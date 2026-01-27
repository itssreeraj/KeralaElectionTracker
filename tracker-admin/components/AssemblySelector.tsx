"use client";

import React, { useEffect, useState } from "react";

export default function AssemblySelector({
  backend,
  onSelectAc,
}: {
  backend: string;
  onSelectAc: (ac: { acCode: number; name: string }) => void;
}) {
  const [districts, setDistricts] = useState<any[]>([]);
  const [districtCode, setDistrictCode] = useState<number | "">("");
  const [loksabha, setLoksabha] = useState<any[]>([]);
  const [lsCode, setLsCode] = useState<number | "">("");
  const [acCode, setAcCode] = useState<string>("");
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${backend}/v1/public/districts`)
      .then((r) => r.json())
      .then((d) => setDistricts(Array.isArray(d) ? d : []))
      .catch(() => setDistricts([]));
    fetch(`${backend}/v1/public/ls`)
      .then((r) => r.json())
      .then((d) => setLoksabha(Array.isArray(d) ? d : []))
      .catch(() => setLoksabha([]));
  }, [backend]);

  const loadByDistrict = async (code: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${backend}/v1/public/assemblies/by-district?districtCode=${code}`);
      const data = await res.json();
      setAssemblies(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  const loadByLs = async (lsCode: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${backend}/v1/public/assemblies/by-ls?lsCode=${encodeURIComponent(lsCode)}`);
      const data = await res.json();
      setAssemblies(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  const lookupByAcCode = async () => {
    if (!acCode) return;
    setLoading(true);
    try {
      const res = await fetch(`${backend}/v1/public/assembly/by-ac-code?acCode=${acCode}`);
      if (!res.ok) {
        setAssemblies([]);
        return;
      }
      const data = await res.json();
      setAssemblies([data]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 12 }}>
      {/* AC lookup */}
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 13, opacity: 0.85 }}>AC code lookup</label>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <input
            value={acCode}
            onChange={(e) => setAcCode(e.target.value)}
            placeholder="AC code (e.g. 90)"
            style={{
              width: 200,
              padding: "6px 8px",
              borderRadius: 6,
              border: "1px solid #374151",
              background: "#020617",
              color: "#f9fafb",
            }}
          />
          <button
            onClick={lookupByAcCode}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              background: "#2563eb",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Lookup
          </button>
        </div>
      </div>

      {/* District selector */}
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 13, opacity: 0.85 }}>Or pick by District</label>
        <div style={{ marginTop: 6 }}>
          <select
            value={districtCode}
            onChange={(e) => {
              const v = Number(e.target.value);
              setDistrictCode(v || "");
              if (v) loadByDistrict(v);
            }}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: 6,
              border: "1px solid #374151",
              background: "#020617",
              color: "#f9fafb",
            }}
          >
            <option value="">Select district</option>
            {districts.map((d) => (
              <option key={d.districtCode} value={d.districtCode}>
                {d.districtCode} - {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* LS Selector */}
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 13, opacity: 0.85 }}>Or pick by Loksabha</label>
        <div style={{ marginTop: 6 }}>
          <select
            value={lsCode}
            onChange={(e) => {
              const v = Number(e.target.value);
              setLsCode(v || "");
              if (v) loadByLs(v);
            }}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: 6,
              border: "1px solid #374151",
              background: "#020617",
              color: "#f9fafb",
            }}
          >
            <option value="">Select Loksabha</option>
            {loksabha.map((ls) => (
              <option key={ls.lsCode} value={ls.lsCode}>
                {ls.lsCode} - {ls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assemblies list */}
      <div style={{ marginTop: 8 }}>
        <label style={{ fontSize: 13, opacity: 0.85 }}>Assemblies</label>
        <div style={{ marginTop: 6 }}>
          {loading ? (
            <div>Loading…</div>
          ) : (
            <select
              onChange={(e) => {
                const code = Number(e.target.value);
                const sel = assemblies.find((a) => a.acCode === code);
                if (sel) onSelectAc({ acCode: sel.acCode, name: sel.name });
              }}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #374151",
                background: "#020617",
                color: "#f9fafb",
              }}
            >
              <option value="">Select assembly</option>
              {assemblies.map((a) => (
                <option key={a.acCode} value={a.acCode}>
                  {a.name} ({a.acCode})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
