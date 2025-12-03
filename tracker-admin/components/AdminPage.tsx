"use client";

import React, { useState, useEffect } from "react";
import BoothManagerTab from "./BoothManagerTab";
import LocalbodyTab from "./LocalBodyTab";
import ReassignBoothsTab from "./ReassignBoothsTab";
import PartyMappingTab from "./PartyMappingTab";
import LocalbodyAnalysisTab from "./LocalbodyAnalysisTab";

const tabs = ["CSV Upload", "LS Mapping", "Localbody Mapping", "Booth Manager", "Reassign Booths", "Party Mapping", "Localbody Analysis"];


export default function AdminPage() {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";
  const [tab, setTab] = useState<"upload" | "ls" | "localbody" | "booth" | "reassign" | "party" | "analysis">("upload");

  return (
    <div style={{ padding: 32, maxWidth: 1000 }}>
      <h1 style={{ marginBottom: 24 }}>Admin Panel</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <TabButton label="CSV Upload" active={tab === "upload"} onClick={() => setTab("upload")} />
        <TabButton label="LS Mapping" active={tab === "ls"} onClick={() => setTab("ls")} />
        <TabButton label="Localbody Mapping" active={tab === "localbody"} onClick={() => setTab("localbody")} />
        <TabButton label="Booth Manager" active={tab === "booth"} onClick={() => setTab("booth")} />
        <TabButton label="Reassign Booths" active={tab==="reassign"} onClick={() => setTab("reassign")} />
        <TabButton label="Party Mapping" active={tab === "party"} onClick={() => setTab("party")} />
        <TabButton label="Localbody Analysis" active={tab === "analysis"} onClick={() => setTab("analysis")} />
      </div>

      {tab === "upload" && <CsvUploadTab />}
      {tab === "ls" && <LsMappingTab />}
      {tab === "localbody" && <LocalbodyTab backend={backend}/>}
      {tab === "booth" && <BoothManagerTab backend={backend} />}
      {tab === "reassign" && <ReassignBoothsTab backend={backend} />}
      {tab === "party" && <PartyMappingTab backend={backend} />}
      {tab === "analysis" && <LocalbodyAnalysisTab backend={backend} />}

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


