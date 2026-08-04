import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import { useSiteConfig } from "../context/SiteConfigContext";

const SOCIAL_ICONS = {
  instagram: "Instagram",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
  twitter: "X",
  facebook: "Facebook",
  telegram: "Telegram",
};

export default function Footer() {
  const year = new Date().getFullYear();
  const { config } = useSiteConfig();
  const social = config?.social || {};
  const site = config?.site || {};
  const socialLinks = Object.entries(social).filter(([, url]) => url && url.startsWith("http"));

  return (
    <footer className="border-t border-white/[0.06] bg-[#0c0a08]/50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <BrandLogo light className="h-8 w-auto" />
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              India&apos;s home-cooking OS. 900+ real recipes — photos, mood plans, Aaj Kya Banaye.
            </p>
            {site.supportEmail && (
              <a href={`mailto:${site.supportEmail}`} className="mt-2 block text-xs text-[var(--accent-soft)] hover:underline">
                {site.supportEmail}
              </a>
            )}
            <p className="mt-3 text-xs text-[var(--accent-soft)]">Made with care for Indian home cooks</p>
            {socialLinks.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {socialLinks.map(([key, url]) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--text-secondary)] transition hover:text-[var(--accent-soft)]"
                  >
                    {SOCIAL_ICONS[key] || key}
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-[var(--text-secondary)]">
            <Link to="/today" className="transition hover:text-[var(--accent-soft)]">Today</Link>
            <Link to="/recipes" className="transition hover:text-[var(--accent-soft)]">Recipes</Link>
            <Link to="/collections" className="transition hover:text-[var(--accent-soft)]">Collections</Link>
            <Link to="/pantry" className="transition hover:text-[var(--accent-soft)]">Pantry</Link>
            <Link to="/planner" className="transition hover:text-[var(--accent-soft)]">Meal Plan</Link>
            <Link to="/kitchen" className="transition hover:text-[var(--accent-soft)]">Kitchen</Link>
            <Link to="/taste" className="transition hover:text-[var(--accent-soft)]">Taste</Link>
            <Link to="/family" className="transition hover:text-[var(--accent-soft)]">Family</Link>
            <Link to="/streak" className="transition hover:text-[var(--accent-soft)]">Streak</Link>
            <Link to="/pricing" className="transition hover:text-[var(--accent-soft)]">Pricing</Link>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-8 sm:flex-row">
          <p className="text-xs text-[var(--text-secondary)]">
            {year} Rasoira — Free core · Plus optional
          </p>
          <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
            {site.privacyUrl && (
              <a href={site.privacyUrl} className="hover:text-[var(--accent-soft)]">Privacy</a>
            )}
            {site.termsUrl && (
              <a href={site.termsUrl} className="hover:text-[var(--accent-soft)]">Terms</a>
            )}
            <span>Aapki rasoi, aapka pride</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
