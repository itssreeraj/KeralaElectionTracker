"use client";

import React, { useState, useEffect } from "react";

export default function AdminPage() {
  const [tab, setTab] = useState<"upload" | "ls" | "localbody">("upload");

  return (
    <div style={{ padding: 32, maxWidth: 1000 }}>
      <h1 style={{ marginBottom: 24 }}>Admin Panel</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <TabButton label="CSV Upload" active={tab === "upload"} onClick={() => setTab("upload")} />
        <TabButton label="LS Mapping" active={tab === "ls"} onClick={() => setTab("ls")} />
        <TabButton label="Localbody Mapping" active={tab === "localbody"} onClick={() => setTab("localbody")} />
      </div>

      {tab === "upload" && <CsvUploadTab />}
      {tab === "ls" && <LsMappingTab />}
      {tab === "localbody" && <LocalbodyTab />}
    </div>
  );
}

/* ---------------- Button Component ---------------- */
function TabButton({ label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 18px",
        background: active ? "#0d6efd" : "#444",
        color: "white",
        fontWeight: 600,
        borderRadius: 6,
        cursor: "pointer",
        border: "1px solid #666",
      }}
    >
      {label}
    </button>
  );
}


/* ---------------------------------------------------
    TAB 1 – CSV UPLOAD
----------------------------------------------------- */

function CsvUploadTab() {
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";

  const log = (msg: string) => setLogMessages((prev) => [...prev, msg]);

  const uploadFile = async (endpoint: string, file: File) => {
    const form = new FormData();
    form.append("file", file);

    setLoading(true);
    log(`Uploading ${file.name} → ${endpoint}`);

    try {
      const res = await fetch(`${backend}${endpoint}`, {
        method: "POST",
        body: form,
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      log(`✔ Success: ${text}`);
    } catch (err: any) {
      log(`❌ Error: ${err.message}`);
    }

    setLoading(false);
  };

  return (
    <div>
      <CsvUploadBlock title="Booths CSV" onUpload={(file) => uploadFile("/import/booths", file)} />
      <CsvUploadBlock title="Candidates CSV" onUpload={(file) => uploadFile("/import/candidates", file)} />
      <CsvUploadBlock title="Form 20 Votes CSV" onUpload={(file) => uploadFile("/import/form20", file)} />
      <CsvUploadBlock title="Form 20 Totals CSV" onUpload={(file) => uploadFile("/import/form20-totals", file)} />

      <div
        style={{
          background: "#111",
          color: "#0f0",
          padding: 16,
          minHeight: 180,
          maxHeight: 300,
          overflowY: "auto",
          borderRadius: 6,
          marginTop: 20,
          fontFamily: "monospace",
        }}
      >
        {logMessages.map((m, i) => (
          <div key={i}>{m}</div>
        ))}
      </div>

      {loading && <p style={{ color: "orange" }}>Uploading…</p>}
    </div>
  );
}

function CsvUploadBlock({ title, onUpload }: any) {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div style={{ marginBottom: 20, padding: 16, border: "1px solid #ccc", borderRadius: 6 }}>
      <h3>{title}</h3>
      <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <button
        onClick={() => file && onUpload(file)}
        style={{
          marginLeft: 10,
          padding: "6px 14px",
          background: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: 6,
        }}
        disabled={!file}
      >
        Upload
      </button>
    </div>
  );
}

/* ---------------------------------------------------
    TAB 2 – LS MAPPING
----------------------------------------------------- */

function LsMappingTab() {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";

  const [lsList, setLsList] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");

  // load LS list
  useEffect(() => {
    fetch(`${backend}/admin/ls`)
      .then((r) => r.json())
      .then(setLsList);
  }, []);

  const createLs = async () => {
    const res = await fetch(`${backend}/admin/ls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, lsCode: newCode }),
    });

    const ls = await res.json();
    setLsList((prev) => [...prev, ls]);
    setNewName("");
    setNewCode("");
  };

  const updateCode = async (id: number, code: string) => {
    await fetch(`${backend}/admin/ls/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lsCode: code }),
    });
  };

  return (
    <div>
      <h2>Lok Sabha Mapping</h2>

      <div style={{ marginTop: 16 }}>
        <h4>Add New Lok Sabha</h4>
        <input placeholder="LS Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <input
          placeholder="LS Code"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          style={{ marginLeft: 8 }}
        />
        <button
          onClick={createLs}
          style={{
            marginLeft: 8,
            padding: "6px 12px",
            background: "green",
            color: "white",
            borderRadius: 6,
          }}
        >
          Add
        </button>
      </div>

      <h3 style={{ marginTop: 24 }}>Existing Constituencies</h3>

      {lsList.map((ls) => (
        <div key={ls.id} style={{ marginBottom: 10 }}>
          <b>{ls.name}</b>
          <input
            style={{ marginLeft: 8 }}
            defaultValue={ls.lsCode || ""}
            onBlur={(e) => updateCode(ls.id, e.target.value)}
            placeholder="Enter LS Code"
          />
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------
    TAB 3 – LOCALBODY MAPPING
----------------------------------------------------- */

function LocalbodyTab() {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";

  const [districts, setDistricts] = useState<any[]>([]);
  const [district, setDistrict] = useState("");

  const [name, setName] = useState("");
  const [type, setType] = useState("gramapanchayat");

  const [assemblies, setAssemblies] = useState<any[]>([]);
  const [boothFilter, setBoothFilter] = useState("");

  const [acFilter, setAcFilter] = useState("");
  const [selectedAc, setSelectedAc] = useState("");

  const [booths, setBooths] = useState<any[]>([]);
  const [selectedBooths, setSelectedBooths] = useState<Set<number>>(new Set());

  const filteredBooths = booths.filter((b) =>
    (b.psNumber + " " + (b.psSuffix || "") + " " + b.name)
      .toLowerCase()
      .includes(boothFilter.toLowerCase())
  );


  // Load districts + assemblies
  useEffect(() => {
    fetch(`${backend}/admin/districts`)
      .then((r) => r.json())
      .then(setDistricts);

    fetch(`${backend}/admin/assemblies`)
      .then((r) => r.json())
      .then(setAssemblies);
  }, []);

  const filteredAssemblies = assemblies.filter((ac) =>
    (ac.acCode + " " + ac.name).toLowerCase().includes(acFilter.toLowerCase())
  );

  const loadBooths = () => {
    fetch(`${backend}/admin/booths?acCode=${selectedAc}`)
      .then((r) => r.json())
      .then(setBooths);
  };

  const toggleBooth = (id: number) => {
    setSelectedBooths((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const saveLocalbody = async () => {
    // Create Localbody
    const res = await fetch(`${backend}/admin/localbody`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        districtName: district,
        name,
        type,
      }),
    });

    const data = await res.json();

    // Map booths
    await fetch(`${backend}/admin/localbody/${data.id}/map-booths`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boothIds: Array.from(selectedBooths) }),
    });

    alert("Localbody & Booths saved!");
  };

  return (
    <div>
      <h2>Localbody Mapping</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 500 }}>

        {/* District Dropdown */}
        <div>
          <label>District</label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">Select District</option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Localbody Name */}
        <input
          placeholder="Localbody Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 8 }}
        />

        {/* Type */}
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: 8 }}>
          <option value="gramapanchayat">Gramapanchayat</option>
          <option value="municipality">Municipality</option>
          <option value="corporation">Corporation</option>
        </select>

        {/* AC SEARCH FILTER */}
        <div>
          <label>Search Assembly Constituency</label>
          <input
            placeholder="Type AC code or name..."
            value={acFilter}
            onChange={(e) => setAcFilter(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              marginBottom: 8,
              borderRadius: 6,
            }}
          />

          {/* Filtered AC dropdown */}
          <select
            value={selectedAc}
            onChange={(e) => setSelectedAc(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          >
            <option value="">Select AC</option>
            {filteredAssemblies.map((ac) => (
              <option key={ac.id} value={ac.acCode}>
                {ac.acCode} – {ac.name}
              </option>
            ))}
          </select>
        </div>

        <button onClick={loadBooths} disabled={!selectedAc}>
          Load Booths
        </button>
      </div>

      {/* Booth Search + Select All / None */}
      <h3 style={{ marginTop: 20 }}>Booths in AC {selectedAc}</h3>

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <input
          placeholder="Search booths…"
          value={boothFilter}
          onChange={(e) => setBoothFilter(e.target.value)}
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 6,
            background: "#111",
            color: "white",
            border: "1px solid #555",
          }}
        />

        <button
          onClick={() => {
            // select all visible filtered booths
            const newSet = new Set(selectedBooths);
            filteredBooths.forEach((b) => newSet.add(b.id));
            setSelectedBooths(newSet);
          }}
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
          onClick={() => {
            // remove only filtered booths
            const newSet = new Set(selectedBooths);
            filteredBooths.forEach((b) => newSet.delete(b.id));
            setSelectedBooths(newSet);
          }}
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
          maxHeight: 350,
          overflowY: "auto",
          border: "1px solid #555",
          padding: 12,
          borderRadius: 6,
          background: "#222",
          color: "white",
        }}
      >
        {filteredBooths.map((b) => (
          <div key={b.id} style={{ marginBottom: 6 }}>
            <label>
              <input
                type="checkbox"
                checked={selectedBooths.has(b.id)}
                onChange={() => toggleBooth(b.id)}
              />{" "}
              [{b.psNumber}{b.psSuffix || ""}] – {b.name}
            </label>
          </div>
        ))}
      </div>


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
    </div>
  );
}
