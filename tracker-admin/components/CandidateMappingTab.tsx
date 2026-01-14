"use client";

import React, { useEffect, useState } from "react";
import { AVAILABLE_YEARS as ANALYSIS_YEARS } from "../lib/constants";

export default function CandidateMappingTab({ backend }: { backend: string }) {
  const [parties, setParties] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [lokSabhas, setLokSabhas] = useState<any[]>([]);

  const [year, setYear] = useState<number>(ANALYSIS_YEARS[0] ?? 2024);
  const [selectedLs, setSelectedLs] = useState("");

  useEffect(() => {
    loadParties();
    loadCandidates();
  }, [year, selectedLs]);

  const loadParties = async () => {
    const r = await fetch(`${backend}/admin/parties`);
    if (r.ok) setParties(await r.json());
    else setParties([]);
  };

  const loadCandidates = async () => {
    let url = `${backend}/admin/candidates?year=${year}`;
    if (selectedLs) url += `&lsId=${selectedLs}`;

    const r = await fetch(url);
    if (r.ok) {
      const data = await r.json();
      setCandidates(data);

      // derive Lok Sabhas from the candidate list (grouped by ls id/code/name)
      const map = new Map<string, { id: any; lsCode: string; name: string }>();
      (Array.isArray(data) ? data : []).forEach((c: any) => {
        const id = c.lsId ?? c.ls?.id ?? null;
        const lsCode = c.lsCode ?? c.ls?.lsCode ?? null;
        const name = c.lsName ?? c.ls?.name ?? null;
        const key = id ?? lsCode ?? name ?? null;
        if (key != null && !map.has(String(key))) {
          map.set(String(key), { id: id ?? lsCode ?? name, lsCode: lsCode ?? "", name: name ?? "" });
        }
      });

      setLokSabhas(Array.from(map.values()));
    } else {
      setCandidates([]);
      setLokSabhas([]);
    }
  };

  const updateCandidateParty = async (candidateId: number, partyId: number) => {
    const r = await fetch(`${backend}/admin/candidates/${candidateId}/party`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partyId }),
    });

    if (r.ok) loadCandidates();
    else alert("Failed to update party");
  };

  return (
    <div style={{ padding: 24, color: "white" }}>
      <h2>Candidate Mapping</h2>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 12, color: "#aaa" }}>Year</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ANALYSIS_YEARS.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: year === y ? "1px solid #0d6efd" : "1px solid #555",
                background: year === y ? "#0d6efd33" : "transparent",
                color: "#fff",
                fontSize: 12,
              }}
            >
              {y}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 12, color: "#aaa" }}>Lok Sabha</label>
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
      </div>

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
                    updateCandidateParty(c.id, Number(e.target.value) || 0)
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

      <p style={{ marginTop: 24, opacity: 0.7 }}>* Alliance is automatically derived from Party</p>
    </div>
  );
}
