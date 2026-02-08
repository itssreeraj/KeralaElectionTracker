"use client";

import { getConfig } from "@/config/env";

import React, { useEffect, useState } from "react";
import { AVAILABLE_YEARS, LOCALBODY_TYPE_OPTIONS } from "../lib/constants";
import DistrictSelector, { type District } from "./DistrictSelector";

/* ========= TYPES ========= */

type Localbody = {
  id: number;
  name: string;
  type: string;
};

type VoteShareRow = {
  alliance: string; // "LDF", "UDF", "NDA", "IND", "OTH"
  votes: number;
  percentage: number;
};

type PerformanceRow = {
  alliance: string;
  winner: number; // for LOCALBODY: ward wins; for LOKSABHA: #1 booths
  runnerUp: number; // for LOCALBODY: #2; for LOKSABHA: #2 booths
  third: number; // #3
};

type ElectionType = "LOCALBODY" | "LOKSABHA" | "ASSEMBLY";

type SingleElectionAnalysis = {
  year: number;
  type: ElectionType;
  label: string;
  voteShare: VoteShareRow[] | null; // ward-based (LOCALBODY)
  wardPerformance: PerformanceRow[] | null; // LOCALBODY
  boothVoteShare: VoteShareRow[] | null; // LOKSABHA/ASSEMBLY
  boothPerformance: PerformanceRow[] | null;
};

type LocalbodyInfo = {
  id: number;
  name: string;
  type: string;
  districtName: string | null;
};

type AnalysisResponse = {
  localbody: LocalbodyInfo;
  elections: Record<string, SingleElectionAnalysis>;
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
  total: number;
  winner: string | null;
  margin: number | null;
};

type BoothDetailRow = {
  boothNum: number;
  boothName: string;
  alliances: AllianceVoteDetail[];
  total: number;
  winner: string | null;
  margin: number | null;
};

type DetailedYearData = {
  year: number;
  type: ElectionType;
  wards?: WardDetailRow[];
  booths?: BoothDetailRow[];
};

type DetailedResponse = Record<string, DetailedYearData>;

/* ========= CONSTANTS ========= */

const ALLIANCE_COLORS: Record<string, string> = {
  LDF: "#ff4b4b",
  UDF: "#3584e4",
  NDA: "#e66100",
  IND: "#9b59b6",
  OTH: "#999999",
};



/* ========= COMPONENT ========= */

export default function LocalbodyAnalysisTab() {
  const config = getConfig();
  const backend = config.apiBase ? config.apiBase : "http://localhost:3000/api";
  console.log("Using backend:", backend);
  const posterBase = config.posterBase ? config.posterBase.replace(/\/$/, "") : "";
  const profile = config.env || "";

  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);

  const [localbodies, setLocalbodies] = useState<Localbody[]>([]);
  const [selectedLocalbody, setSelectedLocalbody] = useState<string>("");

  const [selectedYears, setSelectedYears] = useState<number[]>([
    2025,
  ]);

  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);

  const [loadingLb, setLoadingLb] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* === POSTER STATES === */
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [posterLoading, setPosterLoading] = useState(false);

  /* === DETAILED TABLE STATES === */
  const [detailed, setDetailed] = useState<DetailedResponse | null>(null);
  const [loadingDetailed, setLoadingDetailed] = useState(false);

  const [selectedType, setSelectedType] = useState<string>("");
  const [lbSearch, setLbSearch] = useState<string>(""); // localbody text search


  /* -------- LOAD LOCALBODIES WHEN DISTRICT CHANGES -------- */

  useEffect(() => {
    const loadLocalbodies = async () => {
      if (!selectedDistrict) {
        setLocalbodies([]);
        setSelectedLocalbody("");
        return;
      }
      setLoadingLb(true);
      try {
        const res = await fetch(
          `v1/public/localbodies/by-district?name=${encodeURIComponent(
            selectedDistrict.name
          )}`
        );
        const data = await res.json();
        const rawList = Array.isArray(data) ? data : [];

        let filteredList = rawList;

        // filter by type if selected
        if (selectedType) {
          filteredList = filteredList.filter(
            (lb: any) => lb.type.toLowerCase() === selectedType.toLowerCase()
          );
        }

        // filter by search text
        if (lbSearch.trim() !== "") {
          const q = lbSearch.toLowerCase();
          filteredList = filteredList.filter((lb: any) =>
            lb.name.toLowerCase().includes(q)
          );
        }

        setLocalbodies(filteredList);
      } catch (e) {
        console.error("Error loading localbodies", e);
        setLocalbodies([]);
      }
      setLoadingLb(false);
    };
    loadLocalbodies();
  }, [backend, selectedDistrict, selectedType, lbSearch]);

  /* -------- HELPERS -------- */

  const formatPct = (v: number) => `${v.toFixed(2)}%`;

  const getAllianceColor = (name: string | null | undefined) => {
    if (!name) return ALLIANCE_COLORS.OTH;
    const key = name.toUpperCase();
    return ALLIANCE_COLORS[key] || ALLIANCE_COLORS.OTH;
  };

  /* -------- LOAD DETAILED RESULTS -------- */

  const loadDetailed = async (lbId: number, years: number[]) => {
    setLoadingDetailed(true);
    setDetailed(null);
    try {
      const yearsParam = years.join(",");
      const res = await fetch(
        `v1/public/analysis/localbody/${lbId}/details?years=${yearsParam}`
      );
      if (!res.ok) {
        console.error("Failed to load detailed results");
        setLoadingDetailed(false);
        return;
      }
      const data = (await res.json()) as DetailedResponse;
      setDetailed(data);
    } catch (e) {
      console.error("Error loading detailed results", e);
    }
    setLoadingDetailed(false);
  };

  /* -------- LOAD ANALYSIS (multi-year) -------- */

  const loadAnalysis = async () => {
    if (!selectedLocalbody || selectedYears.length === 0) return;

    setLoadingAnalysis(true);
    setErrorMsg(null);
    setAnalysis(null);
    setDetailed(null);
    setPosterImage(null);

    const lbId = Number(selectedLocalbody);
    const yearsParam = selectedYears.join(",");

    try {
      const res = await fetch(
        `v1/public/analysis/localbody/${lbId}?years=${yearsParam}`
      );
      if (!res.ok) {
        setErrorMsg("Failed to load analysis");
        setLoadingAnalysis(false);
        return;
      }

      const data = (await res.json()) as AnalysisResponse;
      setAnalysis(data);

      // also load detailed ward/booth tables
      await loadDetailed(lbId, selectedYears);
    } catch (e) {
      console.error("Error loading analysis", e);
      setErrorMsg("Error loading analysis");
    }

    setLoadingAnalysis(false);
  };

  /* -------- TABLE RENDER HELPERS -------- */

  const renderVoteShareTable = (rows: VoteShareRow[], title: string) => {
    if (!rows || rows.length === 0) return null;

    const totalVotes = rows.reduce((sum, r) => sum + r.votes, 0);

    return (
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ marginBottom: 8 }}>{title}</h4>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            fontSize: 14,
          }}
        >
          <thead>
            <tr>
              <th style={thStyleLeft}>Alliance</th>
              <th style={thStyleRight}>Votes</th>
              <th style={thStyleRight}>Share</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .slice()
              .sort((a, b) => b.votes - a.votes)
              .map((row, idx) => {
                const alliance = row.alliance || "OTH";
                const color = getAllianceColor(alliance);
                const pct =
                  totalVotes === 0
                    ? "0.00%"
                    : formatPct((row.votes * 100.0) / totalVotes);

                return (
                  <tr key={idx}>
                    <td style={tdStyleLeft}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: color,
                            display: "inline-block",
                            marginRight: 8,
                          }}
                        />
                        {alliance}
                      </div>
                    </td>
                    <td style={tdStyleRight}>
                      {row.votes.toLocaleString("en-IN")}
                    </td>
                    <td style={tdStyleRight}>{pct}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPerformanceTable = (
    rows: PerformanceRow[] | null,
    title: string,
    colLabels: { win: string; second: string; third: string }
  ) => {
    if (!rows || rows.length === 0) return null;

    const sorted = rows
      .slice()
      .sort((a, b) => (b.winner ?? 0) - (a.winner ?? 0));

    return (
      <div style={{ marginTop: 12 }}>
        <h4 style={{ marginBottom: 8 }}>{title}</h4>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            fontSize: 14,
          }}
        >
          <thead>
            <tr>
              <th style={thStyleLeft}>Alliance</th>
              <th style={thStyleRight}>{colLabels.win}</th>
              <th style={thStyleRight}>{colLabels.second}</th>
              <th style={thStyleRight}>{colLabels.third}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => {
              const alliance = row.alliance || "OTH";
              const color = getAllianceColor(alliance);
              const w = row.winner ?? 0;
              const r2 = row.runnerUp ?? 0;
              const r3 = row.third ?? 0;

              return (
                <tr key={idx}>
                  <td style={tdStyleLeft}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: color,
                          display: "inline-block",
                          marginRight: 8,
                        }}
                      />
                      {alliance}
                    </div>
                  </td>
                  <td style={tdStyleRight}>{w}</td>
                  <td style={tdStyleRight}>{r2}</td>
                  <td style={tdStyleRight}>{r3}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const toggleYear = (year: number) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  /* ========= POSTER GENERATION (combined template) ========= */

  const generatePoster = async () => {
    if (!analysis) return;

    if (!posterBase) {
      alert(
        `Poster service not configured for profile: ${profile || "unknown"}. Set NEXT_PUBLIC_POSTER_BASE in your environment.`
      );
      return;
    }

    setPosterLoading(true);
    setPosterImage(null);

    // Build years block like your old puppeteer backend expects
    const yearsPayload = Object.values(analysis.elections)
      .sort((a, b) => a.year - b.year)
      .map((el) => {
        const isLocalbody = el.type === "LOCALBODY";
        const isLokSabha = el.type === "LOKSABHA";
        const isAssembly = el.type === "ASSEMBLY";
        const isGeneral = isLokSabha || isAssembly;

        const baseYearLabel = isLokSabha ? `${el.year} LOKSABHA` : isAssembly ? `${el.year} ASSEMBLY` : `${el.year}`;

        const yearBlock: any = {
          year: baseYearLabel,
          notes: notes[el.year] || "",
          votes: [] as any[],
          wards: [] as any[],
          generalVotes: [] as any[],
          generalBooths: [] as any[],
        };

        if (isLocalbody) {
          yearBlock.votes = (el.voteShare || []).map((v) => ({
            alliance: v.alliance,
            color: getAllianceColor(v.alliance),
            votes: v.votes,
            percent: Number(v.percentage.toFixed(2)),
          }));

          yearBlock.wards = (el.wardPerformance || []).map((p) => ({
            alliance: p.alliance,
            color: getAllianceColor(p.alliance),
            winner: p.winner,
            runnerUp: p.runnerUp,
            third: p.third,
          }));
        }

        if (isGeneral) {
          yearBlock.generalVotes = (el.boothVoteShare || []).map((v) => ({
            alliance: v.alliance,
            color: getAllianceColor(v.alliance),
            votes: v.votes,
            percent: Number(v.percentage.toFixed(2)),
          }));

          yearBlock.generalBooths = (el.boothPerformance || []).map((p) => ({
            alliance: p.alliance,
            color: getAllianceColor(p.alliance),
            winner: p.winner,
            runnerUp: p.runnerUp,
            third: p.third,
          }));
        }

        return yearBlock;
      });

    const payload = {
      template: "combined",
      localbody: `${analysis.localbody.name} (${analysis.localbody.type})`,
      district: analysis.localbody.districtName || "",
      showVotes: true,
      showPercent: true,
      years: yearsPayload,
    };

    try {
      const res = await fetch(`${posterBase}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Poster backend failed");

      const data = await res.json();
      // Backend returns { image: "<base64>" }
      setPosterImage(data.image);
    } catch (err) {
      console.error(err);
      alert("Poster generation failed");
    }

    setPosterLoading(false);
  };

  /* -------- RENDER -------- */

  return (
    <div style={{ padding: 24, color: "white" }}>
      <h2 style={{ marginBottom: 8 }}>Localbody Election Analysis</h2>
      <p style={{ marginBottom: 20, opacity: 0.8, fontSize: 14 }}>
        Compare alliance performance across Localbody (2015, 2020, 2025), General
        Election (2009, 2014, 2019, 2024) and Assembly Election (2011, 2016, 2021, 2026) for the selected localbody.
      </p>

      {/* TOP FILTER BAR */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 2fr 1.5fr",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* DISTRICT */}
        <DistrictSelector
          backend={backend}
          emptyLabel="Select District"
          labelStyle={labelStyle}
          onSelectDistrict={(district) => {
            setSelectedDistrict(district);
            setSelectedLocalbody("");
            setAnalysis(null);
            setDetailed(null);
            setPosterImage(null);
          }}
        />

        {/* LOCALBODY TYPE */}
        <div>
          <label style={labelStyle}>Type</label>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setAnalysis(null);
              setDetailed(null);
              setPosterImage(null);
              // Reload list when type changes
            }}
            style={selectStyle}
          >
            {LOCALBODY_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>


        {/* LOCALBODY */}
        <div>
          <label style={labelStyle}>Localbody</label>

          {/* SEARCH BOX */}
          <input
            type="text"
            placeholder="Search localbody\u2026"
            value={lbSearch}
            onChange={(e) => {
              setLbSearch(e.target.value);
              setAnalysis(null);
              setDetailed(null);
              setPosterImage(null);
            }}
            style={{
              width: "100%",
              padding: "6px 8px",
              marginTop: 4,
              marginBottom: 6,
              borderRadius: 6,
              border: "1px solid #374151",
              background: "#020617",
              color: "#f9fafb",
              fontSize: 14,
            }}
          />

          {loadingLb ? (
            <div style={{ paddingTop: 8 }}>Loading localbodies\u2026</div>
          ) : (
            <select
              value={selectedLocalbody}
              onChange={(e) => {
                setSelectedLocalbody(e.target.value);
                setAnalysis(null);
                setDetailed(null);
                setPosterImage(null);
              }}
              style={selectStyle}
            >
              <option value="">Select Localbody</option>
              {localbodies.map((lb) => (
                <option key={lb.id} value={lb.id}>
                  {lb.name} ({lb.type})
                </option>
              ))}
            </select>
          )}

        </div>

        {/* YEARS + LOAD BUTTON */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Election Years</label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 8,
              marginTop: 4,
            }}
          >
            {AVAILABLE_YEARS.map((y) => {
              const active = selectedYears.includes(y);
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

          <button
            onClick={loadAnalysis}
            disabled={!selectedLocalbody || loadingAnalysis}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              background: loadingAnalysis ? "#444" : "#0d6efd",
              color: "#fff",
              cursor:
                !selectedLocalbody || loadingAnalysis
                  ? "not-allowed"
                  : "pointer",
              fontSize: 14,
            }}
          >
            {loadingAnalysis ? "Loading…" : "Run Analysis"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <p style={{ color: "salmon", marginBottom: 12 }}>{errorMsg}</p>
      )}

      {/* ANALYSIS CARDS + POSTER + DETAILED TABLES */}
      {analysis && (
        <div style={{ marginTop: 16 }}>
          {/* Localbody header */}
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 8,
              background: "#1f2933",
              border: "1px solid #2f3b4a",
            }}
          >
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              {analysis.localbody.districtName}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              {analysis.localbody.name}{" "}
              <span style={{ fontSize: 13, opacity: 0.7 }}>
                ({analysis.localbody.type})
              </span>
            </div>
          </div>

          {/* Grid of elections */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {Object.values(analysis.elections)
              .sort((a, b) => a.year - b.year)
              .map((el) => {
                const isLocalbody = el.type === "LOCALBODY";
                const isGeneral = el.type === "LOKSABHA" || el.type === "ASSEMBLY";
                const badgeColor =
                  el.type === "LOCALBODY"
                    ? "#059669"
                    : el.type === "LOKSABHA"
                    ? "#3b82f6"
                    : "#f59e0b";

                return (
                  <div
                    key={el.year}
                    style={{
                      background: "#111827",
                      borderRadius: 10,
                      padding: 16,
                      border: "1px solid #1f2937",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            opacity: 0.8,
                            marginBottom: 2,
                          }}
                        >
                          {el.label}
                        </div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 18,
                          }}
                        >
                          {el.year}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "3px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          backgroundColor: badgeColor,
                        }}
                      >
                        {el.type}
                      </div>
                    </div>

                    {/* Content */}
                    {isLocalbody && (
                      <>
                        {renderVoteShareTable(
                          el.voteShare || [],
                          "Ward-wise Alliance Vote Share"
                        )}

                        {renderPerformanceTable(
                          el.wardPerformance,
                          "Ward Performance (Alliance-wise)",
                          {
                            win: "# Wins",
                            second: "# 2nd",
                            third: "# 3rd",
                          }
                        )}
                      </>
                    )}

                    {isGeneral && (
                      <>
                        {renderVoteShareTable(
                          el.boothVoteShare || [],
                          "Booth-wise Alliance Vote Share"
                        )}

                        {renderPerformanceTable(
                          el.boothPerformance,
                          "Booth Performance (Alliance-wise)",
                          {
                            win: "#1 Rank",
                            second: "#2 Rank",
                            third: "#3 Rank",
                          }
                        )}

                        {(!el.boothVoteShare ||
                          el.boothVoteShare.length === 0) &&
                          (!el.boothPerformance ||
                            el.boothPerformance.length === 0) && (
                            <p
                              style={{
                                fontSize: 13,
                                opacity: 0.7,
                                marginTop: 8,
                              }}
                            >
                              No booth-level data available for this election.
                            </p>
                          )}
                      </>
                    )}

                    {/* NOTES BOX */}
                    <textarea
                      placeholder={`Notes for ${el.year}…`}
                      value={notes[el.year] || ""}
                      onChange={(e) =>
                        setNotes({ ...notes, [el.year]: e.target.value })
                      }
                      style={{
                        width: "100%",
                        marginTop: 10,
                        padding: 8,
                        borderRadius: 6,
                        background: "#1e293b",
                        border: "1px solid #334155",
                        color: "white",
                        minHeight: 70,
                        fontSize: 13,
                      }}
                    />

                    {!isLocalbody && !isGeneral && (
                      <p style={{ fontSize: 13, opacity: 0.7 }}>
                        No renderer defined for type: {el.type}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>

          {/* GENERATE POSTER BUTTON */}
          <div style={{ marginTop: 30, textAlign: "center" }}>
            <button
              onClick={generatePoster}
              disabled={posterLoading}
              style={{
                padding: "12px 20px",
                background: "#0d6efd",
                color: "white",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {posterLoading ? "Generating Poster…" : "Generate Combined Poster"}
            </button>
          </div>

          {/* POSTER PREVIEW */}
          {posterImage && (
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <h3>Poster Preview</h3>
              <img
                src={`data:image/png;base64,${posterImage}`}
                alt="Poster"
                style={{
                  maxWidth: "100%",
                  border: "1px solid #333",
                  borderRadius: 10,
                  marginTop: 10,
                }}
              />
            </div>
          )}

          {/* DETAILED TABLES (WARDS + BOOTHS, PER YEAR) */}
          <div style={{ marginTop: 40 }}>
            <h3 style={{ marginBottom: 12 }}>Detailed Ward / Booth Results</h3>

            {loadingDetailed && (
              <p style={{ fontSize: 13, opacity: 0.7 }}>
                Loading detailed results…
              </p>
            )}

            {!loadingDetailed && detailed && (
              <DetailedResultsTabs
                detailed={detailed}
                allianceColors={ALLIANCE_COLORS}
                formatPct={formatPct}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ========= DETAILED RESULTS TABS COMPONENT ========= */

type DetailedResultsTabsProps = {
  detailed: DetailedResponse;
  allianceColors: Record<string, string>;
  formatPct: (v: number) => string;
};

function DetailedResultsTabs({
  detailed,
  allianceColors,
  formatPct,
}: DetailedResultsTabsProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  const years = Object.values(detailed).sort((a, b) => a.year - b.year);

  if (years.length === 0) {
    return (
      <p style={{ fontSize: 13, opacity: 0.7 }}>
        No detailed ward/booth data available.
      </p>
    );
  }

  const activeYear = years[Math.min(activeIdx, years.length - 1)];
  const isLocalbody = activeYear.type === "LOCALBODY";
  const labelId = isLocalbody ? "Ward" : "Booth";

  const rows = (isLocalbody
    ? activeYear.wards || []
    : activeYear.booths || []) as (WardDetailRow | BoothDetailRow)[];

  // Determine alliance order from first row
  let allianceOrder: string[] = [];
  if (rows.length > 0) {
    allianceOrder = rows[0].alliances
      .slice()
      .sort((a, b) => b.votes - a.votes)
      .map((a) => a.alliance);
  }

  const getAllianceColor = (name: string | null | undefined) => {
    if (!name) return allianceColors.OTH;
    const key = name.toUpperCase();
    return allianceColors[key] || allianceColors.OTH;
  };

  return (
    <div
      style={{
        marginTop: 12,
        padding: 16,
        borderRadius: 10,
        background: "#020617",
        border: "1px solid #1f2937",
      }}
    >
      {/* Year tabs */}
      <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {years.map((y, idx) => {
          const active = idx === activeIdx;
          return (
            <button
              key={y.year}
              type="button"
              onClick={() => setActiveIdx(idx)}
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
              {y.year} {y.type === "LOKSABHA" ? "LOKSABHA" : ""}
            </button>
          );
        })}
      </div>

      {/* Active year table */}
      {rows.length === 0 ? (
        <p style={{ fontSize: 13, opacity: 0.7 }}>
          No {isLocalbody ? "ward" : "booth"} data available for {activeYear.year}.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "auto",
              fontSize: 13,
              minWidth: 600,
            }}
          >
            <thead>
              <tr>
                <th style={thStyleLeft}>{labelId} #</th>
                <th style={thStyleLeft}>{labelId} Name</th>

                {allianceOrder.map((a) => (
                  <React.Fragment key={a}>
                    <th style={thStyleRight}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: getAllianceColor(a),
                            display: "inline-block",
                          }}
                        />
                        {a} Votes
                      </div>
                    </th>
                    <th style={thStyleRight}>{a} %</th>
                  </React.Fragment>
                ))}

                <th style={thStyleRight}>Total</th>
                <th style={thStyleLeft}>Winner</th>
                <th style={thStyleRight}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const num =
                  (row as WardDetailRow).wardNum ??
                  (row as BoothDetailRow).boothNum ??
                  null;
                const name =
                  (row as WardDetailRow).wardName ??
                  (row as BoothDetailRow).boothName ??
                  "";

                return (
                  <tr key={idx}>
                    <td style={tdStyleLeft}>{num}</td>
                    <td style={tdStyleLeft}>{name}</td>

                    {allianceOrder.map((a) => {
                      const found = row.alliances.find(
                        (x) => x.alliance === a
                      );
                      const votes = found?.votes ?? 0;
                      const pct = found?.percentage ?? 0;
                      return (
                        <React.Fragment key={a}>
                          <td style={tdStyleRight}>
                            {votes.toLocaleString("en-IN")}
                          </td>
                          <td style={tdStyleRight}>{formatPct(pct)}</td>
                        </React.Fragment>
                      );
                    })}

                    <td style={tdStyleRight}>
                      {row.total.toLocaleString("en-IN")}
                    </td>
                    <td style={tdStyleLeft}>{row.winner || "-"}</td>
                    <td style={tdStyleRight}>
                      {row.margin != null ? row.margin : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ========= SMALL STYLE HELPERS ========= */

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.85,
  marginBottom: 10,
  display: "block",
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

const thStyleLeft: React.CSSProperties = {
  borderBottom: "1px solid #374151",
  padding: 6,
  textAlign: "left",
  fontWeight: 500,
};

const thStyleRight: React.CSSProperties = {
  borderBottom: "1px solid #374151",
  padding: 6,
  textAlign: "right",
  fontWeight: 500,
};

const tdStyleLeft: React.CSSProperties = {
  padding: 6,
  borderBottom: "1px solid #111827",
  textAlign: "left",
};

const tdStyleRight: React.CSSProperties = {
  padding: 6,
  borderBottom: "1px solid #111827",
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};
