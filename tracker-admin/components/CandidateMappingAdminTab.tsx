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

export default function CandidateMappingAdminTab({ backend }: { backend: string }) {
  const [selectedAc, setSelectedAc] = useState("");
  const [assemblies, setAssemblies] = useState<{ acCode: number; acName: string }[]>([]);

  const [parties, setParties] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [lokSabhas, setLokSabhas] = useState<any[]>([]);

  const [year, setYear] = useState<number>(ANALYSIS_YEARS[0] ?? 2024);
  const [selectedLs, setSelectedLs] = useState("");

  /* ================= LOAD PARTIES ================= */
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

  /* ================= LOAD LS MASTER ================= */
  useEffect(() => {
    loadLokSabhas();
  }, []);

  const loadLokSabhas = async () => {
    const r = await fetch(`${backend}/public/ls`);
    if (!r.ok) return setLokSabhas([]);

    const data = await r.json();

    const map = new Map<string, { id: any; lsCode: string; name: string }>();
    (Array.isArray(data) ? data : []).forEach((ls: any) => {
      const id = ls?.id ?? null;
      const lsCode = ls?.lsCode ?? null;
      const name = ls?.name ?? null;
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
  };

  /* ================= LOAD ASSEMBLIES BY LS ================= */
  useEffect(() => {
    setSelectedAc("");
    if (selectedLs) loadAssembliesByLs(selectedLs);
    else setAssemblies([]);
  }, [selectedLs]);

  const loadAssembliesByLs = async (lsCode: string) => {
    const r = await fetch(`${backend}/public/assemblies/by-ls?lsCode=${lsCode}`);
    if (!r.ok) return setAssemblies([]);

    const data = await r.json();
    const acMap = new Map<number, { acCode: number; acName: string }>();

    data.forEach((ac: any) => {
      if (!selectedLs || String(ac.ls.id) === selectedLs) {
        if (ac.acCode && !acMap.has(ac.acCode)) {
          acMap.set(ac.acCode, {
            acCode: ac.acCode,
            acName: ac.name,
          });
        }
      }
    });

    setAssemblies(
      Array.from(acMap.values()).sort((a, b) =>
        a.acCode - b.acCode
      )
    );
  };

  // ================= BATCH ADD CANDIDATES =================

  type NewCandidateRow = {
    name: string;
    electionType: "LOKSABHA" | "ASSEMBLY";
    electionYear: number;
    lsCode?: string;
    acCode?: string;
    partyId?: string;
    allianceId?: string;
  };

  const [newCandidates, setNewCandidates] = useState<NewCandidateRow[]>([]);
  const [showBatchForm, setShowBatchForm] = useState(false);

  // ========================================================

  const addCandidateRow = () => {
    setNewCandidates((prev) => [
      ...prev,
      {
        name: "",
        electionType: "ASSEMBLY",
        electionYear: year,
      },
    ]);
  };

  const removeCandidateRow = (idx: number) => {
    setNewCandidates((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCandidateRow = (idx: number, field: string, value: any) => {
    setNewCandidates((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    );
  };

  const submitCandidates = async () => {
    if (newCandidates.length === 0) return alert("Add at least one candidate");

    // Validation
    for (const c of newCandidates) {
      if (!c.name) return alert("Candidate name required");
      if (c.electionType === "LOKSABHA" && !c.lsCode)
        return alert("LS candidate must have LS selected");
      if (c.electionType === "ASSEMBLY" && !c.acCode)
        return alert("AC candidate must have AC selected");
    }

    const payload = {
      candidates: newCandidates.map((c) => ({
        name: c.name,
        electionYear: c.electionYear,
        electionType: c.electionType,
        lsCode: c.electionType === "LOKSABHA" ? Number(c.lsCode) : null,
        acCode: c.electionType === "ASSEMBLY" ? Number(c.acCode) : null,
        partyId: c.partyId ? Number(c.partyId) : null,
        allianceId: c.allianceId ? Number(c.allianceId) : null,
      })),
    };

    const res = await fetch(`${backend}/admin/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert("Failed to create candidates");
      return;
    }

    alert("Candidates created successfully");
    setNewCandidates([]);
    setShowBatchForm(false);
    loadCandidates();
  };


  const loadCandidates = async () => {
    let url = `${backend}/admin/candidates?year=${year}`;
    if (selectedLs) url += `&lsId=${selectedLs}`;

    const r = await fetch(url);
    if (r.ok) {
      const data = await r.json();
      setCandidates(data);
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
      {/* ================= BATCH ADD CANDIDATES ================= */}
        <div style={{ marginTop: 32 }}>
          <h3>Bulk Add Candidates</h3>

          <button
            onClick={() => setShowBatchForm(!showBatchForm)}
            style={{
              padding: "6px 12px",
              background: "#0d6efd",
              color: "white",
              borderRadius: 6,
              border: "none",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {showBatchForm ? "Hide Form" : "+ Add Candidates"}
          </button>

          {showBatchForm && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                background: "#0b0b0b",
                border: "1px solid #333",
                borderRadius: 8,
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>LS / AC</th>
                    <th style={thStyle}>Party</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>

                <tbody>
                  {newCandidates.map((c, idx) => (
                    <tr key={idx}>
                      {/* Name */}
                      <td style={tdStyle}>
                        <input
                          value={c.name}
                          onChange={(e) =>
                            updateCandidateRow(idx, "name", e.target.value)
                          }
                          style={{
                            width: "100%",
                            padding: 6,
                            background: "#111",
                            border: "1px solid #333",
                            color: "white",
                          }}
                        />
                      </td>

                      {/* Election Type */}
                      <td style={tdStyle}>
                        <select
                          value={c.electionType}
                          onChange={(e) =>
                            updateCandidateRow(idx, "electionType", e.target.value)
                          }
                          style={{ background: "#111", color: "white" }}
                        >
                          <option value="ASSEMBLY">Assembly</option>
                          <option value="LOKSABHA">Lok Sabha</option>
                        </select>
                      </td>

                      {/* LS / AC Selector */}
                      <td style={tdStyle}>
                        {c.electionType === "LOKSABHA" ? (
                          <select
                            value={c.lsCode || ""}
                            onChange={(e) =>
                              updateCandidateRow(idx, "lsCode", e.target.value)
                            }
                          >
                            <option value="">Select LS</option>
                            {lokSabhas.map((ls) => (
                              <option key={ls.id} value={ls.id}>
                                {ls.lsCode} – {ls.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={c.acCode || ""}
                            onChange={(e) =>
                              updateCandidateRow(idx, "acCode", e.target.value)
                            }
                          >
                            <option value="">Select AC</option>
                            {assemblies.map((ac) => (
                              <option key={ac.acCode} value={ac.acCode}>
                                {ac.acCode} – {ac.acName}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* Party */}
                      <td style={tdStyle}>
                        <select
                          value={c.partyId || ""}
                          onChange={(e) =>
                            updateCandidateRow(idx, "partyId", e.target.value)
                          }
                        >
                          <option value="">— Party —</option>
                          {parties.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Remove */}
                      <td style={tdStyle}>
                        <button
                          onClick={() => removeCandidateRow(idx)}
                          style={{
                            padding: "4px 8px",
                            background: "#dc2626",
                            color: "white",
                            borderRadius: 4,
                            border: "none",
                          }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Add Row */}
              <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                <button
                  onClick={addCandidateRow}
                  style={{
                    padding: "6px 10px",
                    background: "#374151",
                    color: "white",
                    borderRadius: 6,
                    border: "none",
                  }}
                >
                  + Add Row
                </button>

                {newCandidates.length > 0 && (
                  <button
                    onClick={submitCandidates}
                    style={{
                      padding: "6px 14px",
                      background: "#059669",
                      color: "white",
                      borderRadius: 6,
                      border: "none",
                      fontWeight: 600,
                    }}
                  >
                    Save All Candidates
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
