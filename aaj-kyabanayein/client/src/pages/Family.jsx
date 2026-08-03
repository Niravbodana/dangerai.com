import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  addFamilyMember,
  getFamilyProfiles,
  removeFamilyMember,
  setActiveMember,
  updateFamilyMember,
} from "../lib/familyProfiles";
import { getProfileCompletion, getTasteProfile } from "../lib/tasteProfile";
import { canAddFamilyMember } from "../lib/subscription";
import { track } from "../lib/analytics";

export default function Family() {
  const [data, setData] = useState(getFamilyProfiles);
  const [name, setName] = useState("");
  const [diet, setDiet] = useState("veg");
  const [msg, setMsg] = useState("");
  const completion = useMemo(() => getProfileCompletion(getTasteProfile()), [data]);

  const refresh = () => setData(getFamilyProfiles());

  const add = () => {
    const gate = canAddFamilyMember(data.members.length);
    if (!gate.ok) {
      setMsg("Family plan needed for more profiles. See Pricing.");
      return;
    }
    if (!name.trim()) return;
    addFamilyMember({ name: name.trim(), diet });
    track("family_member_add", { diet });
    setName("");
    setMsg("");
    refresh();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl text-[var(--text-primary)]">Family Profiles</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Different diets in one home — plan meals that work for everyone.
      </p>

      <div className="glass-strong mt-6 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Household taste profile</p>
            <p className="mt-1 text-sm text-[var(--text-primary)]">{completion.percent}% complete</p>
          </div>
          <Link to="/taste" className="text-xs text-[var(--accent-soft)] hover:underline">
            {completion.percent < 100 ? "Complete profile" : "Edit profile"}
          </Link>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-[var(--accent)]" style={{ width: `${completion.percent}%` }} />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {data.members.map((m) => (
          <div
            key={m.id}
            className={`recipe-card flex items-center gap-4 p-4 ${
              data.activeId === m.id ? "border-[var(--accent)]/40" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => { setActiveMember(m.id); refresh(); }}
              className="flex-1 text-left"
            >
              <p className="font-medium text-[var(--text-primary)]">{m.name}</p>
              <p className="text-xs capitalize text-[var(--text-secondary)]">
                {m.diet} · {m.spice || "medium"} spice
                {m.diabetic ? " · diabetes" : ""}{m.lowSalt ? " · low salt" : ""}
                {data.activeId === m.id ? " · Active" : ""}
              </p>
            </button>
            <select
              value={m.diet}
              onChange={(e) => { updateFamilyMember(m.id, { diet: e.target.value }); refresh(); }}
              className="glass-input py-1.5 text-xs"
            >
              <option value="veg">Veg</option>
              <option value="non-veg">Non-veg</option>
              <option value="jain">Jain</option>
            </select>
            <div className="flex flex-col gap-1 text-[10px]">
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={!!m.diabetic} onChange={(e) => { updateFamilyMember(m.id, { diabetic: e.target.checked }); refresh(); }} />
                Diabetes
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={!!m.lowSalt} onChange={(e) => { updateFamilyMember(m.id, { lowSalt: e.target.checked }); refresh(); }} />
                Low salt
              </label>
            </div>
            {data.members.length > 1 && (
              <button
                type="button"
                onClick={() => { removeFamilyMember(m.id); refresh(); }}
                className="text-xs text-red-300"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="glass-strong mt-6 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Add member</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Papa, Beta)"
            className="glass-input flex-1 py-2 text-sm"
          />
          <select value={diet} onChange={(e) => setDiet(e.target.value)} className="glass-input py-2 text-sm">
            <option value="veg">Veg</option>
            <option value="non-veg">Non-veg</option>
            <option value="jain">Jain</option>
          </select>
          <button type="button" onClick={add} className="premium-btn px-4 py-2 text-sm">Add</button>
        </div>
        {msg && (
          <p className="mt-3 text-sm text-[var(--accent-soft)]">
            {msg} <Link to="/pricing" className="underline">Upgrade</Link>
          </p>
        )}
      </div>
    </div>
  );
}
