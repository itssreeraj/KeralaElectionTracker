"use client";

import { getConfig } from "@/config/env";

import React, { useState } from "react";
import AssemblySelector from "./AssemblySelector";
import DistrictSelector from "./DistrictSelector";
import { LOCALBODY_ELECTION_YEARS as ANALYSIS_YEARS } from "../lib/constants";

/* ===================== DTO TYPES ===================== */
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

type AnalysisResponse = {
  scope: "ASSEMBLY" | "DISTRICT" | "STATE";
  scopeName: string;
  year: number;
  totalWards: number;
  overallVoteShare: AllianceVoteShare[];
  localbodies: LocalbodySummary[];
  wards: WardRow[];
};

const config = getConfig();
const backend =
  `${config.apiBase}` || "http://localhost:8080/api";


/* ===================== CONSTANTS ===================== */


const TIER_OPTIONS = [
  { id: "grama_panchayath", label: "Grama Panchayath (GP)" },
  { id: "block_panchayath", label: "Block Panchayath (BP)" },
  { id: "district_panchayath", label: "District Panchayath (DP)" },
  { id: "Municipality", label: "Municipality" },
  { id: "Corporation", label: "Corporation" },
];

const ALLIANCE_COLORS: Record<string, string> = {
  LDF: "#e11d48",
  UDF: "#2563eb",
  NDA: "#facc15",
  SDPI: "#16a34a",
  IND: "#9ca3af",
  OTH: "#6b7280",
};

/* ===================== SHARED TABLE STYLES ===================== */
const tdCell: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #1f2937",
  verticalAlign: "top",
};

const thCell: React.CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid #1f2937",
  textAlign: "left",
  fontWeight: 600,
  color: "#e5e7eb",
  whiteSpace: "nowrap",
};

/* ===================== BADGE ===================== */
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
        gap: 6,
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
        }}
      />
      <b>{alliance}</b>
      <span style={{ opacity: 0.8 }}>
        {votes.toLocaleString("en-IN")} ({pct.toFixed(2)}%)
      </span>
    </span>
  );
}

/* =====================================================
                    MAIN COMPONENT
===================================================== */
export default function LocalbodyAggregationAnalysisTab() {
  const [mode, setMode] = useState<"assembly" | "district" | "state">(
    "assembly"
  );

  const [selectedAc, setSelectedAc] =
    useState<{ acCode: number; name: string } | null>(null);

  const [selectedDistrict, setSelectedDistrict] =
    useState<{ districtCode: number; name: string } | null>(null);

  const [year, setYear] = useState(2025);

  const [selectedTiers, setSelectedTiers] = useState<string[]>([
    "grama_panchayath",
    "Municipality",
    "Corporation",
  ]);

  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [showAssemblyOverview, setShowAssemblyOverview] = useState(true);
  const [assemblyOverview, setAssemblyOverview] = useState<any | null>(null);

  const toggleTier = (tier: string) =>
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );

  const canRun =
    !loading &&
    ((mode === "assembly" && selectedAc) ||
      (mode === "district" && selectedDistrict) ||
      mode === "state");

  const runAnalysis = async () => {
    const params = new URLSearchParams();
    params.append("year", String(year));
    params.append("includeTypes", selectedTiers.join(","));

    let url = "";
    if (mode === "assembly") {
      params.append("acCode", String(selectedAc!.acCode));
      url = `${backend}/v1/public/analysis/assembly-by-id`;
    } else if (mode === "district") {
      params.append("districtCode", String(selectedDistrict!.districtCode));
      url = `${backend}/v1/public/analysis/district`;
    } else {
      url = `${backend}/v1/public/analysis/state`;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const res = await fetch(`${url}?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      setAnalysis(await res.json());
    } finally {
      setLoading(false);
    }

    const overviewParams = new URLSearchParams();
    overviewParams.append("year", String(year));
    overviewParams.append("includeTypes", selectedTiers.join(","));

    if (selectedDistrict) {
      overviewParams.append("districtCode", String(selectedDistrict.districtCode));
    }

    const overviewRes = await fetch(
      `${backend}/v1/public/analysis/assembly-overview?${overviewParams.toString()}`
    );

    setAssemblyOverview(await overviewRes.json());

  };

  
  /* ===================== RENDER ===================== */
  return (
    <div style={{ padding: 20, color: "white" }}>
      <h2 style={{ fontSize: 22, marginBottom: 12 }}>Localbody Aggregation Analysis</h2>
      <p style={{ marginBottom: 20, opacity: 0.8, fontSize: 14 }}>
        Analyze localbody election results aggregated at assembly, district, or state level.
      </p>

      {/* MODE SWITCH */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {["assembly", "district", "state"].map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m as any);
              setAnalysis(null);
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border:
                mode === m ? "1px solid #0d6efd" : "1px solid #555",
              background: mode === m ? "#0d6efd33" : "transparent",
              color: "#fff",
            }}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* INPUTS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 260px 140px",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            opacity: mode === "assembly" ? 1 : 0.3,
            pointerEvents: mode === "assembly" ? "auto" : "none",
          }}
        >
          <AssemblySelector backend={backend} onSelectAc={setSelectedAc} />
        </div>

        <div
          style={{
            opacity: mode === "district" ? 1 : 0.3,
            pointerEvents: mode === "district" ? "auto" : "none",
          }}
        >
          <DistrictSelector
            backend={backend}
            onSelectDistrict={setSelectedDistrict}
          />
        </div>

        <div>
          <label>Year</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {ANALYSIS_YEARS.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border:
                    year === y ? "1px solid #0d6efd" : "1px solid #555",
                  background:
                    year === y ? "#0d6efd33" : "transparent",
                  color: "#fff",
                  fontSize: 12,
                }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={runAnalysis}
          disabled={!canRun}
          style={{
            alignSelf: "end",
            padding: "8px 12px",
            background: canRun ? "#0d6efd" : "#444",
            color: "#fff",
            border: "none",
            borderRadius: 6,
          }}
        >
          {loading ? "Loading…" : "Run Analysis"}
        </button>
      </div>

      {/* TYPES */}
      <div style={{ marginBottom: 20 }}>
        {TIER_OPTIONS.map((t) => (
          <label key={t.id} style={{ marginRight: 12 }}>
            <input
              type="checkbox"
              checked={selectedTiers.includes(t.id)}
              onChange={() => toggleTier(t.id)}
            />{" "}
            {t.label}
          </label>
        ))}
      </div>

      {/* ===================== OUTPUT ===================== */}
      {analysis && (
        <>
          {/* HEADER */}
          <div
            style={{
              background: "#111827",
              padding: 14,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            {/* DISTRICT / STATE */}
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#93c5fd",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 4,
              }}
            >
              {analysis.scope === "STATE"
                ? "Kerala"
                : analysis.scopeName?.startsWith("District")
                ? analysis.scopeName
                : selectedDistrict?.name ?? "—"}
            </div>

            {/* SCOPE NAME (Assembly / District / State) */}
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              {analysis.scopeName}
            </div>

            {/* META */}
            <div
              style={{
                fontSize: 13,
                opacity: 0.85,
              }}
            >
              Year: {analysis.year} &nbsp;•&nbsp; Wards: {analysis.totalWards}
            </div>
          </div>


          {/* OVERALL VOTE SHARE */}
          <h3>Overall Vote Share</h3>
          <ResponsiveTable>
            <tbody>
              {analysis.overallVoteShare.map((v) => (
                <tr key={v.alliance}>
                  <td>
                    <AllianceBadge
                      alliance={v.alliance}
                      votes={v.votes}
                      pct={v.percentage}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>

          <h3 style={{ marginTop: 20 }}>Localbody-wise Vote Share</h3>
          <ResponsiveTable>
            <thead>
              <tr>
                <th style={thCell}>Localbody</th>
                <th style={thCell}>Type</th>
                <th style={{ ...thCell, textAlign: "right", width: 60 }}>Wards</th>
                <th style={thCell}>Alliance Performance</th>
              </tr>
            </thead>

            <tbody>
              {analysis.localbodies.map((lb) => (
                <LocalbodyRow
                  key={lb.localbodyId}
                  lb={lb}
                  wardsAll={analysis.wards}
                />
              ))}
            </tbody>
          </ResponsiveTable>
        </>
      )}

      {assemblyOverview && (
        <>
          <h3>Assembly-wise Overview</h3>
          <ResponsiveTable>
            <thead>
              <tr>
                <th style={thCell}>Assembly</th>
                <th style={thCell}>Wards</th>
                <th style={thCell}>Vote Share</th>
                <th style={thCell}>Winner</th>
                <th style={thCell}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {assemblyOverview.assemblies.map((ac: any) => (
                <tr key={ac.acCode}>
                  <td style={tdCell}>{ac.acName}</td>
                  <td style={tdCell}>{ac.totalWards}</td>
                  <td style={tdCell}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {ac.voteShare.map((v: any) => (
                        <AllianceBadge
                          key={v.alliance}
                          alliance={v.alliance}
                          votes={v.votes}
                          pct={v.percentage}
                        />
                      ))}
                    </div>
                  </td>
                  <td style={tdCell}><b>{ac.winner}</b></td>
                  <td style={tdCell}>{ac.margin ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </ResponsiveTable>
        </>
      )}

    </div>
  );
}

/* ===================== LOCALBODY ROW ===================== */
function LocalbodyRow({
  lb,
  wardsAll,
}: {
  lb: LocalbodySummary;
  wardsAll: WardRow[];
}) {
  const [expanded, setExpanded] = useState(false);
  const lbWards = wardsAll.filter((w) => w.localbodyId === lb.localbodyId);

  return (
    <>
      <tr>
        <td style={tdCell}>
          <b>{lb.localbodyName}</b>
        </td>

        <td style={tdCell}>{lb.localbodyType ?? "-"}</td>

        <td style={{ ...tdCell, textAlign: "right" }}>{lb.wardsCount}</td>

        <td style={tdCell}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center", overflowX: "auto", flex: 1 }}>
              {lb.voteShare.map((v) => (
                <div
                  key={v.alliance}
                  style={{ minWidth: 140, display: "flex", alignItems: "center" }}
                >
                  <AllianceBadge
                    alliance={v.alliance}
                    votes={v.votes}
                    pct={v.percentage}
                  />
                </div>
              ))}
            </div>

            <div style={{ flex: "0 0 auto" }}>
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: expanded ? "#374151" : "#0d6efd",
                  color: "#fff",
                  border: "none",
                }}
              >
                {expanded ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </td>
      </tr>

      {expanded &&
        lbWards.map((w) => (
          <tr key={w.wardId}>
            <td colSpan={4} style={tdCell}>
              {w.wardNum}. {w.wardName} — <b>{w.winner ?? "-"}</b> ({w.total})
              <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                {w.alliances.map((a) => (
                  <AllianceBadge
                    key={a.alliance}
                    alliance={a.alliance}
                    votes={a.votes}
                    pct={a.percentage}
                  />
                ))}
              </div>
            </td>
          </tr>
        ))}
    </>
  );
}

/* ===================== TABLE ===================== */
function ResponsiveTable({ children }: any) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        marginBottom: 20,
      }}
    >
      {children}
    </table>
  );
}
