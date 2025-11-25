"use client";

import React, { useEffect, useState } from "react";

export default function LocalbodyAnalysisTab({ backend }: { backend: string }) {
  const [districts, setDistricts] = useState<any[]>([]);
  const [localbodies, setLocalbodies] = useState<any[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedLocalbody, setSelectedLocalbody] = useState("");
  const [year, setYear] = useState(2024);

  const [analysis, setAnalysis] = useState<any | null>(null);

  /* Load Districts initially */
  useEffect(() => {
    fetch(`${backend}/admin/districts`)
      .then((r) => r.json())
      .then(setDistricts);
  }, []);

  /* Load localbodies when district changes */
  useEffect(() => {
    if (!selectedDistrict) return;

    fetch(`${backend}/admin/localbodies/by-district?name=${selectedDistrict}`)
      .then((r) => r.json())
      .then(setLocalbodies);
  }, [selectedDistrict]);

  /* Load analysis */
  const loadAnalysis = () => {
    if (!selectedLocalbody) {
      alert("Select a localbody");
      return;
    }

    fetch(
      `${backend}/admin/analysis/localbody?localbodyId=${selectedLocalbody}&year=${year}`
    )
      .then((r) => r.json())
      .then(setAnalysis);
  };

  return (
    <div style={{ padding: 24, color: "white" }}>
      <h2>Localbody Vote Analysis</h2>

      {/* District */}
      <label>District</label>
      <select
        value={selectedDistrict}
        onChange={(e) => setSelectedDistrict(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 12 }}
      >
        <option value="">Select District</option>
        {districts.map((d) => (
          <option key={d.districtCode} value={d.name}>
            {d.districtCode} - {d.name}
          </option>
        ))}
      </select>

      {/* Localbody */}
      <label>Localbody</label>
      <select
        value={selectedLocalbody}
        onChange={(e) => setSelectedLocalbody(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 12 }}
      >
        <option value="">Select Localbody</option>
        {localbodies.map((lb) => (
          <option key={lb.id} value={lb.id}>
            {lb.name} ({lb.type})
          </option>
        ))}
      </select>

      {/* Year */}
      <label>Election Year</label>
      <select
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        style={{ width: "100%", padding: 8, marginBottom: 12 }}
      >
        <option value={2024}>2024</option>
      </select>

      <button
        onClick={loadAnalysis}
        style={{
          padding: "10px 16px",
          background: "#0d6efd",
          color: "white",
          borderRadius: 8,
        }}
      >
        Load Analysis
      </button>

      {/* Analysis Output */}
      {analysis && (
        <div style={{ marginTop: 30 }}>
          <h3>Votes by Party</h3>
          <table style={{ width: "100%", background: "#111", marginBottom: 30 }}>
            <tbody>
              {analysis.partyVotes.map((row: any) => (
                <tr key={row.party}>
                  <td>{row.party}</td>
                  <td>{row.votes}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Votes by Alliance</h3>
          <table style={{ width: "100%", background: "#111" }}>
            <tbody>
              {analysis.allianceVotes.map((row: any) => (
                <tr key={row.alliance}>
                  <td>{row.alliance}</td>
                  <td>{row.votes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
