import React, { useState, useEffect } from "react";
import {
  addWeightLog,
  subscribeWeightLogs,
  updateWeightLog,
  deleteWeightLog
} from "../firebase";
import { todayStr, toDateStr, parseDateStr } from "../lib/calc";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip
} from "recharts";

export default function WeightTracker({ uid, desiredWeight }) {
  const [newWeight, setNewWeight] = useState("");
  const [newDate,   setNewDate]   = useState(todayStr());
  const [logs, setLogs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editWeight, setEditWeight] = useState("");
  const [editDate,   setEditDate]   = useState("");

  // Subscribe
  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeWeightLogs(uid, setLogs);
    return () => unsub();
  }, [uid]);

  // Add (stamped at noon so the local day never shifts)
  const handleAdd = async e => {
    e.preventDefault();
    const w = parseFloat(newWeight);
    if (!(w > 0)) return;
    const date = parseDateStr(newDate || todayStr());
    date.setHours(12);
    await addWeightLog(uid, { date, weight: w });
    setNewWeight("");
    setNewDate(todayStr());
  };

  // Edit flow
  const startEdit = log => {
    setEditingId(log.id);
    setEditWeight(String(log.weight));
    setEditDate(toDateStr(log.date));
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditWeight("");
    setEditDate("");
  };
  const saveEdit = async () => {
    const w = parseFloat(editWeight);
    if (!(w > 0)) return;
    const date = editDate ? parseDateStr(editDate) : null;
    if (date) date.setHours(12);
    await updateWeightLog(editingId, { weight: w, date });
    cancelEdit();
  };

  // Delete
  const handleDelete = async id => {
    if (window.confirm("Delete this weigh-in?")) {
      await deleteWeightLog(id);
    }
  };

  // Chart data
  const data = logs.map(log => ({
    date: toDateStr(log.date),
    weight: log.weight
  }));
  const goal = Number(desiredWeight);

  // Suggested protein intake
  const latestWeight = logs.length > 0 ? logs[logs.length - 1].weight : null;
  const suggestedProtein = latestWeight ? Math.round(latestWeight * 1.0) : null;
  const change = logs.length > 1
    ? Math.round((latestWeight - logs[0].weight) * 10) / 10
    : null;

  return (
    <div className="p-4 bg-white rounded shadow-sm">
      <h2 className="text-lg font-semibold">Weight Progress</h2>

      <form onSubmit={handleAdd} className="flex gap-2 mt-2">
        <input
          type="number"
          step="0.1"
          min="0"
          placeholder="Weight (lbs)"
          value={newWeight}
          onChange={e => setNewWeight(e.target.value)}
          className="px-2 py-1 border rounded flex-1"
        />
        <input
          type="date"
          value={newDate}
          max={todayStr()}
          onChange={e => setNewDate(e.target.value)}
          aria-label="Weigh-in date"
          className="px-2 py-1 border rounded flex-1"
        />
        <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">
          Add
        </button>
      </form>

      {data.length > 0 && (
        <div className="graph-container">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              {goal > 0 && <ReferenceLine y={goal} stroke="red" label="Goal" />}
              <Line type="monotone" dataKey="weight" stroke="#8884d8" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {latestWeight && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <p><strong>Latest Weight:</strong> {latestWeight} lbs</p>
          {change != null && (
            <p><strong>Change since first weigh-in:</strong> {change > 0 ? "+" : ""}{change} lbs</p>
          )}
          {goal > 0 && (
            <p><strong>To goal:</strong> {Math.round(Math.abs(latestWeight - goal) * 10) / 10} lbs</p>
          )}
          <p><strong>Suggested Protein Intake:</strong> {suggestedProtein} g/day (based on 1g/lb)</p>
        </div>
      )}

      <ul className="mt-4 space-y-2 text-sm entry-list">
        {[...logs].reverse().map(log => (
          <li key={log.id} className="flex items-center gap-4">
            {editingId === log.id ? (
              <>
                <input
                  type="date"
                  value={editDate}
                  max={todayStr()}
                  onChange={e => setEditDate(e.target.value)}
                  className="px-2 py-1 border rounded"
                />
                <input
                  type="number"
                  step="0.1"
                  value={editWeight}
                  onChange={e => setEditWeight(e.target.value)}
                  className="w-24 px-2 py-1 border rounded"
                />
                <button onClick={saveEdit} className="px-2 py-1 bg-green-600 text-white rounded">
                  Save
                </button>
                <button onClick={cancelEdit} className="px-2 py-1 bg-gray-300 rounded">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="w-24">{toDateStr(log.date)}</span>
                <span className="w-20">{log.weight} lbs</span>
                <button onClick={() => startEdit(log)} className="px-2 py-1 bg-blue-500 text-white rounded">
                  Edit
                </button>
                <button onClick={() => handleDelete(log.id)} className="px-2 py-1 bg-red-500 text-white rounded">
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
