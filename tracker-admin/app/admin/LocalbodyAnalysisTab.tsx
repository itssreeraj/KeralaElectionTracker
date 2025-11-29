"use client";

import React, { useEffect, useState } from "react";

type District = {
  districtCode: number;
  name: string;
};

type Localbody = {
  id: number;
  name: string;
  type: string;
};

type PartyVotes = {
  partyId: number | null;
  partyName: string | null;
  partyShortName: string | null;
  allianceId: number | null;
  allianceName: string | null;
  allianceColor: string | null;
  votes: number;
};

type AllianceVotes = {
  allianceId: number | null;
  allianceName: string | null;
  allianceColor: string | null;
  votes: number;
};

export default function LocalbodyAnalysisTab() {
  const backend =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";

  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");

  const [localbodies, setLocalbodies] = useState<Localbody[]>([]);
  const [selectedLocalbody, setSelectedLocalbody] = useState<string>("");

  const [year, setYear] = useState<number>(2024);

  const [partyVotes, setPartyVotes] = useState<PartyVotes[]>([]);
  const [allianceVotes, setAllianceVotes] = useState<AllianceVotes[]>([]);

  const [loadingLb, setLoadingLb] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [boothBreakdown, setBoothBreakdown] = useState<any[]>([]);
  const [boothTable, setBoothTable] = useState<any[]>([]);


  /* ----------------------------------------
     LOAD DISTRICTS ONCE
  ---------------------------------------- */
  useEffect(() => {
    const loadDistricts = async () => {
      try {
        const res = await fetch(`${backend}/admin/districts`);
        if (!res.ok) {
          console.error("Failed to load districts", await res.text());
          return;
        }
        const data = await res.json();
        setDistricts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error loading districts", e);
      }
    };

    loadDistricts();
  }, [backend]);

  /* ----------------------------------------
     LOAD LOCALBODIES WHEN DISTRICT CHANGES
  ---------------------------------------- */
  useEffect(() => {
    const loadLocalbodies = async () => {
      if (!selectedDistrict) {
        setLocalbodies([]);
        setSelectedLocalbody("");
        return;
      }

      setLoadingLb(true);
      setErrorMsg(null);
      try {
        const res = await fetch(
          `${backend}/admin/localbodies/by-district?name=${encodeURIComponent(
            selectedDistrict
          )}`
        );

        if (!res.ok) {
          const txt = await res.text();
          console.error("Failed to load localbodies", txt);
          setErrorMsg("Failed to load localbodies");
          setLocalbodies([]);
          return;
        }

        const data = await res.json();
        setLocalbodies(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error loading localbodies", e);
        setErrorMsg("Error loading localbodies");
        setLocalbodies([]);
      } finally {
        setLoadingLb(false);
      }
    };

    loadLocalbodies();
  }, [backend, selectedDistrict]);

  /* ----------------------------------------
     LOAD ANALYSIS
  ---------------------------------------- */
  const loadAnalysis = async () => {
    if (!selectedLocalbody) {
      alert("Please select a localbody.");
      return;
    }

    setLoadingAnalysis(true);
    setErrorMsg(null);

    const lbId = Number(selectedLocalbody);

    try {
      // PARTY-WISE
      const partyRes = await fetch(
        `${backend}/admin/analysis/localbody/party?localbodyId=${lbId}&year=${year}`
      );
      if (!partyRes.ok) {
        console.error("Party analysis failed", await partyRes.text());
        setErrorMsg("Failed to load party-wise analysis");
        setPartyVotes([]);
      } else {
        const data = await partyRes.json();
        setPartyVotes(Array.isArray(data) ? data : []);
      }

      // ALLIANCE-WISE
      const allianceRes = await fetch(
        `${backend}/admin/analysis/localbody/alliance?localbodyId=${lbId}&year=${year}`
      );
      if (!allianceRes.ok) {
        console.error("Alliance analysis failed", await allianceRes.text());
        // keep previous error if already set, or set a new one:
        setErrorMsg((prev) => prev ?? "Failed to load alliance-wise analysis");
        setAllianceVotes([]);
      } else {
        const data = await allianceRes.json();
        setAllianceVotes(Array.isArray(data) ? data : []);
      }

      // BOOTH LEVEL BREAKDOWN
      const boothRes = await fetch(
        `${backend}/admin/analysis/localbody/${lbId}/booths?year=${year}`
      );
      let raw: any[] = [];
      if (boothRes.ok) {
        raw = await boothRes.json();  // parse ONCE
        setBoothBreakdown(raw);       // reuse
      } else {
        setBoothBreakdown([]);
      }

      // Pivot
      const temp: Record<number, any> = {};

      raw.forEach((row: any[]) => {
        const [
          boothId,
          psNumber,
          psSuffix,
          boothName,
          allianceName,
          votes
        ] = row;

        if (!temp[boothId]) {
          temp[boothId] = {
            boothId,
            psNumber: psNumber + (psSuffix || ""),
            boothName,
            LDF: 0,
            UDF: 0,
            NDA: 0,
            OTH: 0,
          };
        }

        const col =
          allianceName === "LDF"
            ? "LDF"
            : allianceName === "UDF"
            ? "UDF"
            : allianceName === "NDA"
            ? "NDA"
            : "OTH";

        temp[boothId][col] += votes;
      });

      setBoothTable(Object.values(temp));

      
    } catch (e) {
      console.error("Error loading analysis", e);
      setErrorMsg("Error loading analysis");
      setPartyVotes([]);
      setAllianceVotes([]);
    } finally {
      setLoadingAnalysis(false);
    }
  };




  /* ----------------------------------------
     RENDER
  ---------------------------------------- */
  return (
    <div style={{ padding: 24, color: "white" }}>
      <h2 style={{ marginBottom: 16 }}>Localbody Analysis</h2>

      {/* DISTRICT SELECT */}
      <div style={{ marginBottom: 16 }}>
        <label>District</label>
        <select
          value={selectedDistrict}
          onChange={(e) => {
            setSelectedDistrict(e.target.value);
            setSelectedLocalbody("");
            setPartyVotes([]);
            setAllianceVotes([]);
          }}
          style={{ width: "100%", padding: 8, marginTop: 4 }}
        >
          <option value="">Select District</option>
          {districts.map((d) => (
            <option key={d.districtCode} value={d.name}>
              {d.districtCode} - {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* LOCALBODY SELECT */}
      <div style={{ marginBottom: 16 }}>
        <label>Localbody</label>
        {loadingLb ? (
          <p style={{ marginTop: 4 }}>Loading localbodies…</p>
        ) : (
          <select
            value={selectedLocalbody}
            onChange={(e) => {
              setSelectedLocalbody(e.target.value);
              setPartyVotes([]);
              setAllianceVotes([]);
            }}
            style={{ width: "100%", padding: 8, marginTop: 4 }}
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

      {/* YEAR + LOAD BUTTON */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <label>Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || 0)}
            style={{ padding: 8, marginLeft: 8, width: 100 }}
          />
        </div>

        <button
          onClick={loadAnalysis}
          disabled={!selectedLocalbody || loadingAnalysis}
          style={{
            padding: "8px 16px",
            background: "#0d6efd",
            color: "white",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            opacity: !selectedLocalbody || loadingAnalysis ? 0.6 : 1,
          }}
        >
          {loadingAnalysis ? "Loading..." : "Load Analysis"}
        </button>
      </div>

      {errorMsg && (
        <p style={{ color: "salmon", marginBottom: 16 }}>{errorMsg}</p>
      )}

      {/* PARTY-WISE TABLE */}
      {partyVotes.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3>Party-wise Votes</h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 8,
              fontSize: 14,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{ borderBottom: "1px solid #555", padding: 6 }}
                  align="left"
                >
                  Party
                </th>
                <th
                  style={{ borderBottom: "1px solid #555", padding: 6 }}
                  align="left"
                >
                  Alliance
                </th>
                <th
                  style={{ borderBottom: "1px solid #555", padding: 6 }}
                  align="right"
                >
                  Votes
                </th>
              </tr>
            </thead>
            <tbody>
              {partyVotes.map((p, idx) => (
                <tr key={idx}>
                  <td style={{ padding: 6 }}>
                    {p.partyShortName
                      ? `${p.partyShortName} – ${p.partyName}`
                      : p.partyName ?? "Independent / Unknown"}
                  </td>
                  <td style={{ padding: 6, display: "flex", alignItems: "center" }}>
                    {p.allianceName ? (
                      <>
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background: p.allianceColor ?? "#888",
                            marginRight: 8,
                          }}
                        ></div>
                        {p.allianceName}
                      </>
                    ) : (
                      "Independent / Others"
                    )}
                  </td>

                  <td style={{ padding: 6 }} align="right">
                    {p.votes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ALLIANCE-WISE TABLE */}
      {allianceVotes.length > 0 && (
        <div>
          <h3>Alliance-wise Votes</h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 8,
              fontSize: 14,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{ borderBottom: "1px solid #555", padding: 6 }}
                  align="left"
                >
                  Alliance
                </th>
                <th
                  style={{ borderBottom: "1px solid #555", padding: 6 }}
                  align="right"
                >
                  Votes
                </th>
              </tr>
            </thead>
            <tbody>
              {allianceVotes.map((a, idx) => (
                <tr key={idx}>
                  <td style={{ padding: 6, display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: a.alliance?.color ?? "#888",
                        marginRight: 8,
                      }}
                    ></div>
                    {a.alliance?.name ?? "Unaligned / Others"}
                  </td>
                  <td style={{ padding: 6 }} align="right">
                    {a.votes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {boothTable.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3>Booth-wise Alliance Breakdown</h3>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: 8,
              fontSize: 14,
            }}
          >
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #555", padding: 6 }}>PS No</th>
                <th style={{ borderBottom: "1px solid #555", padding: 6 }}>Booth Name</th>
                <th style={{ borderBottom: "1px solid #555", padding: 6 }} align="right">LDF</th>
                <th style={{ borderBottom: "1px solid #555", padding: 6 }} align="right">UDF</th>
                <th style={{ borderBottom: "1px solid #555", padding: 6 }} align="right">NDA</th>
                <th style={{ borderBottom: "1px solid #555", padding: 6 }} align="right">OTH</th>
              </tr>
            </thead>

            <tbody>
              {boothTable.map((b) => (
                <tr key={b.boothId}>
                  <td style={{ padding: 6 }}>{b.psNumber}</td>
                  <td style={{ padding: 6 }}>{b.boothName}</td>

                  <td style={{ padding: 6 }} align="right">{b.LDF}</td>
                  <td style={{ padding: 6 }} align="right">{b.UDF}</td>
                  <td style={{ padding: 6 }} align="right">{b.NDA}</td>
                  <td style={{ padding: 6 }} align="right">{b.OTH}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ALLIANCE-WISE BOOTH RANK SUMMARY */}
      {boothTable.length > 0 && (() => {

        // Prepare counters
        const summary: Record<string, { first: number; second: number; third: number }> = {
          LDF: { first: 0, second: 0, third: 0 },
          UDF: { first: 0, second: 0, third: 0 },
          NDA: { first: 0, second: 0, third: 0 },
          OTH: { first: 0, second: 0, third: 0 },
        };

        // Rank alliances for each booth
        boothTable.forEach((b) => {
          const entries = [
            ["LDF", b.LDF],
            ["UDF", b.UDF],
            ["NDA", b.NDA],
            ["OTH", b.OTH],
          ];

          // Sort by votes desc
          entries.sort((a, b) => b[1] - a[1]);

          if (entries[0]) summary[entries[0][0]].first++;
          if (entries[1]) summary[entries[1][0]].second++;
          if (entries[2]) summary[entries[2][0]].third++;
        });

        return (
          <div style={{ marginTop: 32 }}>
            <h3>Alliance-wise Booth Ranking Summary</h3>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: 8,
                fontSize: 14,
              }}
            >
              <thead>
                <tr>
                  <th style={{ borderBottom: "1px solid #555", padding: 6 }}>Alliance</th>
                  <th style={{ borderBottom: "1px solid #555", padding: 6 }} align="right">#1 Rank</th>
                  <th style={{ borderBottom: "1px solid #555", padding: 6 }} align="right">#2 Rank</th>
                  <th style={{ borderBottom: "1px solid #555", padding: 6 }} align="right">#3 Rank</th>
                </tr>
              </thead>
              <tbody>
                {["LDF", "UDF", "NDA", "OTH"].map((al) => (
                  <tr key={al}>
                    <td style={{ padding: 6 }}>{al}</td>
                    <td style={{ padding: 6 }} align="right">{summary[al].first}</td>
                    <td style={{ padding: 6 }} align="right">{summary[al].second}</td>
                    <td style={{ padding: 6 }} align="right">{summary[al].third}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}



      {partyVotes.length === 0 &&
        allianceVotes.length === 0 &&
        selectedLocalbody &&
        !loadingAnalysis && (
          <p style={{ marginTop: 16, opacity: 0.7 }}>
            No analysis data yet for this localbody/year.
          </p>
        )}
    </div>
  );
}
