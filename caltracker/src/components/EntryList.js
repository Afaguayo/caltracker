import React, { useEffect, useState } from "react";
import {
  subscribeEntriesForDate,
  deleteEntry,
  updateEntry
} from "../firebase";

export default function EntryList({
  uid,
  selectedDate = new Date().toISOString().slice(0, 10),
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
    const [y, m, d] = dateStr.split("-");
    const prev = new Date(+y, +m - 1, +d);
    prev.setDate(prev.getDate() - 1);
    const prevStr = [
      prev.getFullYear(),
      String(prev.getMonth() + 1).padStart(2, "0"),
      String(prev.getDate()).padStart(2, "0")
    ].join("-");
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
    await updateEntry(id, {
      description: editVals.description.trim(),
      calories:    Number(editVals.calories),
      protein:     Number(editVals.protein)
    });
    cancelEdit();
  };
  const handleDelete = async id => {
    if (window.confirm("Delete this entry?")) {
      await deleteEntry(id);
    }
  };

  const totalCal  = entries.reduce((sum, e) => sum + (e.calories || 0), 0);
  const totalProt = entries.reduce((sum, e) => sum + (e.protein  || 0), 0);
  const prevCal   = prevEntries.reduce((sum, e) => sum + (e.calories || 0), 0);

  const carryover = typeof targetCalories === "number"
    ? Math.max(0, prevCal - targetCalories)
    : 0;
  const todayGoal = typeof targetCalories === "number"
    ? targetCalories - carryover
    : null;
  const remaining = todayGoal != null ? todayGoal - totalCal : null;

  const [yy, mm, dd] = dateStr.split("-");
  const dispDate    = new Date(+yy, +mm - 1, +dd);

  return (
    <div className="p-4 bg-white rounded shadow text-sm space-y-2">
      {carryover > 0 && <p className="text-gray-600">Carry-over: {carryover} kcal</p>}
      {todayGoal != null && <p><strong>Goal:</strong> {todayGoal} kcal</p>}
      {remaining != null && (
        <p className={remaining < 0 ? "text-red-600" : ""}>
          <strong>Remaining:</strong> {remaining} kcal
        </p>
      )}
      <p><strong>Protein:</strong> {totalProt} g</p>
      <p>
        <strong>Total for{" "}
          {dispDate.toLocaleDateString(undefined, {
            weekday: "short", year: "numeric", month: "short", day: "numeric"
          })}
        :</strong> {totalCal} kcal
      </p>

      <ul className="space-y-2">
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
