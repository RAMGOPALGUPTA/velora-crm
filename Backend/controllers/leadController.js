import Lead from "../models/Lead.js";

const followUpDaysByStatus = {
  new: 1,
  contacted: 2,
  qualified: 3,
  negotiation: 5,
  closed: null
};

const scoreWeightsByStatus = {
  new: 6,
  contacted: 14,
  qualified: 24,
  negotiation: 32,
  closed: 38
};

const sourceWeights = {
  referral: 24,
  website: 18,
  linkedin: 18,
  whatsapp: 17,
  campaign: 14,
  direct: 12,
  "cold call": 10
};

const normalizeAssignedTo = (assignedTo) => {
  if (!assignedTo) {
    return [];
  }

  if (Array.isArray(assignedTo)) {
    return assignedTo.filter(Boolean);
  }

  return [assignedTo].filter(Boolean);
};

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const createActivity = (type, message, user) => ({
  type,
  message,
  createdByName: user?.name || "System",
  createdAt: new Date()
});

const buildLeadQuery = (user, leadId) => {
  const query = {};

  if (leadId) {
    query._id = leadId;
  }

  if (user.role === "sales") {
    query.assignedTo = user.id;
  }

  return query;
};

const resolveAssignees = (user, requestedAssignees = [], fallbackAssignees = []) => {
  if (user.role === "sales") {
    return [user.id];
  }

  if (requestedAssignees.length) {
    return requestedAssignees;
  }

  if (fallbackAssignees.length) {
    return normalizeAssignedTo(fallbackAssignees);
  }

  return [user.id];
};

const buildAutoFollowUpDate = (status) => {
  const days = followUpDaysByStatus[status];

  if (!days) {
    return null;
  }

  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(10, 0, 0, 0);

  return date;
};

const refreshDerivedFieldsForLead = (lead) => {
  const payload = {
    name: lead.name?.trim(),
    email: lead.email?.trim().toLowerCase() || "",
    phone: lead.phone?.trim() || "",
    status: lead.status || "new",
    source: lead.source?.trim() || "",
    company: lead.company?.trim() || "",
    dealValue: Number(lead.dealValue) >= 0 ? Number(lead.dealValue) : 0,
    assignedTo: normalizeAssignedTo(lead.assignedTo),
    nextFollowUpAt: lead.status === "closed"
      ? null
      : normalizeDate(lead.nextFollowUpAt) || buildAutoFollowUpDate(lead.status)
  };

  return {
    ...payload,
    lastContactedAt: lead.lastContactedAt || (payload.status === "new" ? null : lead.updatedAt || new Date()),
    ...calculateLeadScore(payload)
  };
};

const getValueScore = (dealValue) => {
  if (dealValue >= 1000000) {
    return 28;
  }

  if (dealValue >= 500000) {
    return 22;
  }

  if (dealValue >= 150000) {
    return 16;
  }

  if (dealValue >= 50000) {
    return 10;
  }

  return dealValue > 0 ? 6 : 0;
};

const calculateLeadScore = (payload) => {
  let score = 10;
  const sourceKey = payload.source.toLowerCase();

  if (payload.email) {
    score += 8;
  }

  if (payload.phone) {
    score += 8;
  }

  if (payload.company) {
    score += 7;
  }

  score += sourceWeights[sourceKey] || (payload.source ? 8 : 0);
  score += getValueScore(payload.dealValue);
  score += scoreWeightsByStatus[payload.status] || 0;

  if (payload.assignedTo.length > 1) {
    score += 6;
  }

  if (payload.nextFollowUpAt) {
    const today = new Date();
    const followUpDate = new Date(payload.nextFollowUpAt);
    const diffInDays = Math.ceil((followUpDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays < 0) {
      score -= 12;
    } else if (diffInDays <= 2) {
      score += 6;
    }
  }

  const clampedScore = Math.max(0, Math.min(100, score));

  return {
    score: clampedScore,
    scoreBand: clampedScore >= 70 ? "hot" : clampedScore >= 40 ? "warm" : "cold"
  };
};

const sanitizeLeadPayload = (body) => ({
  name: body.name?.trim(),
  email: body.email?.trim().toLowerCase() || "",
  phone: body.phone?.trim() || "",
  status: body.status || "new",
  source: body.source?.trim() || "",
  company: body.company?.trim() || "",
  dealValue: Number(body.dealValue) >= 0 ? Number(body.dealValue) : 0,
  nextFollowUpAt: normalizeDate(body.nextFollowUpAt),
  assignedTo: normalizeAssignedTo(body.assignedTo)
});

const prepareLeadPayload = (body, user, existingLead = null) => {
  const payload = sanitizeLeadPayload(body);

  if (!payload.name) {
    return { error: "Lead name is required" };
  }

  payload.assignedTo = resolveAssignees(
    user,
    payload.assignedTo,
    existingLead?.assignedTo
  );

  if (payload.status === "closed") {
    payload.nextFollowUpAt = null;
  } else if (!payload.nextFollowUpAt) {
    payload.nextFollowUpAt = buildAutoFollowUpDate(payload.status);
  }

  const previousStatus = existingLead?.status;
  if (!previousStatus || previousStatus !== payload.status) {
    payload.lastContactedAt = payload.status === "new" ? existingLead?.lastContactedAt || null : new Date();
  } else {
    payload.lastContactedAt = existingLead?.lastContactedAt || (payload.status === "new" ? null : new Date());
  }

  return {
    ...payload,
    ...calculateLeadScore(payload)
  };
};

const getLeadWithRelations = async (leadId) =>
  Lead.findById(leadId).populate("assignedTo", "name email role");

const forecastWeightExpression = {
  $switch: {
    branches: [
      { case: { $eq: ["$status", "new"] }, then: 0.12 },
      { case: { $eq: ["$status", "contacted"] }, then: 0.3 },
      { case: { $eq: ["$status", "qualified"] }, then: 0.55 },
      { case: { $eq: ["$status", "negotiation"] }, then: 0.78 },
      { case: { $eq: ["$status", "closed"] }, then: 1 }
    ],
    default: 0
  }
};

const syncLegacyLeadFields = async (query) => {
  const legacyLeads = await Lead.find({
    ...query,
    $or: [
      { score: { $exists: false } },
      { scoreBand: { $exists: false } },
      { nextFollowUpAt: { $exists: false } },
      { lastContactedAt: { $exists: false } }
    ]
  });

  if (!legacyLeads.length) {
    return;
  }

  await Lead.bulkWrite(
    legacyLeads.map((lead) => ({
      updateOne: {
        filter: { _id: lead._id },
        update: refreshDerivedFieldsForLead(lead)
      }
    }))
  );
};

// CREATE LEAD
export const createLead = async (req, res) => {
  try {
    const payload = prepareLeadPayload(req.body, req.user);

    if (payload.error) {
      return res.status(400).json({ msg: payload.error });
    }

    const lead = await Lead.create({
      ...payload,
      activities: [
        createActivity("created", "Lead created in CRM workspace", req.user)
      ]
    });

    const populatedLead = await getLeadWithRelations(lead._id);

    res.status(201).json(populatedLead);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// GET LEADS (ROLE + FILTER + SEARCH)
export const getLeads = async (req, res) => {
  try {
    const { status, search, priority, followUp } = req.query;
    const query = buildLeadQuery(req.user);

    await syncLegacyLeadFields(buildLeadQuery(req.user));

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.scoreBand = priority;
    }

    if (followUp === "due") {
      query.nextFollowUpAt = { $lte: new Date() };
      query.status = { $ne: "closed" };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } }
      ];
    }

    const leads = await Lead.find(query)
      .populate("assignedTo", "name email role")
      .sort({ score: -1, nextFollowUpAt: 1, createdAt: -1 });

    res.json(leads);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// UPDATE LEAD
export const updateLead = async (req, res) => {
  try {
    const existingLead = await Lead.findOne(buildLeadQuery(req.user, req.params.id));

    if (!existingLead) {
      return res.status(404).json({ msg: "Lead not found or access denied" });
    }

    const payload = prepareLeadPayload(req.body, req.user, existingLead);

    if (payload.error) {
      return res.status(400).json({ msg: payload.error });
    }

    const activities = [...(existingLead.activities || [])];

    if (existingLead.status !== payload.status) {
      activities.unshift(
        createActivity(
          "status_changed",
          `Stage moved from ${existingLead.status} to ${payload.status}`,
          req.user
        )
      );
    } else {
      activities.unshift(
        createActivity("updated", "Lead details updated", req.user)
      );
    }

    const lead = await Lead.findByIdAndUpdate(
      existingLead._id,
      {
        ...payload,
        activities: activities.slice(0, 25)
      },
      { new: true, runValidators: true }
    ).populate("assignedTo", "name email role");

    res.json(lead);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const addLeadNote = async (req, res) => {
  try {
    const note = req.body.note?.trim();

    if (!note) {
      return res.status(400).json({ msg: "Note is required" });
    }

    const lead = await Lead.findOne(buildLeadQuery(req.user, req.params.id));

    if (!lead) {
      return res.status(404).json({ msg: "Lead not found or access denied" });
    }

    lead.activities = [
      createActivity("note", note, req.user),
      ...(lead.activities || [])
    ].slice(0, 25);

    await lead.save();

    const populatedLead = await getLeadWithRelations(lead._id);
    res.json(populatedLead);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const completeLeadFollowUp = async (req, res) => {
  try {
    const lead = await Lead.findOne(buildLeadQuery(req.user, req.params.id));

    if (!lead) {
      return res.status(404).json({ msg: "Lead not found or access denied" });
    }

    const nextStatus = lead.status === "new" ? "contacted" : lead.status;
    const nextFollowUpAt = nextStatus === "closed" ? null : buildAutoFollowUpDate(nextStatus);
    const refreshedPayload = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: nextStatus,
      source: lead.source,
      company: lead.company,
      dealValue: lead.dealValue,
      assignedTo: normalizeAssignedTo(lead.assignedTo),
      nextFollowUpAt
    };

    const scoreData = calculateLeadScore(refreshedPayload);

    lead.status = nextStatus;
    lead.nextFollowUpAt = nextFollowUpAt;
    lead.lastContactedAt = new Date();
    lead.score = scoreData.score;
    lead.scoreBand = scoreData.scoreBand;
    lead.activities = [
      createActivity(
        "follow_up_completed",
        nextStatus === "contacted"
          ? "Follow-up completed and lead moved to contacted"
          : "Follow-up completed and next reminder scheduled",
        req.user
      ),
      ...(lead.activities || [])
    ].slice(0, 25);

    await lead.save();

    const populatedLead = await getLeadWithRelations(lead._id);
    res.json(populatedLead);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// DELETE LEAD (ADMIN ONLY)
export const deleteLead = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Only admin can delete leads" });
    }

    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({ msg: "Lead not found" });
    }

    res.json({ msg: "Lead deleted" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// LEAD STATS (DASHBOARD)
export const getLeadStats = async (req, res) => {
  try {
    const matchStage = buildLeadQuery(req.user);
    const followUpQuery = {
      ...matchStage,
      status: { $ne: "closed" },
      nextFollowUpAt: { $ne: null }
    };

    await syncLegacyLeadFields(matchStage);

    const totalLeads = await Lead.countDocuments(matchStage);

    const statusStats = await Lead.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          value: { $sum: "$dealValue" }
        }
      }
    ]);

    const [valueSummary] = await Lead.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalValue: { $sum: "$dealValue" },
          closedValue: {
            $sum: {
              $cond: [{ $eq: ["$status", "closed"] }, "$dealValue", 0]
            }
          },
          openValue: {
            $sum: {
              $cond: [{ $ne: ["$status", "closed"] }, "$dealValue", 0]
            }
          },
          weightedForecast: {
            $sum: {
              $multiply: ["$dealValue", forecastWeightExpression]
            }
          }
        }
      }
    ]);

    const scoreBreakdown = await Lead.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$scoreBand",
          count: { $sum: 1 }
        }
      }
    ]);

    const dueFollowUps = await Lead.countDocuments({
      ...followUpQuery,
      nextFollowUpAt: { $lte: new Date() }
    });

    const upcomingFollowUps = await Lead.find(followUpQuery)
      .populate("assignedTo", "name email role")
      .sort({ nextFollowUpAt: 1, score: -1 })
      .limit(6);

    const priorityLeads = await Lead.find({
      ...matchStage,
      scoreBand: "hot",
      status: { $ne: "closed" }
    })
      .populate("assignedTo", "name email role")
      .sort({ score: -1, nextFollowUpAt: 1 })
      .limit(5);

    const teamPerformance = await Lead.aggregate([
      { $match: matchStage },
      { $unwind: "$assignedTo" },
      {
        $group: {
          _id: "$assignedTo",
          totalLeads: { $sum: 1 },
          openDeals: {
            $sum: {
              $cond: [{ $ne: ["$status", "closed"] }, 1, 0]
            }
          },
          closedDeals: {
            $sum: {
              $cond: [{ $eq: ["$status", "closed"] }, 1, 0]
            }
          },
          pipelineValue: { $sum: "$dealValue" },
          closedRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "closed"] }, "$dealValue", 0]
            }
          },
          weightedForecast: {
            $sum: {
              $multiply: ["$dealValue", forecastWeightExpression]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "member"
        }
      },
      { $unwind: "$member" },
      {
        $project: {
          _id: 1,
          totalLeads: 1,
          openDeals: 1,
          closedDeals: 1,
          pipelineValue: 1,
          closedRevenue: 1,
          weightedForecast: 1,
          name: "$member.name",
          email: "$member.email",
          role: "$member.role"
        }
      },
      { $sort: { closedRevenue: -1, weightedForecast: -1, totalLeads: -1 } }
    ]);

    res.json({
      totalLeads,
      statusStats,
      scoreBreakdown,
      dueFollowUps,
      upcomingFollowUps,
      priorityLeads,
      teamPerformance,
      totalValue: valueSummary?.totalValue || 0,
      closedValue: valueSummary?.closedValue || 0,
      openValue: valueSummary?.openValue || 0,
      weightedForecast: valueSummary?.weightedForecast || 0
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
