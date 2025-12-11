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

export default function AssemblyAnalysisTab() {
  /* ------------------ STATE ------------------ */
  const [selectedAc, setSelectedAc] = useState<{ acCode: number; name: string } | null>(null);
  const [year, setYear] = useState<number>(2024);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([
    "grama_panchayath",
    "Municipality",
    "Corporation",
  ]);

  const [analysis, setAnalysis] = useState<AssemblyAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);

  /* ------------------ AC Selection ------------------ */
  const onSelectAc = (ac: { acCode: number; name: string }) => {
    setSelectedAc(ac);
    setAnalysis(null);
  };

  /* ------------------ Toggle Tier ------------------ */
  const toggleTier = (tier: string) => {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((x) => x !== tier) : [...prev, tier]
    );
  };

  /* ------------------ Run Analysis ------------------ */
  const runAnalysis = async () => {
    if (!selectedAc) return alert("Select an assembly");

    const params = new URLSearchParams({
      acCode: String(selectedAc.acCode),
      year: String(year),
    });

    if (selectedTiers.length > 0) {
      params.append("includeTypes", selectedTiers.join(","));
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch(`${backend}/analysis/assembly-by-id?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      console.error(e);
      alert("Failed to load assembly analysis");
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

      {/* ---------- INPUTS GRID ---------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 140px 280px 140px",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* AC SELECTOR */}
        <AssemblySelector backend={backend} onSelectAc={onSelectAc} />

        {/* YEAR */}
        <div>
          <label style={{ fontSize: 13, opacity: 0.85 }}>Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={smallInput}
          />
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
              <label
                key={t.id}
                style={{ display: "flex", alignItems: "center", fontSize: 12, gap: 6 }}
              >
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
            disabled={!selectedAc || loading}
            style={{
              padding: "8px 12px",
              background: loading ? "#444" : "#0d6efd",
              color: "white",
              borderRadius: 6,
              border: "none",
              cursor: !selectedAc || loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Loading…" : "Run"}
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
          <ResponsiveTable>
            <thead>
              <tr>
                <th>Alliance</th>
                <th style={{ textAlign: "right" }}>Votes</th>
                <th style={{ textAlign: "right" }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {analysis.overallVoteShare.map((v) => (
                <tr key={v.alliance}>
                  <td>{v.alliance}</td>
                  <td style={{ textAlign: "right" }}>{v.votes.toLocaleString("en-IN")}</td>
                  <td style={{ textAlign: "right" }}>{v.percentage.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>

          {/* LOCALBODIES TABLE */}
          <h3 style={{ marginTop: 20, marginBottom: 8 }}>Localbodies Considered</h3>
          <ResponsiveTable>
            <thead>
              <tr>
                <th>Localbody</th>
                <th style={{ textAlign: "center" }}>Wards</th>
                <th style={{ textAlign: "right" }}>Top Alliances</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {analysis.localbodies.map((lb) => (
                <LocalbodyRow key={lb.localbodyId} lb={lb} wardsAll={analysis.wards} />
              ))}
            </tbody>
          </ResponsiveTable>

          {/* WARD TABLE (FLAT) */}
          <h3 style={{ marginTop: 20 }}>Wards (All)</h3>
          <ResponsiveTable>
            <thead>
              <tr>
                <th>Ward #</th>
                <th>Name</th>
                <th>Localbody</th>
                <th style={{ textAlign: "right" }}>Total</th>
                <th>Winner</th>
                <th style={{ textAlign: "right" }}>Margin</th>
                <th>Top Alliances</th>
              </tr>
            </thead>
            <tbody>
              {analysis.wards.map((w) => {
                const top = w.alliances
                  .slice(0, 3)
                  .map(
                    (a) => `${a.alliance} ${a.votes.toLocaleString("en-IN")} (${a.percentage.toFixed(2)}%)`
                  )
                  .join(", ");

                return (
                  <tr key={w.wardId}>
                    <td>{w.wardNum}</td>
                    <td>{w.wardName}</td>
                    <td>{w.localbodyName}</td>
                    <td style={{ textAlign: "right" }}>{w.total.toLocaleString("en-IN")}</td>
                    <td>{w.winner ?? "-"}</td>
                    <td style={{ textAlign: "right" }}>{w.margin ?? "-"}</td>
                    <td>{top}</td>
                  </tr>
                );
              })}
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
  const lbWards = wardsAll.filter((w) => w.localbodyId == lb.localbodyId);

  return (
    <>
      <tr>
        <td>
          {lb.localbodyName}
          <span style={{ color: "#999", marginLeft: 6 }}>({lb.localbodyType})</span>
        </td>
        <td style={{ textAlign: "center" }}>{lb.wardsCount}</td>
        <td style={{ textAlign: "right" }}>
          {lb.voteShare
            .slice(0, 4)
            .map((v) => `${v.alliance} ${v.votes.toLocaleString("en-IN")} (${v.percentage.toFixed(2)}%)`)
            .join(" • ")}
        </td>
        <td>
          <button
            onClick={() => setExpanded((prev) => !prev)}
            style={expandButton}
          >
            {expanded ? "Hide" : "Show"}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={4} style={{ padding: 10 }}>
            <div style={{ background: "#1b2234", padding: 8, borderRadius: 6 }}>
              <h4 style={{ marginBottom: 8 }}>{lb.localbodyName} — Wards</h4>

              <ResponsiveTable>
                <thead>
                  <tr>
                    <th>Ward #</th>
                    <th>Name</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                    <th>Winner</th>
                    <th style={{ textAlign: "right" }}>Margin</th>
                    <th>Top Alliances</th>
                  </tr>
                </thead>
                <tbody>
                  {lbWards.map((w) => {
                    const top = w.alliances
                      .slice(0, 3)
                      .map(
                        (a) =>
                          `${a.alliance} ${a.votes.toLocaleString("en-IN")} (${a.percentage.toFixed(2)}%)`
                      )
                      .join(", ");
                    return (
                      <tr key={w.wardId}>
                        <td>{w.wardNum}</td>
                        <td>{w.wardName}</td>
                        <td style={{ textAlign: "right" }}>{w.total.toLocaleString("en-IN")}</td>
                        <td>{w.winner ?? "-"}</td>
                        <td style={{ textAlign: "right" }}>{w.margin ?? "-"}</td>
                        <td>{top}</td>
                      </tr>
                    );
                  })}
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
      SMALL STYLE HELPERS
   ========================================================== */

const smallInput: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  marginTop: 6,
  borderRadius: 6,
  border: "1px solid #374151",
  background: "#020617",
  color: "#f9fafb",
  fontSize: 14,
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
    </div>
  );
}
