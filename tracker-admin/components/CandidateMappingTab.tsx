"use client";

import React, { useEffect, useState } from "react";
import { AVAILABLE_YEARS as ANALYSIS_YEARS } from "../lib/constants";

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 12,
  fontWeight: 600,
  color: "#9ca3af",
  borderBottom: "1px solid #333",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  verticalAlign: "middle",
};

export default function CandidateMappingTab({ backend }: { backend: string }) {
  const [selectedAc, setSelectedAc] = useState("");
  const [assemblies, setAssemblies] = useState<{ acCode: number; acName: string }[]>([]);

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

  useEffect(() => {
    setSelectedAc("");
  }, [selectedLs]);

  const loadCandidates = async () => {
    let url = `${backend}/admin/candidates?year=${year}`;
    if (selectedLs) url += `&lsId=${selectedLs}`;

    const r = await fetch(url);
    if (r.ok) {
      const data = await r.json();
      setCandidates(data);

      // derive assemblies based on selected LS
      const acMap = new Map<number, { acCode: number; acName: string }>();

      data.forEach((c: any) => {
        if (!selectedLs || String(c.lsId) === selectedLs) {
          if (c.acCode && !acMap.has(c.acCode)) {
            acMap.set(c.acCode, {
              acCode: c.acCode,
              acName: c.acName,
            });
          }
        }
      });

      setAssemblies(
        Array.from(acMap.values()).sort((a, b) =>
          a.acCode - b.acCode
        )
      );

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

      setLokSabhas(
        Array.from(map.values()).sort((a, b) => {
          if (a.lsCode && b.lsCode) {
            return Number(a.lsCode) - Number(b.lsCode);
          }
          return a.name.localeCompare(b.name);
        })
      );

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
          paddingBottom: 12,
          borderBottom: "1px solid #333",
        }}
      >
        {/* Year */}
        <div>
          <label style={{ fontSize: 11, color: "#9ca3af" }}>Election Year</label>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
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
                  cursor: "pointer",
                }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Lok Sabha */}
        <div style={{ minWidth: 280 }}>
          <label style={{ fontSize: 11, color: "#9ca3af" }}>
            Lok Sabha Constituency
          </label>

          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <select
              value={selectedLs}
              onChange={(e) => setSelectedLs(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 10px",
                background: "#0b0b0b",
                border: selectedLs ? "1px solid #0d6efd" : "1px solid #333",
                borderRadius: 6,
                color: "white",
                fontSize: 12,
              }}
            >
              <option value="">All Lok Sabhas</option>
              {lokSabhas.map((ls) => (
                <option key={ls.id} value={ls.id}>
                  {ls.lsCode ? `${ls.lsCode} – ` : ""}
                  {ls.name}
                </option>
              ))}
            </select>

            {selectedLs && (
              <button
                onClick={() => setSelectedLs("")}
                title="Clear Lok Sabha filter"
                style={{
                  padding: "0 10px",
                  borderRadius: 6,
                  border: "1px solid #333",
                  background: "#111",
                  color: "#9ca3af",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
        {/* Assembly */}
        {selectedLs && (
          <div style={{ minWidth: 260 }}>
            <label style={{ fontSize: 11, color: "#9ca3af" }}>
              Assembly Constituency
            </label>

            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <select
                value={selectedAc}
                onChange={(e) => setSelectedAc(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  background: "#0b0b0b",
                  border: selectedAc ? "1px solid #0d6efd" : "1px solid #333",
                  borderRadius: 6,
                  color: "white",
                  fontSize: 12,
                }}
              >
                <option value="">All Assemblies</option>
                {assemblies.map(ac => (
                  <option key={ac.acCode} value={ac.acCode}>
                    {ac.acCode} – {ac.acName}
                  </option>
                ))}
              </select>

              {selectedAc && (
                <button
                  onClick={() => setSelectedAc("")}
                  title="Clear Assembly filter"
                  style={{
                    padding: "0 10px",
                    borderRadius: 6,
                    border: "1px solid #333",
                    background: "#111",
                    color: "#9ca3af",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <h3 style={{ marginTop: 24, marginBottom: 8 }}>Candidate Mapping</h3>
      <div
        style={{
          maxHeight: 520,
          overflowY: "auto",
          background: "#0b0b0b",
          border: "1px solid #333",
          borderRadius: 8,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead
            style={{
              position: "sticky",
              top: 0,
              background: "#111",
              zIndex: 1,
            }}
          >
            <tr>
              <th style={thStyle}>Candidate</th>
              <th style={thStyle}>Lok Sabha</th>
              <th style={thStyle}>Party</th>
              <th style={thStyle}>Alliance</th>
            </tr>
          </thead>

          <tbody>
            {candidates
              .filter(c =>
                (!selectedLs || String(c.lsId) === selectedLs) &&
                (!selectedAc || String(c.acCode) === selectedAc)
              )
              .map((c) => (
              <tr
                key={c.id}
                style={{
                  borderBottom: "1px solid #1f1f1f",
                }}
              >
                {/* Candidate */}
                <td style={tdStyle}>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "#777" }}>
                    ID: {c.id}
                  </div>
                </td>

                {/* LS */}
                <td style={tdStyle}>
                  <div style={{ fontSize: 12 }}>
                    {c.lsCode} – {c.lsName}
                  </div>
                </td>

                {/* Party */}
                <td style={tdStyle}>
                  <select
                    value={c.partyId || ""}
                    onChange={(e) =>
                      updateCandidateParty(c.id, Number(e.target.value) || 0)
                    }
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      background: "#0b0b0b",
                      border: "1px solid #333",
                      borderRadius: 6,
                      color: "white",
                      fontSize: 12,
                    }}
                  >
                    <option value="">— Unassigned —</option>
                    {parties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Alliance */}
                <td style={tdStyle}>
                  {c.allianceName ? (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 11,
                        background: c.allianceColor || "#334155",
                        color: "white",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.allianceName}
                    </span>
                  ) : (
                    <span style={{ color: "#555" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
        * Alliance is automatically derived from Party
      </p>
    </div>
  );
}
