"use client";

import React, { useEffect, useState } from "react";

/* ========= TYPES ========= */

type District = {
  districtCode: number;
  name: string;
};

type Localbody = {
  id: number;
  name: string;
  type: string;
};

type VoteShareRow = {
  alliance: string;       // "LDF", "UDF", "NDA", "IND", "OTH"
  votes: number;
  percentage: number;
};

type PerformanceRow = {
  alliance: string;
  winner: number;   // for LOCALBODY: ward wins; for GE: #1 booths
  runnerUp: number; // for LOCALBODY: #2; for GE: #2 booths
  third: number;    // #3
};

type ElectionType = "LOCALBODY" | "GE" | "ASSEMBLY";

type SingleElectionAnalysis = {
  year: number;
  type: ElectionType;
  label: string;
  voteShare: VoteShareRow[] | null;         // ward-based (LOCALBODY)
  wardPerformance: PerformanceRow[] | null; // LOCALBODY
  boothVoteShare: VoteShareRow[] | null;    // GE/ASSEMBLY
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

/* ========= CONSTANTS ========= */

const ALLIANCE_COLORS: Record<string, string> = {
  LDF: "#ff4b4b",
  UDF: "#3584e4",
  NDA: "#e66100",
  IND: "#9b59b6",
  OTH: "#999999",
};

const AVAILABLE_YEARS = [2015, 2020, 2019, 2024, 2025, 2026]; // you can extend to 2019, 2025, 2026 later

/* ========= COMPONENT ========= */

export default function LocalbodyAnalysisTab() {
  const backend =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";

  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");

  const [localbodies, setLocalbodies] = useState<Localbody[]>([]);
  const [selectedLocalbody, setSelectedLocalbody] = useState<string>("");

  const [selectedYears, setSelectedYears] = useState<number[]>([2015, 2020, 2024]);

  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);

  const [loadingLb, setLoadingLb] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* === NEW STATES for POSTER === */
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [posterLoading, setPosterLoading] = useState(false);

  /* -------- LOAD DISTRICTS -------- */

  useEffect(() => {
    const loadDistricts = async () => {
      try {
        const res = await fetch(`${backend}/admin/districts`);
        if (!res.ok) return;
        const data = await res.json();
        setDistricts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error loading districts", e);
      }
    };
    loadDistricts();
  }, [backend]);

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
          `${backend}/admin/localbodies/by-district?name=${encodeURIComponent(
            selectedDistrict
          )}`
        );
        const data = await res.json();
        setLocalbodies(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error loading localbodies", e);
        setLocalbodies([]);
      }
      setLoadingLb(false);
    };
    loadLocalbodies();
  }, [backend, selectedDistrict]);

  /* -------- LOAD ANALYSIS (multi-year) -------- */

  const loadAnalysis = async () => {
    if (!selectedLocalbody || selectedYears.length === 0) return;

    setLoadingAnalysis(true);
    setErrorMsg(null);
    setAnalysis(null);

    const lbId = Number(selectedLocalbody);
    const yearsParam = selectedYears.join(",");

    try {
      const res = await fetch(
        `${backend}/admin/analysis/localbody/${lbId}?years=${yearsParam}`
      );
      if (!res.ok) {
        setErrorMsg("Failed to load analysis");
        setLoadingAnalysis(false);
        return;
      }

      const data = (await res.json()) as AnalysisResponse;
      setAnalysis(data);
    } catch (e) {
      console.error("Error loading analysis", e);
      setErrorMsg("Error loading analysis");
    }

    setLoadingAnalysis(false);
  };

  /* -------- HELPERS FOR RENDERING -------- */

  const formatPct = (v: number) => `${v.toFixed(2)}%`;

  const getAllianceColor = (name: string | null | undefined) => {
    if (!name) return ALLIANCE_COLORS.OTH;
    const key = name.toUpperCase();
    return ALLIANCE_COLORS[key] || ALLIANCE_COLORS.OTH;
  };

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
                    <td style={tdStyleRight}>{row.votes.toLocaleString("en-IN")}</td>
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
      .sort((a, b) => (b.winner ?? 0) - (a.winner ?? 0)); // sort by # wins / #1

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

  /* ========= NEW: GENERATE POSTER LOGIC ========= */

  const generatePoster = async () => {
    if (!analysis) return;

    setPosterLoading(true);
    setPosterImage(null);

    const payload = {
      localbody: analysis.localbody,
      elections: Object.values(analysis.elections),
      notes,
    };

    try {
      const res = await fetch("http://localhost:4000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Poster backend failed");

      const data = await res.json();
      setPosterImage(data.image); // Expect backend to return { imageBase64 }
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
        Compare alliance performance across Localbody (2015, 2020) and
        General Election (2024) for the selected localbody.
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
        <div>
          <label style={labelStyle}>District</label>
          <select
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              setSelectedLocalbody("");
              setAnalysis(null);
            }}
            style={selectStyle}
          >
            <option value="">Select District</option>
            {districts.map((d) => (
              <option key={d.districtCode} value={d.name}>
                {d.districtCode} - {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* LOCALBODY */}
        <div>
          <label style={labelStyle}>Localbody</label>
          {loadingLb ? (
            <div style={{ paddingTop: 8 }}>Loading localbodies…</div>
          ) : (
            <select
              value={selectedLocalbody}
              onChange={(e) => {
                setSelectedLocalbody(e.target.value);
                setAnalysis(null);
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
        <div>
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
              cursor: !selectedLocalbody || loadingAnalysis ? "not-allowed" : "pointer",
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

      {/* ANALYSIS CARDS */}
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
                const isGE = el.type === "GE";
                const badgeColor =
                  el.type === "LOCALBODY"
                    ? "#059669"
                    : el.type === "GE"
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

                    {isGE && (
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

                        {(!el.boothVoteShare || el.boothVoteShare.length === 0) &&
                          (!el.boothPerformance ||
                            el.boothPerformance.length === 0) && (
                            <p style={{ fontSize: 13, opacity: 0.7, marginTop: 8 }}>
                              No booth-level data available for this election.
                            </p>
                          )}
                      </>
                    )}

                    {/* === NEW: NOTES BOX === */}
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

                    {!isLocalbody && !isGE && (
                      <p style={{ fontSize: 13, opacity: 0.7 }}>
                        No renderer defined for type: {el.type}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
          {/* === NEW: GENERATE POSTER BUTTON === */}
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
              {posterLoading ? "Generating Poster\u2026" : "Generate Combined Poster"}
            </button>
          </div>
          {/* === NEW: POSTER PREVIEW === */}
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
        </div>
      )}
    </div>
  );
}

/* ========= SMALL STYLE HELPERS ========= */

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
  fontVariantNumeric: "tabular-nums", // nice aligned numbers
};
