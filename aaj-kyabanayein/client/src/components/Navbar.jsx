import { Link } from "react-router-dom";

export default function Navbar() {
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
        <nav className="flex items-center gap-3">
          <Link
            to="/planner"
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
          >
            Meal Plan
          </Link>
          <Link
            to="/pricing"
            className="hidden rounded-full border border-orange-200 px-4 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-50 sm:block"
          >
            Pricing
          </Link>
        </nav>
      </div>
    </header>
  );
}
