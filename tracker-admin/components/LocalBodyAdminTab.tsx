"use client";

import React, { useEffect, useState } from "react";

export default function LocalbodyAdminTab({ backend }: { backend: string }) {

  const [districts, setDistricts] = useState<any[]>([]);
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [filteredAssemblies, setFilteredAssemblies] = useState<any[]>([]);
  const [acFilter, setAcFilter] = useState("");

  const [selectedAc, setSelectedAc] = useState("");
  const [booths, setBooths] = useState<any[]>([]);
  const [filteredBooths, setFilteredBooths] = useState<any[]>([]);
  const [boothFilter, setBoothFilter] = useState("");

  const [selectedBooths, setSelectedBooths] = useState<Set<number>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

  // CREATE LOCALBODY FIELDS
  const [district, setDistrict] = useState("");
  const [lbName, setLbName] = useState("");
  const [lbType, setLbType] = useState("gramapanchayat");

  /* ---------------------------------------------------
     INITIAL LOAD → Districts + Assemblies
  ----------------------------------------------------- */
  useEffect(() => {
    fetch(`${backend}/v1/public/districts`)
      .then((r) => r.json())
      .then(setDistricts);

    fetch(`${backend}/v1/public/assemblies`)
      .then((r) => r.json())
      .then((data) => {
        setAssemblies(data);
        setFilteredAssemblies(data);
      });
  }, [backend]);

  /* ---------------------------------------------------
     FILTER ASSEMBLY LIST
  ----------------------------------------------------- */
  useEffect(() => {
    const q = acFilter.toLowerCase();
    setFilteredAssemblies(
      assemblies.filter(
        (ac) =>
          String(ac.acCode).toLowerCase().includes(q) ||
          ac.name.toLowerCase().includes(q)
      )
    );
  }, [acFilter, assemblies]);

  /* ---------------------------------------------------
     LOAD BOOTHS BASED ON AC
  ----------------------------------------------------- */
  const loadBooths = () => {
    if (!selectedAc) return;

    fetch(`${backend}/v1/public/booths?acCode=${selectedAc}`)
      .then((r) => r.json())
      .then((data) => {
        setBooths(data);
        setFilteredBooths(data);
        setSelectedBooths(new Set()); // reset old selections
      });
  };

  /* ---------------------------------------------------
     FILTER BOOTHS BY SEARCH
  ----------------------------------------------------- */
  useEffect(() => {
    const q = boothFilter.toLowerCase();
    setFilteredBooths(
      booths.filter((b) =>
        (`${b.psNumber}${b.psSuffix || ""} ${b.name}`).toLowerCase().includes(q)
      )
    );
  }, [boothFilter, booths]);

  /* ---------------------------------------------------
     SHIFT-CLICK MULTISELECT
  ----------------------------------------------------- */
  const toggleBooth = (event: React.MouseEvent, boothId: number, index: number) => {
    const isShift = event.shiftKey;

    setSelectedBooths((prev) => {
      const newSet = new Set(prev);

      if (isShift && lastClickedIndex !== null) {
        const start = Math.min(lastClickedIndex, index);
        const end = Math.max(lastClickedIndex, index);

        for (let i = start; i <= end; i++) {
          newSet.add(filteredBooths[i].id);
        }
      } else {
        newSet.has(boothId) ? newSet.delete(boothId) : newSet.add(boothId);
      }

      return newSet;
    });

    setLastClickedIndex(index);
  };

  /* ---------------------------------------------------
     CREATE LOCALBODY + MAP BOOTHS
  ----------------------------------------------------- */
  const saveLocalbody = async () => {
    if (!district || !lbName || selectedBooths.size === 0) {
      alert("District, Localbody name, and booth selections are required.");
      return;
    }

    try {
      // 1. Create or fetch the localbody
      const res = await fetch(`${backend}/v1/admin/localbody`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          districtCode: Number(district),   // IMPORTANT: now districtCode
          name: lbName,
          type: lbType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(`❌ Error: ${data.error || "Unknown error"}`);
        return;
      }

      // Backend returns:  { status, message, localbody }
      const lb = data.localbody;

      if (!lb || !lb.id) {
        alert("❌ Invalid localbody response from backend");
        return;
      }

      // Show message from backend
      if (data.status === "EXISTS") {
        alert(`ℹ Existing localbody found: ${lb.name}`);
      } else if (data.status === "CREATED") {
        alert(`✔ Created localbody: ${lb.name}`);
      }

      // 2. Map booths
      const mapRes = await fetch(`${backend}/v1/admin/localbody/${lb.id}/map-booths`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boothIds: Array.from(selectedBooths) }),
      });

      if (!mapRes.ok) {
        const txt = await mapRes.text();
        alert(`❌ Booth mapping failed: ${txt}`);
        return;
      }

      alert(`✔ Booths mapped to ${lb.name} successfully`);

      // Reset form
      setLbName("");
      setDistrict("");
      setSelectedBooths(new Set());
    } catch (err: any) {
      console.error("Localbody create/mapping error", err);
      alert("Unexpected error: " + err.message);
    }
  };


  /* ---------------------------------------------------
     RENDER
  ----------------------------------------------------- */
  return (
    <div style={{ padding: 24, color: "white" }}>
      <h2>Localbody Mapping</h2>

      {/* CREATE LOCALBODY FORM */}
      <div
        style={{
          padding: 16,
          border: "1px solid #444",
          borderRadius: 6,
          marginBottom: 24,
          background: "#181818",
        }}
      >
        <h3>Create New Localbody</h3>

        <label>District</label>
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 12 }}
        >
          <option value="">Select District</option>
          {districts.map((d) => (
            <option key={d.districtCode} value={d.districtCode}>
              {d.districtCode} - {d.name}
            </option>
          ))}
        </select>

        <label>Name</label>
        <input
          value={lbName}
          onChange={(e) => setLbName(e.target.value)}
          placeholder="Localbody Name"
          style={{ width: "100%", padding: 8, marginBottom: 12 }}
        />

        <label>Type</label>
        <select
          value={lbType}
          onChange={(e) => setLbType(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 16 }}
        >
          <option value="gramapanchayat">Gramapanchayat</option>
          <option value="municipality">Municipality</option>
          <option value="corporation">Corporation</option>
        </select>
      </div>

      {/* ASSEMBLY SELECTION */}
      <label>Search Assembly Constituency</label>
      <input
        value={acFilter}
        onChange={(e) => setAcFilter(e.target.value)}
        placeholder="Type AC code or name..."
        style={{
          width: "100%",
          padding: 8,
          marginBottom: 8,
          borderRadius: 6,
        }}
      />

      <select
        value={selectedAc}
        onChange={(e) => setSelectedAc(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 16 }}
      >
        <option value="">Select AC</option>
        {filteredAssemblies.map((ac) => (
          <option key={ac.acCode} value={ac.acCode}>
            {ac.acCode} - {ac.name}
          </option>
        ))}
      </select>

      <button onClick={loadBooths} disabled={!selectedAc}>
        Load Booths
      </button>

      {/* BOOTH FILTER + SELECT ALL/NONE */}
      {booths.length > 0 && (
        <>
          <h3 style={{ marginTop: 20 }}>Booths in AC {selectedAc}</h3>

          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input
              placeholder="Search booths..."
              value={boothFilter}
              onChange={(e) => setBoothFilter(e.target.value)}
              style={{
                flex: 1,
                padding: 8,
                borderRadius: 6,
                background: "#111",
                color: "white",
              }}
            />

            <button
              onClick={() => {
                const setAll = new Set(selectedBooths);
                filteredBooths.forEach((b) => setAll.add(b.id));
                setSelectedBooths(setAll);
              }}
            >
              All
            </button>

            <button
              onClick={() => {
                const setNone = new Set(selectedBooths);
                filteredBooths.forEach((b) => setNone.delete(b.id));
                setSelectedBooths(setNone);
              }}
            >
              None
            </button>
          </div>

          {/* BOOTH LIST */}
          <div
            style={{
              maxHeight: 350,
              overflowY: "auto",
              border: "1px solid #555",
              padding: 12,
              borderRadius: 6,
              background: "#222",
              color: "white",
            }}
          >
            {filteredBooths.map((b, idx) => (
              <div key={b.id} style={{ marginBottom: 6 }}>
                <label
                  onClick={(e) => toggleBooth(e as any, b.id, idx)}
                  style={{ cursor: "pointer", userSelect: "none" }}
                >
                  <input type="checkbox" checked={selectedBooths.has(b.id)} readOnly />
                  {" "}
                  [{b.psNumber}{b.psSuffix || ""}] – {b.name}
                </label>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 8, color: "#0ff" }}>
            Selected Booths: {selectedBooths.size}
          </p>

          <button
            onClick={saveLocalbody}
            style={{
              marginTop: 20,
              padding: "10px 16px",
              background: "#28a745",
              color: "white",
              borderRadius: 6,
            }}
          >
            Save Localbody & Map Booths
          </button>
        </>
      )}
    </div>
  );
}
