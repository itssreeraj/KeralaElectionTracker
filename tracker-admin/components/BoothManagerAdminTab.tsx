"use client";

import React, { useEffect, useState } from "react";
import { AVAILABLE_YEARS as ANALYSIS_YEARS } from "../lib/constants";

export default function BoothManagerAdminTab({ backend }: { backend: string }) {
  const [districts, setDistricts] = useState<any[]>([]);
  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [filteredAssemblies, setFilteredAssemblies] = useState<any[]>([]);
  const [assemblySearch, setAssemblySearch] = useState("");

  const [localbodies, setLocalbodies] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [booths, setBooths] = useState<any[]>([]);

  const [loadingBooths, setLoadingBooths] = useState(false);
  
  const [filteredLocalbodies, setFilteredLocalbodies] = useState<any[]>([]);
  const [localbodySearch, setLocalbodySearch] = useState("");

  const [lbTypes, setLbTypes] = useState<string[]>([]);
  const [selectedLbTypes, setSelectedLbTypes] = useState<Set<string>>(new Set());

  const [year, setYear] = useState<number>(ANALYSIS_YEARS[0] ?? 2024);

  // Form fields for create-booth
  const [form, setForm] = useState({
    district: "",
    ac: "",
    localbody: "",
    ward: "",
    psNumber: "",
    psSuffix: "",
    name: "",
  });

  /* ---------------------------------------------------
      INITIAL LOAD → Districts, ACs, Localbodies
  ----------------------------------------------------- */
  useEffect(() => {
    fetch(`${backend}/admin/districts`)
      .then((r) => r.json())
      .then(setDistricts);

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

  /* ---------------------------------------------------
      FILTER AC LIST (search by code or name)
  ----------------------------------------------------- */
  useEffect(() => {
    let list = assemblies;

    // district filter
    if (form.district) {
      list = list.filter(ac => ac.district?.name === form.district);
    }

    // search filter
    if (assemblySearch.trim()) {
      const q = assemblySearch.toLowerCase();
      list = list.filter(
        ac =>
          String(ac.acCode).includes(q) ||
          ac.name.toLowerCase().includes(q)
      );
    }

    setFilteredAssemblies(list);
  }, [assemblies, form.district, assemblySearch]);

  // Load localbodies based on selected district
  useEffect(() => {
    if (!form.district) {
      setLocalbodies([]);
      setFilteredLocalbodies([]);
      return;
    }

    fetch(
      `${backend}/admin/localbodies/by-district?name=${encodeURIComponent(
        form.district
      )}`
    )
      .then((r) => r.json())
      .then((data) => {
        setLocalbodies(data);
        setFilteredLocalbodies(data);

        const types = [...new Set(data.map((lb:any) => lb.type))].sort();
        setLbTypes(types);
      });
  }, [form.district, backend]);

  // Localbody search filter
  useEffect(() => {
    let list = [...localbodies];

    if (selectedLbTypes.size > 0) {
      list = list.filter(lb => selectedLbTypes.has(lb.type));
    }

    if (localbodySearch.trim()) {
      const q = localbodySearch.toLowerCase();
      list = list.filter(
        lb =>
          lb.name.toLowerCase().includes(q) ||
          lb.type.toLowerCase().includes(q)
      );
    }

    setFilteredLocalbodies(list);
  }, [localbodies, localbodySearch, selectedLbTypes]);

  useEffect(() => {
    if (form.ac) {
      loadBooths(form.ac, year);
    }
  }, [year]);


  /* ---------------------------------------------------
      LOAD BOOTHS FOR SELECTED AC
  ----------------------------------------------------- */
  const loadBooths = async (acCode: string, y: number = year) => {
    if (!acCode) {
      setBooths([]);
      return;
    }

    setLoadingBooths(true);
    try {
      const res = await fetch(
        `${backend}/admin/booths?acCode=${acCode}&year=${y}`
      );
      setBooths(await res.json());
    } finally {
      setLoadingBooths(false);
    }
  };

  /* ---------------------------------------------------
      LOAD WARDS FOR SELECTED LOCALBODY
  ----------------------------------------------------- */
  const loadWards = async (lbId: string) => {
    if (!lbId) {
      setWards([]);
      return;
    }

    const res = await fetch(`${backend}/admin/wards?localbodyId=${lbId}`);
    if (res.ok) setWards(await res.json());
    else setWards([]);
  };

  /* ---------------------------------------------------
      FORM UPDATER
  ----------------------------------------------------- */
  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /* ---------------------------------------------------
      SUBMIT → CREATE BOOTH
  ----------------------------------------------------- */
  const submit = async () => {
    const payload = {
      district: form.district,                                    // district name
      ac: form.ac,
      year: year,                                                // acCode (string)
      localbody: form.localbody ? Number(form.localbody) : null,  // localbody ID
      ward: form.ward ? Number(form.ward) : null,                 // ward ID
      psNumber: Number(form.psNumber),
      psSuffix: form.psSuffix || null,
      name: form.name,
    };

    const res = await fetch(`${backend}/admin/booth/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    if (res.ok) {
      alert("✔ Booth Created: " + text);
      // optionally reload booths for the currently selected AC
      if (form.ac) {
        loadBooths(form.ac);
      }
    } else {
      alert("❌ Error: " + text);
    }
  };

  /* ---------------------------------------------------
      RENDER
  ----------------------------------------------------- */
  return (
    <div style={{ padding: 24, color: "white" }}>
      <h2 style={{ marginBottom: 16 }}>Booth Manager</h2>

      {/* Year */}
      <div>
        <label style={{ fontSize: 12, color: "#aaa" }}>Year</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ANALYSIS_YEARS.map((y) => (
            <button
              key={y}
              onClick={() => {
                setYear(y);
                if (form.ac) loadBooths(form.ac, y);
              }}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: year === y ? "1px solid #0d6efd" : "1px solid #555",
                background: year === y ? "#0d6efd33" : "transparent",
                color: "#fff",
                fontSize: 12,
              }}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* ================= TOP BAR ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "200px 220px 1fr 260px",
          gap: 12,
          alignItems: "end",
          marginBottom: 20,
        }}
      >

        {/* District */}
        <div>
          <label style={{ fontSize: 12, color: "#aaa" }}>District</label>
          <select
            value={form.district}
            onChange={(e) => updateForm("district", e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              background: "#0b0b0b",
              border: "1px solid #333",
              borderRadius: 6,
              color: "white",
            }}
          >
            <option value="">Select District</option>
            {districts.map((d) => (
              <option key={d.districtCode} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* AC Search */}
        <div>
          <label style={{ fontSize: 12, color: "#aaa" }}>Search Assembly</label>
          <input
            value={assemblySearch}
            onChange={(e) => setAssemblySearch(e.target.value)}
            placeholder="AC code or name"
            style={{
              width: "100%",
              padding: 10,
              background: "#0b0b0b",
              border: "1px solid #333",
              borderRadius: 6,
              color: "white",
            }}
          />
        </div>

        {/* AC Select */}
        <div>
          <label style={{ fontSize: 12, color: "#aaa" }}>Assembly</label>
          <select
            value={form.ac}
            onChange={(e) => {
              updateForm("ac", e.target.value);
              loadBooths(e.target.value, year);
            }}
            style={{
              width: "100%",
              padding: 10,
              background: "#0b0b0b",
              border: "1px solid #333",
              borderRadius: 6,
              color: "white",
            }}
          >
            <option value="">Select AC</option>
            {filteredAssemblies.map((ac) => (
              <option key={ac.acCode} value={ac.acCode}>
                {ac.acCode} – {ac.name}
              </option>
            ))}
          </select>
        </div>
      </div>



      {form.district && form.ac && (
      <>
        {/* Existing Booths */}
        <div style={{ marginBottom: 24 }}>
          <h3>Existing Booths</h3>

          {loadingBooths ? (
            <p>Loading booths…</p>
          ) : booths.length === 0 ? (
            <p>No booths found.</p>
          ) : (
              <div
                style={{
                  maxHeight: 260,
                  overflowY: "auto",
                  background: "#0b0b0b",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #333",
                  boxShadow: "inset 0 0 0 1px #1f1f1f",
                }}
              >

              {booths.map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: "6px 8px",
                    borderBottom: "1px solid #1f1f1f",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>
                    [{b.psNumber}{b.psSuffix || ""}] — {b.name}
                  </span>

                  {b.localbodyName && (
                    <span
                      style={{
                        background: "#1e293b",
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 12,
                        color: "#93c5fd",
                      }}
                    >
                      {b.localbodyName}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* ================ CREATE BOOTH FORM ================ */}
        <div
          style={{
            background: "#0b0b0b",
            padding: 16,
            borderRadius: 8,
            border: "1px solid #333",
            marginTop: 24,
          }}
        >

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
              marginBottom: 12,
            }}
          >
            {lbTypes.map((t) => (
              <label
                key={t}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 4,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedLbTypes.has(t)}
                  onChange={() => {
                    const next = new Set(selectedLbTypes);
                    next.has(t) ? next.delete(t) : next.add(t);
                    setSelectedLbTypes(next);
                  }}
                />
                {t}
              </label>
            ))}
          </div>

          {/* Localbody Search */}
          <label>Search Localbody</label>
          <input
            type="text"
            placeholder="Search localbody…"
            value={localbodySearch}
            onChange={(e) => setLocalbodySearch(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              marginBottom: 8,
              background: "#0b0b0b",
              border: "1px solid #333",
              borderRadius: 6,
              color: "white",
              outline: "none",
            }}
          />


          {/* Localbody */}
          <label>Localbody</label>
          <select
            value={form.localbody}
            onChange={(e) => {
              updateForm("localbody", e.target.value);
              loadWards(e.target.value);
            }}
            style={{ width: "100%", padding: 8, marginBottom: 16 }}
          >
            <option value="">-- none --</option>
            {filteredLocalbodies.map((lb) => (
              <option key={String(lb.id)} value={lb.id}>
                {lb.name} ({lb.type})
              </option>
            ))}
          </select>

          {/* Ward */}
          <label>Ward</label>
          <select
            value={form.ward}
            onChange={(e) => updateForm("ward", e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 16 }}
          >
            <option value="">-- none --</option>
            {wards.map((w) => (
              <option key={String(w.id)} value={w.id}>
                {w.number} - {w.name}
              </option>
            ))}
          </select>

          {/* Booth Number */}
          <label>Polling Station Number</label>
          <input
            type="number"
            value={form.psNumber}
            onChange={(e) => updateForm("psNumber", e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 16 }}
          />

          {/* Suffix */}
          <label>Suffix</label>
          <input
            type="text"
            value={form.psSuffix}
            onChange={(e) => updateForm("psSuffix", e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 16 }}
          />

          {/* Booth Name */}
          <label>Booth Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateForm("name", e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 24 }}
          />

          {/* Submit */}
          <button
            onClick={submit}
            style={{
              padding: "12px 20px",
              background: "#0070f3",
              color: "white",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
            }}
          >
            Create Booth
          </button>
        </div>
      </>
      )}
    </div>
  );
}
