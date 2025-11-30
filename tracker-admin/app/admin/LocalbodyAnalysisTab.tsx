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
  id: number | null;
  name: string | null;
  color: string | null;
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

  const [boothTable, setBoothTable] = useState<any[]>([]);

  /* LOAD DISTRICTS */
  useEffect(() => {
    const loadDistricts = async () => {
      try {
        const res = await fetch(`${backend}/admin/districts`);
        if (!res.ok) return;

        const data = await res.json();
        setDistricts(Array.isArray(data) ? data : []);
      } catch {}
    };
    loadDistricts();
  }, [backend]);

  /* LOAD LOCALBODIES WHEN DISTRICT CHANGES */
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
      } catch {
        setLocalbodies([]);
      }
      setLoadingLb(false);
    };
    loadLocalbodies();
  }, [backend, selectedDistrict]);

  /* LOAD ANALYSIS */
  const loadAnalysis = async () => {
    if (!selectedLocalbody) return;

    setLoadingAnalysis(true);
    setErrorMsg(null);
    const lbId = Number(selectedLocalbody);

    try {
      /* PARTY */
      const partyRes = await fetch(
        `${backend}/admin/analysis/localbody/party?localbodyId=${lbId}&year=${year}`
      );
      if (partyRes.ok) setPartyVotes(await partyRes.json());
      else setPartyVotes([]);

      /* ALLIANCE */
      const allianceRes = await fetch(
        `${backend}/admin/analysis/localbody/alliance?localbodyId=${lbId}&year=${year}`
      );
      if (allianceRes.ok) setAllianceVotes(await allianceRes.json());
      else setAllianceVotes([]);

      /* BOOTHS */
      const boothRes = await fetch(
        `${backend}/admin/analysis/localbody/${lbId}/booths?year=${year}`
      );
      let raw: any[] = boothRes.ok ? await boothRes.json() : [];

      const temp: Record<number, any> = {};
      raw.forEach((row) => {
        const [
          boothId,
          psNumber,
          psSuffix,
          boothName,
          allianceName,
          votes,
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
    } catch {
      setErrorMsg("Error loading analysis");
    }

    setLoadingAnalysis(false);
  };

  /* RENDER */
  return (
    <div style={{ padding: 24, color: "white" }}>
      <h2 style={{ marginBottom: 16 }}>Localbody Analysis</h2>

      {/* DISTRICT */}
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

      {/* LOCALBODY */}
      <div style={{ marginBottom: 16 }}>
        <label>Localbody</label>
        {loadingLb ? (
          <p>Loading localbodies…</p>
        ) : (
          <select
            value={selectedLocalbody}
            onChange={(e) => setSelectedLocalbody(e.target.value)}
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

      {/* YEAR + LOAD */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div>
          <label>Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
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
          }}
        >
          {loadingAnalysis ? "Loading…" : "Load Analysis"}
        </button>
      </div>

      {errorMsg && <p style={{ color: "salmon" }}>{errorMsg}</p>}

      {/* GRID LAYOUT */}
      {/* ANALYSIS CONTENT IN 2-COLUMN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "420px 1fr",
          gap: 24,
          alignItems: "start",
          marginTop: 20,
        }}
      >
        {/* LEFT COLUMN */}
        <div>
          {/* PARTY TABLE */}
          {partyVotes.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3>Party-wise Votes</h3>
              <table
                style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", marginTop: 8 }}
              >
                <thead>
                  <tr>
                    <th style={{ borderBottom: "1px solid #555", padding: 6 }}>
                      Party
                    </th>
                    <th style={{ borderBottom: "1px solid #555", padding: 6 }}>
                      Alliance
                    </th>
                    <th style={{ borderBottom: "1px solid #555", padding: 6 }}>
                      Votes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {partyVotes.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: 6 }}>{p.partyName}</td>
                      <td style={{ padding: 6 }}>{p.allianceName}</td>
                      <td style={{ padding: 6 }} align="right">
                        {p.votes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ALLIANCE TABLE */}
          {allianceVotes.length > 0 && (() => {

            const totalVotes = allianceVotes.reduce((sum, a) => sum + a.votes, 0);

            return (
              <div>
                <h3>Alliance-wise Votes</h3>

                <table
                  style={{
                    width: "100%",
                    tableLayout: "fixed",
                    borderCollapse: "collapse",
                    marginTop: 8,
                    fontSize: 14,
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ borderBottom: "1px solid #555", padding: 6 }}>
                        Alliance
                      </th>
                      <th
                        style={{ borderBottom: "1px solid #555", padding: 6 }}
                        align="right"
                      >
                        Votes
                      </th>
                      <th
                        style={{ borderBottom: "1px solid #555", padding: 6 }}
                        align="right"
                      >
                        %
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {allianceVotes.map((a, idx) => {
                      const name = a.alliance?.name ?? "Unaligned / Others";
                      const color = a.alliance?.color ?? "#888";

                      const pct = totalVotes
                        ? ((a.votes / totalVotes) * 100).toFixed(2)
                        : "0.00";

                      return (
                        <tr key={idx}>
                          <td style={{ padding: 6 }}>
                            <div style={{ display: "flex", alignItems: "center" }}>
                              <div
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: "50%",
                                  background: color,
                                  marginRight: 8,
                                }}
                              ></div>
                              {name}
                            </div>
                          </td>

                          <td style={{ padding: 6 }} align="right">
                            {a.votes}
                          </td>

                          <td style={{ padding: 6 }} align="right">
                            {pct}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}


        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* BOOTH TABLE */}
          {boothTable.length > 0 && (
            <div>
              <h3>Booth-wise Alliance Breakdown</h3>
              <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ borderBottom: "1px solid #555", padding: 6 }}>
                      PS No
                    </th>
                    <th style={{ borderBottom: "1px solid #555", padding: 6 }}>
                      Booth Name
                    </th>
                    <th style={{ borderBottom: "1px solid #555", padding: 6 }}>
                      LDF
                    </th>
                    <th style={{ borderBottom: "1px solid #555", padding: 6 }}>
                      UDF
                    </th>
                    <th style={{ borderBottom: "1px solid #555", padding: 6 }}>
                      NDA
                    </th>
                    <th style={{ borderBottom: "1px solid #555", padding: 6 }}>
                      OTH
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {boothTable.map((b) => (
                    <tr key={b.boothId}>
                      <td style={{ padding: 6 }}>{b.psNumber}</td>
                      <td
                          title={b.boothName}
                          style={{
                            padding: 6,
                            maxWidth: 200,
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {b.boothName}
                        </td>
                      <td style={{ padding: 6 }} align="right">
                        {b.LDF}
                      </td>
                      <td style={{ padding: 6 }} align="right">
                        {b.UDF}
                      </td>
                      <td style={{ padding: 6 }} align="right">
                        {b.NDA}
                      </td>
                      <td style={{ padding: 6 }} align="right">
                        {b.OTH}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* RANK SUMMARY */}
          {boothTable.length > 0 && (() => {
            const summary: any = {
              LDF: { first: 0, second: 0, third: 0 },
              UDF: { first: 0, second: 0, third: 0 },
              NDA: { first: 0, second: 0, third: 0 },
              OTH: { first: 0, second: 0, third: 0 },
            };

            boothTable.forEach((b) => {
              const arr = [
                ["LDF", b.LDF],
                ["UDF", b.UDF],
                ["NDA", b.NDA],
                ["OTH", b.OTH],
              ];
              arr.sort((a, b) => b[1] - a[1]);

              if (arr[0]) summary[arr[0][0]].first++;
              if (arr[1]) summary[arr[1][0]].second++;
              if (arr[2]) summary[arr[2][0]].third++;
            });

            return (
              <div style={{ marginTop: 32 }}>
                <h3>Alliance-wise Booth Ranking Summary</h3>
                <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ borderBottom: "1px solid #555", padding: 6 }}>
                        Alliance
                      </th>
                      <th style={{ borderBottom: "1px solid #555", padding: 6 }}>
                        #1 Rank
                      </th>
                      <th style={{ borderBottom: "1px solid #555", padding: 6 }}>
                        #2 Rank
                      </th>
                      <th style={{ borderBottom: "1px solid #555", padding: 6 }}>
                        #3 Rank
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {["LDF", "UDF", "NDA", "OTH"].map((al) => (
                      <tr key={al}>
                        <td style={{ padding: 6 }}>{al}</td>
                        <td style={{ padding: 6 }} align="right">
                          {summary[al].first}
                        </td>
                        <td style={{ padding: 6 }} align="right">
                          {summary[al].second}
                        </td>
                        <td style={{ padding: 6 }} align="right">
                          {summary[al].third}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
