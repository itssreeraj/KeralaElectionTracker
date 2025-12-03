"use client";

import React, { useEffect, useState } from "react";

export default function BoothManagerTab({ backend }: { backend: string }) {
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
    if (!assemblySearch.trim()) {
      setFilteredAssemblies(assemblies);
      return;
    }

    const q = assemblySearch.toLowerCase();

    setFilteredAssemblies(
      assemblies.filter(
        (ac) =>
          String(ac.acCode).toLowerCase().includes(q) ||
          ac.name.toLowerCase().includes(q)
      )
    );
  }, [assemblySearch, assemblies]);

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
      });
  }, [form.district, backend]);

  // Localbody search filter
  useEffect(() => {
    const q = localbodySearch.toLowerCase();

    setFilteredLocalbodies(
      localbodies.filter(
        (lb) =>
          lb.name.toLowerCase().includes(q) ||
          lb.type.toLowerCase().includes(q)
      )
    );
  }, [localbodySearch, localbodies]);


  /* ---------------------------------------------------
      LOAD BOOTHS FOR SELECTED AC
  ----------------------------------------------------- */
  const loadBooths = async (acCode: string) => {
    if (!acCode) {
      setBooths([]);
      return;
    }

    setLoadingBooths(true);
    try {
      const res = await fetch(`${backend}/admin/booths?acCode=${acCode}`);
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
      ac: form.ac,                                                // acCode (string)
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

      {/* District */}
      <label>District</label>
      <select
        value={form.district}
        onChange={(e) => updateForm("district", e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 16 }}
      >
        <option value="">-- select district --</option>
        {districts.map((d) => (
          <option key={d.districtCode} value={d.name}>
            {d.districtCode} - {d.name}
          </option>
        ))}
      </select>

      {/* Assembly Search */}
      <label>Assembly Constituency</label>
      <input
        type="text"
        placeholder="Search AC..."
        value={assemblySearch}
        onChange={(e) => setAssemblySearch(e.target.value)}
        style={{
          width: "100%",
          padding: 8,
          marginBottom: 8,
          background: "#222",
          color: "white",
        }}
      />

      {/* AC Dropdown */}
      <select
        value={form.ac}
        onChange={(e) => {
          updateForm("ac", e.target.value);
          loadBooths(e.target.value);
        }}
        style={{ width: "100%", padding: 8, marginBottom: 16 }}
      >
        <option value="">-- select AC --</option>
        {filteredAssemblies.map((ac) => (
          <option key={ac.acCode} value={ac.acCode}>
            {ac.acCode} - {ac.name}
          </option>
        ))}
      </select>

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
              maxHeight: 200,
              overflowY: "auto",
              background: "#111",
              padding: 12,
              borderRadius: 6,
              border: "1px solid #333",
            }}
          >
            {booths.map((b) => (
              <div key={b.id} style={{ marginBottom: 6 }}>
                [{b.psNumber}
                {b.psSuffix || ""}] — {b.name}
                {b.localbodyName && (
                  <span style={{ marginLeft: 8, color: "#0ff" }}>
                    (Localbody: {b.localbodyName})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Localbody Search */}
      <label>Search Localbody</label>
      <input
        type="text"
        placeholder="search name or type..."
        value={localbodySearch}
        onChange={(e) => setLocalbodySearch(e.target.value)}
        style={{
          width: "100%",
          padding: 8,
          marginBottom: 8,
          background: "#222",
          color: "white",
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
  );
}
