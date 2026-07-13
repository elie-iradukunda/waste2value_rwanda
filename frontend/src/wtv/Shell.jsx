import { roleMeta } from "./data.js";

export default function Shell({ user, onLogout, children }) {
  const role = roleMeta(user?.role);

  return (
    <div>
      <div className="topbar">
        <div className="brand">
          <div className="logo small">W2V</div>
          <div>
            <div className="brand-name">Waste to Value</div>
            <div className="brand-sub">Rwanda circular exchange</div>
          </div>
          <span className="role-tag" style={{ background: `${role.color}22`, color: role.color }}>
            {role.label}
          </span>
        </div>
        <div className="spacer" />
        <div className="who">
          <div className="who-r">{user?.name || role.label}</div>
          <div className="who-e">{user?.email || role.email}</div>
        </div>
        <button className="btn ghost sm" onClick={onLogout}>Logout</button>
      </div>
      {children}
    </div>
  );
}
