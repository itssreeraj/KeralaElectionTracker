"use client";

import React, { useEffect, useState } from "react";

type Assembly = {
  id: number;
  acCode: number;
  name: string;
  ls?: LokSabha;
  district?: District;
};

type LokSabha = {
  id: number;
  lsCode: number;
  name: string;
};

type District = {
  id: number;
  districtCode: number;
  name: string;
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 12,
  fontWeight: 600,
  color: "#9ca3af",
  borderBottom: "1px solid #333",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  verticalAlign: "middle",
};

export default function ConstituencyMappingAdminTab({ backend }: { backend: string }) {
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [lsList, setLsList] = useState<LokSabha[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [search, setSearch] = useState("");

  // Load all data
  useEffect(() => {
    fetch(`${backend}/public/assemblies`)
      .then(r => r.json())
      .then(setAssemblies);

    fetch(`${backend}/public/ls`)
      .then(r => r.json())
      .then(data => {
        data.sort((a: any, b: any) => a.lsCode - b.lsCode);
        setLsList(data);
      });

    fetch(`${backend}/public/districts`)
      .then(r => r.json())
      .then(data => {
        data.sort((a: any, b: any) => a.districtCode - b.districtCode);
        setDistricts(data);
      });
  }, [backend]);

  const updateAssembly = async (id: number, lsCode?: number, districtCode?: number) => {
    await fetch(`${backend}/admin/assemblies/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lsCode, districtCode }),
    });
  };

  return (
    <div style={{ padding: 24, color: "white" }}>
      <h2>Constituency Mapping</h2>

      <h3 style={{ marginTop: 20, marginBottom: 8 }}>
        Assembly → Lok Sabha & District Mapping
      </h3>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          paddingBottom: 10,
          borderBottom: "1px solid #333",
        }}
      >
        <div style={{ minWidth: 280 }}>
          <label style={{ fontSize: 11, color: "#9ca3af" }}>
            Search Assembly
          </label>
          <input
            placeholder="AC code or Assembly name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              marginTop: 6,
              background: "#0b0b0b",
              border: "1px solid #333",
              borderRadius: 6,
              color: "white",
              fontSize: 12,
            }}
          />
        </div>
      </div>

      <div
        style={{
          maxHeight: 520,
          overflowY: "auto",
          background: "#0b0b0b",
          border: "1px solid #333",
          borderRadius: 8,
        }}
      >

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          {/* Sticky Header */}
          <thead
            style={{
              position: "sticky",
              top: 0,
              background: "#111",
              zIndex: 1,
            }}
          >
            <tr>
              <th style={thStyle}>AC Code</th>
              <th style={thStyle}>Assembly Name</th>
              <th style={thStyle}>Lok Sabha</th>
              <th style={thStyle}>District</th>
            </tr>
          </thead>

          <tbody>
            {assemblies
              .filter(ac => 
                String(ac.acCode).includes(search) ||
                ac.name.toLowerCase().includes(search.toLowerCase())
              )
              .sort((a, b) => a.acCode - b.acCode)
              .map((ac) => (
                <tr
                  key={ac.id}
                  style={{
                    borderBottom: "1px solid #1f1f1f",
                  }}
                >
                  {/* AC Code */}
                  <td style={tdStyle}>
                    <b>{ac.acCode}</b>
                  </td>

                  {/* Assembly Name */}
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{ac.name}</div>
                    <div style={{ fontSize: 11, color: "#777" }}>
                      ID: {ac.id}
                    </div>
                  </td>

                  {/* Lok Sabha Mapping */}
                  <td style={tdStyle}>
                    <select
                      defaultValue={ac.ls?.lsCode || ""}
                      onChange={(e) =>
                        updateAssembly(ac.id, Number(e.target.value) || undefined, ac.district?.districtCode)
                      }
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        background: "#0b0b0b",
                        border: "1px solid #333",
                        borderRadius: 6,
                        color: "white",
                        fontSize: 12,
                      }}
                    >
                      <option value="">— Unassigned —</option>
                      {lsList.map((ls) => (
                        <option key={ls.id} value={ls.lsCode}>
                          {ls.lsCode} – {ls.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* District Mapping */}
                  <td style={tdStyle}>
                    <select
                      defaultValue={ac.district?.districtCode || ""}
                      onChange={(e) =>
                        updateAssembly(ac.id, ac.ls?.lsCode, Number(e.target.value) || undefined)
                      }
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        background: "#0b0b0b",
                        border: "1px solid #333",
                        borderRadius: 6,
                        color: "white",
                        fontSize: 12,
                      }}
                    >
                      <option value="">— Unassigned —</option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.districtCode}>
                          {d.districtCode} – {d.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
        * Changes are saved instantly. Mapping is stored in Assembly Constituency master table.
      </p>
    </div>
  );
}


