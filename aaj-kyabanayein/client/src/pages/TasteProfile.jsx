import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ALLERGY_OPTIONS,
  APPLIANCE_OPTIONS,
  BUDGET_OPTIONS,
  COOKING_PREFERENCES,
  DEFAULT_TASTE,
  DIETARY_OPTIONS,
  SKILL_OPTIONS,
  getProfileCompletion,
  getTasteProfile,
  saveTasteProfile,
} from "../lib/tasteProfile";
import { track } from "../lib/analytics";
import { INDIAN_STATES, stateLabel } from "../data/indianStates";

const CUISINES = [
  "north-indian", "south-indian", "gujarati", "maharashtrian",
  "punjabi", "bengali", "kerala", "chinese", "healthy",
];

export default function TasteProfilePage() {
  const [profile, setProfile] = useState(getTasteProfile);
  const [saved, setSaved] = useState(false);
  const completion = useMemo(() => getProfileCompletion(profile), [profile]);

  const update = (partial) => {
    setProfile((p) => ({ ...p, ...partial }));
    setSaved(false);
  };

  const save = () => {
    saveTasteProfile(profile);
    track("taste_profile_save", { diet: profile.diet, spice: profile.spice, completion: completion.percent });
    setSaved(true);
  };

  const toggleList = (key, item, max) => {
    const list = profile[key] || [];
    const next = list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
    update({ [key]: max ? next.slice(0, max) : next });
  };

  const toggleDietary = (id) => {
    if (id === "jain") update({ jain: !profile.jain, dietaryTags: toggleInList(profile.dietaryTags, "jain") });
    else if (id === "kids") update({ kidsFriendly: !profile.kidsFriendly, dietaryTags: toggleInList(profile.dietaryTags, "kids") });
    else if (id === "diabetic") update({ diabeticFriendly: !profile.diabeticFriendly, dietaryTags: toggleInList(profile.dietaryTags, "diabetic") });
    else if (id === "veg" || id === "non-veg" || id === "vegan") update({ diet: id });
  };

  const isDietaryActive = (id) => {
    if (id === "jain") return profile.jain;
    if (id === "kids") return profile.kidsFriendly;
    if (id === "diabetic") return profile.diabeticFriendly;
    return profile.diet === id;
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl text-[var(--text-primary)]">Taste Profile</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Rasoira isko use karke Aaj Kya Banaye aur plans personalise karega.
      </p>

      <div className="glass-strong mt-6 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Profile completion</p>
            <p className="mt-1 text-sm text-[var(--text-primary)]">{completion.done} of {completion.total} sections filled</p>
          </div>
          <span className="font-display text-2xl text-[var(--accent-soft)]">{completion.percent}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${completion.percent}%` }} />
        </div>
        {completion.percent < 100 && (
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            Missing: {completion.items.filter((i) => !i.done).map((i) => i.label).join(", ")}
          </p>
        )}
      </div>

      <div className="glass-strong mt-6 space-y-6 rounded-2xl p-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Dietary preferences</p>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleDietary(opt.id)}
                className={`rounded-full px-4 py-2 text-xs font-medium ${
                  isDietaryActive(opt.id) ? "bg-[var(--accent)] text-[#14110e]" : "border border-white/10 text-[var(--text-secondary)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{/* home state */}Home state / राज्य</p>
          <p className="mb-3 text-xs text-[var(--text-secondary)]">Aaj Kya Banaye mein aapke state ki recipes priority milegi</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => update({ homeState: "" })}
              className={`rounded-full px-3 py-1.5 text-xs ${
                !profile.homeState ? "bg-[var(--accent)] text-[#14110e]" : "border border-white/10 text-[var(--text-secondary)]"
              }`}
            >
              Any
            </button>
            {INDIAN_STATES.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => update({ homeState: st.id })}
                className={`rounded-full px-3 py-1.5 text-xs ${
                  profile.homeState === st.id
                    ? "bg-[var(--accent)]/20 text-[var(--accent-soft)]"
                    : "border border-white/10 text-[var(--text-secondary)]"
                }`}
              >
                {stateLabel(st, "hi")}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Cooking preferences</p>
          <div className="flex flex-wrap gap-2">
            {COOKING_PREFERENCES.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleList("cookingPreferences", opt.id)}
                className={`rounded-full px-3 py-1.5 text-xs ${
                  profile.cookingPreferences?.includes(opt.id)
                    ? "bg-[var(--accent)]/20 text-[var(--accent-soft)]"
                    : "border border-white/10 text-[var(--text-secondary)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Allergies</p>
          <div className="flex flex-wrap gap-2">
            {ALLERGY_OPTIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => update({ allergies: toggleInList(profile.allergies, a), noAllergies: false })}
                className={`rounded-full px-3 py-1.5 text-xs capitalize ${
                  profile.allergies?.includes(a)
                    ? "bg-red-500/20 text-red-300"
                    : "border border-white/10 text-[var(--text-secondary)]"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={!!profile.noAllergies}
              onChange={(e) => update({ noAllergies: e.target.checked, allergies: e.target.checked ? [] : profile.allergies })}
              className="accent-[var(--accent)]"
            />
            No known allergies
          </label>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Appliances</p>
          <div className="flex flex-wrap gap-2">
            {APPLIANCE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleList("appliances", opt.id)}
                className={`rounded-full px-3 py-1.5 text-xs ${
                  profile.appliances?.includes(opt.id)
                    ? "bg-[var(--accent)]/20 text-[var(--accent-soft)]"
                    : "border border-white/10 text-[var(--text-secondary)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Budget</p>
          <div className="flex flex-wrap gap-2">
            {BUDGET_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => update({ budget: opt.id })}
                className={`rounded-full px-4 py-2 text-xs font-medium ${
                  profile.budget === opt.id ? "bg-[var(--accent)] text-[#14110e]" : "border border-white/10 text-[var(--text-secondary)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Cooking skill level</p>
          <div className="flex flex-wrap gap-2">
            {SKILL_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => update({ skillLevel: opt.id })}
                className={`rounded-full px-4 py-2 text-xs font-medium ${
                  profile.skillLevel === opt.id ? "bg-[var(--accent)] text-[#14110e]" : "border border-white/10 text-[var(--text-secondary)]"
                }`}
              >
                {opt.label}
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
                onClick={() => toggleList("preferCuisines", c, 4)}
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Also avoid</p>
          <div className="flex flex-wrap gap-2">
            {["onion", "garlic", "mushroom", "egg"].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleList("avoid", a)}
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

      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
        <Link to="/today" className="text-[var(--accent-soft)]">See Aaj Kya Banaye →</Link>
        <Link to="/family" className="text-[var(--accent-soft)]">Family profiles →</Link>
      </div>
    </div>
  );
}

function toggleInList(list = [], item) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}
