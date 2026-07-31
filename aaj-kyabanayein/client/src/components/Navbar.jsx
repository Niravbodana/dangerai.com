import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { to: "/recipes", label: "Recipes", icon: "📖" },
  { to: "/pantry", label: "Pantry", icon: "🏠" },
  { to: "/planner", label: "Meal Plan", icon: "🍳" },
  { to: "/healthy-week", label: "Healthy", icon: "💚" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-orange-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🍳</span>
          <div>
            <span className="text-lg font-bold text-orange-600">AajKyaBanayein</span>
            <p className="text-xs text-gray-500">100% Free · Roz ka khana</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-orange-50 hover:text-orange-600 sm:block"
            >
              {link.icon} {link.label}
            </Link>
          ))}

          {user ? (
            <>
              <span className="hidden text-sm text-gray-600 md:block">
                {user.name}
              </span>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
