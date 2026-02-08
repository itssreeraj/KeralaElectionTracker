"use client";

import React, { useEffect, useMemo, useState } from "react";
import DistrictSelector from "./DistrictSelector";

const DELIM_YEARS = [2009, 2010, 2025];

export default function WardAssemblyMappingAdminTab({ backend }: { backend: string }) {
  /* --------------------- STATE --------------------- */
  const [districtCode, setDistrictCode] = useState<number | "">("");

  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [selectedAcCode, setSelectedAcCode] = useState<number | null>(null);

  const [localbodies, setLocalbodies] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [lbSearch, setLbSearch] = useState("");
  const [selectedLocalbody, setSelectedLocalbody] = useState<number | null>(null);

  const [delimitationYear, setDelimitationYear] = useState<number | "">("");

  const [wards, setWards] = useState<any[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);

  const [selectedWardIds, setSelectedWardIds] = useState<number[]>([]);
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

  /* ---- Assembly mapped wards ---- */
  const [mappedWards, setMappedWards] = useState<any[]>([]);
  const [loadingMapped, setLoadingMapped] = useState(false);
  const [expandedLbs, setExpandedLbs] = useState<Record<string, boolean>>({});

  const sortAssembliesByCode = (list: any[]) =>
    [...list].sort((a, b) => Number(a.acCode) - Number(b.acCode));

  /* =============================================================
      LOAD ASSEMBLIES
     ============================================================= */
  const loadAssemblies = async (code: number) => {
    const res = await fetch(`/v1/public/assemblies/by-district?districtCode=${code}`);
    const data = await res.json();
    setAssemblies(sortAssembliesByCode(Array.isArray(data) ? data : []));
  };

  /* =============================================================
      LOAD LOCALBODIES
     ============================================================= */
  const loadLocalbodies = async (districtName: string) => {
    const res = await fetch(
      `v1/public/localbodies/by-district?name=${encodeURIComponent(districtName)}`
    );
    setLocalbodies(await res.json());
  };

  /* =============================================================
      FILTER LOCALBODIES (for localbody-based ward load)
     ============================================================= */
  const filteredLocalbodies = useMemo(() => {
    let list = localbodies;
    if (selectedType) list = list.filter((lb: any) => lb.type === selectedType);
    if (lbSearch.trim())
      list = list.filter((lb: any) =>
        lb.name.toLowerCase().includes(lbSearch.toLowerCase())
      );
    return list;
  }, [localbodies, selectedType, lbSearch]);

  /* =============================================================
      LOAD WARDS (LOCALBODY)
     ============================================================= */
  const loadWards = async () => {
    if (!selectedLocalbody || !delimitationYear) {
      alert("Select localbody and delimitation year");
      return;
    }

    setLoadingWards(true);
    setSelectedWardIds([]);

    try {
      const res = await fetch(
        `v1/public/wards/by-localbody?localbodyId=${selectedLocalbody}&delimitationYear=${delimitationYear}`
      );
      setWards(await res.json());
    } catch {
      setWards([]);
    }

    setLoadingWards(false);
  };

  /* =============================================================
      LOAD WARDS (ASSEMBLY)
      ✔ Localbody type filter applied SERVER-SIDE
      ✔ Clears stale data on reload
     ============================================================= */
  const loadMappedWards = async () => {
    if (!selectedAcCode || !delimitationYear) {
      alert("Select assembly and delimitation year");
      return;
    }

    setLoadingMapped(true);
    setMappedWards([]); // IMPORTANT: clear stale data

    const params = new URLSearchParams({
      acCode: String(selectedAcCode),
      delimitationYear: String(delimitationYear),
    });

    if (selectedType) {
      params.append("types", selectedType);
    }

    try {
      const res = await fetch(`/v1/public/wards/by-assembly?${params}`);
      setMappedWards(await res.json());
    } catch {
      setMappedWards([]);
    }

    setLoadingMapped(false);
  };

  /* =============================================================
      AUTO-RELOAD mapped wards when type changes (FIX)
     ============================================================= */
  useEffect(() => {
    if (selectedAcCode && delimitationYear) {
      setMappedWards([]);
      loadMappedWards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);


  /* =============================================================
      WARD SELECTION
     ============================================================= */
  const toggleWard = (wardId: number, index: number, shiftKey: boolean) => {
    if (shiftKey && lastClickedIndex !== null) {
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      const range = wards.slice(start, end + 1).map((w) => w.id);
      setSelectedWardIds(range);
    } else {
      setSelectedWardIds((prev) =>
        prev.includes(wardId) ? prev.filter((id) => id !== wardId) : [...prev, wardId]
      );
    }
    setLastClickedIndex(index);
  };

  const selectAll = () => setSelectedWardIds(wards.map((w) => w.id));
  const selectNone = () => setSelectedWardIds([]);

  /* =============================================================
      ASSIGN WARDS
     ============================================================= */
  const assignWards = async () => {
    if (!selectedAcCode || !delimitationYear || selectedWardIds.length === 0)
      return alert("Missing selection");

    await fetch(`/v1/admin/wards/assign-assembly`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wardIds: selectedWardIds,
        acCode: selectedAcCode,
        delimitationYear,
      }),
    });

    alert("Assigned successfully");
    loadWards();
  };

  /* =============================================================
      GROUP ASSEMBLY-MAPPED WARDS (Type → Localbody)
     ============================================================= */
  const groupedMapped = useMemo(() => {
    const map: any = {};
    mappedWards.forEach((w) => {
      map[w.localbodyType] ??= {};
      map[w.localbodyType][w.localbodyName] ??= [];
      map[w.localbodyType][w.localbodyName].push(w);
    });
    return map;
  }, [mappedWards]);

  /* =============================================================
      UI
     ============================================================= */
  return (
    <div style={{ padding: 16, color: "white" }}>
      <h2 style={{ marginBottom: 12 }}>Ward → Assembly Mapping</h2>

      {/* ---------------- FILTER ---------------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* DISTRICT */}
        <div>
          <DistrictSelector
            backend={backend}
            emptyLabel="Select District"
            selectedCode={districtCode}
            onSelectDistrict={(district) => {
              setDistrictCode(district ? district.districtCode : "");
              setSelectedAcCode(null);
              setLocalbodies([]);
              setAssemblies([]);
              setSelectedLocalbody(null);
              setMappedWards([]); // reset
              if (district) {
                loadAssemblies(district.districtCode);
                loadLocalbodies(district.name);
              }
            }}
          />
        </div>

        {/* ASSEMBLY */}
        <div>
          <label>Assembly</label>
          <select
            value={selectedAcCode ?? ""}
            onChange={(e) => {
              setSelectedAcCode(Number(e.target.value));
              setMappedWards([]); // reset
            }}
            style={selectStyle}
          >
            <option value="">Select Assembly</option>
            {assemblies.map((a) => (
              <option key={a.acCode} value={a.acCode}>
                {a.acCode} - {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* LOCALBODY TYPE */}
        <div>
          <label>Localbody Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={selectStyle}
          >
            <option value="">All Types</option>
            <option value="grama_panchayath">Grama Panchayath</option>
            <option value="block_panchayath">Block Panchayath</option>
            <option value="district_panchayath">District Panchayath</option>
            <option value="municipality">Municipality</option>
            <option value="corporation">Corporation</option>
          </select>
        </div>

        {/* SEARCH LOCALBODY */}
        <div>
          <label>Search Localbody</label>
          <input
            value={lbSearch}
            onChange={(e) => setLbSearch(e.target.value)}
            placeholder="Search localbody…"
            style={selectStyle}
          />
        </div>

        {/* LOCALBODY */}
        <div>
          <label>Localbody</label>
          <select
            value={selectedLocalbody ?? ""}
            onChange={(e) => setSelectedLocalbody(Number(e.target.value))}
            style={selectStyle}
          >
            <option value="">Select Localbody</option>
            {filteredLocalbodies.map((lb) => (
              <option key={lb.id} value={lb.id}>
                {lb.name} ({lb.type})
              </option>
            ))}
          </select>
        </div>

        {/* DELIMITATION YEAR */}
        <div>
          <label>Delimitation Year</label>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            {DELIM_YEARS.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setDelimitationYear(y)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border:
                    delimitationYear === y ? "1px solid #0d6efd" : "1px solid #555",
                  background:
                    delimitationYear === y ? "#0d6efd33" : "transparent",
                  color: "#fff",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div style={{ gridColumn: "1 / span 2", marginTop: 10 }}>
          <button onClick={loadWards} style={blueButton}>
            {loadingWards ? "Loading…" : "Load Wards"}
          </button>
          <button onClick={loadMappedWards} style={greenButton}>
            {loadingMapped ? "Loading…" : "Load Assembly Mapped Wards"}
          </button>
        </div>
      </div>

      {/* ---------------- LOCALBODY WARDS ---------------- */}
      {wards.length > 0 && (
        <div>
          <h3 style={{ marginBottom: 6 }}>Wards ({wards.length})</h3>

          <div style={{ marginBottom: 8 }}>
            <button onClick={selectAll} style={tinyButton}>Select All</button>
            <button onClick={selectNone} style={tinyButton}>None</button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}></th>
                <th style={th}>Ward #</th>
                <th style={th}>Name</th>
                <th style={th}>Current AC</th>
              </tr>
            </thead>
            <tbody>
              {wards.map((w, idx) => {
                const selected = selectedWardIds.includes(w.id);
                return (
                  <tr
                    key={w.id}
                    style={{ background: selected ? "#0d6efd33" : "transparent" }}
                    onClick={(e) => toggleWard(w.id, idx, e.shiftKey)}
                  >
                    <td style={td}>
                      <input type="checkbox" checked={selected} readOnly />
                    </td>
                    <td style={td}>{w.wardNum}</td>
                    <td style={td}>{w.wardName}</td>
                    <td style={td}>{w.ac?.name ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: 16 }}>
            <button onClick={assignWards} style={greenButton}>
              Assign Selected
            </button>
          </div>
        </div>
      )}

      {/* ---------------- ASSEMBLY MAPPED WARDS (TABLE VIEW) ---------------- */}
      {Object.keys(groupedMapped).length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3>Wards Mapped to Assembly</h3>

          {Object.entries(groupedMapped).map(([type, lbs]: any) => (
            <div key={type} style={{ marginTop: 16 }}>
              {!selectedType && (
                <h4 style={{ color: "#93c5fd" }}>
                  {type.replaceAll("_", " ").toUpperCase()}
                </h4>
              )}

              {Object.entries(lbs).map(([lbName, ws]: any) => {
                const lbKey = `${type}::${lbName}`;
                const expanded = !!expandedLbs[lbKey];
                return (
                  <div key={lbKey} style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <strong style={{ fontSize: 13 }}>{lbName}</strong>
                        <span style={{ color: "#93c5fd", fontSize: 12 }}>{ws.length} wards</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedLbs((p) => ({ ...p, [lbKey]: !p[lbKey] }))}
                        style={{ ...tinyButton, padding: "4px 8px" }}
                      >
                        {expanded ? "Hide" : "Show"}
                      </button>
                    </div>

                    {expanded && (
                      <table style={compactTable}>
                        <tbody>
                          {ws.map((w: any) => (
                            <tr key={w.id ?? w.wardId ?? w.wardNum}>
                              <td style={compactTd}>{w.wardNum}</td>
                              <td style={compactTd}>{w.wardName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =============================================================
      STYLE HELPERS (UNCHANGED)
   ============================================================= */

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  marginTop: 6,
  borderRadius: 6,
  border: "1px solid #374151",
  background: "#020617",
  color: "#f9fafb",
  fontSize: 14,
};

const th: React.CSSProperties = {
  padding: 6,
  borderBottom: "1px solid #374151",
  textAlign: "left",
};

const td: React.CSSProperties = {
  padding: 6,
  borderBottom: "1px solid #111827",
};

const compactTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 6,
  fontSize: 13,
};

const compactTd: React.CSSProperties = {
  padding: "4px 6px",
  borderBottom: "1px solid #111827",
  fontSize: 13,
};

const blueButton: React.CSSProperties = {
  padding: "8px 12px",
  background: "#2563eb",
  borderRadius: 6,
  color: "white",
  border: "none",
  cursor: "pointer",
  marginRight: 10,
};

const greenButton: React.CSSProperties = {
  padding: "10px 18px",
  background: "#059669",
  borderRadius: 6,
  color: "white",
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
};

const tinyButton: React.CSSProperties = {
  padding: "4px 10px",
  marginRight: 10,
  borderRadius: 6,
  border: "1px solid #374151",
  background: "#1f2937",
  color: "white",
  cursor: "pointer",
};
