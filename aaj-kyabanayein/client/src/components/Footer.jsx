import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.06] bg-[#0c0a08]/50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <BrandLogo light className="h-8 w-auto" />
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              Ghar ka khana, naye andaaz mein. 770+ real recipes with authentic ingredients — step-by-step cooking, pantry suggestions, abhi ke liye free.
            </p>
            <p className="mt-3 text-xs text-[var(--accent-soft)]">Made with ❤️ for Indian home cooks</p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-[var(--text-secondary)]">
            <Link to="/recipes" className="transition hover:text-[var(--accent-soft)]">Recipes</Link>
            <Link to="/planner" className="transition hover:text-[var(--accent-soft)]">Meal Plan</Link>
            <Link to="/pantry" className="transition hover:text-[var(--accent-soft)]">Pantry</Link>
            <Link to="/favorites" className="transition hover:text-[var(--accent-soft)]">Favorites</Link>
            <Link to="/pricing" className="transition hover:text-[var(--accent-soft)]">Pricing</Link>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-8 sm:flex-row">
          <p className="text-xs text-[var(--text-secondary)]">
            {year} Rasoira — Free for Now
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Aapki rasoi, aapka pride 🍛
          </p>
        </div>
      </div>
    </footer>
  );
}
