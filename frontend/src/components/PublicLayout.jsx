import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { roleMeta } from "../data/platformData";

const baseLinks = [
  { to: "/", label: "Home" },
  { to: "/marketplace-preview", label: "Marketplace" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "Impact" }
];

export default function PublicLayout({ children }) {
  const { user, isAuthenticated } = useAuth();
  const links = isAuthenticated
    ? [...baseLinks, { to: roleMeta[user.role]?.basePath || "/login", label: "My Dashboard" }]
    : [...baseLinks, { to: "/login", label: "Login" }];

  return (
    <div className="min-h-screen bg-brand-50 px-4 py-8 text-ink sm:px-8 lg:px-14">
      <div className="mx-auto max-w-[1280px]">
        <header className="mb-16 flex items-center justify-between gap-6 rounded-lg border border-line bg-white px-8 py-4 max-md:flex-col max-md:items-stretch">
          <NavLink to="/" className="text-lg font-extrabold text-brand-700">Waste-to-Value Rwanda</NavLink>
          <nav className="flex flex-wrap items-center justify-end gap-8 text-sm font-bold text-ink max-md:justify-start">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => isActive ? "text-brand-700" : "hover:text-brand-700"}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
