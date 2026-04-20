const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);

function TeamPerformancePanel({ members = [] }) {
  return (
    <section className="surface-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow eyebrow-dark">Team Performance</p>
          <h3 className="panel-title">Revenue leaderboard</h3>
          <p className="muted-text">
            See who owns the most pipeline, forecast, and closed revenue.
          </p>
        </div>
      </div>

      <div className="leaderboard-list">
        {members.length ? members.map((member, index) => (
          <div className="leaderboard-row" key={member._id}>
            <div className="leaderboard-rank">{index + 1}</div>
            <div className="leaderboard-main">
              <strong>{member.name}</strong>
              <p>{`${member.role} - ${member.totalLeads} leads`}</p>
            </div>
            <div className="leaderboard-metrics">
              <span>{`Forecast ${formatCurrency(member.weightedForecast)}`}</span>
              <span>{`Closed ${formatCurrency(member.closedRevenue)}`}</span>
            </div>
          </div>
        )) : (
          <div className="empty-mini">Performance data will appear after leads are assigned.</div>
        )}
      </div>
    </section>
  );
}

export default TeamPerformancePanel;
