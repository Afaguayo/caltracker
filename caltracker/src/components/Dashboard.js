import React from "react";
import EntryForm from "./EntryForm";
import EntryList from "./EntryList";
import WeightTracker from "./WeightTracker";

export default function Dashboard({ uid, selectedDate, setSelectedDate, dailyGoal, desiredWeight }) {
  const [yy, mm, dd] = selectedDate.split("-");
  const headerDate = new Date(+yy, +mm - 1, +dd);

  return (
    <div className="space-y-6 px-4 py-6 pb-24">
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <p className="text-sm text-gray-700">
          Viewing <strong>{headerDate.toLocaleDateString(undefined, {
            weekday: "long", year: "numeric", month: "long", day: "numeric"
          })}</strong>
        </p>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300 text-sm"
        />
      </div>

      <WeightTracker uid={uid} desiredWeight={desiredWeight} />

      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Log Food</h2>
        <EntryForm />
      </div>

      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Food Entries</h2>
        <EntryList
          uid={uid}
          selectedDate={selectedDate}
          targetCalories={dailyGoal}
        />
      </div>

      {/* Optional Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t shadow sm:hidden flex justify-around text-sm text-gray-600 py-2">
        <button className="flex flex-col items-center">
          <span>⚖️</span>
          <span className="text-xs">Weight</span>
        </button>
        <button className="flex flex-col items-center">
          <span>🍽</span>
          <span className="text-xs">Log</span>
        </button>
        <button className="flex flex-col items-center">
          <span>📅</span>
          <span className="text-xs">Date</span>
        </button>
      </nav>
    </div>
  );
}
