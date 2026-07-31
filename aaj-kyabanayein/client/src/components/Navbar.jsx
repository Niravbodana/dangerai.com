import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-orange-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🍳</span>
          <div>
            <span className="text-lg font-bold text-orange-600">AajKyaBanayein</span>
            <p className="text-xs text-gray-500">Roz ka khana, tension free</p>
          </div>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-gray-600 sm:block">
                Namaste, <strong>{user.name}</strong>
                <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs capitalize text-green-700">
                  {user.plan}
                </span>
              </span>
              <Link
                to="/planner"
                className="rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
              >
                Meal Plan
              </Link>
              <Link
                to="/pantry"
                className="hidden rounded-full border border-green-200 px-3 py-2 text-sm font-medium text-green-600 transition hover:bg-green-50 sm:block"
              >
                🏠 Pantry
              </Link>
              <Link
                to="/healthy-week"
                className="hidden rounded-full border border-green-200 px-3 py-2 text-sm font-medium text-green-600 transition hover:bg-green-50 md:block"
              >
                💚 Healthy
              </Link>
              <Link
                to="/recipes"
                className="hidden rounded-full border border-orange-200 px-4 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-50 sm:block"
              >
                Recipes
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-orange-200 px-4 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-50"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
              >
                Signup
              </Link>
            </>
          )}
          <Link
            to="/pricing"
            className="hidden rounded-full border border-orange-200 px-4 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-50 md:block"
          >
            Pricing
          </Link>
        </nav>
      </div>
    </header>
  );
}
