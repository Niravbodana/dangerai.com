import { useEffect, useState } from "react";
import { fetchHealthyPlan } from "../api";
import GroceryList from "../components/GroceryList";
import MealCard from "../components/MealCard";
import Navbar from "../components/Navbar";

export default function HealthyWeek() {
  const [diet, setDiet] = useState("veg");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchHealthyPlan(diet)
      .then(setData)
      .finally(() => setLoading(false));
  }, [diet]);

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">💚 Healthy Week Plan</h1>
        <p className="mb-6 text-gray-600">
          7 din ka sehat ke liye best meal plan — roz healthy khana
        </p>

        <div className="mb-6 flex gap-2">
          {[
            { value: "veg", label: "🥬 Veg Healthy" },
            { value: "non-veg", label: "🍗 Non-Veg Healthy" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDiet(opt.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                diet === opt.value ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-500">Healthy plan ban raha hai...</p>
        ) : (
          <div className="space-y-8">
            {data?.plans?.map((day) => (
              <div key={day.date} className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">📅 {day.dayLabel}</h2>
                    <p className="text-sm text-gray-400">{day.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-700">
                      🔥 {day.totalCalories} cal total
                    </span>
                  </div>
                </div>
                <p className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-800">
                  💡 {day.healthTip}
                </p>
                <div className="space-y-4">
                  {day.meals.map((meal) => (
                    <MealCard
                      key={`${day.date}-${meal.mealType}`}
                      mealType={meal.mealType}
                      recipe={meal.recipe}
                    />
                  ))}
                </div>
              </div>
            ))}

            {data?.groceryList && <GroceryList items={data.groceryList} />}
          </div>
        )}
      </div>
    </div>
  );
}
