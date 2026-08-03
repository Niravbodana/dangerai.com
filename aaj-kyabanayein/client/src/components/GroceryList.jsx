import { useEffect, useState } from "react";
import { buildGroceryWhatsAppText, openWhatsAppShare } from "../lib/pantryStore";
import {
  getCheckedState,
  getGroceryCompletion,
  toggleGroceryChecked,
} from "../lib/groceryStore";
import {
  getGroceryProviders,
  getDeliveryProviders,
  openProviderSearch,
  fetchProviderCompare,
  isProviderComingSoon,
} from "../lib/groceryProviders";
import { track } from "../lib/analytics";

export default function GroceryList({ items, persist = true }) {
  const [checked, setChecked] = useState(() => (persist ? getCheckedState() : {}));

  useEffect(() => {
    if (persist) setChecked(getCheckedState());
  }, [items, persist]);

  const grouped = items.reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const { done, total } = getGroceryCompletion(items);
  const providers = getGroceryProviders();
  const deliveryProviders = getDeliveryProviders();

  const [shopMsg, setShopMsg] = useState("");

  const handleProvider = (p, query) => {
    const res = openProviderSearch(p.id, query);
    if (res?.comingSoon) {
      setShopMsg(`${p.name} — Coming Soon!`);
      setTimeout(() => setShopMsg(""), 3500);
      return;
    }
    track(p.type === "delivery" ? "delivery_provider" : "grocery_provider", { provider: p.id });
  };

  const compareItem = async (itemName) => {
    const links = await fetchProviderCompare(itemName);
    const open = links.find((l) => !l.comingSoon && !isProviderComingSoon(l.id));
    if (open?.url) window.open(open.url, "_blank", "noopener,noreferrer");
    else {
      setShopMsg("Grocery apps — Coming Soon! WhatsApp list use karein.");
      setTimeout(() => setShopMsg(""), 3500);
    }
  };

  const itemKey = (item) => item.id || item.name;

  const handleToggle = (id) => {
    if (persist) {
      setChecked(toggleGroceryChecked(id));
    } else {
      setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
    }
  };

  const shareWa = () => {
    const pending = items.filter((i) => !checked[itemKey(i)]);
    openWhatsAppShare(buildGroceryWhatsAppText(pending.length ? pending : items));
    track("grocery_whatsapp", { count: items.length });
  };

  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg text-[var(--text-primary)]">Bazaar List</h3>
        <span className="text-sm text-[var(--text-secondary)]">{done}/{total}</span>
      </div>

      {shopMsg && (
        <p className="mb-3 text-xs text-[var(--accent-soft)]">{shopMsg}</p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">Pehle meal plan generate karein.</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <button type="button" onClick={shareWa} className="premium-btn-outline px-3 py-1.5 text-xs">
              WhatsApp share
            </button>
            {providers.filter((p) => p.type !== "delivery").map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleProvider(p, items[0]?.name || "groceries")}
                className="premium-btn-outline px-3 py-1.5 text-xs"
              >
                {p.name}{p.comingSoon || isProviderComingSoon(p.id) ? " · Soon" : ""}
              </button>
            ))}
            {deliveryProviders.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleProvider(p, "indian food delivery")}
                className="premium-btn-outline px-3 py-1.5 text-xs"
              >
                {p.name}{p.comingSoon ? " · Soon" : ""}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, catItems]) => (
              <div key={category}>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent-green)]">{category}</h4>
                <ul className="space-y-2">
                  {catItems.map((item) => {
                    const id = itemKey(item);
                    const isChecked = checked[id] ?? false;
                    return (
                      <li key={id}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/40">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggle(id)}
                            className="h-4 w-4 rounded accent-[var(--accent-green)]"
                          />
                          <span className={`flex-1 ${isChecked ? "text-sm text-[var(--text-secondary)] line-through" : "text-sm text-[var(--text-primary)]"}`}>
                            {item.nameHi} ({item.name}) — {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); compareItem(item.name); }}
                            className="text-[10px] text-[var(--accent-soft)] hover:underline"
                          >
                            Compare
                          </button>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
