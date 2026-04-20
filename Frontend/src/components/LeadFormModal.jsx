import { useState } from "react";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  source: "",
  status: "new",
  dealValue: "",
  nextFollowUpAt: "",
  assignedTo: []
};

const normalizeAssignedTo = (lead) => {
  if (!lead?.assignedTo) {
    return [];
  }

  return (Array.isArray(lead.assignedTo) ? lead.assignedTo : [lead.assignedTo])
    .map((user) => user?._id || user?.id || user)
    .filter(Boolean);
};

const formatDateInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const getInitialForm = (lead, currentUser) => {
  if (!lead) {
    return {
      ...initialForm,
      assignedTo: currentUser?._id ? [currentUser._id] : currentUser?.id ? [currentUser.id] : []
    };
  }

  return {
    name: lead.name || "",
    email: lead.email || "",
    phone: lead.phone || "",
    company: lead.company || "",
    source: lead.source || "",
    status: lead.status || "new",
    dealValue: lead.dealValue ?? "",
    nextFollowUpAt: formatDateInput(lead.nextFollowUpAt),
    assignedTo: normalizeAssignedTo(lead)
  };
};

function LeadFormModal({
  lead,
  users = [],
  currentUser,
  canAssignMultiple,
  onClose,
  onSave,
  isSaving
}) {
  const [form, setForm] = useState(() => getInitialForm(lead, currentUser));

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleAssignToggle = (userId) => {
    setForm((current) => {
      const exists = current.assignedTo.includes(userId);

      if (!canAssignMultiple) {
        return {
          ...current,
          assignedTo: exists ? [] : [userId]
        };
      }

      return {
        ...current,
        assignedTo: exists
          ? current.assignedTo.filter((id) => id !== userId)
          : [...current.assignedTo, userId]
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSave({
      ...form,
      dealValue: form.dealValue === "" ? 0 : Number(form.dealValue),
      nextFollowUpAt: form.nextFollowUpAt || null,
      assignedTo: form.assignedTo
    });
  };

  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-card lead-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow eyebrow-dark">Lead Workspace</p>
            <h2 className="section-title" id="lead-modal-title">
              {lead ? "Update deal record" : "Create pipeline lead"}
            </h2>
            <p className="section-subtitle">
              Add company context, forecast value, next follow-up date, and team ownership.
            </p>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="field-label">
              Lead name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Aarav Sharma"
                required
              />
            </label>
            <label className="field-label">
              Company
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="BluePeak Labs"
              />
            </label>
          </div>

          <div className="form-row">
            <label className="field-label">
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="lead@company.com"
              />
            </label>
            <label className="field-label">
              Phone
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />
            </label>
          </div>

          <div className="form-row">
            <label className="field-label">
              Status
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <label className="field-label">
              Deal value
              <input
                name="dealValue"
                type="number"
                min="0"
                value={form.dealValue}
                onChange={handleChange}
                placeholder="250000"
              />
            </label>
          </div>

          <div className="form-row">
            <label className="field-label">
              Source
              <input
                name="source"
                value={form.source}
                onChange={handleChange}
                placeholder="Referral, Website, LinkedIn"
              />
            </label>
            <label className="field-label">
              Next follow-up
              <input
                name="nextFollowUpAt"
                type="date"
                value={form.nextFollowUpAt}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="field-label">
            Assigned team
            <div className="assignment-grid">
              {users.map((user) => {
                const isSelected = form.assignedTo.includes(user._id);

                return (
                  <label className={`assignment-chip ${isSelected ? "selected" : ""}`} key={user._id}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleAssignToggle(user._id)}
                    />
                    <span className="assignment-name">{user.name}</span>
                    <span className="assignment-role">{user.role}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : lead ? "Save changes" : "Create lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LeadFormModal;
