import { Link } from "react-router-dom";
import { getBadgeCatalog, getStreak } from "../lib/streak";
import { getCookingStats, getMilestones, buildReferralLink } from "../lib/growth";

export default function StreakPage() {
  const streak = getStreak();
  const badges = getBadgeCatalog();
  const stats = getCookingStats();
  const milestones = getMilestones();
  const referralLink = buildReferralLink();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl text-[var(--text-primary)]">Cook Streak</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Ghar ka khana — roz thoda pride. Streak todna mat!
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { n: streak.current, l: "Current" },
          { n: streak.best, l: "Best" },
          { n: streak.totalCooks, l: "Total cooks" },
        ].map((s) => (
          <div key={s.l} className="recipe-card p-4 text-center">
            <p className="font-display text-3xl text-[var(--accent-soft)]">{s.n}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="recipe-card mt-6 p-4">
        <h2 className="font-display text-lg text-[var(--text-primary)]">This week</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {stats.thisWeek.cookFinish} cooks · {stats.thisWeek.recipeOpen} recipes opened · {stats.thisWeek.activeDays} active days
        </p>
      </div>

      <h2 className="mt-10 font-display text-xl text-[var(--text-primary)]">Milestones</h2>
      <div className="mt-4 space-y-3">
        {milestones.filter((m) => !m.unlocked).slice(0, 3).map((m) => (
          <div key={m.id} className="recipe-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-primary)]">{m.icon} {m.name}</span>
              <span className="text-[var(--text-secondary)]">{m.current}/{m.target}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-[var(--accent)]" style={{ width: `${m.progress}%` }} />
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl text-[var(--text-primary)]">Badges</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {badges.map((b) => (
          <div
            key={b.id}
            className={`recipe-card flex items-center gap-3 p-4 ${b.unlocked ? "" : "opacity-40"}`}
          >
            <span className="text-3xl">{b.icon}</span>
            <div>
              <p className="font-medium text-[var(--text-primary)]">{b.name}</p>
              <p className="text-xs text-[var(--text-secondary)]">{b.nameHi}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--accent-soft)]">
                {b.unlocked ? "Unlocked" : "Locked"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="recipe-card mt-8 p-4">
        <h2 className="font-display text-lg text-[var(--text-primary)]">Invite friends</h2>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Share Rasoira — referral rewards coming soon</p>
        <p className="mt-3 break-all rounded-lg bg-white/5 px-3 py-2 text-xs text-[var(--accent-soft)]">{referralLink}</p>
      </div>

      <Link to="/today" className="premium-btn mt-8 inline-block px-6 py-3 text-sm">
        Aaj cook karo →
      </Link>
    </div>
  );
}
