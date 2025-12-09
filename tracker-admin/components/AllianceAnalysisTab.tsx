"use client";

import React, { useEffect, useState } from "react";
import {AllianceAnalysisResults} from "./AllianceAnalysisResults";

const labelStyle: React.CSSProperties = { fontSize: 13, opacity: 0.85 };
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

const AVAILABLE_YEARS = [2015, 2020, 2019, 2024];

const LOCALBODY_TYPES = [
  { value: "", label: "All Types" },
  { value: "Municipality", label: "Municipality" },
  { value: "Corporation", label: "Corporation" },
  { value: "grama_panchayath", label: "Grama Panchayath" },
  { value: "block_panchayath", label: "Block Panchayath" },
  { value: "district_panchayath", label: "District Panchayath" },
];

export default function AllianceAnalysisTab() {
  const backend =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";

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
  const [analysis, setAnalysis] = useState(false);

  /* ====== Load Districts ====== */
  useEffect(() => {
    fetch(`${backend}/admin/districts`)
      .then((r) => r.json())
      .then((data) => setDistricts(Array.isArray(data) ? data : []));
  }, [backend]);

  /* ====== Load Alliances ====== */
  useEffect(() => {
    fetch(`${backend}/public/alliances`)
      .then((r) => r.json())
      .then((data) => setAlliances(Array.isArray(data) ? data : []));
  }, []);

  /* ====== Load Localbodies ====== */
  useEffect(() => {
    if (!selectedDistrictCode || !selectedDistrictName) {
      setLocalbodies([]);
      return;
    }

    const load = async () => {
      setLoadingLB(true);

      const res = await fetch(
        `${backend}/admin/localbodies/by-district?name=${encodeURIComponent(
          selectedDistrictName
        )}`
      );

      const list = await res.json();
      let lbList = Array.isArray(list) ? list : [];

      if (selectedType) {
        lbList = lbList.filter(
          (lb) => lb.type.toLowerCase() === selectedType.toLowerCase()
        );
      }

      setLocalbodies(lbList);
      setLoadingLB(false);
    };

    load();
  }, [backend, selectedDistrictCode, selectedDistrictName, selectedType]);

  /* ====== YEAR SELECTOR ====== */
  const toggleYear = (y: number) => {
    setSelectedYear((prev) => (prev === y ? null : y));
  };

  /* ====== Run Analysis ====== */
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

    const url = `${backend}/localbody/analysis/alliance?${params.toString()}`;
    console.log("Calling:", url);

    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log("Alliance Analysis Response:", data);
      setAnalysis(data);
    } catch (err) {
      console.error("Error running analysis:", err);
      alert("Failed to run analysis");
    }
  };

  return (
    <div style={{ padding: 20, color: "white" }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>
        Alliance-Based Analysis
      </h2>

      {/* GRID */}
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
              const code = Number(e.target.value);
              setSelectedDistrictCode(code);
              const dist = districts.find((d) => d.districtCode === code);
              setSelectedDistrictName(dist?.name || "");
              setSelectedLocalbody("");
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
              onChange={(e) => setSelectedLocalbody(e.target.value)}
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
            onChange={(e) => setSelectedAlliance(e.target.value)}
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

        {/* Swing % */}
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

        {/* Year Toggle */}
        <div>
          <label style={labelStyle}>Election Year</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
            {AVAILABLE_YEARS.map((y) => {
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

      {/* ANALYZE BUTTON */}
      <button
        onClick={runAnalysis}
        style={{
          padding: "10px 18px",
          background: "#2563eb",
          borderRadius: 6,
          fontWeight: 600,
          color: "white",
          border: "1px solid #1d4ed8",
          cursor: "pointer",
        }}
      >
        Run Alliance Analysis
      </button>

      {analysis && <AllianceAnalysisResults result={analysis} />}

    </div>
  );
}
