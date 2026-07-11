import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { roleMeta } from "../../data/platformData";
import { useAuth } from "../../hooks/useAuth";

const NAV = {
  admin: [
    { label: "Dashboard", to: "/admin" },
    { label: "Users", to: "/admin/users" },
    { label: "Materials", to: "/admin/materials" },
    { label: "Categories", to: "/admin/categories" },
    { label: "Reports", to: "/admin/reports" }
  ],
  industry: [
    { label: "Dashboard", to: "/industry" },
    { label: "My Materials", to: "/industry/materials" },
    { label: "Requests", to: "/industry/requests" },
    { label: "Certificates", to: "/industry/certificates" }
  ],
  buyer: [
    { label: "Dashboard", to: "/buyer" },
    { label: "Marketplace", to: "/buyer/marketplace" },
    { label: "My Requests", to: "/buyer/requests" },
    { label: "Delivery", to: "/buyer/delivery" }
  ],
  transporter: [
    { label: "Dashboard", to: "/transport" },
    { label: "Jobs", to: "/transport/jobs" },
    { label: "Delivery", to: "/transport/delivery" }
  ],
  regulator: [
    { label: "Dashboard", to: "/regulator" },
    { label: "Quality Verification", to: "/regulator/quality" },
    { label: "Collection Overview", to: "/regulator/collection" },
    { label: "Reports", to: "/regulator/reports" }
  ]
};

export default function DashboardShell({ title, active = "Dashboard", userRole = "admin", children }) {
  const roleLabel = roleMeta[userRole]?.label || "System Admin";
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV[userRole] || NAV.admin;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-canvas p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid max-w-[1340px] gap-6 lg:grid-cols-[230px_1fr]">
        <aside className="flex min-h-[calc(100vh-64px)] flex-col rounded-lg bg-brand-900 p-6 text-white max-lg:min-h-0">
          <Link to="/" className="block">
            <h1 className="text-[28px] font-extrabold leading-none text-white">Waste-to-Value</h1>
            <p className="mt-2 text-xs font-semibold text-emerald-100">Rwanda Platform</p>
          </Link>

          <nav className="mt-9 grid gap-2 max-lg:grid-cols-3 max-sm:grid-cols-2">
            {items.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.label === "Dashboard"}
                className={() =>
                  `rounded-lg px-4 py-3 text-sm font-medium transition ${
                    active === item.label
                      ? "bg-brand-500 text-white"
                      : "text-emerald-50 hover:bg-white/10"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-8 max-lg:hidden">
            <p className="truncate text-sm font-extrabold text-white">{user?.fullName || roleLabel}</p>
            <p className="mt-1 truncate text-xs font-semibold text-emerald-100">{user?.company?.companyName || roleLabel}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="mb-7">
            <h2 className="text-3xl font-extrabold leading-tight text-ink">{title}</h2>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
