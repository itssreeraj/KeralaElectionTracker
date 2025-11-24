"use client";

import React, { useState } from "react";

/* --------------------------------------------------
   Main Page Component with Tabs
--------------------------------------------------- */
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"upload" | "ls">("upload");

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "24px" }}>
        Admin Panel
      </h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveTab("upload")}
          style={{
            padding: "10px 20px",
            borderRadius: "6px",
            border: "1px solid #444",
            background: activeTab === "upload" ? "#0070f3" : "#222",
            color: "white",
            cursor: "pointer",
          }}
        >
          CSV Upload
        </button>

        <button
          onClick={() => setActiveTab("ls")}
          style={{
            padding: "10px 20px",
            borderRadius: "6px",
            border: "1px solid #444",
            background: activeTab === "ls" ? "#0070f3" : "#222",
            color: "white",
            cursor: "pointer",
          }}
        >
          LS Mapping
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "upload" ? <CsvUploadTab /> : <LsMappingTab />}
    </div>
  );
}

/* ==================================================
   CSV UPLOAD TAB
=================================================== */
function CsvUploadTab() {
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const backend =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";

  const log = (msg: string) => {
    setLogMessages((prev) => [...prev, msg]);
  };

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
    <>
      {/* CSV Upload Blocks */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          rowGap: "18px",
          marginBottom: "32px",
        }}
      >
        <CsvUploadBlock
          title="Booth List CSV"
          onUpload={(file) => uploadFile("/import/booths", file)}
        />

        <CsvUploadBlock
          title="Candidates CSV"
          onUpload={(file) => uploadFile("/import/candidates", file)}
        />

        <CsvUploadBlock
          title="Form 20 - Candidate Votes CSV"
          onUpload={(file) => uploadFile("/import/form20", file)}
        />

        <CsvUploadBlock
          title="Form 20 Totals CSV"
          onUpload={(file) => uploadFile("/import/form20-totals", file)}
        />
      </div>

      {/* Logs */}
      <div
        style={{
          background: "#111",
          color: "#0f0",
          padding: "16px",
          minHeight: "180px",
          maxHeight: "400px",
          overflowY: "auto",
          borderRadius: "6px",
          fontFamily: "monospace",
          border: "1px solid #333",
        }}
      >
        {logMessages.length === 0 ? (
          <span style={{ opacity: 0.5 }}>No logs yet…</span>
        ) : (
          logMessages.map((line, idx) => (
            <div key={idx} style={{ marginBottom: "4px" }}>
              {line}
            </div>
          ))
        )}
      </div>

      {loading && (
        <p style={{ marginTop: "12px", color: "orange" }}>Uploading…</p>
      )}
    </>
  );
}

/* ==================================================
   LS MAPPING TAB
=================================================== */
function LsMappingTab() {
  const [lsName, setLsName] = useState("");
  const [lsCode, setLsCode] = useState("");
  const [response, setResponse] = useState("");

  const backend =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";

  const saveMapping = async () => {
    if (!lsName || !lsCode) {
      setResponse("❌ Enter LS Name & LS Code");
      return;
    }

    const payload = { lsName, lsCode: Number(lsCode) };

    const res = await fetch(`${backend}/admin/ls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    setResponse(text);
  };

  return (
    <div style={{ padding: "10px", border: "1px solid #555", borderRadius: 8 }}>
      <h2 style={{ marginBottom: 16 }}>Loksabha Constituency Mapping</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="text"
          placeholder="LS Name (ex: Alappuzha)"
          value={lsName}
          onChange={(e) => setLsName(e.target.value)}
          style={{
            padding: 10,
            borderRadius: 6,
            border: "1px solid #444",
            background: "#222",
            color: "white",
          }}
        />

        <input
          type="number"
          placeholder="LS Code (ex: 15)"
          value={lsCode}
          onChange={(e) => setLsCode(e.target.value)}
          style={{
            padding: 10,
            borderRadius: 6,
            border: "1px solid #444",
            background: "#222",
            color: "white",
          }}
        />

        <button
          onClick={saveMapping}
          style={{
            padding: "10px 20px",
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Save Mapping
        </button>

        <pre
          style={{
            background: "#111",
            padding: 12,
            borderRadius: 6,
            color: "#0f0",
            minHeight: 50,
          }}
        >
          {response || "No action yet"}
        </pre>
      </div>
    </div>
  );
}

/* ==================================================
   Reusable Upload Block
=================================================== */
function CsvUploadBlock({
  title,
  onUpload,
}: {
  title: string;
  onUpload: (file: File) => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <div
      style={{
        padding: "16px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h3 style={{ marginBottom: "8px" }}>{title}</h3>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
        />

        <button
          style={{
            padding: "8px 16px",
            background: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          onClick={() => selectedFile && onUpload(selectedFile)}
          disabled={!selectedFile}
        >
          Upload
        </button>
      </div>
    </div>
  );
}
