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
    month: "short"
  }).format(date);
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);

function InsightStack({ scoreMix = [], upcomingFollowUps = [], priorityLeads = [] }) {
  return (
    <section className="insights-grid">
      <article className="surface-card insight-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow eyebrow-dark">Priority Mix</p>
            <h3 className="panel-title">AI scoring buckets</h3>
            <p className="muted-text">
              Rule-based lead scoring keeps the hottest deals visible first.
            </p>
          </div>
        </div>

        <div className="score-grid">
          {scoreMix.map((item) => (
            <div className="score-card" key={item.key}>
              <span className={`score-badge ${item.key}`}>{item.label}</span>
              <strong>{item.count}</strong>
              <span>{item.note}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="surface-card insight-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow eyebrow-dark">Smart Reminders</p>
            <h3 className="panel-title">Upcoming follow-ups</h3>
            <p className="muted-text">
              These are the next records that need action from your team.
            </p>
          </div>
        </div>

        <div className="insight-list">
          {upcomingFollowUps.length ? upcomingFollowUps.map((lead) => (
            <div className="insight-row" key={lead._id}>
              <div>
                <strong>{lead.name}</strong>
                <p>{lead.company || lead.source || "Direct lead"}</p>
              </div>
              <div className="insight-meta">
                <span>{formatDate(lead.nextFollowUpAt)}</span>
                <span className={`score-badge ${lead.scoreBand || "cold"}`}>{lead.scoreBand || "cold"}</span>
              </div>
            </div>
          )) : (
            <div className="empty-mini">No active follow-ups right now.</div>
          )}
        </div>
      </article>

      <article className="surface-card insight-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow eyebrow-dark">Priority Queue</p>
            <h3 className="panel-title">Hot leads to close</h3>
            <p className="muted-text">
              Highest-scoring open leads worth acting on immediately.
            </p>
          </div>
        </div>

        <div className="insight-list">
          {priorityLeads.length ? priorityLeads.map((lead) => (
            <div className="insight-row" key={lead._id}>
              <div>
                <strong>{lead.name}</strong>
                <p>{`${lead.company || "Opportunity"} - ${formatCurrency(lead.dealValue)}`}</p>
              </div>
              <div className="insight-meta">
                <span>{`Score ${lead.score || 0}`}</span>
                <span className={`badge ${lead.status}`}>{lead.status}</span>
              </div>
            </div>
          )) : (
            <div className="empty-mini">Hot leads will appear here as your funnel grows.</div>
          )}
        </div>
      </article>
    </section>
  );
}

export default InsightStack;
