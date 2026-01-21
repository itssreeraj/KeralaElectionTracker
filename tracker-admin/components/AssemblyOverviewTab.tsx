"use client";

import { getConfig } from "@/config/env";
import React, { useEffect, useState } from "react";
import AssemblySelector from "./AssemblySelector";
import DistrictSelector from "./DistrictSelector";
import { AVAILABLE_YEARS } from "../lib/constants";

/* ===================== TYPES ===================== */

type ElectionType = "LOCALBODY" | "ASSEMBLY" | "LOKSABHA";

type AllianceSummary = {
  alliance: string;
  votes: number;
  percentage: number;
  rank1: number;
  rank2: number;
};

type YearBlock = {
  year: number;
  type: ElectionType;
  allianceSummary: AllianceSummary[];
  winner: string;
};

type AssemblyOverviewResponse = {
  assembly: {
    acCode: number;
    name: string;
    districtName: string;
  };
  years: YearBlock[];
};

/* ===================== CONSTANTS ===================== */

const ALLIANCE_COLORS: Record<string, string> = {
  LDF: "#e11d48",
  UDF: "#2563eb",
  NDA: "#f59e0b",
  SDPI: "#16a34a",
  IND: "#9ca3af",
  OTH: "#6b7280",
};

/* ===================== STYLES ===================== */

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  opacity: 0.85,
  marginBottom: 6,
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
  padding: 8,
  textAlign: "left",
  fontWeight: 600,
};

const thStyleRight: React.CSSProperties = {
  borderBottom: "1px solid #374151",
  padding: 8,
  textAlign: "right",
  fontWeight: 600,
};

const tdStyleLeft: React.CSSProperties = {
  padding: 8,
  borderBottom: "1px solid #111827",
  textAlign: "left",
};

const tdStyleRight: React.CSSProperties = {
  padding: 8,
  borderBottom: "1px solid #111827",
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

/* ===================== COMPONENT ===================== */

export default function AssemblyOverviewTab() {
  const config = getConfig();
  const backend = config.apiBase || "http://localhost:8080/api";

  const [selectedDistrict, setSelectedDistrict] = useState<any | null>(null);
  const [selectedAc, setSelectedAc] = useState<any | null>(null);

  const [selectedYears, setSelectedYears] = useState<number[]>([2021, 2026]);
  const [selectedTypes, setSelectedTypes] = useState<ElectionType[]>([
    "LOCALBODY",
    "ASSEMBLY",
    "LOKSABHA",
  ]);

  const [data, setData] = useState<AssemblyOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleYear = (y: number) => {
    setSelectedYears((prev) =>
      prev.includes(y) ? prev.filter((v) => v !== y) : [...prev, y]
    );
  };

  const toggleType = (t: ElectionType) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((v) => v !== t) : [...prev, t]
    );
  };

  const canRun =
    selectedAc &&
    selectedYears.length > 0 &&
    selectedTypes.length > 0 &&
    !loading;

  const runAnalysis = async () => {
    if (!canRun) return;

    const params = new URLSearchParams();
    params.append("acCode", String(selectedAc.acCode));
    params.append("years", selectedYears.join(","));
    params.append("types", selectedTypes.join(","));

    setLoading(true);
    setData(null);

    try {
      const res = await fetch(
        `${backend}/analysis/assembly/overview?${params.toString()}`
      );
      if (!res.ok) throw new Error("Failed");
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, color: "white" }}>
      <h2 style={{ marginBottom: 8 }}>Assembly Result Overview</h2>
      <p style={{ marginBottom: 20, opacity: 0.8, fontSize: 14 }}>
        Comparative analysis of alliance performance across Localbody, Assembly
        and Lok Sabha elections for a selected Assembly constituency.
      </p>

      {/* FILTER BAR */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 2fr 1fr",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <label style={labelStyle}>District</label>
          <DistrictSelector backend={backend} onSelectDistrict={setSelectedDistrict} />
        </div>

        <div>
          <label style={labelStyle}>Assembly</label>
          <AssemblySelector backend={backend} onSelectAc={setSelectedAc} />
        </div>

        <div>
          <label style={labelStyle}>Election Types</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {["LOCALBODY", "ASSEMBLY", "LOKSABHA"].map((t) => {
              const active = selectedTypes.includes(t as ElectionType);
              return (
                <button
                  key={t}
                  onClick={() => toggleType(t as ElectionType)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: active ? "1px solid #0d6efd" : "1px solid #555",
                    background: active ? "#0d6efd33" : "transparent",
                    color: "#fff",
                    fontSize: 12,
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Years</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {AVAILABLE_YEARS.map((y) => {
              const active = selectedYears.includes(y);
              return (
                <button
                  key={y}
                  onClick={() => toggleYear(y)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: active ? "1px solid #0d6efd" : "1px solid #555",
                    background: active ? "#0d6efd33" : "transparent",
                    color: "#fff",
                    fontSize: 12,
                  }}
                >
                  {y}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        onClick={runAnalysis}
        disabled={!canRun}
        style={{
          padding: "10px 18px",
          borderRadius: 8,
          background: canRun ? "#0d6efd" : "#444",
          color: "#fff",
          border: "none",
          cursor: canRun ? "pointer" : "not-allowed",
          fontSize: 15,
          fontWeight: 600,
          marginBottom: 24,
        }}
      >
        {loading ? "Loading…" : "Run Assembly Overview"}
      </button>

      {/* ================= DATA ================= */}

      {data && (
        <>
          {/* HEADER */}
          <div
            style={{
              marginBottom: 20,
              padding: 14,
              borderRadius: 8,
              background: "#111827",
              border: "1px solid #1f2937",
            }}
          >
            <div style={{ fontSize: 13, opacity: 0.75 }}>
              {data.assembly.districtName}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              {data.assembly.name}
            </div>
          </div>

          {/* SUMMARY TABLE */}
          <h3 style={{ marginBottom: 12 }}>Year-wise Alliance Performance</h3>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
                minWidth: 900,
              }}
            >
              <thead>
                <tr>
                  <th style={thStyleLeft}>Year</th>
                  <th style={thStyleLeft}>Type</th>

                  {Object.keys(ALLIANCE_COLORS).map((a) => (
                    <th key={a} style={thStyleRight}>
                      {a} %
                    </th>
                  ))}

                  <th style={thStyleLeft}>Winner</th>
                </tr>
              </thead>

              <tbody>
                {data.years
                  .sort((a, b) => a.year - b.year)
                  .map((y) => {
                    const map: Record<string, AllianceSummary> = {};
                    y.allianceSummary.forEach((a) => {
                      map[a.alliance] = a;
                    });

                    return (
                      <tr key={`${y.year}-${y.type}`}>
                        <td style={tdStyleLeft}>{y.year}</td>
                        <td style={tdStyleLeft}>
                          <span
                            style={{
                              padding: "3px 10px",
                              borderRadius: 999,
                              fontSize: 11,
                              background:
                                y.type === "LOCALBODY"
                                  ? "#059669"
                                  : y.type === "ASSEMBLY"
                                  ? "#f59e0b"
                                  : "#3b82f6",
                            }}
                          >
                            {y.type}
                          </span>
                        </td>

                        {Object.keys(ALLIANCE_COLORS).map((a) => {
                          const v = map[a];
                          return (
                            <td key={a} style={tdStyleRight}>
                              {v ? `${v.percentage.toFixed(2)}%` : "—"}
                            </td>
                          );
                        })}

                        <td style={tdStyleLeft}>
                          <b>{y.winner || "-"}</b>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
