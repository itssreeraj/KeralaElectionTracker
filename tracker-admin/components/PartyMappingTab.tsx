"use client";

import React, { useEffect, useState } from "react";

export default function PartyMappingTab({ backend }: { backend: string }) {
  /* ------------------------------
        STATE
  ------------------------------- */
  const [alliances, setAlliances] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [lokSabhas, setLokSabhas] = useState<any[]>([]);

  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedLs, setSelectedLs] = useState("");

  /* Create Alliance */
  const [newAllianceName, setNewAllianceName] = useState("");
  const [newAllianceColor, setNewAllianceColor] = useState("#ff0000");

  /* Create Party */
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyCode, setNewPartyCode] = useState("");
  const [newPartyAlliance, setNewPartyAlliance] = useState("");

  /* ------------------------------
        INITIAL LOAD
  ------------------------------- */
  useEffect(() => {
    loadAlliances();
    loadParties();
    loadLokSabhas();
    loadCandidates();
  }, [selectedYear, selectedLs]);

  const loadAlliances = async () => {
    const r = await fetch(`${backend}/admin/alliances`);
    setAlliances(await r.json());
  };

  const loadParties = async () => {
    const r = await fetch(`${backend}/admin/parties`);
    setParties(await r.json());
  };

  const loadLokSabhas = async () => {
    const r = await fetch(`${backend}/admin/loksabhas`);
    if (r.ok) setLokSabhas(await r.json());
  };

  const loadCandidates = async () => {
    let url = `${backend}/admin/candidates?year=${selectedYear}`;
    if (selectedLs) url += `&lsId=${selectedLs}`;

    const r = await fetch(url);
    setCandidates(await r.json());
  };

  /* ------------------------------
        CREATE ALLIANCE
  ------------------------------- */
  const createAlliance = async () => {
    if (!newAllianceName) {
      alert("Alliance name is required");
      return;
    }

    const r = await fetch(`${backend}/admin/alliances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newAllianceName,
        color: newAllianceColor,
      }),
    });

    if (r.ok) {
      alert("Alliance created!");
      setNewAllianceName("");
      loadAlliances();
    } else {
      alert("Error creating alliance");
    }
  };

  /* ------------------------------
        CREATE PARTY
  ------------------------------- */
  const createParty = async () => {
    if (!newPartyName || !newPartyCode) {
      alert("Party name and code are required");
      return;
    }

    const r = await fetch(`${backend}/admin/parties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newPartyName,
        code: newPartyCode,
        allianceId: newPartyAlliance || null,
      }),
    });

    if (r.ok) {
      alert("Party created!");
      setNewPartyName("");
      setNewPartyCode("");
      setNewPartyAlliance("");
      loadParties();
      loadCandidates();
    } else {
      alert("Error creating party");
    }
  };

  /* ------------------------------
        MAP CANDIDATE → PARTY
  ------------------------------- */
  const updateCandidateParty = async (candidateId: number, partyId: number) => {
    const r = await fetch(`${backend}/admin/candidates/${candidateId}/party`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partyId }),
    });

    if (r.ok) {
      loadCandidates();
    } else {
      alert("Failed to update party");
    }
  };

  /* ------------------------------
        MAP PARTY → ALLIANCE
  ------------------------------- */
  const updatePartyAlliance = async (partyId: number, allianceId: number | null) => {
    await fetch(`${backend}/admin/parties/${partyId}/alliance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allianceId }),
    });

    loadParties();
    loadCandidates();
  };


  /* ------------------------------
        RENDER
  ------------------------------- */
  return (
    <div style={{ padding: 24, color: "white" }}>
      <h2>Party & Alliance Mapping</h2>

      {/* ------------------- FILTER ------------------- */}
      <div style={{ marginBottom: 24 }}>
        <label>Year</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          style={{ marginLeft: 12, padding: 6 }}
        >
          <option value={2024}>2024</option>
        </select>

        <label style={{ marginLeft: 20 }}>Lok Sabha</label>
        <select
          value={selectedLs}
          onChange={(e) => setSelectedLs(e.target.value)}
          style={{ marginLeft: 12, padding: 6 }}
        >
          <option value="">All</option>
          {lokSabhas.map((ls) => (
            <option key={ls.id} value={ls.id}>
              {ls.lsCode} - {ls.name}
            </option>
          ))}
        </select>
      </div>

      {/* ------------------- ALLIANCE CREATION ------------------- */}
      <div style={{ background: "#222", padding: 16, marginBottom: 24 }}>
        <h3>Create Alliance</h3>
        <input
          placeholder="Alliance Name (LDF / UDF / NDA)"
          value={newAllianceName}
          onChange={(e) => setNewAllianceName(e.target.value)}
          style={{ padding: 8, width: "40%", marginRight: 10 }}
        />
        <input
          type="color"
          value={newAllianceColor}
          onChange={(e) => setNewAllianceColor(e.target.value)}
          style={{ width: 60, height: 35 }}
        />
        <button
          onClick={createAlliance}
          style={{ marginLeft: 12, padding: "8px 16px" }}
        >
          Add Alliance
        </button>
      </div>

      {/* ------------------- PARTY CREATION ------------------- */}
      <div style={{ background: "#222", padding: 16, marginBottom: 24 }}>
        <h3>Create Party</h3>
        <input
          placeholder="Party Name (e.g. CPI(M))"
          value={newPartyName}
          onChange={(e) => setNewPartyName(e.target.value)}
          style={{ padding: 8, width: "35%", marginRight: 10 }}
        />
        <input
          placeholder="Code (e.g. CPM)"
          value={newPartyCode}
          onChange={(e) => setNewPartyCode(e.target.value)}
          style={{ padding: 8, width: "20%", marginRight: 10 }}
        />

        <select
          value={newPartyAlliance}
          onChange={(e) => setNewPartyAlliance(e.target.value)}
          style={{ padding: 8 }}
        >
          <option value="">No Alliance</option>
          {alliances.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <button
          style={{ marginLeft: 12, padding: "8px 16px" }}
          onClick={createParty}
        >
          Add Party
        </button>
      </div>

      {/* ------------------- PARTY LIST ------------------- */}
      <h3>Parties</h3>
      <table style={{ width: "100%", background: "#111", marginBottom: 30 }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Code</th>
            <th>Alliance</th>
          </tr>
        </thead>
        <tbody>
          {parties.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.code}</td>
              <td>
                <select
                  value={p.alliance?.id || ""}
                  onChange={(e) =>
                    updatePartyAlliance(
                      p.id,
                      Number(e.target.value) || 0
                    )
                  }
                >
                  <option value="">None</option>
                  {alliances.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ------------------- CANDIDATE MAPPING ------------------- */}
      <h3>Candidate Mapping</h3>
      <table style={{ width: "100%", background: "#111" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>LS</th>
            <th>Party</th>
            <th>Alliance</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.lsName}</td>
              <td>
                <select
                  value={c.partyId || ""}
                  onChange={(e) =>
                    updateCandidateParty(
                      c.id,
                      Number(e.target.value) || 0
                    )
                  }
                >
                  <option value="">None</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                {c.allianceName ? (
                  <span style={{ color: c.allianceColor }}>{c.allianceName}</span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 24, opacity: 0.7 }}>
        * Alliance is automatically derived from Party
      </p>
    </div>
  );
}
