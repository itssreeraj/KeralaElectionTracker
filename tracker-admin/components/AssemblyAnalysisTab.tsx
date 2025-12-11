"use client";

import React, { useState } from "react";
import AssemblySelector from "./AssemblySelector";

/* ===================== TYPES ===================== */

type AllianceVoteShare = {
  alliance: string;
  votes: number;
  percentage: number;
};

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
  wardPerformance: {
    alliance: string;
    winner: number;
    runnerUp: number;
    third: number;
  }[];
};

type AssemblyAnalysisResponse = {
  acId: number;
  acName: string;
  district: string;
  year: number;
  totalWards: number;
  overallVoteShare: AllianceVoteShare[];
  localbodies: LocalbodySummary[];
  wards: WardRow[];
};

/* ===================== CONSTANTS ===================== */

const backend =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.85,
};

const boxStyle: React.CSSProperties = {
  padding: 12,
  background: "#111827",
  borderRadius: 8,
  border: "1px solid #1f2937",
};

const th: React.CSSProperties = {
  padding: 6,
  textAlign: "left",
  borderBottom: "1px solid #1f2937",
};

const thRight: React.CSSProperties = {
  padding: 6,
  textAlign: "right",
  borderBottom: "1px solid #1f2937",
};

const td: React.CSSProperties = {
  padding: 6,
  borderBottom: "1px solid #1f2937",
};

const tdRight: React.CSSProperties = {
  padding: 6,
  textAlign: "right",
  borderBottom: "1px solid #1f2937",
};

/* ===================== MAIN COMPONENT ===================== */

export default function AssemblyAnalysisTab() {
  const [selectedAc, setSelectedAc] = useState<{ acCode: number; name: string } | null>(null);
  const [year, setYear] = useState<number>(2024);
  const [analysis, setAnalysis] = useState<AssemblyAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const onSelectAc = (ac: { acCode: number; name: string }) => {
    setSelectedAc(ac);
    setAnalysis(null);
  };

  /* ============ RUN ANALYSIS ============ */
  const runAnalysis = async () => {
    if (!selectedAc) {
      alert("Select an assembly first");
      return;
    }

    const url = `${backend}/analysis/assembly-by-id?acCode=${selectedAc.acCode}&year=${year}`;
    setLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load assembly analysis");
      const data = (await res.json()) as AssemblyAnalysisResponse;
      setAnalysis(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load analysis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, color: "white" }}>
      <h2 style={{ fontSize: 22, marginBottom: 16 }}>Assembly Constituency Analysis</h2>

      {/* ===================== TOP FILTERS ===================== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 200px 140px",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <AssemblySelector backend={backend} onSelectAc={onSelectAc} />

        {/* Year */}
        <div>
          <label style={labelStyle}>Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{
              width: "100%",
              padding: "6px 8px",
              marginTop: 6,
              borderRadius: 6,
              border: "1px solid #374151",
              background: "#020617",
              color: "#f9fafb",
            }}
          />
        </div>

        {/* Run Button */}
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            onClick={runAnalysis}
            disabled={!selectedAc || loading}
            style={{
              padding: "8px 12px",
              background: loading ? "#444" : "#0d6efd",
              color: "#fff",
              borderRadius: 6,
              border: "none",
              cursor: !selectedAc || loading ? "not-allowed" : "pointer",
              width: "100%",
            }}
          >
            {loading ? "Loading…" : "Run Analysis"}
          </button>
        </div>
      </div>

      {/* ===================== ANALYSIS SECTION ===================== */}
      {analysis && <AssemblyAnalysisResult analysis={analysis} />}
    </div>
  );
}

/* ============================================================
    COMPONENT: AssemblyAnalysisResult
   ============================================================ */

function AssemblyAnalysisResult({ analysis }: { analysis: AssemblyAnalysisResponse }) {
  return (
    <div>
      {/* ===================== HEADER ===================== */}
      <div style={{ ...boxStyle, marginBottom: 20 }}>
        <div style={{ fontSize: 13, opacity: 0.85 }}>{analysis.district}</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{analysis.acName}</div>
        <div style={{ marginTop: 8 }}>
          <strong>Year:</strong> {analysis.year} &nbsp; • &nbsp;
          <strong>Total Wards:</strong> {analysis.totalWards}
        </div>
      </div>

      {/* ===================== OVERALL VOTE SHARE ===================== */}
      <h3 style={{ marginBottom: 8 }}>Assembly Vote Share</h3>
      <div style={{ marginBottom: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={th}>Alliance</th>
              <th style={thRight}>Votes</th>
              <th style={thRight}>Share</th>
            </tr>
          </thead>
          <tbody>
            {analysis.overallVoteShare
              .slice()
              .sort((a, b) => b.votes - a.votes)
              .map((r) => (
                <tr key={r.alliance}>
                  <td style={td}>{r.alliance}</td>
                  <td style={tdRight}>{r.votes.toLocaleString("en-IN")}</td>
                  <td style={tdRight}>{r.percentage.toFixed(2)}%</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ===================== LOCALBODY SUMMARY ===================== */}
      <LocalbodySummaryTable analysis={analysis} />

      {/* ===================== FLAT WARDS TABLE ===================== */}
      <FlatWardTable wards={analysis.wards} />
    </div>
  );
}

/* ============================================================
    COMPONENT: LocalbodySummaryTable
   ============================================================ */

function LocalbodySummaryTable({ analysis }: { analysis: AssemblyAnalysisResponse }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <h3 style={{ marginBottom: 8 }}>Localbodies inside Assembly</h3>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 800 }}>
          <thead>
            <tr>
              <th style={th}>Localbody</th>
              <th style={thRight}>Wards</th>
              <th style={thRight}>Top Alliances (Votes)</th>
              <th style={th}>Details</th>
            </tr>
          </thead>
          <tbody>
            {analysis.localbodies.map((lb) => (
              <LocalbodyRow key={lb.localbodyId} lb={lb} wardsAll={analysis.wards} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
    COMPONENT: LocalbodyRow (Expandable)
   ============================================================ */

function LocalbodyRow({ lb, wardsAll }: { lb: LocalbodySummary; wardsAll: WardRow[] }) {
  const [open, setOpen] = useState(false);
  const lbWards = wardsAll.filter((w) => w.localbodyId === lb.localbodyId);

  const top = lb.voteShare
    .slice()
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 3)
    .map((v) => `${v.alliance} ${v.votes.toLocaleString("en-IN")} (${v.percentage.toFixed(2)}%)`)
    .join(" • ");

  return (
    <>
      <tr>
        <td style={td}>
          {lb.localbodyName}{" "}
          <span style={{ opacity: 0.6 }}>({lb.localbodyType})</span>
        </td>
        <td style={tdRight}>{lb.wardsCount}</td>
        <td style={tdRight}>{top}</td>
        <td style={td}>
          <button
            onClick={() => setOpen((x) => !x)}
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              background: open ? "#0d6efd33" : "transparent",
              border: "1px solid #475569",
              color: "white",
              cursor: "pointer",
            }}
          >
            {open ? "Hide" : "Show"}
          </button>
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={4} style={{ padding: 10 }}>
            <WardTableForLocalbody lbName={lb.localbodyName} wards={lbWards} />
          </td>
        </tr>
      )}
    </>
  );
}

/* ============================================================
    COMPONENT: WardTableForLocalbody
   ============================================================ */

function WardTableForLocalbody({ lbName, wards }: { lbName: string; wards: WardRow[] }) {
  return (
    <div style={{ ...boxStyle, padding: 12 }}>
      <div style={{ marginBottom: 8, fontWeight: 600 }}>{lbName} — Wards</div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={th}>Ward #</th>
              <th style={th}>Ward Name</th>
              <th style={thRight}>Total</th>
              <th style={th}>Winner</th>
              <th style={thRight}>Margin</th>
              <th style={th}>Top Alliances</th>
            </tr>
          </thead>
          <tbody>
            {wards.map((w) => {
              const top = w.alliances
                .slice(0, 3)
                .map((a) => `${a.alliance} ${a.votes.toLocaleString("en-IN")} (${a.percentage.toFixed(2)}%)`)
                .join(", ");

              return (
                <tr key={w.wardId}>
                  <td style={td}>{w.wardNum}</td>
                  <td style={td}>{w.wardName}</td>
                  <td style={tdRight}>{w.total.toLocaleString("en-IN")}</td>
                  <td style={td}>{w.winner ?? "-"}</td>
                  <td style={tdRight}>{w.margin ?? "-"}</td>
                  <td style={td}>{top}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
    COMPONENT: FlatWardTable
   ============================================================ */

function FlatWardTable({ wards }: { wards: WardRow[] }) {
  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ marginBottom: 8 }}>Wards (Complete List)</h3>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 1000 }}>
          <thead>
            <tr>
              <th style={th}>Ward #</th>
              <th style={th}>Ward Name</th>
              <th style={th}>Localbody</th>
              <th style={thRight}>Total</th>
              <th style={th}>Winner</th>
              <th style={thRight}>Margin</th>
              <th style={th}>Top Alliances</th>
            </tr>
          </thead>

          <tbody>
            {wards.map((w) => {
              const top = w.alliances
                .slice(0, 3)
                .map((a) => `${a.alliance} ${a.votes.toLocaleString("en-IN")} (${a.percentage.toFixed(2)}%)`)
                .join(", ");

              return (
                <tr key={w.wardId}>
                  <td style={td}>{w.wardNum}</td>
                  <td style={td}>{w.wardName}</td>
                  <td style={td}>{w.localbodyName}</td>
                  <td style={tdRight}>{w.total.toLocaleString("en-IN")}</td>
                  <td style={td}>{w.winner ?? "-"}</td>
                  <td style={tdRight}>{w.margin ?? "-"}</td>
                  <td style={td}>{top}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
