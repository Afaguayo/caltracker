import React, { useState } from "react";
import { addEntry } from "../firebase";
import { todayStr, parseDateStr } from "../lib/calc";

export default function EntryForm({ selectedDate = todayStr() }) {
  const [desc,   setDesc]   = useState("");
  const [cal,    setCal]    = useState("");
  const [prot,   setProt]   = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleSubmit = async e => {
    e.preventDefault();
    if (!desc.trim() || !cal) {
      setError("Add a description and calories.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await addEntry({
        description: desc.trim(),
        calories:    Number(cal),
        protein:     Number(prot) || 0
      }, selectedDate);
      setDesc("");
      setCal("");
      setProt("");
    } catch (err) {
      console.error("Failed to add entry:", err);
      setError("Couldn't save that entry. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const isToday = selectedDate === todayStr();
  const label   = isToday
    ? "Add Entry"
    : `Add to ${parseDateStr(selectedDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow text-sm space-y-2">
      {error && <p className="text-red-600" role="alert">{error}</p>}
      <input
        type="text"
        placeholder="What did you eat?"
        value={desc}
        onChange={e => setDesc(e.target.value)}
        className="w-full px-3 py-2 border rounded"
      />
      <div className="flex gap-2">
        <input
          type="number"
          min="0"
          placeholder="Calories"
          value={cal}
          onChange={e => setCal(e.target.value)}
          className="flex-1 px-3 py-2 border rounded"
        />
        <input
          type="number"
          min="0"
          placeholder="Protein (g)"
          value={prot}
          onChange={e => setProt(e.target.value)}
          className="flex-1 px-3 py-2 border rounded"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="w-full py-2 bg-blue-600 text-white rounded"
      >
        {saving ? "Saving…" : label}
      </button>
    </form>
  );
}
