import { useState } from "react";
import { Link } from "react-router-dom";
import { DEFAULT_TASTE, getTasteProfile, saveTasteProfile } from "../lib/tasteProfile";
import { track } from "../lib/analytics";

const CUISINES = [
  "north-indian", "south-indian", "gujarati", "maharashtrian",
  "punjabi", "bengali", "kerala", "chinese", "healthy",
];

export default function TasteProfilePage() {
  const [profile, setProfile] = useState(getTasteProfile);
  const [saved, setSaved] = useState(false);

  const update = (partial) => {
    setProfile((p) => ({ ...p, ...partial }));
    setSaved(false);
  };

  const save = () => {
    saveTasteProfile(profile);
    track("taste_profile_save", { diet: profile.diet, spice: profile.spice });
    setSaved(true);
  };

  const toggleCuisine = (c) => {
    const list = profile.preferCuisines || [];
    update({
      preferCuisines: list.includes(c) ? list.filter((x) => x !== c) : [...list, c].slice(0, 4),
    });
  };

  const toggleAvoid = (item) => {
    const list = profile.avoid || [];
    update({
      avoid: list.includes(item) ? list.filter((x) => x !== item) : [...list, item],
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl text-[var(--text-primary)]">Taste Profile</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Rasoira isko use karke Aaj Kya Banaye aur plans personalise karega.
      </p>

      <div className="glass-strong mt-6 space-y-6 rounded-2xl p-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Diet</p>
          <div className="flex flex-wrap gap-2">
            {["veg", "non-veg", "all"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => update({ diet: d })}
                className={`rounded-full px-4 py-2 text-xs font-medium ${
                  profile.diet === d ? "bg-[var(--accent)] text-[#14110e]" : "border border-white/10 text-[var(--text-secondary)]"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Spice</p>
          <div className="flex flex-wrap gap-2">
            {["mild", "medium", "spicy"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => update({ spice: s })}
                className={`rounded-full px-4 py-2 text-xs font-medium capitalize ${
                  profile.spice === s ? "bg-[var(--accent)] text-[#14110e]" : "border border-white/10 text-[var(--text-secondary)]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Max cook time: {profile.cookTimeMax} min
          </p>
          <input
            type="range"
            min={15}
            max={90}
            step={5}
            value={profile.cookTimeMax}
            onChange={(e) => update({ cookTimeMax: Number(e.target.value) })}
            className="w-full accent-[var(--accent)]"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Favourite cuisines</p>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCuisine(c)}
                className={`rounded-full px-3 py-1.5 text-xs capitalize ${
                  profile.preferCuisines?.includes(c)
                    ? "bg-[var(--accent)]/20 text-[var(--accent-soft)]"
                    : "border border-white/10 text-[var(--text-secondary)]"
                }`}
              >
                {c.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Avoid</p>
          <div className="flex flex-wrap gap-2">
            {["onion", "garlic", "mushroom", "egg"].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAvoid(a)}
                className={`rounded-full px-3 py-1.5 text-xs capitalize ${
                  profile.avoid?.includes(a)
                    ? "bg-red-500/20 text-red-300"
                    : "border border-white/10 text-[var(--text-secondary)]"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            { key: "jain", label: "Jain" },
            { key: "kidsFriendly", label: "Kids friendly" },
            { key: "diabeticFriendly", label: "Diabetic friendly" },
          ].map((opt) => (
            <label key={opt.key} className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={!!profile[opt.key]}
                onChange={(e) => update({ [opt.key]: e.target.checked })}
                className="accent-[var(--accent)]"
              />
              {opt.label}
            </label>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Family size: {profile.familySize}
          </p>
          <input
            type="range"
            min={1}
            max={10}
            value={profile.familySize}
            onChange={(e) => update({ familySize: Number(e.target.value) })}
            className="w-full accent-[var(--accent)]"
          />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={save} className="premium-btn flex-1 py-3 text-sm">
            {saved ? "Saved ✓" : "Save taste profile"}
          </button>
          <button
            type="button"
            onClick={() => { setProfile(DEFAULT_TASTE); setSaved(false); }}
            className="premium-btn-outline px-4 py-3 text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      <Link to="/today" className="mt-6 block text-center text-sm text-[var(--accent-soft)]">
        See Aaj Kya Banaye with this profile →
      </Link>
    </div>
  );
}
