import { Link, NavLink } from "react-router-dom";
import { roleMeta } from "../../data/platformData";
import { SearchBox } from "./ui";

function navPath(item, role) {
  const paths = {
    admin: {
      Dashboard: "/admin",
      Users: "/admin/users",
      Companies: "/admin/companies",
      Materials: "/admin/material-approvals",
      Transactions: "/admin/transactions",
      Certificates: "/admin/certificates",
      Analytics: "/admin/reports",
      Messages: "/messages",
      Settings: "/admin/settings"
    },
    industry: {
      Dashboard: "/industry",
      "Add Material": "/industry/add-material",
      "My Materials": "/industry/materials",
      Requests: "/industry/requests",
      Transport: "/industry/transport-request",
      Sustainability: "/industry/sustainability",
      Certificates: "/industry/certificates",
      Messages: "/messages",
      Settings: "/industry/settings"
    },
    buyer: {
      Dashboard: "/buyer",
      Marketplace: "/buyer/marketplace",
      "Smart Matching": "/buyer/smart-matching",
      Requests: "/buyer/requests",
      Delivery: "/buyer/delivery-tracking",
      Certificates: "/buyer/certificates",
      Messages: "/messages",
      Settings: "/buyer/settings"
    },
    transporter: {
      Dashboard: "/transport",
      Jobs: "/transport/jobs",
      Delivery: "/transport/active",
      Earnings: "/transport/earnings",
      Ratings: "/transport/ratings",
      Messages: "/messages",
      Settings: "/transport/settings"
    },
    regulator: {
      Dashboard: "/regulator",
      Impact: "/regulator/impact",
      Ranking: "/regulator/ranking",
      Certificates: "/regulator/certificates",
      Compliance: "/regulator/compliance",
      Messages: "/messages",
      Settings: "/regulator/settings"
    }
  };

  const base = roleMeta[role]?.basePath || "/admin";
  return paths[role]?.[item] || base;
}

function navItemsForRole(role) {
  const items = {
    admin: ["Dashboard", "Users", "Companies", "Materials", "Transactions", "Certificates", "Analytics", "Messages", "Settings"],
    industry: ["Dashboard", "Add Material", "My Materials", "Requests", "Transport", "Sustainability", "Certificates", "Messages", "Settings"],
    buyer: ["Dashboard", "Marketplace", "Smart Matching", "Requests", "Delivery", "Certificates", "Messages", "Settings"],
    transporter: ["Dashboard", "Jobs", "Delivery", "Earnings", "Ratings", "Messages", "Settings"],
    regulator: ["Dashboard", "Impact", "Ranking", "Certificates", "Compliance", "Messages", "Settings"]
  };

  return items[role] || items.admin;
}

export default function DashboardShell({ title, active = "Dashboard", userRole = "admin", children }) {
  const roleLabel = roleMeta[userRole]?.label || "System Admin";

  return (
    <div className="min-h-screen bg-canvas p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid max-w-[1340px] gap-6 lg:grid-cols-[230px_1fr]">
        <aside className="flex min-h-[calc(100vh-64px)] flex-col rounded-lg bg-brand-900 p-6 text-white max-lg:min-h-0">
          <Link to="/" className="block">
            <h1 className="text-[28px] font-extrabold leading-none text-white">Waste2Value</h1>
            <p className="mt-2 text-xs font-semibold text-emerald-100">Rwanda Platform</p>
          </Link>

          <nav className="mt-9 grid gap-2 max-lg:grid-cols-3 max-sm:grid-cols-2">
            {navItemsForRole(userRole).map((item) => (
              <NavLink
                key={item}
                to={navPath(item, userRole)}
                end={item === "Dashboard"}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-3 text-sm font-medium transition ${
                    isActive || active === item
                      ? "bg-brand-500 text-white"
                      : "text-emerald-50 hover:bg-white/10"
                  }`
                }
              >
                {item}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-8 max-lg:hidden">
            <p className="truncate text-sm font-extrabold text-white">{roleLabel}</p>
            <p className="mt-1 text-xs font-semibold text-emerald-100">Logged in</p>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="mb-7 flex items-center justify-between gap-5 max-md:flex-col max-md:items-stretch">
            <h2 className="text-3xl font-extrabold leading-tight text-ink">{title}</h2>
            <SearchBox />
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
