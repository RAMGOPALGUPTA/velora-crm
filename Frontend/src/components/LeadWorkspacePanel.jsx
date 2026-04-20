import { useState } from "react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);

const formatDate = (value, withTime = false) => {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", withTime
    ? {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
    : {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(date);
};

const getAssignees = (lead) => {
  if (!lead.assignedTo) {
    return [];
  }

  return Array.isArray(lead.assignedTo) ? lead.assignedTo : [lead.assignedTo];
};

function LeadWorkspacePanel({
  lead,
  onClose,
  onEdit,
  onAddNote,
  onCompleteFollowUp,
  isSubmitting
}) {
  const [note, setNote] = useState("");
  const assignees = getAssignees(lead);

  const handleAddNote = async (event) => {
    event.preventDefault();

    const trimmedNote = note.trim();
    if (!trimmedNote) {
      return;
    }

    await onAddNote(trimmedNote);
    setNote("");
  };

  return (
    <div className="overlay workspace-overlay" role="presentation" onClick={onClose}>
      <aside
        className="workspace-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-workspace-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="workspace-header">
          <div>
            <p className="eyebrow eyebrow-dark">Lead Workspace</p>
            <h2 className="section-title" id="lead-workspace-title">{lead.name}</h2>
            <p className="section-subtitle">
              {`${lead.company || lead.source || "Pipeline lead"} - ${formatCurrency(lead.dealValue)}`}
            </p>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="workspace-summary-grid">
          <div className="workspace-card">
            <span className="muted-text">Stage</span>
            <strong className={`badge ${lead.status}`}>{lead.status}</strong>
          </div>
          <div className="workspace-card">
            <span className="muted-text">Priority</span>
            <strong className={`score-badge ${lead.scoreBand || "cold"}`}>
              {`${lead.scoreBand || "cold"} - ${lead.score || 0}`}
            </strong>
          </div>
          <div className="workspace-card">
            <span className="muted-text">Next follow-up</span>
            <strong>{formatDate(lead.nextFollowUpAt)}</strong>
          </div>
        </div>

        <div className="workspace-actions">
          <button className="ghost-button" type="button" onClick={() => onEdit(lead)}>
            Edit details
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={onCompleteFollowUp}
            disabled={isSubmitting || lead.status === "closed"}
          >
            {lead.status === "closed" ? "Closed lead" : isSubmitting ? "Saving..." : "Complete follow-up"}
          </button>
        </div>

        <div className="workspace-section">
          <h3 className="workspace-section-title">Contact & ownership</h3>
          <div className="workspace-info-grid">
            <div className="workspace-card">
              <span className="muted-text">Email</span>
              <strong>{lead.email || "Not added"}</strong>
            </div>
            <div className="workspace-card">
              <span className="muted-text">Phone</span>
              <strong>{lead.phone || "Not added"}</strong>
            </div>
            <div className="workspace-card">
              <span className="muted-text">Last contacted</span>
              <strong>{formatDate(lead.lastContactedAt)}</strong>
            </div>
            <div className="workspace-card">
              <span className="muted-text">Assigned team</span>
              <div className="workspace-chip-wrap">
                {assignees.length ? assignees.map((user) => (
                  <span className="kanban-chip" key={user._id || user.id}>
                    {user.name}
                  </span>
                )) : <strong>Unassigned</strong>}
              </div>
            </div>
          </div>
        </div>

        <div className="workspace-section">
          <h3 className="workspace-section-title">Activity timeline</h3>
          <div className="timeline-list">
            {(lead.activities || []).length ? lead.activities.map((activity, index) => (
              <div className="timeline-item" key={`${activity.createdAt}-${index}`}>
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-head">
                    <strong>{activity.message}</strong>
                    <span>{formatDate(activity.createdAt, true)}</span>
                  </div>
                  <p>{`${activity.createdByName || "System"} - ${activity.type}`}</p>
                </div>
              </div>
            )) : (
              <div className="empty-mini">No activity has been logged for this lead yet.</div>
            )}
          </div>
        </div>

        <div className="workspace-section">
          <h3 className="workspace-section-title">Add note</h3>
          <form className="workspace-note-form" onSubmit={handleAddNote}>
            <textarea
              className="workspace-textarea"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add call outcome, objection, next step, or meeting summary..."
              rows={4}
            />
            <button className="primary-button" type="submit" disabled={isSubmitting || !note.trim()}>
              {isSubmitting ? "Saving..." : "Save note"}
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}

export default LeadWorkspacePanel;
