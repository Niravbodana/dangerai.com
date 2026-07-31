import { useState } from "react";

export default function GroceryList({ items }) {
  const [checked, setChecked] = useState({});

  const grouped = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">🛒 Bazaar List</h3>
        <span className="text-sm text-gray-500">
          {doneCount}/{items.length} liya
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Pehle meal plan generate karein.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, catItems]) => (
            <div key={category}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-600">
                {category}
              </h4>
              <ul className="space-y-2">
                {catItems.map((item) => (
                  <li key={item.name}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-green-50">
                      <input
                        type="checkbox"
                        checked={checked[item.name] ?? false}
                        onChange={() =>
                          setChecked((prev) => ({ ...prev, [item.name]: !prev[item.name] }))
                        }
                        className="h-4 w-4 rounded border-gray-300 text-green-600"
                      />
                      <span
                        className={
                          checked[item.name]
                            ? "text-sm text-gray-400 line-through"
                            : "text-sm text-gray-700"
                        }
                      >
                        {item.nameHi} ({item.name}) — {item.quantity}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
