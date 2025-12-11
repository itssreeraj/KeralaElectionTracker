"use client";

import React, { useEffect, useState, useMemo } from "react";

export default function WardAssemblyMappingTab({ backend }: { backend: string }) {

    console.log("WardAssemblyMappingTab mounted");
  /* ================== STATE ===================== */
  const [districts, setDistricts] = useState<any[]>([]);
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

  /* ================== LOAD DISTRICTS ===================== */
  useEffect(() => {
    fetch(`${backend}/admin/districts`)
      .then((r) => r.json())
      .then((d) => setDistricts(Array.isArray(d) ? d : []));
  }, [backend]);

  /* ================== LOAD ASSEMBLIES BY DISTRICT ===================== */
  const loadAssemblies = async (code: number) => {
    const res = await fetch(`${backend}/admin/assemblies/by-district?districtCode=${code}`);
    const data = await res.json();
    setAssemblies(Array.isArray(data) ? data : []);
  };

  /* ================== LOAD LOCALBODIES BY DISTRICT ===================== */
  const loadLocalbodies = async (d: any) => {
    if (!d?.name) return;
    const res = await fetch(`${backend}/admin/localbodies/by-district?name=${encodeURIComponent(d.name)}`);
    const data = await res.json();
    setLocalbodies(Array.isArray(data) ? data : []);
  };

  /* ================== FILTERED LOCALBODIES ===================== */
  const filteredLocalbodies = useMemo(() => {
    let list = localbodies;
    if (selectedType) list = list.filter((lb: any) => lb.type === selectedType);
    if (lbSearch.trim() !== "")
      list = list.filter((lb: any) => lb.name.toLowerCase().includes(lbSearch.toLowerCase()));
    return list;
  }, [localbodies, selectedType, lbSearch]);

  /* ================== LOAD WARDS ===================== */
  const loadWards = async () => {
    if (!selectedLocalbody || !delimitationYear) {
      alert("Select localbody and delimitation year");
      return;
    }

    setLoadingWards(true);
    setSelectedWardIds([]);

    try {
      const res = await fetch(
        `${backend}/admin/wards/by-localbody?localbodyId=${selectedLocalbody}&delimitationYear=${delimitationYear}`
      );
      const data = await res.json();
      setWards(Array.isArray(data) ? data : []);
    } catch (e) {
      setWards([]);
    }

    setLoadingWards(false);
  };

  /* ================== WARD SELECTION HANDLING ===================== */

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

  /* ================== ASSIGN WARDS ===================== */
  const assignWards = async () => {
    if (!selectedAcCode) return alert("Select an Assembly");
    if (!delimitationYear) return alert("Enter delimitation year");
    if (selectedWardIds.length === 0) return alert("Select at least 1 ward");

    const payload = {
      wardIds: selectedWardIds,
      acCode: selectedAcCode,
      delimitationYear,
    };

    const res = await fetch(`${backend}/admin/wards/assign-assembly`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert("Failed to assign");
    } else {
      alert("Assigned successfully");
      loadWards(); // reload
    }
  };

  /* ================== UI ===================== */

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Ward → Assembly Mapping</h2>

      {/* ------------------- FILTER SECTION ------------------- */}
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
          <label>District</label>
          <select
            value={districtCode}
            onChange={(e) => {
              const val = Number(e.target.value);
              setDistrictCode(val);
              setSelectedAcCode(null);
              setAssemblies([]);
              setLocalbodies([]);
              setSelectedLocalbody(null);

              const dist = districts.find((d) => d.districtCode === val);
              if (dist) {
                loadAssemblies(val);
                loadLocalbodies(dist);
              }
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

        {/* ASSEMBLY */}
        <div>
          <label>Assembly</label>
          <select
            value={selectedAcCode ?? ""}
            onChange={(e) => setSelectedAcCode(Number(e.target.value))}
            style={selectStyle}
          >
            <option value="">Select Assembly</option>
            {assemblies.map((a) => (
              <option key={a.acCode} value={a.acCode}>
                {a.name} ({a.acCode})
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
            <option value="Municipality">Municipality</option>
            <option value="Corporation">Corporation</option>
            <option value="grama_panchayath">Grama Panchayath</option>
            <option value="block_panchayath">Block Panchayath</option>
            <option value="district_panchayath">District Panchayath</option>
          </select>
        </div>

        {/* LOCALBODY SEARCH */}
        <div>
          <label>Search Localbody</label>
          <input
            value={lbSearch}
            onChange={(e) => setLbSearch(e.target.value)}
            placeholder="Type to filter..."
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
          <input
            type="number"
            value={delimitationYear}
            onChange={(e) => setDelimitationYear(Number(e.target.value))}
            style={selectStyle}
            placeholder="e.g. 2020"
          />
        </div>

        {/* LOAD WARDS BUTTON */}
        <div style={{ gridColumn: "1 / span 2", marginTop: 10 }}>
          <button
            onClick={loadWards}
            style={blueButton}
            disabled={!selectedLocalbody || !delimitationYear}
          >
            {loadingWards ? "Loading Wards…" : "Load Wards"}
          </button>
        </div>
      </div>

      {/* ------------------- WARD TABLE ------------------- */}
      {wards.length > 0 && (
        <div>
          <h3 style={{ marginBottom: 6 }}>Wards ({wards.length})</h3>

          {/* Select all / none */}
          <div style={{ marginBottom: 8 }}>
            <button onClick={selectAll} style={tinyButton}>
              Select All
            </button>
            <button onClick={selectNone} style={tinyButton}>
              None
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Ward #</th>
                  <th style={th}>Name</th>
                  <th style={th}>Delimitation</th>
                  <th style={th}>Current AC</th>
                </tr>
              </thead>

              <tbody>
                {wards.map((w, idx) => {
                  const selected = selectedWardIds.includes(w.id);
                  return (
                    <tr
                      key={w.id}
                      style={{
                        background: selected ? "#0d6efd33" : "transparent",
                        cursor: "pointer",
                      }}
                      onClick={(e) => toggleWard(w.id, idx, e.shiftKey)}
                    >
                      <td style={td}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => toggleWard(w.id, idx, e.shiftKey)}
                        />
                      </td>
                      <td style={td}>{w.wardNum}</td>
                      <td style={td}>{w.wardName}</td>
                      <td style={td}>{w.delimitationYear}</td>
                      <td style={td}>{w.assemblyCode ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Assign button */}
          <div style={{ marginTop: 16 }}>
            <button onClick={assignWards} style={greenButton}>
              Assign to Assembly ({selectedAcCode})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== SMALL STYLE HELPERS ===================== */

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

const blueButton: React.CSSProperties = {
  padding: "8px 12px",
  background: "#0d6efd",
  borderRadius: 6,
  color: "white",
  border: "none",
  cursor: "pointer",
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
