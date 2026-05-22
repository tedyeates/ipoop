import { NavLink } from "react-router-dom";
import { Home, UtensilsCrossed, CircleDot, Activity, Thermometer } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/log/meal", label: "Meal", icon: UtensilsCrossed },
  { to: "/log/stool", label: "Stool", icon: CircleDot },
  { to: "/log/context", label: "Context", icon: Activity },
  { to: "/log/symptoms", label: "Symptoms", icon: Thermometer },
] as const;

export default function BottomNav() {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white"
    >
      <ul className="flex items-center justify-around">
        {navItems.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex min-h-[44px] min-w-[44px] flex-col items-center justify-center px-2 py-1 text-xs ${
                  isActive
                    ? "text-indigo-600 font-semibold"
                    : "text-gray-500"
                }`
              }
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="mt-0.5">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
