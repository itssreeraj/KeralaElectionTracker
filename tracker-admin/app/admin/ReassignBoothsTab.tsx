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
       AC SEARCH FILTER
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
       LOAD BOOTHS FROM AC
  ---------------------------------------------- */
  const loadBooths = async () => {
    if (!selectedAc) return;

    const r = await fetch(`${backend}/admin/booths?acCode=${selectedAc}`);
    const data = await r.json();

    setBooths(data);
    setFilteredBooths(data);
    setSelectedBooths(new Set());
  };

  /* ---------------------------------------------
       FILTER BOOTHS
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
       SELECT / UNSELECT
  ---------------------------------------------- */
  const toggleBooth = (id: number) => {
    setSelectedBooths((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  /* ---------------------------------------------
        SUBMIT REASSIGNMENT
  ---------------------------------------------- */
  const reassign = async () => {
    if (!selectedLocalbody || selectedBooths.size === 0) {
      alert("Select target localbody and booths.");
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

          {/* Booth list */}
          <div
            style={{
              background: "#111",
              padding: 12,
              borderRadius: 6,
              maxHeight: 250,
              overflowY: "auto",
              border: "1px solid #444",
            }}
          >
            {filteredBooths.map((b) => (
              <label
                key={b.id}
                style={{
                  display: "block",
                  marginBottom: 6,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedBooths.has(b.id)}
                  onChange={() => toggleBooth(b.id)}
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
            Reassign Booths
          </button>
        </>
      )}
    </div>
  );
}
