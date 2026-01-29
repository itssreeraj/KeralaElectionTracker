"use client";

import { getConfig } from "@/config/env";

import React, { useEffect, useState } from "react";
import { LOCALBODY_ELECTION_YEARS as ANALYSIS_YEARS } from "../lib/constants";

/* ======= Shared Styles ======= */

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.85,
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  marginTop: 4,
  borderRadius: 6,
  border: "1px solid #374151",
  background: "#020617",
  color: "#f9fafb",
  fontSize: 14,
};

const LOCALBODY_TYPES = [
  { value: "", label: "All Types" },
  { value: "Municipality", label: "Municipality" },
  { value: "Corporation", label: "Corporation" },
  { value: "grama_panchayath", label: "Grama Panchayath" },
  { value: "block_panchayath", label: "Block Panchayath" },
  { value: "district_panchayath", label: "District Panchayath" },
];

/* ======= TYPES ======= */

type AllianceBreakdown = {
  localbodyId: number;
  localbodyName: string;
  wardsWon: number;
  wardsWinnable: number;
  boothsWon: number | null;
  boothsWinnable: number | null;

  // NEW back-end fields
  totalWards: number;
  majorityNeeded: number;
  verdict: string; // "MAJORITY", "POSSIBLE_WITH_SWING", "HARD"
};

type AllianceAnalysisResponse = {
  district: string;
  type: string;
  alliance: string;
  year: number;
  swingPercent: number;
  localbodyCount: number;
  wardsWon: number;
  wardsWinnable: number;
  boothsWon: number | null;
  boothsWinnable: number | null;
  breakdown: AllianceBreakdown[];
};

type AllianceVoteDetail = {
  alliance: string;
  votes: number;
  percentage: number;
};

type WardDetailRow = {
  wardNum: number;
  wardName: string;
  alliances: AllianceVoteDetail[];
  totalVotes: number;
  winnerAlliance: string | null;
  marginVotes: number | null;
  winnable: boolean;
  gapPercent: number | null;
};

type LocalbodyWardDetailsResponse = {
  localbodyId: number;
  localbodyName: string;
  year: number;
  totalWards: number;
  majorityNeeded: number;
  wards: WardDetailRow[];
};

/* ======= SMALL STYLE HELPERS ======= */

const thCell: React.CSSProperties = {
  borderBottom: "1px solid #374151",
  padding: 6,
  textAlign: "center",
  fontWeight: 500,
};

const thCellLeft: React.CSSProperties = {
  ...thCell,
  textAlign: "left",
};

const tdCell: React.CSSProperties = {
  padding: 6,
  borderBottom: "1px solid #111827",
  textAlign: "center",
  fontVariantNumeric: "tabular-nums",
};

const tdCellLeft: React.CSSProperties = {
  ...tdCell,
  textAlign: "left",
};

const summaryBoxStyle: React.CSSProperties = {
  background: "#111827",
  border: "1px solid #2f3b4a",
  borderRadius: 8,
  padding: "10px 14px",
  minWidth: 120,
  textAlign: "center",
};

const summaryLabel: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  opacity: 0.75,
};

const summaryValue: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
};

/* ======= BADGES ======= */

function VerdictBadge({ verdict }: { verdict: string }) {
  const key = verdict?.toUpperCase() || "";

  let color = "#4b5563";
  let text = "UNKNOWN";

  if (key === "MAJORITY") {
    color = "#16a34a";
    text = "MAJORITY";
  } else if (key === "POSSIBLE_WITH_SWING") {
    color = "#f59e0b";
    text = "POSSIBLE WITH SWING";
  } else if (key === "HARD") {
    color = "#dc2626";
    text = "HARD";
  }

  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: color + "33",
        border: `1px solid ${color}`,
        color,
      }}
    >
      {text}
    </span>
  );
}

type WardStatus = "WON" | "WINNABLE" | "HARD";

function WardStatusBadge({ status }: { status: WardStatus }) {
  let color = "#4b5563";
  let label = status;

  if (status === "WON") {
    color = "#16a34a";
    label = "WON";
  } else if (status === "WINNABLE") {
    color = "#f59e0b";
    label = "WINNABLE";
  } else if (status === "HARD") {
    color = "#dc2626";
    label = "HARD";
  }

  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        background: color + "33",
        border: `1px solid ${color}`,
        color,
      }}
    >
      {label}
    </span>
  );
}

/* ========= MAIN TAB ========= */

export default function LocalbodySwingAnalysisTab() {
  const config = getConfig();
  const backend =
    `${config.apiBase}` || "http://localhost:3000/api";

  const [districts, setDistricts] = useState<any[]>([]);
  const [localbodies, setLocalbodies] = useState<any[]>([]);
  const [alliances, setAlliances] = useState<any[]>([]);

  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | null>(null);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("");

  const [selectedType, setSelectedType] = useState("");
  const [selectedLocalbody, setSelectedLocalbody] = useState("");

  const [selectedAlliance, setSelectedAlliance] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [swing, setSwing] = useState<number>(10);

  const [loadingLB, setLoadingLB] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const [analysis, setAnalysis] = useState<AllianceAnalysisResponse | null>(null);

  /* Load districts */
  useEffect(() => {
    fetch(`${backend}/v1/public/districts`)
      .then((r) => r.json())
      .then((data) => setDistricts(Array.isArray(data) ? data : []));
  }, [backend]);

  /* Load alliances */
  useEffect(() => {
    fetch(`${backend}/v1/public/alliances`)
      .then((r) => r.json())
      .then((data) => setAlliances(Array.isArray(data) ? data : []));
  }, []);

  /* Load localbodies on district/type change */
  useEffect(() => {
    if (!selectedDistrictCode || !selectedDistrictName) {
      setLocalbodies([]);
      return;
    }

    const load = async () => {
      setLoadingLB(true);
      try {
        const res = await fetch(
          `${backend}/v1/public/localbodies/by-district?name=${encodeURIComponent(
            selectedDistrictName
          )}`
        );
        const list = await res.json();
        let lbList = Array.isArray(list) ? list : [];

        if (selectedType) {
          lbList = lbList.filter(
            (lb: any) => lb.type.toLowerCase() === selectedType.toLowerCase()
          );
        }

        setLocalbodies(lbList);
      } finally {
        setLoadingLB(false);
      }
    };

    load();
  }, [backend, selectedDistrictCode, selectedDistrictName, selectedType]);

  /* Year toggle */
  const toggleYear = (year: number) => {
    setSelectedYear((prev) => (prev === year ? null : year));
    setAnalysis(null);
  };

  /* Run Alliance Analysis */
  const runAnalysis = async () => {
    if (!selectedDistrictCode || !selectedAlliance || !selectedYear) {
      alert("Please fill all required fields");
      return;
    }

    const params = new URLSearchParams({
      district: String(selectedDistrictCode),
      type: selectedType || "",
      alliance: selectedAlliance,
      year: String(selectedYear),
      swing: String(swing),
    });

    if (selectedLocalbody) params.append("localbodyId", selectedLocalbody);

    const url = `${backend}/v1/public/localbody/analysis/alliance?${params.toString()}`;
    console.log("Calling:", url);

    setLoadingAnalysis(true);
    setAnalysis(null);
    try {
      const res = await fetch(url);
      const data = (await res.json()) as AllianceAnalysisResponse;
      console.log("Alliance Analysis Response:", data);
      setAnalysis(data);
    } catch (err) {
      console.error("Error running analysis:", err);
      alert("Failed to run analysis");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <div style={{ padding: 20, color: "white" }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>
        Alliance-Based Analysis
      </h2>
      <p style={{ marginBottom: 20, opacity: 0.8, fontSize: 14 }}>
        A swing-based performance analysis of the alliance, utilizing local body election results to project how shifts in voter sentiment impact seat viability
      </p>

      {/* FILTER GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* District */}
        <div>
          <label style={labelStyle}>District</label>
          <select
            value={selectedDistrictCode ?? ""}
            onChange={(e) => {
              const code = Number(e.target.value || "0");
              if (!code) {
                setSelectedDistrictCode(null);
                setSelectedDistrictName("");
                setSelectedLocalbody("");
                setAnalysis(null);
                return;
              }
              setSelectedDistrictCode(code);
              const dist = districts.find((d) => d.districtCode === code);
              setSelectedDistrictName(dist?.name || "");
              setSelectedLocalbody("");
              setAnalysis(null);
            }}
            style={selectStyle}
          >
            <option value="">Select District</option>
            {districts.map((d) => (
              <option key={d.districtCode} value={d.districtCode}>
                {d.districtCode} - {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Localbody Type */}
        <div>
          <label style={labelStyle}>Localbody Type</label>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setSelectedLocalbody("");
              setAnalysis(null);
            }}
            style={selectStyle}
          >
            {LOCALBODY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Localbody */}
        <div>
          <label style={labelStyle}>Localbody</label>
          {loadingLB ? (
            <div style={{ marginTop: 6 }}>Loading…</div>
          ) : (
            <select
              value={selectedLocalbody}
              onChange={(e) => {
                setSelectedLocalbody(e.target.value);
                setAnalysis(null);
              }}
              style={selectStyle}
            >
              <option value="">All Localbodies</option>
              {localbodies.map((lb) => (
                <option key={lb.id} value={lb.id}>
                  {lb.name} ({lb.type})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Alliance */}
        <div>
          <label style={labelStyle}>Alliance</label>
          <select
            value={selectedAlliance}
            onChange={(e) => {
              setSelectedAlliance(e.target.value);
              setAnalysis(null);
            }}
            style={selectStyle}
          >
            <option value="">Select Alliance</option>
            {alliances.map((a) => (
              <option key={a.code} value={a.code}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Swing */}
        <div>
          <label style={labelStyle}>Swing %</label>
          <input
            type="number"
            value={swing}
            min={0}
            max={50}
            onChange={(e) => setSwing(Number(e.target.value))}
            style={selectStyle}
            placeholder="Default 10"
          />
        </div>

        {/* Year buttons */}
        <div>
          <label style={labelStyle}>Election Year</label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 6,
            }}
          >
            {ANALYSIS_YEARS.map((y) => {
              const active = selectedYear === y;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => toggleYear(y)}
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
      </div>

      {/* Run Button */}
      <button
        onClick={runAnalysis}
        disabled={loadingAnalysis}
        style={{
          padding: "10px 18px",
          background: loadingAnalysis ? "#4b5563" : "#2563eb",
          borderRadius: 6,
          fontWeight: 600,
          color: "white",
          border: "1px solid #1d4ed8",
          cursor: loadingAnalysis ? "not-allowed" : "pointer",
        }}
      >
        {loadingAnalysis ? "Running..." : "Run Alliance Analysis"}
      </button>

      {/* Results */}
      {analysis && (
        <AllianceAnalysisResults backend={backend} result={analysis} />
      )}
    </div>
  );
}

/* ========= RESULTS + RANKING ========= */

function AllianceAnalysisResults({
  backend,
  result,
}: {
  backend: string;
  result: AllianceAnalysisResponse;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [wardDetails, setWardDetails] = useState<
    Record<number, LocalbodyWardDetailsResponse>
  >({});
  const [loadingDetails, setLoadingDetails] = useState<Set<number>>(new Set());

  const isGE = result.year === 2019 || result.year === 2024;

  const ranked = result.breakdown
    .slice()
    .sort(
      (a, b) =>
        b.wardsWon - a.wardsWon ||
        b.wardsWinnable - a.wardsWinnable
    );

  const toggleExpand = async (lbId: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(lbId)) {
        next.delete(lbId);
      } else {
        next.add(lbId);
      }
      return next;
    });

    // if details already loaded, don't fetch again
    if (wardDetails[lbId]) return;

    setLoadingDetails((prev) => {
      const next = new Set(prev);
      next.add(lbId);
      return next;
    });

    try {
      const params = new URLSearchParams({
        year: String(result.year),
        alliance: result.alliance,
        swing: String(result.swingPercent),
      });

      const res = await fetch(
        `${backend}/v1/public/localbody/analysis/${lbId}/ward-details?${params.toString()}`
      );
      const data = (await res.json()) as LocalbodyWardDetailsResponse;
      setWardDetails((prev) => ({ ...prev, [lbId]: data }));
    } catch (e) {
      console.error("Error loading ward details", e);
    } finally {
      setLoadingDetails((prev) => {
        const next = new Set(prev);
        next.delete(lbId);
        return next;
      });
    }
  };

  return (
    <div style={{ marginTop: 30 }}>
      {/* Summary */}
      <div
        style={{
          background: "#1f2937",
          border: "1px solid #374151",
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>
          District {result.district} • {result.type}
        </div>

        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
          Alliance: {result.alliance}
        </div>

        <div style={{ fontSize: 14, opacity: 0.9 }}>
          <strong>Year:</strong> {result.year} &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong>Swing:</strong> {result.swingPercent}% &nbsp;&nbsp;|&nbsp;&nbsp;
          <strong>Localbodies:</strong> {result.localbodyCount}
        </div>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={summaryBoxStyle}>
            <div style={summaryLabel}>Wards Won</div>
            <div style={summaryValue}>{result.wardsWon}</div>
          </div>
          <div style={summaryBoxStyle}>
            <div style={summaryLabel}>Wards Winnable</div>
            <div style={summaryValue}>{result.wardsWinnable}</div>
          </div>
          {isGE && (
            <>
              <div style={summaryBoxStyle}>
                <div style={summaryLabel}>Booths Won</div>
                <div style={summaryValue}>{result.boothsWon ?? "-"}</div>
              </div>
              <div style={summaryBoxStyle}>
                <div style={summaryLabel}>Booths Winnable</div>
                <div style={summaryValue}>{result.boothsWinnable ?? "-"}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Ranked table */}
      <div
        style={{
          background: "#020617",
          border: "1px solid #1f2937",
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <h3 style={{ marginBottom: 12, fontSize: 16 }}>Localbody Ranking</h3>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              minWidth: 680,
            }}
          >
            <thead>
              <tr>
                <th style={thCell}>Rank</th>
                <th style={thCellLeft}>Localbody</th>
                <th style={thCell}>Wards Won</th>
                <th style={thCell}>Winnable</th>
                <th style={thCell}>Total Wards</th>
                <th style={thCell}>Majority</th>
                <th style={thCellLeft}>Verdict</th>
                <th style={thCell}>Details</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((lb, idx) => {
                const isExpanded = expanded.has(lb.localbodyId);
                const isLoading = loadingDetails.has(lb.localbodyId);

                return (
                  <React.Fragment key={lb.localbodyId}>
                    <tr>
                      <td style={tdCell}>{idx + 1}</td>
                      <td style={tdCellLeft}>{lb.localbodyName}</td>
                      <td style={tdCell}>{lb.wardsWon}</td>
                      <td style={tdCell}>{lb.wardsWinnable}</td>
                      <td style={tdCell}>
                        {lb.totalWards ?? "-"}
                      </td>
                      <td style={tdCell}>
                        {lb.majorityNeeded ?? "-"}
                      </td>
                      <td style={tdCellLeft}>
                        {lb.verdict && <VerdictBadge verdict={lb.verdict} />}
                      </td>
                      <td style={tdCell}>
                        <button
                          type="button"
                          onClick={() => toggleExpand(lb.localbodyId)}
                          style={{
                            padding: "2px 8px",
                            fontSize: 12,
                            borderRadius: 999,
                            border: "1px solid #4b5563",
                            background: isExpanded ? "#0d6efd33" : "transparent",
                            color: "#e5e7eb",
                            cursor: "pointer",
                          }}
                        >
                          {isLoading
                            ? "Loading..."
                            : isExpanded
                            ? "Hide"
                            : "Show"}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && wardDetails[lb.localbodyId] && (
                      <tr>
                        <td colSpan={8} style={{ padding: 10 }}>
                          <LocalbodyWardDetailsTable
                            details={wardDetails[lb.localbodyId]}
                            alliance={result.alliance}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ========= WARD DETAILS TABLE ========= */

function LocalbodyWardDetailsTable({
  details,
  alliance,
}: {
  details: LocalbodyWardDetailsResponse;
  alliance: string;
}) {
  const rows = details.wards;

  return (
    <div
      style={{
        background: "#020617",
        borderRadius: 8,
        border: "1px solid #1f2937",
        padding: 12,
      }}
    >
      <div
        style={{
          marginBottom: 8,
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {details.localbodyName} – Ward Details ({details.year}) | Total:{" "}
        {details.totalWards}, Majority: {details.majorityNeeded}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
            minWidth: 700,
          }}
        >
          <thead>
            <tr>
              <th style={thCell}>Ward #</th>
              <th style={thCellLeft}>Ward Name</th>
              <th style={thCellLeft}>Winner</th>
              <th style={thCell}>Winner Votes</th>
              <th style={thCell}>Margin</th>
              <th style={thCellLeft}>Top 3 Alliances (Votes, %)</th>
              <th style={thCellLeft}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w, idx) => {
              const sortedAlliances = w.alliances
                .slice()
                .sort((a, b) => b.votes - a.votes);
              const top3 = sortedAlliances.slice(0, 3);
              const winnerVotes = sortedAlliances[0]?.votes ?? 0;

              let status: WardStatus = "HARD";
              if (
                w.winnerAlliance &&
                w.winnerAlliance.toUpperCase() === alliance.toUpperCase()
              ) {
                status = "WON";
              } else if (w.winnable) {
                status = "WINNABLE";
              } else {
                status = "HARD";
              }

              return (
                <tr key={idx}>
                  <td style={tdCell}>{w.wardNum}</td>
                  <td style={tdCellLeft}>{w.wardName}</td>
                  <td style={tdCellLeft}>{w.winnerAlliance ?? "-"}</td>
                  <td style={tdCell}>
                    {winnerVotes
                      ? winnerVotes.toLocaleString("en-IN")
                      : "-"}
                  </td>
                  <td style={tdCell}>
                    {w.marginVotes != null
                      ? w.marginVotes.toLocaleString("en-IN")
                      : "-"}
                  </td>
                  <td style={tdCellLeft}>
                    {top3.length === 0
                      ? "-"
                      : top3
                          .map(
                            (a) =>
                              `${a.alliance} ${a.votes.toLocaleString(
                                "en-IN"
                              )} (${a.percentage.toFixed(2)}%)`
                          )
                          .join(", ")}
                  </td>
                  <td style={tdCellLeft}>
                    <WardStatusBadge status={status} />
                    {w.gapPercent != null && status !== "WON" && (
                      <span style={{ marginLeft: 6, opacity: 0.8 }}>
                        ({w.gapPercent.toFixed(1)}%)
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
