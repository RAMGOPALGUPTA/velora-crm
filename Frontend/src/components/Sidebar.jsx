import VeloraLogo from "./VeloraLogo";

const getInitials = (value) =>
  value
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

const labelFromKey = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

const icons = {
  dashboard: (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M2 2h5v5H2zm7 0h5v5H9zm-7 7h5v5H2zm7 0h5v5H9z" />
    </svg>
  ),
  contacts: (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 5a5 5 0 0 1 10 0H3z" />
    </svg>
  ),
  companies: (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M2 2h12v12H2V2zm2 2v8h3V9h2v3h3V4H4zm1 1h2v2H5V5zm4 0h2v2H9V5zM5 8h2v1H5V8z" />
    </svg>
  ),
  pipeline: (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M1 3h3v10H1zm4 3h3v7H5zm4-5h3v12H9zm3 0h1v12h-1z" />
    </svg>
  ),
  deals: (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" />
    </svg>
  ),
  tasks: (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M2 2h12v2H2zm0 4h12v2H2zm0 4h7v2H2z" />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M1 3h14l-7 6-7-6zm0 2.5l7 6 7-6V13H1z" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M2 10l4-4 3 3 4-5 1 1-5 6-3-3-3 3z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm-1-3h2l.4 1.6a5 5 0 0 1 1.4.8l1.6-.6 1 1.7-1.3 1a5 5 0 0 1 0 1.8l1.3 1-1 1.7-1.6-.6a5 5 0 0 1-1.4.8L9 13H7l-.4-1.6a5 5 0 0 1-1.4-.8l-1.6.6-1-1.7 1.3-1a5 5 0 0 1 0-1.8l-1.3-1 1-1.7 1.6.6a5 5 0 0 1 1.4-.8z" />
    </svg>
  )
};

const navSections = [
  {
    title: "Main",
    items: ["dashboard", "contacts", "companies"]
  },
  {
    title: "Sales",
    items: ["pipeline", "deals", "tasks"]
  },
  {
    title: "Communication",
    items: ["email", "reports"]
  },
  {
    title: "Settings",
    items: ["settings"]
  }
];

function Sidebar({
  user,
  activeView,
  onNavigate,
  onLogout,
  leadCount,
  hotLeadCount,
  dueFollowUps,
  unreadCount
}) {
  const badges = {
    contacts: leadCount || null,
    deals: hotLeadCount || null,
    tasks: dueFollowUps || null,
    email: unreadCount || null
  };

  return (
    <aside className="crm-sidebar">
      <div className="logo">
        <VeloraLogo variant="sidebar" />
      </div>

      <div className="nav">
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="nav-section">{section.title}</div>
            {section.items.map((item) => (
              <button
                className={`nav-item ${activeView === item ? "active" : ""}`}
                key={item}
                type="button"
                onClick={() => onNavigate(item)}
              >
                {icons[item]}
                <span>{labelFromKey(item)}</span>
                {badges[item] ? (
                  <span className={`nav-badge ${item === "deals" ? "warning" : ""}`}>
                    {badges[item]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="avatar">{getInitials(user?.name)}</div>
        <div className="sidebar-footer-text">
          <div className="sidebar-footer-name">{user?.name || "Velora User"}</div>
          <div className="sidebar-footer-role">{labelFromKey(user?.role || "sales")}</div>
        </div>
        <button className="sidebar-logout" type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
