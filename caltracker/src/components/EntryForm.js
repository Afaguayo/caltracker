import React, { useState } from "react";
import { addEntry } from "../firebase";

export default function EntryForm() {
  const [desc, setDesc] = useState("");
  const [cal,  setCal]  = useState("");
  const [prot, setProt] = useState("");

  const handleSubmit = async e => {
    e.preventDefault();
    if (!desc.trim() || !cal) return;
    await addEntry({
      description: desc.trim(),
      calories:    Number(cal),
      protein:     Number(prot) || 0
    });
    setDesc("");
    setCal("");
    setProt("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow text-sm space-y-2">
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
          placeholder="Calories"
          value={cal}
          onChange={e => setCal(e.target.value)}
          className="flex-1 px-3 py-2 border rounded"
        />
        <input
          type="number"
          placeholder="Protein (g)"
          value={prot}
          onChange={e => setProt(e.target.value)}
          className="flex-1 px-3 py-2 border rounded"
        />
      </div>
      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white rounded"
      >
        Add Entry
      </button>
    </form>
  );
}
