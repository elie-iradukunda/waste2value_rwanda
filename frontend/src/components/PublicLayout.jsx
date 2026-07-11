import { Menu, Recycle, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { roleMeta } from "../data/platformData";
import { cx } from "./dashboard/ui";

const baseLinks = [
  { to: "/", label: "Home" },
  { to: "/marketplace-preview", label: "Marketplace" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "Impact" },
  { to: "/contact", label: "Contact" }
];

export default function PublicLayout({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = isAuthenticated
    ? [...baseLinks, { to: roleMeta[user.role]?.basePath || "/login", label: "My Dashboard" }]
    : [...baseLinks, { to: "/login", label: "Login" }];

  return (
    <div className="min-h-screen bg-[#f4faf6] text-ink">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-extrabold focus:text-brand-700 focus:shadow-subtle">
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex min-w-0 items-center gap-3" aria-label="Waste-to-Value Rwanda home">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-700 text-white">
              <Recycle className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg font-extrabold text-brand-900">Waste-to-Value Rwanda</span>
              <span className="block text-xs font-bold text-muted">Circular waste exchange</span>
            </span>
          </NavLink>

          <button
            type="button"
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-white text-ink md:hidden"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>

          <nav className="hidden items-center justify-end gap-1 text-sm font-extrabold text-ink md:flex" aria-label="Public navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => cx(
                  "rounded-lg px-4 py-3 transition hover:bg-brand-50 hover:text-brand-700",
                  isActive && "bg-brand-50 text-brand-700"
                )}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {menuOpen && (
          <nav className="border-t border-line bg-white px-4 py-3 md:hidden" aria-label="Mobile navigation">
            <div className="mx-auto grid max-w-[1280px] gap-2">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => cx(
                    "rounded-lg px-4 py-3 text-sm font-extrabold transition hover:bg-brand-50 hover:text-brand-700",
                    isActive && "bg-brand-50 text-brand-700"
                  )}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main id="main-content" className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-brand-100 bg-white">
        <div className="mx-auto grid max-w-[1280px] gap-4 px-4 py-8 text-sm font-semibold text-muted sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
          <p>Waste-to-Value Rwanda connects verified companies to reuse materials, coordinate transport, and prove circular impact.</p>
          <p className="text-brand-700">Kigali, Rwanda</p>
        </div>
      </footer>
      </div>
  );
}
