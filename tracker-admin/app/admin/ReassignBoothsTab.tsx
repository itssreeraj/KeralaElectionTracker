"use client";

import React, { useEffect, useState } from "react";

export default function ReassignBoothsTab({ backend }: { backend: string }) {
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [filteredAssemblies, setFilteredAssemblies] = useState<any[]>([]);
  const [assemblySearch, setAssemblySearch] = useState("");

  const [selectedAc, setSelectedAc] = useState("");
  const [booths, setBooths] = useState<any[]>([]);
  const [filteredBooths, setFilteredBooths] = useState<any[]>([]);
  const [boothFilter, setBoothFilter] = useState("");

  const [localbodies, setLocalbodies] = useState<any[]>([]);
  const [selectedLocalbody, setSelectedLocalbody] = useState("");

  const [selectedBooths, setSelectedBooths] = useState<Set<number>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

  /* ---------------------------------------------
       LOAD ASSEMBLIES + LOCALBODIES
  ---------------------------------------------- */
  useEffect(() => {
    fetch(`${backend}/admin/assemblies`)
      .then((r) => r.json())
      .then((data) => {
        setAssemblies(data);
        setFilteredAssemblies(data);
      });

    fetch(`${backend}/admin/localbodies`)
      .then((r) => r.json())
      .then(setLocalbodies);
  }, [backend]);

  /* ---------------------------------------------
       AC FILTER
  ---------------------------------------------- */
  useEffect(() => {
    const q = assemblySearch.toLowerCase();
    setFilteredAssemblies(
      assemblies.filter(
        (ac) =>
          String(ac.acCode).toLowerCase().includes(q) ||
          ac.name.toLowerCase().includes(q)
      )
    );
  }, [assemblySearch, assemblies]);

  /* ---------------------------------------------
       LOAD BOOTHS FOR AC
  ---------------------------------------------- */
  const loadBooths = async () => {
    if (!selectedAc) return;
    const r = await fetch(`${backend}/admin/booths?acCode=${selectedAc}`);
    const data = await r.json();

    setBooths(data);
    setFilteredBooths(data);
    setSelectedBooths(new Set());
    setLastClickedIndex(null);
  };

  /* ---------------------------------------------
       BOOTH FILTER
  ---------------------------------------------- */
  useEffect(() => {
    const q = boothFilter.toLowerCase();
    setFilteredBooths(
      booths.filter((b) =>
        (`${b.psNumber}${b.psSuffix || ""} ${b.name} ${b.localbodyName || ""}`)
          .toLowerCase()
          .includes(q)
      )
    );
  }, [boothFilter, booths]);

  /* ---------------------------------------------
       SELECTION (NORMAL + SHIFT CLICK)
  ---------------------------------------------- */
  const toggleBooth = (e: React.MouseEvent, boothId: number, index: number) => {
    const isShift = e.shiftKey;

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

  /* ---------------------------------------------
       SELECT ALL / NONE (filtered only)
  ---------------------------------------------- */

  const selectAll = () => {
    const s = new Set(selectedBooths);
    filteredBooths.forEach((b) => s.add(b.id));
    setSelectedBooths(s);
  };

  const selectNone = () => {
    const s = new Set(selectedBooths);
    filteredBooths.forEach((b) => s.delete(b.id));
    setSelectedBooths(s);
  };

  /* ---------------------------------------------
        REASSIGN 
  ---------------------------------------------- */
  const reassign = async () => {
    if (!selectedLocalbody) {
      alert("Select a target localbody!");
      return;
    }
    if (selectedBooths.size === 0) {
      alert("Select at least one booth!");
      return;
    }

    const payload = {
      boothIds: Array.from(selectedBooths),
      localbodyId: Number(selectedLocalbody),
    };

    const res = await fetch(`${backend}/admin/booths/reassign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (res.ok) alert("✔ Booths reassigned successfully");
    else alert("❌ Error: " + text);

    loadBooths();
  };

  /* ---------------------------------------------
        UNASSIGN BOOTHS
  ---------------------------------------------- */
  const unassign = async () => {
    if (selectedBooths.size === 0) {
      alert("Select at least one booth!");
      return;
    }

    const payload = {
      boothIds: Array.from(selectedBooths),
      localbodyId: null,
    };

    const res = await fetch(`${backend}/admin/booths/reassign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    if (res.ok) alert("✔ Booths unassigned successfully");
    else alert("❌ Error: " + text);

    loadBooths();
  };

  /* ---------------------------------------------
        RENDER UI
  ---------------------------------------------- */
  return (
    <div style={{ padding: 24, color: "white" }}>
      <h2>Reassign Booths</h2>

      {/* Assembly Search */}
      <label>Search AC</label>
      <input
        value={assemblySearch}
        onChange={(e) => setAssemblySearch(e.target.value)}
        placeholder="Type AC code or name…"
        style={{ width: "100%", padding: 8, marginBottom: 8 }}
      />

      <select
        value={selectedAc}
        onChange={(e) => setSelectedAc(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 12 }}
      >
        <option value="">Select AC</option>
        {filteredAssemblies.map((ac) => (
          <option key={ac.acCode} value={ac.acCode}>
            {ac.acCode} – {ac.name}
          </option>
        ))}
      </select>

      <button onClick={loadBooths} disabled={!selectedAc}>
        Load Booths
      </button>

      {/* Booth Search */}
      {booths.length > 0 && (
        <>
          <h3 style={{ marginTop: 20 }}>Booths</h3>

          <input
            value={boothFilter}
            onChange={(e) => setBoothFilter(e.target.value)}
            placeholder="Search booths…"
            style={{ width: "100%", padding: 8, marginBottom: 12 }}
          />

          {/* Select All / None */}
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <button
              onClick={selectAll}
              style={{
                padding: "6px 12px",
                background: "#0d6efd",
                color: "white",
                borderRadius: 6,
              }}
            >
              All
            </button>

            <button
              onClick={selectNone}
              style={{
                padding: "6px 12px",
                background: "#dc3545",
                color: "white",
                borderRadius: 6,
              }}
            >
              None
            </button>
          </div>

          {/* Booth list */}
          <div
            style={{
              background: "#111",
              padding: 12,
              borderRadius: 6,
              maxHeight: 300,
              overflowY: "auto",
              border: "1px solid #444",
            }}
          >
            {filteredBooths.map((b, idx) => (
              <label
                key={b.id}
                style={{
                  display: "block",
                  marginBottom: 6,
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={(e) => toggleBooth(e, b.id, idx)}
              >
                <input
                  type="checkbox"
                  checked={selectedBooths.has(b.id)}
                  readOnly
                />{" "}
                [{b.psNumber}
                {b.psSuffix || ""}] — {b.name}{" "}
                {b.localbodyName && (
                  <span style={{ color: "#0af" }}>
                    (Current: {b.localbodyName})
                  </span>
                )}
              </label>
            ))}
          </div>

          <p style={{ marginTop: 8, color: "#0ff" }}>
            Selected Booths: {selectedBooths.size}
          </p>

          {/* Localbody dropdown */}
          <label>New Localbody</label>
          <select
            value={selectedLocalbody}
            onChange={(e) => setSelectedLocalbody(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 16 }}
          >
            <option value="">Select Localbody</option>
            {localbodies.map((lb) => (
              <option key={lb.id} value={lb.id}>
                {lb.name} ({lb.type})
              </option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={reassign}
              style={{
                padding: "12px 20px",
                background: "orange",
                color: "black",
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              Reassign
            </button>

            <button
              onClick={unassign}
              style={{
                padding: "12px 20px",
                background: "#ff4444",
                color: "white",
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              Unassign
            </button>
          </div>
        </>
      )}
    </div>
  );
}
