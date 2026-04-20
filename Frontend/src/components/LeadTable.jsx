const formatDate = (value) => {
  if (!value) {
    return "No reminder";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "No reminder";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);

const getAssignees = (lead) => {
  if (!lead.assignedTo) {
    return [];
  }

  return Array.isArray(lead.assignedTo) ? lead.assignedTo : [lead.assignedTo];
};

function LeadTable({ leads = [], role, onEdit, onDelete, onOpenWorkspace, isLoading }) {
  if (isLoading) {
    return <div className="loader">Loading leads</div>;
  }

  if (!leads.length) {
    return (
      <div className="empty-state">
        <h3 style={{ marginTop: 0 }}>No leads found</h3>
        <p style={{ marginBottom: 0 }}>
          Create a new lead, move a deal in the board, or clear the active filters.
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="lead-table">
        <thead>
          <tr>
            <th>Lead</th>
            <th>Stage</th>
            <th>Priority</th>
            <th>Value</th>
            <th>Assigned</th>
            <th>Follow-up</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const assignees = getAssignees(lead);

            return (
              <tr key={lead._id}>
                <td>
                  <div className="lead-primary">
                    <strong>{lead.name}</strong>
                    <span>{lead.company || "Independent lead"}</span>
                    <span>{lead.email || lead.phone || "No contact details"}</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${lead.status}`}>{lead.status}</span>
                </td>
                <td>
                  <div className="lead-primary">
                    <span className={`score-badge ${lead.scoreBand || "cold"}`}>
                      {lead.scoreBand || "cold"}
                    </span>
                    <span>{lead.score || 0}/100</span>
                  </div>
                </td>
                <td>
                  <strong>{formatCurrency(lead.dealValue)}</strong>
                  <div className="muted-text">{lead.source || "Direct"}</div>
                </td>
                <td>
                  <div className="table-avatars">
                    {assignees.length
                      ? assignees.map((user) => (
                        <span className="tiny-avatar" key={user._id || user.id} title={user.name}>
                          {user.name?.slice(0, 1) || "U"}
                        </span>
                      ))
                      : <span className="muted-text">Unassigned</span>}
                  </div>
                </td>
                <td>{formatDate(lead.nextFollowUpAt)}</td>
                <td>
                  <div className="table-actions">
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => onOpenWorkspace(lead)}
                    >
                      Open
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => onEdit(lead)}
                    >
                      Edit
                    </button>
                    {role === "admin" && (
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => onDelete(lead)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default LeadTable;
