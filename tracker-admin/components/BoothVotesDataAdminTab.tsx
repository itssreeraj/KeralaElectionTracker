"use client";

import React, { useEffect, useMemo, useState } from "react";
import AssemblySelector from "./AssemblySelector";
import { GENERAL_ELECTION_YEARS as AVAILABLE_YEARS } from "../lib/constants";

/* ================= STYLES ================= */

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 12,
  fontWeight: 600,
  color: "#9ca3af",
  borderBottom: "1px solid #333",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "6px 10px",
  verticalAlign: "middle",
  borderBottom: "1px solid #1f1f1f",
  fontSize: 12,
};

const inputStyle: React.CSSProperties = {
  width: 70,
  padding: "4px 6px",
  background: "#0b0b0b",
  border: "1px solid #333",
  borderRadius: 4,
  color: "white",
  fontSize: 12,
};

/* ================= TYPES ================= */

type CandidateVote = {
  candidateId: number;
  candidateName: string;
  partyName?: string;
  partyColor?: string;
  votes: number | null;
};

type BoothRow = {
  psId: number;
  psNumber: string;
  psName: string;
  candidates: CandidateVote[];
  totals: {
    totalValid: number | null;
    rejected: number | null;
    nota: number | null;
  };
};

/* ================= COMPONENT ================= */

export default function BoothVotesDataAdminTab({ backend }: { backend: string }) {
  const [selectedAc, setSelectedAc] = useState<any | null>(null);
  const [year, setYear] = useState(2021);
  const [data, setData] = useState<BoothRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState<Set<number>>(new Set());
  const [expandedPS, setExpandedPS] = useState<Set<number>>(new Set());

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  /* ================= LOAD DATA ================= */

  const loadData = async () => {
    if (!selectedAc) return;
    setLoading(true);
    const res = await fetch(
      `${backend}/public/boothvotes?acCode=${selectedAc.acCode}&year=${year}`
    );
    const json = await res.json();
    setData(json);
    setDirty(new Set());
    setExpandedPS(new Set());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedAc, year]);

  /* ================= DYNAMIC CANDIDATE HEADERS ================= */

  const candidateHeaders = useMemo(() => {
    const map = new Map<number, CandidateVote>();
    data.forEach((b) =>
      b.candidates.forEach((c) => {
        if (!map.has(c.candidateId)) map.set(c.candidateId, c);
      })
    );
    return Array.from(map.values());
  }, [data]);

  /* ================= PAGINATION ================= */

  const totalPages = Math.ceil(data.length / pageSize);
  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  /* ================= UPDATE HANDLERS ================= */

  const markDirty = (psId: number) =>
    setDirty((prev) => new Set(prev).add(psId));

  const updateVote = (psId: number, candidateId: number, value: number) => {
    setData((prev) =>
      prev.map((b) =>
        b.psId === psId
          ? {
              ...b,
              candidates: b.candidates.map((c) =>
                c.candidateId === candidateId ? { ...c, votes: value } : c
              ),
            }
          : b
      )
    );
    markDirty(psId);
  };

  const updateTotal = (psId: number, field: string, value: number) => {
    setData((prev) =>
      prev.map((b) =>
        b.psId === psId ? { ...b, totals: { ...b.totals, [field]: value } } : b
      )
    );
    markDirty(psId);
  };

  const saveBooth = async (booth: BoothRow) => {
    await fetch(`${backend}/admin/form20/booth/${booth.psId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        votes: booth.candidates.map((c) => ({
          candidateId: c.candidateId,
          votes: c.votes ?? 0,
        })),
        totals: booth.totals,
      }),
    });
    alert(`Saved PS ${booth.psNumber}`);
    setDirty((prev) => {
      const n = new Set(prev);
      n.delete(booth.psId);
      return n;
    });
  };

  const toggleExpand = (psId: number) => {
    setExpandedPS((prev) => {
      const n = new Set(prev);
      n.has(psId) ? n.delete(psId) : n.add(psId);
      return n;
    });
  };

  /* ================= RENDER ================= */

  return (
    <div style={{ padding: 24, color: "white" }}>
      <h2>Form-20 Booth Data Admin</h2>

      {/* Filters */}
      <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 11, color: "#9ca3af" }}>Assembly</label>
          <AssemblySelector backend={backend} onSelectAc={setSelectedAc} />
        </div>

        <div>
          <label style={{ fontSize: 11, color: "#9ca3af" }}>Year</label>
          <div style={{ display: "flex", gap: 6 }}>
            {AVAILABLE_YEARS.map((y) => (
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
        </div>
      </div>

      {/* TABLE */}
      <div style={{ maxHeight: 650, overflow: "auto", background: "#0b0b0b", border: "1px solid #333", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead style={{ position: "sticky", top: 0, background: "#111", zIndex: 2 }}>
            <tr>
              {/* Sticky Left */}
              <th style={{ ...thStyle, position: "sticky", left: 0, background: "#111", minWidth: 60 }}>PS No</th>
              <th style={{ ...thStyle, position: "sticky", left: 60, background: "#111", minWidth: 260 }}>Polling Station</th>

              {/* Candidate Headers */}
              <th style={{ ...thStyle }}>
                <div style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    {candidateHeaders.map((c) => (
                      <div
                        key={c.candidateId}
                        style={{
                          minWidth: 200,
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: 11,
                          fontWeight: 600,
                          color: c.partyColor || "#e5e7eb",
                        }}
                        title={`${c.candidateName}${c.partyName ? " (" + c.partyName + ")" : ""}`}
                      >
                        {c.candidateName}
                        {c.partyName && <span style={{ color: "#9ca3af" }}> ({c.partyName})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </th>

              {/* Sticky Right */}
              <th style={{ ...thStyle, position: "sticky", right: 240, background: "#111", minWidth: 100 }}>Total Valid</th>
              <th style={{ ...thStyle, position: "sticky", right: 120, background: "#111", minWidth: 90 }}>Rejected</th>
              <th style={{ ...thStyle, position: "sticky", right: 60, background: "#111", minWidth: 90 }}>NOTA</th>
              <th style={{ ...thStyle, position: "sticky", right: 0, background: "#111", minWidth: 90 }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {pagedData.map((b) => {
              const candMap = new Map(b.candidates.map((c) => [c.candidateId, c]));
              const expanded = expandedPS.has(b.psId);

              return (
                <tr key={b.psId}>
                  {/* PS No */}
                  <td style={{ ...tdStyle, position: "sticky", left: 0, background: "#0b0b0b" }}>{b.psNumber}</td>

                  {/* Polling Station Name (Ellipsis + Expand) */}
                  <td
                    style={{
                      ...tdStyle,
                      position: "sticky",
                      left: 60,
                      background: "#0b0b0b",
                      minWidth: 260,
                      maxWidth: 360,
                    }}
                  >
                    <div
                      style={{
                        display: expanded ? "block" : "-webkit-box",
                        WebkitLineClamp: expanded ? "unset" : 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        whiteSpace: expanded ? "normal" : "nowrap",
                        wordBreak: "break-word",
                      }}
                      title={b.psName}
                    >
                      {b.psName}
                    </div>

                    <button
                      onClick={() => toggleExpand(b.psId)}
                      style={{
                        fontSize: 10,
                        marginTop: 2,
                        background: "none",
                        border: "none",
                        color: "#0d6efd",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      {expanded ? "Collapse" : "Expand"}
                    </button>
                  </td>

                  {/* Candidate Votes */}
                  <td style={tdStyle}>
                    <div style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        {candidateHeaders.map((h) => {
                          const c = candMap.get(h.candidateId);
                          return (
                            <td key={h.candidateId} style={tdStyle}>
                              <input
                                type="number"
                                value={c?.votes ?? ""}
                                onChange={(e) =>
                                  updateVote(b.psId, h.candidateId, Number(e.target.value))
                                }
                                style={inputStyle}
                              />
                            </td>
                          );
                        })}
                      </div>
                    </div>
                  </td>

                  {/* Totals Sticky */}
                  <td style={{ ...tdStyle, position: "sticky", right: 240, background: "#0b0b0b" }}>
                    <input value={b.totals.totalValid ?? ""} onChange={(e) => updateTotal(b.psId, "totalValid", Number(e.target.value))} style={inputStyle} />
                  </td>

                  <td style={{ ...tdStyle, position: "sticky", right: 120, background: "#0b0b0b" }}>
                    <input value={b.totals.rejected ?? ""} onChange={(e) => updateTotal(b.psId, "rejected", Number(e.target.value))} style={inputStyle} />
                  </td>

                  <td style={{ ...tdStyle, position: "sticky", right: 60, background: "#0b0b0b" }}>
                    <input value={b.totals.nota ?? ""} onChange={(e) => updateTotal(b.psId, "nota", Number(e.target.value))} style={inputStyle} />
                  </td>

                  {/* Save */}
                  <td style={{ ...tdStyle, position: "sticky", right: 0, background: "#0b0b0b" }}>
                    <button
                      onClick={() => saveBooth(b)}
                      style={{
                        padding: "6px 10px",
                        background: "#0d6efd",
                        color: "white",
                        borderRadius: 6,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {loading && <p>Loading…</p>}
    </div>
  );
}
