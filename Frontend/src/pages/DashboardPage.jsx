import { useDeferredValue, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { leadsApi, usersApi } from "../api/client";
import LeadChart from "../components/LeadChart";
import LeadFormModal from "../components/LeadFormModal";
import LeadWorkspacePanel from "../components/LeadWorkspacePanel";
import PipelineBoard from "../components/PipelineBoard";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import TeamPerformancePanel from "../components/TeamPerformancePanel";
import { useAuth } from "../context/AuthContext";

const statusOrder = ["new", "contacted", "qualified", "negotiation", "closed"];
const statusLabels = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  negotiation: "Negotiation",
  closed: "Closed"
};
const viewTitles = {
  dashboard: "Dashboard",
  contacts: "Contacts",
  companies: "Companies",
  pipeline: "Pipeline",
  deals: "Deals",
  tasks: "Tasks",
  email: "Email",
  reports: "Reports",
  settings: "Settings"
};

const initialStats = {
  totalLeads: 0,
  statusStats: [],
  scoreBreakdown: [],
  dueFollowUps: 0,
  upcomingFollowUps: [],
  priorityLeads: [],
  teamPerformance: [],
  totalValue: 0,
  closedValue: 0,
  openValue: 0,
  weightedForecast: 0
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);

const getErrorMessage = (error) =>
  error.response?.data?.msg || "Something went wrong. Please try again.";

const getUserId = (value) => value?._id || value?.id || null;

const getInitials = (value) =>
  value
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "NA";

const titleCase = (value) => statusLabels[value] || value || "";

const toValidDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = toValidDate(value);

  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
};

const formatShortDate = (value) => {
  const date = toValidDate(value);

  if (!date) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short"
  }).format(date);
};

const formatRelativeTime = (value) => {
  const date = toValidDate(value);

  if (!date) {
    return "No recent activity";
  }

  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) {
    return "Just now";
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return formatShortDate(date);
};

const formatTaskDue = (value) => {
  const date = toValidDate(value);

  if (!date) {
    return "No reminder";
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const startOfNext = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);

  if (date < startOfToday) {
    return "Overdue";
  }

  if (date >= startOfToday && date < startOfTomorrow) {
    return "Today";
  }

  if (date >= startOfTomorrow && date < startOfNext) {
    return "Tomorrow";
  }

  return formatShortDate(date);
};

const normalizeAssignedUsers = (assignedTo) => {
  if (!assignedTo) {
    return [];
  }

  return Array.isArray(assignedTo) ? assignedTo : [assignedTo];
};

const createStatusMetrics = (statusStats = []) => {
  const counts = statusStats.reduce((result, item) => {
    result[item._id] = {
      count: item.count,
      value: item.value || 0
    };
    return result;
  }, {});

  return statusOrder.map((status) => ({
    key: status,
    label: statusLabels[status],
    count: counts[status]?.count || 0,
    value: counts[status]?.value || 0
  }));
};

const createScoreMix = (scoreBreakdown = []) => {
  const buckets = scoreBreakdown.reduce((result, item) => {
    result[item._id] = item.count;
    return result;
  }, {});

  return [
    { key: "hot", label: "Hot", count: buckets.hot || 0 },
    { key: "warm", label: "Warm", count: buckets.warm || 0 },
    { key: "cold", label: "Cold", count: buckets.cold || 0 }
  ];
};

const normalizeStats = (payload = {}) => ({
  ...initialStats,
  ...payload,
  statusStats: ensureArray(payload.statusStats),
  scoreBreakdown: ensureArray(payload.scoreBreakdown),
  upcomingFollowUps: ensureArray(payload.upcomingFollowUps),
  priorityLeads: ensureArray(payload.priorityLeads),
  teamPerformance: ensureArray(payload.teamPerformance)
});

const serializeLeadPayload = (lead, overrides = {}) => {
  const nextLead = {
    ...lead,
    ...overrides
  };

  return {
    name: nextLead.name,
    email: nextLead.email || "",
    phone: nextLead.phone || "",
    company: nextLead.company || "",
    source: nextLead.source || "",
    status: nextLead.status,
    dealValue: nextLead.dealValue || 0,
    nextFollowUpAt: nextLead.nextFollowUpAt || null,
    assignedTo: normalizeAssignedUsers(nextLead.assignedTo).map((user) => getUserId(user) || user)
  };
};

const fetchDashboardData = async ({ status, search, priority, followUp }) => {
  const [leadResponse, statsResponse, usersResponse] = await Promise.all([
    leadsApi.getLeads({
      status: status || undefined,
      search: search || undefined,
      priority: priority || undefined,
      followUp: followUp || undefined
    }),
    leadsApi.getStats(),
    usersApi.getUsers()
  ]);

  return {
    leads: ensureArray(leadResponse),
    stats: normalizeStats(statsResponse),
    users: ensureArray(usersResponse)
  };
};

const createMonthlyRevenueSeries = (leads = []) => {
  const now = new Date();
  const months = [];

  for (let index = 5; index >= 0; index -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    months.push({
      key: `${monthDate.getFullYear()}-${monthDate.getMonth()}`,
      label: monthDate.toLocaleString("en-IN", { month: "short" })
    });
  }

  const totals = Object.fromEntries(months.map((month) => [month.key, 0]));

  leads.forEach((lead) => {
    const createdAt = toValidDate(lead.createdAt || lead.updatedAt);

    if (!createdAt) {
      return;
    }

    const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
    if (key in totals) {
      totals[key] += Number(lead.dealValue) || 0;
    }
  });

  const maxValue = Math.max(...Object.values(totals), 1);

  return months.map((month) => ({
    ...month,
    value: totals[month.key],
    height: Math.max(12, Math.round((totals[month.key] / maxValue) * 74))
  }));
};

const createSourceBreakdown = (leads = []) => {
  const grouped = leads.reduce((result, lead) => {
    const key = (lead.source || "Direct").trim() || "Direct";

    if (!result[key]) {
      result[key] = {
        label: key,
        count: 0
      };
    }

    result[key].count += 1;
    return result;
  }, {});

  const items = Object.values(grouped)
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);

  const maxCount = Math.max(...items.map((item) => item.count), 1);

  return items.map((item) => ({
    ...item,
    width: Math.max(16, Math.round((item.count / maxCount) * 100))
  }));
};

const createActivityFeed = (leads = []) =>
  leads
    .flatMap((lead) =>
      ensureArray(lead.activities).map((activity) => ({
        ...activity,
        leadId: lead._id,
        leadName: lead.name,
        company: lead.company || lead.source || "Lead"
      }))
    )
    .sort((left, right) => {
      const leftDate = toValidDate(left.createdAt)?.getTime() || 0;
      const rightDate = toValidDate(right.createdAt)?.getTime() || 0;
      return rightDate - leftDate;
    })
    .slice(0, 6);

const createTaskBuckets = (leads = []) => {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const tasks = leads
    .filter((lead) => lead.status !== "closed")
    .map((lead) => {
      const dueAt = toValidDate(lead.nextFollowUpAt);

      if (!dueAt) {
        return null;
      }

      return {
        id: lead._id,
        title: `Follow up with ${lead.name}`,
        subtitle: lead.company || lead.source || lead.email || "Lead reminder",
        dueAt,
        dueLabel: formatTaskDue(dueAt),
        priority: lead.scoreBand || "cold",
        lead
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.dueAt - right.dueAt);

  return {
    all: tasks,
    overdue: tasks.filter((task) => task.dueAt < startOfToday),
    today: tasks.filter((task) => task.dueAt >= startOfToday && task.dueAt < startOfTomorrow),
    upcoming: tasks.filter((task) => task.dueAt >= startOfTomorrow)
  };
};

const createCompanyRows = (leads = []) => {
  const grouped = leads.reduce((result, lead) => {
    const key = (lead.company || lead.source || "Independent").trim();

    if (!result[key]) {
      result[key] = {
        name: key,
        industry: lead.source || "Direct",
        contacts: 0,
        openDeals: 0,
        annualValue: 0,
        status: "Prospect"
      };
    }

    result[key].contacts += 1;
    result[key].annualValue += Number(lead.dealValue) || 0;

    if (lead.status !== "closed") {
      result[key].openDeals += 1;
    }

    if (lead.status === "closed") {
      result[key].status = "Customer";
    } else if (["qualified", "negotiation", "contacted"].includes(lead.status) && result[key].status !== "Customer") {
      result[key].status = "Active";
    }

    return result;
  }, {});

  return Object.values(grouped).sort((left, right) => right.annualValue - left.annualValue);
};

const createEmailQueue = (priorityLeads = [], upcomingFollowUps = []) => {
  const merged = [...priorityLeads, ...upcomingFollowUps];
  const seen = new Set();

  return merged
    .filter((lead) => {
      if (!lead?._id || seen.has(lead._id)) {
        return false;
      }

      seen.add(lead._id);
      return true;
    })
    .slice(0, 6)
    .map((lead) => ({
      id: lead._id,
      subject: `Follow up with ${lead.name}`,
      preview: `${lead.company || lead.source || "Lead"} · ${titleCase(lead.status)} · ${formatCurrency(lead.dealValue)}`,
      time: formatRelativeTime(lead.nextFollowUpAt || lead.updatedAt || lead.createdAt),
      unread: lead.scoreBand === "hot" || lead.status === "new",
      lead
    }));
};

const createFunnelRows = (statusMetrics = []) => {
  const maxCount = Math.max(...statusMetrics.map((item) => item.count), 1);

  return statusMetrics.map((item) => ({
    ...item,
    width: Math.max(16, Math.round((item.count / maxCount) * 100))
  }));
};

const getActivityTone = (type) => {
  const tones = {
    created: "dot-blue",
    updated: "dot-green",
    note: "dot-amber",
    status_changed: "dot-red",
    follow_up_completed: "dot-green"
  };

  return tones[type] || "dot-blue";
};

const getTagClass = (status) => {
  const tags = {
    new: "tag-gray",
    contacted: "tag-blue",
    qualified: "tag-blue",
    negotiation: "tag-amber",
    closed: "tag-green",
    Customer: "tag-green",
    Active: "tag-blue",
    Prospect: "tag-gray"
  };

  return tags[status] || "tag-gray";
};

function DashboardPage() {
  const { user, logout } = useAuth();
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(initialStats);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter] = useState("");
  const [priorityFilter] = useState("");
  const [followUpFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [workspaceLead, setWorkspaceLead] = useState(null);
  const [isWorkspaceBusy, setIsWorkspaceBusy] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [overviewRange, setOverviewRange] = useState("month");
  const [reportRange, setReportRange] = useState("monthly");
  const [contactView, setContactView] = useState("all");
  const [dealView, setDealView] = useState("all");
  const [taskUpdatingId, setTaskUpdatingId] = useState("");
  const [settingsToggles, setSettingsToggles] = useState({
    leadAssigned: true,
    stageChanges: true,
    reminders: true,
    emailOpens: false
  });
  const [profileDraft, setProfileDraft] = useState({
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "sales"
  });

  const deferredSearch = useDeferredValue(searchInput);

  useEffect(() => {
    setProfileDraft({
      name: user?.name || "",
      email: user?.email || "",
      role: user?.role || "sales"
    });
  }, [user]);

  useEffect(() => {
    document.title = `Velora CRM | ${viewTitles[activeView] || "Dashboard"}`;
  }, [activeView]);

  const statusMetrics = createStatusMetrics(stats.statusStats);
  const scoreMix = createScoreMix(stats.scoreBreakdown);
  const closedCount = statusMetrics.find((item) => item.key === "closed")?.count || 0;
  const openDealsCount = Math.max(stats.totalLeads - closedCount, 0);
  const conversionRate = stats.totalLeads
    ? Math.round((closedCount / stats.totalLeads) * 100)
    : 0;
  const averageDealSize = stats.totalLeads
    ? Math.round(stats.totalValue / stats.totalLeads)
    : 0;
  const hotLeadCount = scoreMix.find((item) => item.key === "hot")?.count || 0;
  const currentUserId = getUserId(user);
  const canAssignMultiple = user?.role !== "sales";
  const assignableUsers = canAssignMultiple
    ? users
    : users.filter((member) => getUserId(member) === currentUserId);

  const revenueSeries = createMonthlyRevenueSeries(leads);
  const sourceBreakdown = createSourceBreakdown(leads);
  const recentActivities = createActivityFeed(leads);
  const taskBuckets = createTaskBuckets(leads);
  const companyRows = createCompanyRows(leads);
  const emailQueue = createEmailQueue(stats.priorityLeads, stats.upcomingFollowUps);
  const reportFunnel = createFunnelRows(statusMetrics);

  const contactsRows = leads.filter((lead) => {
    if (contactView === "hot") {
      return lead.scoreBand === "hot";
    }

    if (contactView === "customers") {
      return lead.status === "closed";
    }

    return true;
  });

  const dealsRows = leads.filter((lead) => {
    if (dealView === "mine") {
      return normalizeAssignedUsers(lead.assignedTo).some((member) => getUserId(member) === currentUserId);
    }

    if (dealView === "closing") {
      const dueAt = toValidDate(lead.nextFollowUpAt);
      if (!dueAt) {
        return false;
      }

      const days = Math.ceil((dueAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days <= 3;
    }

    return true;
  });

  const loadDashboard = async (overrides = {}) => {
    const activeStatus = overrides.status ?? statusFilter;
    const activeSearch = overrides.search ?? deferredSearch;
    const activePriority = overrides.priority ?? priorityFilter;
    const activeFollowUp = overrides.followUp ?? followUpFilter;

    setIsLoading(true);

    try {
      const dashboardData = await fetchDashboardData({
        status: activeStatus,
        search: activeSearch,
        priority: activePriority,
        followUp: activeFollowUp
      });

      setLeads(dashboardData.leads);
      setStats(dashboardData.stats);
      setUsers(dashboardData.users);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const syncDashboard = async () => {
      setIsLoading(true);

      try {
        const dashboardData = await fetchDashboardData({
          status: statusFilter,
          search: deferredSearch,
          priority: priorityFilter,
          followUp: followUpFilter
        });

        if (ignore) {
          return;
        }

        setLeads(dashboardData.leads);
        setStats(dashboardData.stats);
        setUsers(dashboardData.users);
      } catch (error) {
        if (!ignore) {
          toast.error(getErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    syncDashboard();

    return () => {
      ignore = true;
    };
  }, [statusFilter, deferredSearch, priorityFilter, followUpFilter]);

  const handleCreate = () => {
    setWorkspaceLead(null);
    setSelectedLead(null);
    setIsModalOpen(true);
  };

  const handleEdit = (lead) => {
    setWorkspaceLead(null);
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedLead(null);
    setIsModalOpen(false);
  };

  const handleOpenWorkspace = (lead) => {
    setWorkspaceLead(lead);
  };

  const handleCloseWorkspace = () => {
    setWorkspaceLead(null);
  };

  const handleSaveLead = async (payload) => {
    setIsSaving(true);

    try {
      if (selectedLead) {
        await leadsApi.updateLead(selectedLead._id, payload);
        toast.success("Lead updated successfully.");
      } else {
        await leadsApi.createLead(payload);
        toast.success("Lead created successfully.");
      }

      handleCloseModal();
      await loadDashboard();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLead = async (lead) => {
    const confirmed = window.confirm(`Delete ${lead.name}? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      await leadsApi.deleteLead(lead._id);
      toast.success("Lead deleted successfully.");
      await loadDashboard();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleMoveLead = async (leadId, nextStatus) => {
    const lead = leads.find((item) => item._id === leadId);

    if (!lead || lead.status === nextStatus) {
      return;
    }

    try {
      await leadsApi.updateLead(
        leadId,
        serializeLeadPayload(lead, { status: nextStatus })
      );
      toast.success(`Lead moved to ${titleCase(nextStatus)}.`);
      await loadDashboard();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleAddWorkspaceNote = async (note) => {
    if (!workspaceLead) {
      return;
    }

    setIsWorkspaceBusy(true);

    try {
      const updatedLead = await leadsApi.addNote(workspaceLead._id, note);
      setWorkspaceLead(updatedLead);
      toast.success("Note added to lead timeline.");
      await loadDashboard();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsWorkspaceBusy(false);
    }
  };

  const handleCompleteFollowUp = async (leadId) => {
    setTaskUpdatingId(leadId);

    try {
      const updatedLead = await leadsApi.completeFollowUp(leadId);

      if (workspaceLead?._id === leadId) {
        setWorkspaceLead(updatedLead);
      }

      toast.success("Follow-up completed.");
      await loadDashboard();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setTaskUpdatingId("");
    }
  };

  const handleCompleteWorkspaceFollowUp = async () => {
    if (!workspaceLead) {
      return;
    }

    setIsWorkspaceBusy(true);

    try {
      const updatedLead = await leadsApi.completeFollowUp(workspaceLead._id);
      setWorkspaceLead(updatedLead);
      toast.success("Follow-up completed and timeline updated.");
      await loadDashboard();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsWorkspaceBusy(false);
    }
  };

  const handlePlaceholder = (message) => {
    toast(message, {
      icon: "i"
    });
  };

  const toggleSetting = (key) => {
    setSettingsToggles((current) => ({
      ...current,
      [key]: !current[key]
    }));
  };

  const renderTaskList = (items, emptyMessage) => (
    <div className="tasks-list">
      {items.length ? items.map((task) => (
        <div className="task-item" key={task.id}>
          <button
            className={`task-check ${taskUpdatingId === task.id ? "done" : ""}`}
            type="button"
            onClick={() => handleCompleteFollowUp(task.id)}
            disabled={taskUpdatingId === task.id}
            aria-label={`Complete ${task.title}`}
          >
            {taskUpdatingId === task.id ? "✓" : ""}
          </button>
          <button className="task-main" type="button" onClick={() => handleOpenWorkspace(task.lead)}>
            <div className="task-text">{task.title}</div>
            <div className="task-due">{`${task.subtitle} · ${task.dueLabel}`}</div>
          </button>
          <span className={`task-priority ${task.priority}`}>{task.priority}</span>
        </div>
      )) : (
        <div className="empty-mini">{emptyMessage}</div>
      )}
    </div>
  );

  const renderDashboardView = () => (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Revenue overview</div>
          <div className="page-subtitle">{`Welcome back, ${user?.name?.split(" ")[0] || "team"}. Monitor pipeline health, deal momentum, and follow-up workload from one control center.`}</div>
        </div>
        <div className="report-filters">
          <button
            className={`filter-btn ${overviewRange === "month" ? "active" : ""}`}
            type="button"
            onClick={() => setOverviewRange("month")}
          >
            This month
          </button>
          <button
            className={`filter-btn ${overviewRange === "30d" ? "active" : ""}`}
            type="button"
            onClick={() => setOverviewRange("30d")}
          >
            Last 30d
          </button>
          <button
            className={`filter-btn ${overviewRange === "quarter" ? "active" : ""}`}
            type="button"
            onClick={() => setOverviewRange("quarter")}
          >
            Q2 2026
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.totalValue)}
          delta={`${hotLeadCount} hot leads ready to convert`}
        />
        <StatCard
          label="Open Deals"
          value={openDealsCount}
          delta={`${taskBuckets.today.length} due today`}
        />
        <StatCard
          label="Win Rate"
          value={`${conversionRate}%`}
          delta={`${closedCount} deals closed so far`}
          tone={conversionRate >= 40 ? "up" : "down"}
        />
        <StatCard
          label="Avg Deal Size"
          value={formatCurrency(averageDealSize)}
          delta={`${formatCurrency(stats.weightedForecast)} forecast in motion`}
        />
      </div>

      <div className="grid-3">
        <section className="card">
          <div className="card-header">
            <div className="card-title">Revenue trend</div>
            <button className="card-action" type="button" onClick={() => setActiveView("reports")}>
              View full report
            </button>
          </div>

          <div className="mini-chart">
            {revenueSeries.map((item) => (
              <div
                className="bar-v"
                key={item.key}
                style={{ height: `${item.height}px` }}
                title={`${item.label}: ${formatCurrency(item.value)}`}
              />
            ))}
          </div>

          <div className="mini-chart-labels">
            {revenueSeries.map((item) => (
              <span key={item.key}>{item.label}</span>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div className="card-title">Lead sources</div>
          </div>
          <div className="funnel">
            {sourceBreakdown.length ? sourceBreakdown.map((item) => (
              <div className="funnel-row" key={item.label}>
                <div className="funnel-label">{item.label}</div>
                <div className="funnel-bar-wrap">
                  <div className="funnel-bar" style={{ width: `${item.width}%` }}>
                    {item.count}
                  </div>
                </div>
              </div>
            )) : (
              <div className="empty-mini">Lead sources will appear as records are added.</div>
            )}
          </div>
        </section>
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-header">
            <div className="card-title">Recent activities</div>
            <button className="card-action" type="button" onClick={() => setActiveView("deals")}>
              All activities
            </button>
          </div>
          <div className="activity-list">
            {recentActivities.length ? recentActivities.map((activity) => (
              <div className="activity-item" key={`${activity.leadId}-${activity.createdAt}-${activity.type}`}>
                <div className={`activity-dot ${getActivityTone(activity.type)}`} />
                <div>
                  <div className="activity-text">
                    <strong>{activity.leadName}</strong>
                    {` · ${activity.message}`}
                  </div>
                  <div className="activity-time">{`${activity.company} · ${formatRelativeTime(activity.createdAt)}`}</div>
                </div>
              </div>
            )) : (
              <div className="empty-mini">Activity will appear as your team updates leads.</div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div className="card-title">Upcoming tasks</div>
            <button className="card-action" type="button" onClick={() => setActiveView("tasks")}>
              View all
            </button>
          </div>
          {renderTaskList(taskBuckets.all.slice(0, 5), "No follow-ups scheduled right now.")}
        </section>
      </div>
    </section>
  );

  const renderContactsView = () => (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Contact intelligence</div>
          <div className="page-subtitle">{`${contactsRows.length} relationship records across your active pipeline.`}</div>
        </div>
        <div className="report-filters">
          <button className={`filter-btn ${contactView === "all" ? "active" : ""}`} type="button" onClick={() => setContactView("all")}>All</button>
          <button className={`filter-btn ${contactView === "hot" ? "active" : ""}`} type="button" onClick={() => setContactView("hot")}>Hot leads</button>
          <button className={`filter-btn ${contactView === "customers" ? "active" : ""}`} type="button" onClick={() => setContactView("customers")}>Customers</button>
          <button className="btn-primary" type="button" onClick={handleCreate}>Add Contact</button>
        </div>
      </div>

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Stage</th>
              <th>Score</th>
              <th>Owner</th>
              <th>Last contacted</th>
            </tr>
          </thead>
          <tbody>
            {contactsRows.length ? contactsRows.map((lead) => {
              const scoreClass = lead.scoreBand === "hot"
                ? "bar-hot"
                : lead.scoreBand === "warm"
                  ? "bar-warm"
                  : "bar-cold";
              const owner = normalizeAssignedUsers(lead.assignedTo)[0];

              return (
                <tr key={lead._id} onClick={() => handleOpenWorkspace(lead)}>
                  <td>
                    <div className="contact-row">
                      <div className="mini-avatar a1">{getInitials(lead.name)}</div>
                      {lead.name}
                    </div>
                  </td>
                  <td>{lead.company || "Independent lead"}</td>
                  <td className="secondary-cell">{lead.email || "No email"}</td>
                  <td><span className={`tag ${getTagClass(lead.status)}`}>{titleCase(lead.status)}</span></td>
                  <td>
                    <div className="score-bar">
                      <div className="bar-bg">
                        <div className={`bar-fill ${scoreClass}`} style={{ width: `${lead.score || 0}%` }} />
                      </div>
                      <span className="score-number">{lead.score || 0}</span>
                    </div>
                  </td>
                  <td>{owner?.name || "Unassigned"}</td>
                  <td className="secondary-cell">{formatDate(lead.lastContactedAt)}</td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="7">
                  <div className="empty-mini">No contacts match the current filter.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderCompaniesView = () => (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Account portfolio</div>
          <div className="page-subtitle">{`${companyRows.length} organizations organized for sales visibility.`}</div>
        </div>
        <button className="btn-primary" type="button" onClick={handleCreate}>Add Company</button>
      </div>

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Industry</th>
              <th>Contacts</th>
              <th>Open deals</th>
              <th>Annual value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {companyRows.length ? companyRows.map((company) => (
              <tr key={company.name}>
                <td>{company.name}</td>
                <td className="secondary-cell">{company.industry}</td>
                <td>{company.contacts}</td>
                <td>{company.openDeals}</td>
                <td>{formatCurrency(company.annualValue)}</td>
                <td><span className={`tag ${getTagClass(company.status)}`}>{company.status}</span></td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6">
                  <div className="empty-mini">Company records will grow as more leads are added.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderPipelineView = () => (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Pipeline operations</div>
          <div className="page-subtitle">{`${formatCurrency(stats.totalValue)} in tracked opportunity value.`}</div>
        </div>
        <button className="btn-primary" type="button" onClick={handleCreate}>Add Deal</button>
      </div>

      <PipelineBoard
        leads={leads}
        onMoveLead={handleMoveLead}
        onOpenWorkspace={handleOpenWorkspace}
      />
    </section>
  );

  const renderDealsView = () => (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Opportunity register</div>
          <div className="page-subtitle">{`${dealsRows.length} deal records currently under management.`}</div>
        </div>
        <div className="report-filters">
          <button className={`filter-btn ${dealView === "all" ? "active" : ""}`} type="button" onClick={() => setDealView("all")}>All deals</button>
          <button className={`filter-btn ${dealView === "mine" ? "active" : ""}`} type="button" onClick={() => setDealView("mine")}>My deals</button>
          <button className={`filter-btn ${dealView === "closing" ? "active" : ""}`} type="button" onClick={() => setDealView("closing")}>Closing soon</button>
        </div>
      </div>

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Deal name</th>
              <th>Company</th>
              <th>Value</th>
              <th>Stage</th>
              <th>Next action</th>
              <th>Probability</th>
              <th>Owner</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dealsRows.length ? dealsRows.map((lead) => {
              const owner = normalizeAssignedUsers(lead.assignedTo)[0];

              return (
                <tr key={lead._id}>
                  <td onClick={() => handleOpenWorkspace(lead)}>{lead.name}</td>
                  <td className="secondary-cell" onClick={() => handleOpenWorkspace(lead)}>{lead.company || "Independent lead"}</td>
                  <td onClick={() => handleOpenWorkspace(lead)}>{formatCurrency(lead.dealValue)}</td>
                  <td onClick={() => handleOpenWorkspace(lead)}>
                    <span className={`tag ${getTagClass(lead.status)}`}>{titleCase(lead.status)}</span>
                  </td>
                  <td className="secondary-cell" onClick={() => handleOpenWorkspace(lead)}>{formatDate(lead.nextFollowUpAt)}</td>
                  <td onClick={() => handleOpenWorkspace(lead)}>{`${lead.score || 0}%`}</td>
                  <td onClick={() => handleOpenWorkspace(lead)}>{owner?.name || "Unassigned"}</td>
                  <td>
                    <div className="inline-actions">
                      <button className="icon-btn small" type="button" onClick={() => handleOpenWorkspace(lead)}>Open</button>
                      <button className="icon-btn small" type="button" onClick={() => handleEdit(lead)}>Edit</button>
                      {user?.role === "admin" ? (
                        <button className="icon-btn small danger" type="button" onClick={() => handleDeleteLead(lead)}>
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="8">
                  <div className="empty-mini">No deals match the current view.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderTasksView = () => (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Follow-up queue</div>
          <div className="page-subtitle">{`${taskBuckets.all.length} scheduled actions, ${taskBuckets.overdue.length} overdue.`}</div>
        </div>
        <button className="btn-primary" type="button" onClick={() => handlePlaceholder("Tasks are created from lead follow-up dates right now.")}>
          New Task
        </button>
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-header">
            <div className="card-title">Today & overdue</div>
          </div>
          {renderTaskList([...taskBuckets.overdue, ...taskBuckets.today], "No urgent follow-ups right now.")}
        </section>

        <section className="card">
          <div className="card-header">
            <div className="card-title">Upcoming</div>
          </div>
          {renderTaskList(taskBuckets.upcoming, "Nothing scheduled after today.")}
        </section>
      </div>
    </section>
  );

  const renderEmailView = () => {
    const openRate = stats.totalLeads ? Math.round(((hotLeadCount + (scoreMix.find((item) => item.key === "warm")?.count || 0)) / stats.totalLeads) * 100) : 0;
    const clickRate = stats.totalLeads ? Math.round((((statusMetrics.find((item) => item.key === "qualified")?.count || 0) + (statusMetrics.find((item) => item.key === "negotiation")?.count || 0)) / stats.totalLeads) * 100) : 0;
    const replyRate = stats.totalLeads ? Math.round((((statusMetrics.find((item) => item.key === "contacted")?.count || 0) + (statusMetrics.find((item) => item.key === "qualified")?.count || 0) + (statusMetrics.find((item) => item.key === "negotiation")?.count || 0)) / stats.totalLeads) * 100) : 0;

    return (
      <section className="page-shell">
        <div className="page-header">
          <div>
          <div className="page-title">Outreach desk</div>
          <div className="page-subtitle">{`${emailQueue.length} priority conversations ready for follow-up.`}</div>
          </div>
          <button className="btn-primary" type="button" onClick={() => handlePlaceholder("Email compose can connect here once Gmail or Outlook is integrated.")}>
            Compose
          </button>
        </div>

        <div className="grid-3">
          <section className="card">
            <div className="emails-list">
              {emailQueue.length ? emailQueue.map((item) => (
                <div className="email-item" key={item.id} onClick={() => handleOpenWorkspace(item.lead)}>
                  <div className="mini-avatar a2">{getInitials(item.lead.name)}</div>
                  <div>
                    <div className="email-subject">{item.subject}</div>
                    <div className="email-preview">{item.preview}</div>
                    <div className="email-meta">
                      {item.unread ? <span className="unread-dot" /> : null}
                      <span>{item.time}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="empty-mini">Priority outreach will appear here as leads move through the funnel.</div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <div className="card-title">Email stats</div>
            </div>
            <div className="email-stats">
              <div>
                <div className="progress-head"><span>Open rate</span><strong>{`${openRate}%`}</strong></div>
                <div className="bar-bg"><div className="bar-fill bar-hot" style={{ width: `${openRate}%` }} /></div>
              </div>
              <div>
                <div className="progress-head"><span>Click rate</span><strong>{`${clickRate}%`}</strong></div>
                <div className="bar-bg"><div className="bar-fill bar-warm" style={{ width: `${clickRate}%` }} /></div>
              </div>
              <div>
                <div className="progress-head"><span>Reply rate</span><strong>{`${replyRate}%`}</strong></div>
                <div className="bar-bg"><div className="bar-fill bar-green" style={{ width: `${replyRate}%` }} /></div>
              </div>
            </div>

            <div className="sequence-panel">
              <div className="card-title small">Sequences</div>
              <div className="sequence-list">
                <div className="sequence-item">
                  <div>
                    <strong>Hot lead follow-up</strong>
                    <p>{`${hotLeadCount} leads in high-priority outreach`}</p>
                  </div>
                  <span className="tag tag-green">Active</span>
                </div>
                <div className="sequence-item">
                  <div>
                    <strong>Reminder nudges</strong>
                    <p>{`${stats.dueFollowUps} leads need a prompt now`}</p>
                  </div>
                  <span className="tag tag-blue">Running</span>
                </div>
                <div className="sequence-item">
                  <div>
                    <strong>Closed-won nurture</strong>
                    <p>{`${closedCount} converted records available for expansion`}</p>
                  </div>
                  <span className="tag tag-gray">Draft</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    );
  };

  const renderReportsView = () => (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Revenue intelligence</div>
          <div className="page-subtitle">Performance, conversion, and pipeline health for the current sales cycle.</div>
        </div>
        <div className="report-filters">
          <button className={`filter-btn ${reportRange === "monthly" ? "active" : ""}`} type="button" onClick={() => setReportRange("monthly")}>Monthly</button>
          <button className={`filter-btn ${reportRange === "quarterly" ? "active" : ""}`} type="button" onClick={() => setReportRange("quarterly")}>Quarterly</button>
          <button className={`filter-btn ${reportRange === "yearly" ? "active" : ""}`} type="button" onClick={() => setReportRange("yearly")}>Yearly</button>
        </div>
      </div>

      <div className="metrics-grid">
        <StatCard label="Deals closed" value={closedCount} delta={`${conversionRate}% conversion rate`} />
        <StatCard label="New contacts" value={stats.totalLeads} delta={`${hotLeadCount} hot and ready`} />
        <StatCard label="Due follow-ups" value={stats.dueFollowUps} delta={`${taskBuckets.upcoming.length} upcoming next`} tone={stats.dueFollowUps > 0 ? "down" : "up"} />
        <StatCard label="Forecast" value={formatCurrency(stats.weightedForecast)} delta={`${formatCurrency(stats.closedValue)} already closed`} />
      </div>

      <div className="charts-grid">
        <LeadChart stats={statusMetrics} />
        <section className="card">
          <div className="card-header">
            <div className="card-title">Deal conversion funnel</div>
          </div>
          <div className="funnel report-funnel">
            {reportFunnel.map((item) => (
              <div className="funnel-row" key={item.key}>
                <div className="funnel-label">{item.label}</div>
                <div className="funnel-bar-wrap">
                  <div className="funnel-bar" style={{ width: `${item.width}%` }}>
                    {`${item.count} leads`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid-2">
        <TeamPerformancePanel members={stats.teamPerformance} />
        <section className="card">
          <div className="card-header">
            <div className="card-title">Pipeline composition</div>
          </div>
          <div className="segment-bar">
            {statusMetrics.map((item) => (
              <div
                className={`seg seg-${item.key}`}
                key={item.key}
                style={{ width: `${stats.totalLeads ? Math.max(4, (item.count / stats.totalLeads) * 100) : 20}%` }}
                title={`${item.label}: ${item.count}`}
              />
            ))}
          </div>
          <div className="legend-list">
            {statusMetrics.map((item) => (
              <div className="legend-row" key={item.key}>
                <div className="legend-left">
                  <span className={`stage-marker ${item.key}`} />
                  <span>{item.label}</span>
                </div>
                <strong>{`${item.count} · ${formatCurrency(item.value)}`}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );

  const renderSettingsView = () => (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Workspace preferences</div>
          <div className="page-subtitle">Manage your profile, alerts, and core workspace settings.</div>
        </div>
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-title block-title">Profile</div>
          <div className="settings-profile">
            <div className="settings-avatar">{getInitials(profileDraft.name)}</div>
            <div>
              <div className="settings-name">{profileDraft.name}</div>
              <div className="secondary-cell">{profileDraft.email}</div>
            </div>
          </div>
          <div className="settings-form">
            <label className="field-label">
              Full name
              <input
                value={profileDraft.name}
                onChange={(event) => setProfileDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="field-label">
              Email
              <input
                value={profileDraft.email}
                onChange={(event) => setProfileDraft((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label className="field-label">
              Role
              <input
                value={profileDraft.role}
                onChange={(event) => setProfileDraft((current) => ({ ...current, role: event.target.value }))}
              />
            </label>
            <button className="btn-primary settings-save" type="button" onClick={() => toast.success("Profile preferences saved locally.")}>
              Save changes
            </button>
          </div>
        </section>

        <div className="settings-stack">
          <section className="card">
            <div className="card-title block-title">Notifications</div>
            <div className="settings-list">
              <button className="toggle-row" type="button" onClick={() => toggleSetting("leadAssigned")}>
                <span>New lead assigned</span>
                <span className={`toggle ${settingsToggles.leadAssigned ? "on" : ""}`} />
              </button>
              <button className="toggle-row" type="button" onClick={() => toggleSetting("stageChanges")}>
                <span>Deal stage change</span>
                <span className={`toggle ${settingsToggles.stageChanges ? "on" : ""}`} />
              </button>
              <button className="toggle-row" type="button" onClick={() => toggleSetting("reminders")}>
                <span>Task reminders</span>
                <span className={`toggle ${settingsToggles.reminders ? "on" : ""}`} />
              </button>
              <button className="toggle-row" type="button" onClick={() => toggleSetting("emailOpens")}>
                <span>Email opens</span>
                <span className={`toggle ${settingsToggles.emailOpens ? "on" : ""}`} />
              </button>
            </div>
          </section>

          <section className="card">
            <div className="card-title block-title">Integrations</div>
            <div className="integration-list">
              <div className="integration-row"><span>Gmail</span><span className="tag tag-green">Ready</span></div>
              <div className="integration-row"><span>Slack</span><span className="tag tag-blue">Pluggable</span></div>
              <div className="integration-row"><span>Zapier</span><span className="tag tag-gray">Later</span></div>
              <div className="integration-row"><span>WhatsApp</span><span className="tag tag-gray">Later</span></div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );

  const renderActiveView = () => {
    switch (activeView) {
      case "contacts":
        return renderContactsView();
      case "companies":
        return renderCompaniesView();
      case "pipeline":
        return renderPipelineView();
      case "deals":
        return renderDealsView();
      case "tasks":
        return renderTasksView();
      case "email":
        return renderEmailView();
      case "reports":
        return renderReportsView();
      case "settings":
        return renderSettingsView();
      default:
        return renderDashboardView();
    }
  };

  return (
    <div className="crm-app">
      <Sidebar
        user={user}
        activeView={activeView}
        onNavigate={setActiveView}
        onLogout={logout}
        leadCount={stats.totalLeads}
        hotLeadCount={hotLeadCount}
        dueFollowUps={stats.dueFollowUps}
        unreadCount={emailQueue.length}
      />

      <div className="crm-main">
        <header className="topbar">
          <div className="search-box">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="4" />
              <path d="M11 11l3 3" />
            </svg>
            <input
              type="text"
              placeholder="Search contacts, deals, companies..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>

          <div className="topbar-actions">
            <button className="icon-btn" type="button" title="Notifications" onClick={() => setActiveView("tasks")}>
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 1a5 5 0 0 0-5 5v2l-1 2h12l-1-2V6a5 5 0 0 0-5-5zm-1 12a1 1 0 0 0 2 0H7z" />
              </svg>
            </button>
            <button className="icon-btn" type="button" title="Calendar" onClick={() => setActiveView("tasks")}>
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M2 4h12v9H2zm0-2h3V1h2v1h2V1h2v1h3v2H2zM5 7H4v1h1zm3 0H7v1h1zm3 0h-1v1h1zM5 9H4v1h1zm3 0H7v1h1zm3 0h-1v1h1z" />
              </svg>
            </button>
            <button className="ghost-button compact-button" type="button" onClick={loadDashboard}>
              Refresh
            </button>
            <button className="btn-primary" type="button" onClick={handleCreate}>
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 1v14M1 8h14" stroke="white" strokeWidth="2" />
              </svg>
              New Lead
            </button>
          </div>
        </header>

        <div className="crm-content">
          {isLoading ? <div className="page-loader">Loading Velora CRM...</div> : renderActiveView()}
        </div>
      </div>

      {isModalOpen && (
        <LeadFormModal
          key={selectedLead?._id || "new"}
          lead={selectedLead}
          users={assignableUsers}
          currentUser={user}
          canAssignMultiple={canAssignMultiple}
          onClose={handleCloseModal}
          onSave={handleSaveLead}
          isSaving={isSaving}
        />
      )}

      {workspaceLead && (
        <LeadWorkspacePanel
          lead={workspaceLead}
          onClose={handleCloseWorkspace}
          onEdit={handleEdit}
          onAddNote={handleAddWorkspaceNote}
          onCompleteFollowUp={handleCompleteWorkspaceFollowUp}
          isSubmitting={isWorkspaceBusy}
        />
      )}
    </div>
  );
}

export default DashboardPage;
