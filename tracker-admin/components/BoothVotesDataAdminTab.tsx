"use client";

import React, { useEffect, useMemo, useState } from "react";
import AssemblySelector from "./AssemblySelector";
import { GENERAL_ELECTION_YEARS as AVAILABLE_YEARS } from "../lib/constants";

/* ================= STYLES (reuse candidate mapping style) ================= */

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

  /* ================= DYNAMIC CANDIDATE HEADERS ================= */ 
  
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

  /* ================= VALIDATION ================= */

  const sumVotes = (b: BoothRow) =>
    b.candidates.reduce((s, c) => s + (c.votes ?? 0), 0);

  /* ================= SAVE ================= */

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

  const saveAll = async () => {
    const dirtyRows = data.filter((b) => dirty.has(b.psId));
    await fetch(`${backend}/admin/form20/booth/bulk`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dirtyRows),
    });
    alert(`Saved ${dirtyRows.length} booths`);
    setDirty(new Set());
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

        {dirty.size > 0 && (
          <button
            onClick={saveAll}
            style={{
              alignSelf: "end",
              padding: "8px 14px",
              background: "#059669",
              color: "white",
              borderRadius: 6,
              border: "none",
              fontSize: 13,
            }}
          >
            Save All ({dirty.size})
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
          fontSize: 12,
          color: "#9ca3af",
        }}
      >
        {/* Page Size */}
        <div>
          Show{" "}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            style={{
              background: "#0b0b0b",
              color: "white",
              border: "1px solid #333",
              padding: "2px 6px",
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            {[10, 20, 50].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>{" "}
          booths
        </div>

        {/* Page Controls */}   
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <select
            value={page}
            onChange={(e) => setPage(Number(e.target.value))}
            style={{
              background: "#0b0b0b",
              color: "white",
              border: "1px solid #333",
              padding: "2px 6px",
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            {Array.from({ length: totalPages }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid #333",
              background: page === 1 ? "#111" : "#0d6efd",
              color: "white",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Prev
          </button>

          <span>
            Page {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{
              padding: "4px 8px",
              borderRadius: 4,
              border: "1px solid #333",
              background: page === totalPages ? "#111" : "#0d6efd",
              color: "white",
              fontSize: 11,
              cursor: "pointer",
            }}
          >
            Next
          </button>
        </div>
      </div>


      {/* TABLE */}
      <div
        style={{
          maxHeight: 650,
          overflow: "auto",
          background: "#0b0b0b",
          border: "1px solid #333",
          borderRadius: 8,
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead style={{ position: "sticky", top: 0, background: "#111", zIndex: 2 }}>
            <tr>
              {/* Sticky Left */}
              <th style={{ ...thStyle, position: "sticky", left: 0, zIndex: 6, background: "#111", minWidth: 60 }}>PS No</th>
              <th style={{ ...thStyle, position: "sticky", left: 60, zIndex: 6, background: "#111" }}>Polling Station</th>
              
              {/* Scrollable Candidate Headers */}
              <th style={{ ...thStyle, minWidth: candidateHeaders.length * 220 }}>
                <div style={{ display: "flex", gap: 0 }}>
                  {candidateHeaders.map((c) => (
                    <div
                      key={c.candidateId}
                      style={{
                        width: 220,
                        minWidth: 220,
                        maxWidth: 220,
                        padding: "0 8px",
                        borderRight: "1px solid #1f1f1f",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontSize: 11,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                      title={`${c.candidateName} (${c.partyName || ""})`}
                    >
                      {/* Candidate Name */}
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.candidateName}
                      </span>

                      {/* Party Badge */}
                      {c.partyName && (
                        <span
                          style={{
                            fontSize: 10,
                            padding: "1px 6px",
                            borderRadius: 999,
                            background: c.partyColor || "#334155",
                            color: "white",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.partyName}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </th>
              
              {/* Sticky Right */}
              <th style={{ ...thStyle, position: "sticky", right: 240, background: "#111", minWidth: 100 }}>Total Valid</th>
              <th style={{ ...thStyle, position: "sticky", right: 120, background: "#111", minWidth: 90 }}>Rejected</th>
              <th style={{ ...thStyle, position: "sticky", right: 90, background: "#111", minWidth: 90 }}>NOTA</th>
              <th style={{ ...thStyle, position: "sticky", right: 0, background: "#111", minWidth: 90 }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {pagedData.map((b) => {
              const candMap = new Map(
                b.candidates.map((c) => [c.candidateId, c])
              );
              const totalCalc = sumVotes(b);
              const mismatch =
                b.totals.totalValid != null &&
                totalCalc !== b.totals.totalValid;

              return (
                <tr key={b.psId}>
                  {/* Sticky Left Columns */}
                  <td style={{ ...tdStyle, position: "sticky", left: 0, background: "#0b0b0b", zIndex: 3 }}>{b.psNumber}</td>
                  <td style={{ ...tdStyle, position: "sticky", left: 60, background: "#0b0b0b", zIndex: 3 }}>{b.psName}</td>

                  {/* Scrollable Candidate Section */}
                  <td style={tdStyle}>
                    <div style={{ display: "flex" }}>
                      {candidateHeaders.map((h) => {
                        const c = candMap.get(h.candidateId);
                        return (
                          <div
                            key={h.candidateId}
                            style={{
                              width: 220,
                              minWidth: 220,
                              maxWidth: 220,
                              padding: "4px 8px",
                              borderRight: "1px solid #1f1f1f",
                            }}
                          >
                            <input
                              type="number"
                              value={c?.votes ?? ""}
                              onChange={(e) =>
                                updateVote(b.psId, h.candidateId, Number(e.target.value))
                              }
                              style={{
                                ...inputStyle,
                                width: 60,
                                border: c?.votes == null ? "1px solid #dc2626" : "1px solid #333",
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </td>

                  {/* Sticky Totals */}
                  <td
                    style={{
                      ...tdStyle,
                      position: "sticky",
                      right: 240,
                      background: "#0b0b0b",
                      zIndex: 3,
                      minWidth: 100,
                    }}
                  >
                    <input
                      value={b.totals.totalValid ?? ""}
                      onChange={(e) => updateTotal(b.psId, "totalValid", Number(e.target.value))}
                      style={inputStyle}
                    />
                  </td>

                  {/* Rejected */}
                  <td
                    style={{
                      ...tdStyle,
                      position: "sticky",
                      right: 120,
                      background: "#0b0b0b",
                      zIndex: 3,
                      minWidth: 90,
                    }}
                  >
                    <input
                      value={b.totals.rejected ?? ""}
                      onChange={(e) => updateTotal(b.psId, "rejected", Number(e.target.value))}
                      style={inputStyle}
                    />
                  </td>

                  {/* NOTA */}
                  <td
                    style={{
                      ...tdStyle,
                      position: "sticky",
                      right: 0 + 90,
                      background: "#0b0b0b",
                      zIndex: 3,
                      minWidth: 90,
                    }}
                  >
                    <input
                      value={b.totals.nota ?? ""}
                      onChange={(e) => updateTotal(b.psId, "nota", Number(e.target.value))}
                      style={inputStyle}
                    />
                  </td>

                  {/* Sticky Save */}
                  <td style={{ ...tdStyle, position: "sticky", right: 0, background: "#0b0b0b", zIndex: 3 }}>
                    <button
                      onClick={() => saveBooth(b)}
                      style={{
                        padding: "6px 12px",
                        background: "#0d6efd",
                        color: "white",
                        borderRadius: 6,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Save
                    </button>

                    {mismatch && (
                      <div style={{ color: "#f59e0b", fontSize: 10 }}>
                        Σ votes ≠ total valid
                      </div>
                    )}
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
