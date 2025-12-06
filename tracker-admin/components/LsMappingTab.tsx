"use client";

import React, { useState, useEffect } from "react";

export default function LsMappingTab({ backend }: { backend: string }) {

  const [lsList, setLsList] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");

  // load LS list
  useEffect(() => {
    fetch(`${backend}/admin/ls`)
      .then((r) => r.json())
      .then(setLsList);
  }, []);

  const createLs = async () => {
    const res = await fetch(`${backend}/admin/ls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, lsCode: newCode }),
    });

    const ls = await res.json();
    setLsList((prev) => [...prev, ls]);
    setNewName("");
    setNewCode("");
  };

  const updateCode = async (id: number, code: string) => {
    await fetch(`${backend}/admin/ls/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lsCode: code }),
    });
  };

  return (
    <div>
      <h2>Lok Sabha Mapping</h2>

      <div style={{ marginTop: 16 }}>
        <h4>Add New Lok Sabha</h4>
        <input placeholder="LS Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <input
          placeholder="LS Code"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          style={{ marginLeft: 8 }}
        />
        <button
          onClick={createLs}
          style={{
            marginLeft: 8,
            padding: "6px 12px",
            background: "green",
            color: "white",
            borderRadius: 6,
          }}
        >
          Add
        </button>
      </div>

      <h3 style={{ marginTop: 24 }}>Existing Constituencies</h3>

      {lsList.map((ls) => (
        <div key={ls.id} style={{ marginBottom: 10 }}>
          <b>{ls.name}</b>
          <input
            style={{ marginLeft: 8 }}
            defaultValue={ls.lsCode || ""}
            onBlur={(e) => updateCode(ls.id, e.target.value)}
            placeholder="Enter LS Code"
          />
        </div>
      ))}
    </div>
  );
}


