import { Link, useLocation } from "react-router-dom";

const TABS = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/recipes", label: "Recipes", icon: "📖" },
  { to: "/pantry", label: "Pantry", icon: "🥬" },
  { to: "/planner", label: "Plan", icon: "🍳" },
  { to: "/healthy-week", label: "Healthy", icon: "💚" },
];

export default function MobileNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-orange-100 bg-white/95 backdrop-blur sm:hidden">
      <div className="flex justify-around py-2">
        {TABS.map((tab) => {
          const active = pathname === tab.to || (tab.to !== "/" && pathname.startsWith(tab.to));
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center px-2 py-1 text-xs ${
                active ? "font-semibold text-orange-600" : "text-gray-500"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
