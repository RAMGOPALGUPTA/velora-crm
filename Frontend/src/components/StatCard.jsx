function StatCard({ label, value, delta, tone = "up" }) {
  return (
    <article className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {delta ? (
        <div className={`metric-delta ${tone === "down" ? "delta-down" : "delta-up"}`}>
          <span className="delta-arrow" aria-hidden="true">
            {tone === "down" ? "▼" : "▲"}
          </span>
          <span>{delta}</span>
        </div>
      ) : null}
    </article>
  );
}

export default StatCard;
