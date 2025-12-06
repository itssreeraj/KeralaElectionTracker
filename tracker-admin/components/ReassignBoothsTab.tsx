"use client";

import React, { useEffect, useState } from "react";

type District = {
  districtCode: number;
  name: string;
};

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
  const [loadingLb, setLoadingLb] = useState(false);

  const [selectedBooths, setSelectedBooths] = useState<Set<number>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

  const [lbDistrictFilter, setLbDistrictFilter] = useState("");
  const [lbTypeFilter, setLbTypeFilter] = useState<string[]>([]);
  const [lbSearch, setLbSearch] = useState("");
  const [filteredLocalbodies, setFilteredLocalbodies] = useState<any[]>([]);

  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedDistrict, setSelectedDistrict] = useState("");


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

  /* -------- LOAD DISTRICTS -------- */
  useEffect(() => {
    const loadDistricts = async () => {
      try {
        const res = await fetch(`${backend}/admin/districts`);
        if (!res.ok) return;
        const data = await res.json();
        setDistricts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error loading districts", e);
      }
    };
    loadDistricts();
  }, [backend]);

  /* -------- LOAD LOCALBODIES WHEN DISTRICT CHANGES -------- */
  useEffect(() => {
    const loadLocalbodies = async () => {
      if (!selectedDistrict) {
        setLocalbodies([]);
        setFilteredLocalbodies([]);
        return;
      }

      setLoadingLb(true);

      try {
        const res = await fetch(
          `${backend}/admin/localbodies/by-district?name=${encodeURIComponent(
            selectedDistrict
          )}`
        );

        if (!res.ok) {
          setLocalbodies([]);
          setFilteredLocalbodies([]);
          return;
        }

        const data = await res.json();
        setLocalbodies(Array.isArray(data) ? data : []);
        setFilteredLocalbodies(Array.isArray(data) ? data : []);

        // ALSO build type list from the filtered localbodies
        const types = [
          ...new Set(
            (Array.isArray(data) ? data : [])
              .map((lb: any) => lb.type)
              .filter((t: string) => t && t.trim())
          ),
        ].sort();

        setAvailableTypes(types);

      } catch (e) {
        console.error("Error loading localbodies", e);
        setLocalbodies([]);
        setFilteredLocalbodies([]);
      }

      setLoadingLb(false);
    };

    loadLocalbodies();
  }, [backend, selectedDistrict]);

  useEffect(() => {
    if (!localbodies.length) return;

    const districts = Array.from(
      new Set(
        localbodies
          .map(lb => lb.districtName)
          .filter(name => name && name.trim() !== "")
      )
    ).sort();

    const types = Array.from(
      new Set(localbodies.map(lb => lb.type))
    ).sort();

    setAvailableDistricts(districts);
    setAvailableTypes(types);
  }, [localbodies]);

  /* -------- APPLY TYPE + TEXT FILTER -------- */
  useEffect(() => {
    let list = [...localbodies];

    // Type filter
    if (selectedTypes.size > 0) {
      list = list.filter((lb) => selectedTypes.has(lb.type));
    }

    // Text search
    if (lbSearch.trim()) {
      const q = lbSearch.toLowerCase();
      list = list.filter(
        (lb) =>
          lb.name.toLowerCase().includes(q) ||
          lb.type.toLowerCase().includes(q)
      );
    }

    setFilteredLocalbodies(list);
  }, [lbSearch, selectedTypes, localbodies]);

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

          {/* DISTRICT FILTER */}
          <div style={{ marginTop: 20 }}>
            <label style={{ fontWeight: 600 }}>District</label>

            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                marginTop: 6,
                marginBottom: 16,
              }}
            >
              <option value="">All Districts</option>

              {districts.map((d) => (
                <option key={d.districtCode} value={d.name}>
                  {d.districtCode} – {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* TYPE FILTER */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600 }}>Localbody Type</label>

            <div
              style={{
                background: "#111",
                padding: 10,
                borderRadius: 6,
                border: "1px solid #333",
                maxHeight: 150,
                overflowY: "auto",
                marginTop: 6,
              }}
            >
              {availableTypes.map((t) => (
                <label
                  key={t}
                  style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.has(t)}
                    onChange={() =>
                      setSelectedTypes((prev) => {
                        const next = new Set(prev);
                        next.has(t) ? next.delete(t) : next.add(t);
                        return next;
                      })
                    }
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>

          {/* LOCALBODY TEXT SEARCH */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 600 }}>Search Localbody</label>
            <input
              type="text"
              value={lbSearch}
              onChange={(e) => setLbSearch(e.target.value)}
              placeholder="Type localbody name\u2026"
              style={{
                width: "100%",
                padding: 8,
                marginTop: 6,
                background: "#111",
                color: "white",
                borderRadius: 6,
                border: "1px solid #333",
              }}
            />
          </div>

          {/* Localbody dropdown */}
          <label>New Localbody</label>
          <select
            value={selectedLocalbody}
            onChange={(e) => setSelectedLocalbody(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 12 }}
          >
            <option value="">Select Localbody</option>
            {filteredLocalbodies.map((lb) => (
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
