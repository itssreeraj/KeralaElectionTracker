"use client";

import React, { useEffect, useState } from "react";
import AssemblySelector from "./AssemblySelector";

/* -------------------- DTO TYPES -------------------- */
type AllianceVoteShare = { alliance: string; votes: number; percentage: number };
type WardRow = {
  wardId: number;
  wardNum: number;
  wardName: string;
  localbodyId: number;
  localbodyName: string;
  alliances: AllianceVoteShare[];
  total: number;
  winner: string | null;
  margin: number | null;
};

type LocalbodySummary = {
  localbodyId: number;
  localbodyName: string;
  localbodyType: string;
  wardsCount: number;
  voteShare: AllianceVoteShare[];
  wardPerformance: { alliance: string; winner: number; runnerUp: number; third: number }[];
};

type AssemblyAnalysisResponse = {
  acCode: number;
  acName: string;
  district: string;
  year: number;
  totalWards: number;
  overallVoteShare: AllianceVoteShare[];
  localbodies: LocalbodySummary[];
  wards: WardRow[];
};

const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";

/* Alliance color map */
const ALLIANCE_COLORS: Record<string, string> = {
  LDF: "#e11d48",
  UDF: "#2563eb",
  NDA: "#facc15",
  SDPI: "#16a34a",
  IND: "#9ca3af",
  OTH: "#6b7280",
};

/* Alliance badge (Option B, inline compact) */
function AllianceBadge({
  alliance,
  votes,
  pct,
}: {
  alliance: string;
  votes: number;
  pct: number;
}) {
  const color = ALLIANCE_COLORS[alliance] || ALLIANCE_COLORS.OTH;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 20,               // FIXED height so it doesn't expand row
        lineHeight: "20px",      // align text vertically
        fontSize: 12,
        whiteSpace: "nowrap",
        marginRight: 8,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          display: "inline-block",
          borderRadius: "50%",
          background: color,
          flex: "0 0 10px",
        }}
      />
      <span style={{ fontWeight: 600 }}>{alliance}</span>
      <span style={{ color: "#cbd5e1", marginLeft: 6 }}>
        {votes.toLocaleString("en-IN")} ({pct.toFixed(2)}%)
      </span>
    </span>
  );
}

/* -------------------------------------------------------
          TIER OPTIONS FOR ANALYSIS
------------------------------------------------------- */
const TIER_OPTIONS = [
  { id: "grama_panchayath", label: "Grama Panchayath (GP)" },
  { id: "block_panchayath", label: "Block Panchayath (BP)" },
  { id: "district_panchayath", label: "District Panchayath (DP)" },
  { id: "Municipality", label: "Municipality" },
  { id: "Corporation", label: "Corporation" },
];

const ANALYSIS_YEARS = [2010, 2015, 2019, 2020, 2024, 2025];

export default function AssemblyAnalysisTab() {
  const [selectedAc, setSelectedAc] = useState<{ acCode: number; name: string } | null>(null);
  const [year, setYear] = useState<number>(2024);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([
    "grama_panchayath",
    "Municipality",
    "Corporation",
  ]);

  const [analysis, setAnalysis] = useState<AssemblyAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"assembly" | "state">("assembly");

  const onSelectAc = (ac: { acCode: number; name: string }) => {
    setSelectedAc(ac);
    setAnalysis(null);
  };

  const toggleTier = (tier: string) =>
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((x) => x !== tier) : [...prev, tier]
    );

  const runAnalysis = async () => {
    if (mode === "assembly" && !selectedAc) {
      return alert("Select an assembly");
    }

    const params = new URLSearchParams();
    params.append("year", String(year));

    if (selectedTiers.length > 0) {
      params.append("includeTypes", selectedTiers.join(","));
    }

    let url = "";

    if (mode === "assembly") {
      params.append("acCode", String(selectedAc!.acCode));
      url = `${backend}/analysis/assembly-by-id?${params.toString()}`;
    } else {
      // STATE MODE
      url = `${backend}/analysis/state?${params.toString()}`;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      setAnalysis(await res.json());
    } catch (err) {
      console.error(err);
      alert("Failed to load analysis");
    } finally {
      setLoading(false);
    }
  };


  /* ===================================================
                      RENDER
  =================================================== */
  return (
    <div style={{ padding: 20, color: "white" }}>
      <h2 style={{ fontSize: 22, marginBottom: 12 }}>Assembly Analysis</h2>

      {/* MODE SWITCH */}
      <div style={{ marginBottom: 12, display: "flex", gap: 12 }}>
        <button
          onClick={() => setMode("assembly")}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            border: mode === "assembly" ? "1px solid #0d6efd" : "1px solid #555",
            background: mode === "assembly" ? "#0d6efd33" : "transparent",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          Assembly
        </button>

        <button
          onClick={() => setMode("state")}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            border: mode === "state" ? "1px solid #0d6efd" : "1px solid #555",
            background: mode === "state" ? "#0d6efd33" : "transparent",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          State
        </button>
      </div>


      {/* ---------- INPUTS GRID ---------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 180px 280px 120px",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ opacity: mode === "state" ? 0.3 : 1, pointerEvents: mode === "state" ? "none" : "auto" }}>
          <AssemblySelector backend={backend} onSelectAc={onSelectAc} />
        </div>


        {/* YEAR Toggle Buttons */}
        <div>
          <label style={{ fontSize: 13, opacity: 0.85 }}>Year</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
            {ANALYSIS_YEARS.map((y) => {
              const active = year === y;
              return (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: active ? "1px solid #0d6efd" : "1px solid #555",
                    background: active ? "#0d6efd33" : "transparent",
                    color: active ? "#fff" : "#ddd",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {y}
                </button>
              );
            })}
          </div>
        </div>

        {/* TIER SELECTOR */}
        <div>
          <label style={{ fontSize: 13, opacity: 0.85 }}>Localbody Types</label>
          <div
            style={{
              marginTop: 6,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
            }}
          >
            {TIER_OPTIONS.map((t) => (
              <label key={t.id} style={{ fontSize: 12, display: "flex", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={selectedTiers.includes(t.id)}
                  onChange={() => toggleTier(t.id)}
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        {/* RUN BUTTON */}
        <div style={{ display: "flex", alignItems: "end" }}>
          <button
            onClick={runAnalysis}
            disabled={(mode === "assembly" && !selectedAc) || loading}
            style={{
              padding: "8px 12px",
              background: loading ? "#444" : "#0d6efd",
              color: "#fff",
              borderRadius: 6,
              border: "none",
              cursor: ((mode === "assembly" && !selectedAc) || loading)
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading ? "Loading…" : "Run Analysis"}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------
                   ANALYSIS OUTPUT
      ------------------------------------------------ */}
      {analysis && (
        <div>
          {/* HEADER CARD */}
          <div style={{ padding: 12, background: "#111827", borderRadius: 8, marginBottom: 20 }}>
            <div style={{ opacity: 0.8 }}>{analysis.district}</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{analysis.acName}</div>
            <div style={{ marginTop: 6 }}>
              <b>Year:</b> {analysis.year} &nbsp;•&nbsp;
              <b>Total Wards:</b> {analysis.totalWards}
            </div>
          </div>

          {/* VOTE SHARE */}
          <h3 style={{ marginBottom: 8 }}>Assembly Vote Share</h3>
          <div style={{ maxWidth: 480 }}>
            <ResponsiveTable>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Alliance</th>
                  <th style={{ textAlign: "right" }}>Votes</th>
                  <th style={{ textAlign: "right" }}>Share</th>
                </tr>
              </thead>
              <tbody>
                {analysis.overallVoteShare.map((v) => (
                  <tr key={v.alliance}>
                    <td>
                      <AllianceBadge alliance={v.alliance} votes={v.votes} pct={v.percentage} />
                    </td>
                    <td style={{ textAlign: "right" }}>{v.votes.toLocaleString("en-IN")}</td>
                    <td style={{ textAlign: "right" }}>{v.percentage.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </ResponsiveTable>
          </div>

          {/* LOCALBODIES TABLE */}
          <h3 style={{ marginTop: 20, marginBottom: 8 }}>Localbodies Considered</h3>
          <ResponsiveTable>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Localbody</th>
                <th style={{ textAlign: "left" }}>Wards</th>
                <th style={{ textAlign: "left" }}>Top Alliances</th>
                <th style={{ textAlign: "left" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {analysis.localbodies.map((lb) => (
                <LocalbodyRow key={lb.localbodyId} lb={lb} wardsAll={analysis.wards} />
              ))}
            </tbody>
          </ResponsiveTable>

          {/* WARDS TABLE */}
          <h3 style={{ marginTop: 20 }}>Wards (All)</h3>
          <ResponsiveTable>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Ward #</th>
                <th style={{ textAlign: "left" }}>Name</th>
                <th style={{ textAlign: "left" }}>Localbody</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th style={{ textAlign: "left" }}>Winner</th>
                <th style={{ textAlign: "right" }}>Margin</th>
                <th style={{ textAlign: "left" }}>Top Alliances</th>
              </tr>
            </thead>
            <tbody>
              {analysis.wards.map((w) => (
                <tr key={w.wardId}>
                  <td style={tdCell}>{w.wardNum}</td>
                  <td style={tdCell}>{w.wardName}</td>
                  <td style={tdCell}>{w.localbodyName}</td>
                  <td style={{ ...tdCell, textAlign: "right" }}>{w.total.toLocaleString("en-IN")}</td>
                  <td style={tdCell}>{w.winner ?? "-"}</td>
                  <td style={{ ...tdCell, textAlign: "right" }}>{w.margin ?? "-"}</td>

                  {/* IMPORTANT: badges are inline-flex, fixed height, wrapped in a flex container */}
                  <td style={tdCell}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      {w.alliances.slice(0, 3).map((a) => (
                        <AllianceBadge key={a.alliance} alliance={a.alliance} votes={a.votes} pct={a.percentage} />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        </div>
      )}
    </div>
  );
}

/* ==========================================================
      LOCALBODY EXPANDABLE ROW
========================================================== */
function LocalbodyRow({ lb, wardsAll }: { lb: LocalbodySummary; wardsAll: WardRow[] }) {
  const [expanded, setExpanded] = useState(false);
  const lbWards = wardsAll.filter((w) => w.localbodyId === lb.localbodyId);

  return (
    <>
      <tr>
        <td style={tdCell}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontWeight: 700 }}>{lb.localbodyName}</div>
            <div style={{ color: "#9ca3af", fontSize: 12 }}>({lb.localbodyType})</div>
          </div>
        </td>

        <td style={tdCell}>{lb.wardsCount}</td>

        <td style={tdCell}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {lb.voteShare.slice(0, 4).map((v) => (
              <AllianceBadge key={v.alliance} alliance={v.alliance} votes={v.votes} pct={v.percentage} />
            ))}
          </div>
        </td>

        <td style={tdCell}>
          <button onClick={() => setExpanded(!expanded)} style={expandButton}>
            {expanded ? "Hide" : "Show"}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={4} style={{ padding: 12 }}>
            <div style={{ background: "#1b2234", padding: 12, borderRadius: 6 }}>
              <h4 style={{ marginBottom: 8 }}>{lb.localbodyName} — Wards</h4>

              <ResponsiveTable>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Ward #</th>
                    <th style={{ textAlign: "left" }}>Name</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                    <th style={{ textAlign: "left" }}>Winner</th>
                    <th style={{ textAlign: "right" }}>Margin</th>
                    <th style={{ textAlign: "left" }}>Top Alliances</th>
                  </tr>
                </thead>
                <tbody>
                  {lbWards.map((w) => (
                    <tr key={w.wardId}>
                      <td style={tdCell}>{w.wardNum}</td>
                      <td style={tdCell}>{w.wardName}</td>
                      <td style={{ ...tdCell, textAlign: "right" }}>{w.total.toLocaleString("en-IN")}</td>
                      <td style={tdCell}>{w.winner ?? "-"}</td>
                      <td style={{ ...tdCell, textAlign: "right" }}>{w.margin ?? "-"}</td>
                      <td style={tdCell}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                          {w.alliances.slice(0, 3).map((a) => (
                            <AllianceBadge key={a.alliance} alliance={a.alliance} votes={a.votes} pct={a.percentage} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </ResponsiveTable>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ==========================================================
      STYLE HELPERS
========================================================== */

const tdCell: React.CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid #1f2937",
  verticalAlign: "middle", // ensures cells align vertically centered
};

const expandButton: React.CSSProperties = {
  padding: "4px 8px",
  background: "transparent",
  color: "white",
  borderRadius: 6,
  border: "1px solid #374151",
  fontSize: 12,
  cursor: "pointer",
};

function ResponsiveTable({ children }: any) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          marginBottom: 20,
        }}
      >
        {children}
      </table>
      <style>{`
        /* force vertical alignment & consistent padding for headers/cells */
        table th, table td { vertical-align: middle; padding: 8px 12px; }
        table thead th { color: #e6edf3; font-weight: 600; text-align: left; }
        table tbody td { color: #e6edf3; }
      `}</style>
    </div>
  );
}
