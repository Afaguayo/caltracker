import React, { useState, useEffect } from "react";
import {
  addWeightLog,
  subscribeWeightLogs,
  updateWeightLog,
  deleteWeightLog
} from "../firebase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip
} from "recharts";

export default function WeightTracker({ uid, desiredWeight }) {
  const [newWeight,  setNewWeight]  = useState("");
  const [logs,       setLogs]       = useState([]);
  const [editingId,  setEditingId]  = useState(null);
  const [editWeight, setEditWeight] = useState("");

  // Subscribe
  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeWeightLogs(uid, setLogs);
    return () => unsub();
  }, [uid]);

  // Add
  const handleAdd = async e => {
    e.preventDefault();
    const w = parseFloat(newWeight);
    if (!w) return;
    await addWeightLog(uid, { date: new Date(), weight: w });
    setNewWeight("");
  };

  // Edit flow
  const startEdit = log => {
    setEditingId(log.id);
    setEditWeight(String(log.weight));
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditWeight("");
  };
  const saveEdit = async () => {
    const w = parseFloat(editWeight);
    if (!w) return;
    await updateWeightLog(editingId, { weight: w });
    cancelEdit();
  };

  // Delete
  const handleDelete = async id => {
    if (window.confirm("Delete this weight log?")) {
      await deleteWeightLog(id);
    }
  };

  // Chart data
  const data = logs.map(log => ({
    date:   log.date.toISOString().slice(0, 10),
    weight: log.weight
  }));

  return (
    <div className="p-4 bg-white rounded shadow-sm">
      <h2 className="text-lg font-semibold">Weight Progress</h2>

      <form onSubmit={handleAdd} className="flex gap-2 mt-2">
        <input
          type="number"
          step="0.1"
          placeholder="Weight (lbs)"
          value={newWeight}
          onChange={e => setNewWeight(e.target.value)}
          className="px-2 py-1 border rounded flex-1"
        />
        <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">
          Add
        </button>
      </form>

      {data.length > 0 && (
        <LineChart width={600} height={300} data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={["auto", "auto"]} />
          <Tooltip />
          <ReferenceLine y={desiredWeight} stroke="red" label="Goal" />
          <Line type="monotone" dataKey="weight" stroke="#8884d8" dot />
        </LineChart>
      )}

      <ul className="mt-4 space-y-2 text-sm">
        {logs.map(log => (
          <li key={log.id} className="flex items-center gap-4">
            {editingId === log.id ? (
              <>
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
                <span className="w-24">{log.date.toISOString().slice(0, 10)}</span>
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
