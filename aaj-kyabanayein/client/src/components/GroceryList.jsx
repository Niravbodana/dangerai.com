import { useState } from "react";
import { buildGroceryWhatsAppText, openInstamartSearch, openWhatsAppShare } from "../lib/pantryStore";
import { track } from "../lib/analytics";

export default function GroceryList({ items }) {
  const [checked, setChecked] = useState({});
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
  const doneCount = Object.values(checked).filter(Boolean).length;

  const shareWa = () => {
    openWhatsAppShare(buildGroceryWhatsAppText(items));
    track("grocery_whatsapp", { count: items.length });
  };

  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg text-[var(--text-primary)]">Bazaar List</h3>
        <span className="text-sm text-[var(--text-secondary)]">{doneCount}/{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">Pehle meal plan generate karein.</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <button type="button" onClick={shareWa} className="premium-btn-outline px-3 py-1.5 text-xs">
              WhatsApp share
            </button>
            <button
              type="button"
              onClick={() => { openInstamartSearch(items[0]?.name || "groceries"); track("instamart_open"); }}
              className="premium-btn-outline px-3 py-1.5 text-xs"
            >
              Open Instamart
            </button>
          </div>
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, catItems]) => (
              <div key={category}>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent-green)]">{category}</h4>
                <ul className="space-y-2">
                  {catItems.map((item) => (
                    <li key={item.name}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/40">
                        <input
                          type="checkbox"
                          checked={checked[item.name] ?? false}
                          onChange={() => setChecked((prev) => ({ ...prev, [item.name]: !prev[item.name] }))}
                          className="h-4 w-4 rounded accent-[var(--accent-green)]"
                        />
                        <span className={checked[item.name] ? "text-sm text-[var(--text-secondary)] line-through" : "text-sm text-[var(--text-primary)]"}>
                          {item.nameHi} ({item.name}) — {item.quantity}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
