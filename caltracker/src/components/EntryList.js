import React, { useEffect, useState } from "react";
import {
  subscribeEntriesForDate,
  deleteEntry,
  updateEntry
} from "../firebase";
import { todayStr, shiftDateStr, parseDateStr, dailySummary } from "../lib/calc";

export default function EntryList({
  uid,
  selectedDate = todayStr(),
  targetCalories
}) {
  const dateStr = selectedDate;

  const [entries,     setEntries]     = useState([]);
  const [prevEntries, setPrevEntries] = useState([]);
  const [editingId,   setEditingId]   = useState(null);
  const [editVals,    setEditVals]    = useState({
    description: "",
    calories:    "",
    protein:     ""
  });

  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeEntriesForDate(uid, dateStr, setEntries);
    return () => unsub();
  }, [uid, dateStr]);

  useEffect(() => {
    if (!uid) return;
    const prevStr = shiftDateStr(dateStr, -1);
    const unsubPrev = subscribeEntriesForDate(uid, prevStr, setPrevEntries);
    return () => unsubPrev();
  }, [uid, dateStr]);

  const startEdit = e => {
    setEditingId(e.id);
    setEditVals({
      description: e.description,
      calories:    e.calories,
      protein:     e.protein
    });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditVals({ description: "", calories: "", protein: "" });
  };
  const saveEdit = async id => {
    if (!String(editVals.description).trim() || editVals.calories === "") return;
    await updateEntry(id, {
      description: String(editVals.description).trim(),
      calories:    Number(editVals.calories) || 0,
      protein:     Number(editVals.protein)  || 0
    });
    cancelEdit();
  };
  const handleDelete = async id => {
    if (window.confirm("Delete this entry?")) {
      await deleteEntry(id);
    }
  };

  const { totalCal, totalProt, carryover, goal: todayGoal, remaining, percent } =
    dailySummary({ entries, prevEntries, targetCalories });

  const dispDate = parseDateStr(dateStr);

  return (
    <div className="p-4 bg-white rounded shadow text-sm space-y-2">
      {carryover > 0 && <p className="text-gray-600">Carry-over: {carryover} kcal</p>}
      {todayGoal != null && <p><strong>Goal:</strong> {todayGoal} kcal</p>}
      {remaining != null && (
        <p className={remaining < 0 ? "text-red-600" : ""}>
          <strong>{remaining < 0 ? "Over by:" : "Remaining:"}</strong> {Math.abs(remaining)} kcal
        </p>
      )}
      {percent != null && (
        <div
          className="progress"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Calories eaten vs. goal"
        >
          <div
            className={remaining < 0 ? "progress-bar over" : "progress-bar"}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
      <p><strong>Protein:</strong> {totalProt} g</p>
      <p>
        <strong>Total for{" "}
          {dispDate.toLocaleDateString(undefined, {
            weekday: "short", year: "numeric", month: "short", day: "numeric"
          })}
        :</strong> {totalCal} kcal
      </p>

      {entries.length === 0 && (
        <p className="text-gray-700">No food logged for this day yet.</p>
      )}
      <ul className="space-y-2 entry-list">
        {entries.map(e => (
          <li key={e.id} className="flex justify-between items-center">
            {editingId === e.id ? (
              <>
                <input
                  type="text"
                  value={editVals.description}
                  onChange={ev => setEditVals(v => ({ ...v, description: ev.target.value }))}
                  className="flex-1 px-2 py-1 border rounded mr-2"
                />
                <input
                  type="number"
                  value={editVals.calories}
                  onChange={ev => setEditVals(v => ({ ...v, calories: ev.target.value }))}
                  className="w-20 px-2 py-1 border rounded mr-2"
                />
                <input
                  type="number"
                  value={editVals.protein}
                  onChange={ev => setEditVals(v => ({ ...v, protein: ev.target.value }))}
                  className="w-20 px-2 py-1 border rounded mr-2"
                />
                <button onClick={() => saveEdit(e.id)} className="px-2 py-1 bg-green-600 text-white rounded mr-1">
                  Save
                </button>
                <button onClick={cancelEdit} className="px-2 py-1 bg-gray-300 rounded">Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1">{e.description}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono">{e.calories} kcal</span>
                  <span className="font-mono">{e.protein} g</span>
                  <button onClick={() => startEdit(e)} className="px-2 py-1 bg-blue-500 text-white rounded">Edit</button>
                  <button onClick={() => handleDelete(e.id)} className="px-2 py-1 bg-red-500 text-white rounded">Del</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
