const stageMeta = {
  new: {
    title: "New",
    hint: "Fresh inbound or outbound leads"
  },
  contacted: {
    title: "Contacted",
    hint: "First touch is complete"
  },
  qualified: {
    title: "Qualified",
    hint: "Good fit and worth pursuing"
  },
  negotiation: {
    title: "Negotiation",
    hint: "Commercial discussion is active"
  },
  closed: {
    title: "Closed",
    hint: "Won or fully completed"
  }
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);

const formatReminder = (value) => {
  if (!value) {
    return "Auto reminder pending";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Auto reminder pending";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short"
  }).format(date);
};

const getAssigneeNames = (lead) => {
  if (!lead.assignedTo) {
    return [];
  }

  return (Array.isArray(lead.assignedTo) ? lead.assignedTo : [lead.assignedTo])
    .map((user) => user?.name)
    .filter(Boolean);
};

function PipelineBoard({ leads = [], onMoveLead, onOpenWorkspace }) {
  const grouped = Object.keys(stageMeta).reduce((result, key) => {
    result[key] = leads.filter((lead) => lead.status === key);
    return result;
  }, {});

  const handleDragStart = (event, leadId) => {
    event.dataTransfer.setData("text/plain", leadId);
  };

  const handleDrop = (event, nextStatus) => {
    event.preventDefault();
    const leadId = event.dataTransfer.getData("text/plain");

    if (leadId) {
      onMoveLead(leadId, nextStatus);
    }
  };

  return (
    <section className="surface-card kanban-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow eyebrow-dark">Kanban Board</p>
          <h3 className="panel-title">Move deals across the pipeline</h3>
          <p className="muted-text">
            Drag leads between stages and let the CRM refresh score and automation cues.
          </p>
        </div>
      </div>

      <div className="kanban-grid five-column-grid">
        {Object.entries(stageMeta).map(([status, meta]) => (
          <div
            className={`kanban-column ${status}`}
            key={status}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, status)}
          >
            <div className="kanban-column-head">
              <div>
                <h4>{meta.title}</h4>
                <p>{meta.hint}</p>
              </div>
              <span>{grouped[status].length}</span>
            </div>

            <div className="kanban-list">
              {grouped[status].map((lead) => (
                <article
                  className="kanban-item"
                  key={lead._id}
                  draggable
                  onDragStart={(event) => handleDragStart(event, lead._id)}
                >
                  <div className="kanban-item-top">
                    <div>
                      <strong>{lead.name}</strong>
                      <p>{lead.company || lead.source || "Direct lead"}</p>
                    </div>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => onOpenWorkspace(lead)}
                    >
                      Open
                    </button>
                  </div>

                  <div className="kanban-meta-row">
                    <span>{formatCurrency(lead.dealValue)}</span>
                    <span className={`score-badge ${lead.scoreBand || "cold"}`}>
                      {lead.scoreBand || "cold"}
                    </span>
                  </div>

                  <div className="kanban-meta-row">
                    <span>Score {lead.score || 0}</span>
                    <span>Follow-up {formatReminder(lead.nextFollowUpAt)}</span>
                  </div>

                  <div className="kanban-assignees">
                    {getAssigneeNames(lead).map((name) => (
                      <span className="kanban-chip" key={name}>
                        {name}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PipelineBoard;
