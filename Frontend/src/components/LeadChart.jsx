import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const chartPalette = {
  new: "#6b8bff",
  contacted: "#28c0cb",
  qualified: "#8b5cf6",
  negotiation: "#ffb14a",
  closed: "#0ea96e"
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

function LeadChart({ stats = [] }) {
  return (
    <section className="surface-card chart-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow eyebrow-dark">Pipeline Performance</p>
          <h3 className="panel-title">Lead count and value by stage</h3>
          <p className="muted-text">
            See how many deals are sitting in each stage and how much value they carry.
          </p>
        </div>
      </div>

      <div className="chart-shell">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats} barGap={12}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" />
            <XAxis dataKey="label" stroke="#7f8aa3" />
            <YAxis stroke="#7f8aa3" />
            <Tooltip
              formatter={(value, name) => (
                name === "value"
                  ? currencyFormatter.format(value)
                  : value
              )}
              contentStyle={{
                borderRadius: "18px",
                border: "1px solid rgba(191, 219, 254, 0.9)",
                background: "#ffffff",
                boxShadow: "0 18px 40px rgba(37, 99, 235, 0.12)"
              }}
              labelStyle={{ color: "#17314f" }}
            />
            <Bar dataKey="count" radius={[10, 10, 0, 0]}>
              {stats.map((entry) => (
                <Cell key={entry.key} fill={chartPalette[entry.key]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend-grid">
        {stats.map((item) => (
          <div className="chart-legend-card" key={item.key}>
            <div className="legend-left">
              <span
                className="legend-dot"
                style={{ background: chartPalette[item.key] }}
              />
              <strong style={{ textTransform: "capitalize" }}>{item.label}</strong>
            </div>
            <span>{item.count} leads</span>
            <strong>{currencyFormatter.format(item.value || 0)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export default LeadChart;
