"use client";

import React, { useState } from "react";

export default function CsvUploadPage() {
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";

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
    <div style={{ padding: "32px", maxWidth: "700px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>
        Admin CSV Import
      </h1>

      {/* CSV Upload Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          rowGap: "18px",
          marginBottom: "32px",
        }}
      >
        {/* Booth CSV */}
        <CsvUploadBlock
          title="Booth List CSV"
          onUpload={(file) => uploadFile("/import/booths", file)}
        />

        {/* Form 20 Candidate Votes */}
        <CsvUploadBlock
          title="Form 20 - Candidate Votes CSV"
          onUpload={(file) => uploadFile("/import/form20", file)}
        />

        {/* Form 20 Totals */}
        <CsvUploadBlock
          title="Form 20 Totals CSV"
          onUpload={(file) => uploadFile("/import/form20-totals", file)}
        />

        {/* Polling Stations CSV */}
        <CsvUploadBlock
          title="Polling Station CSV"
          onUpload={(file) => uploadFile("/import/polling-stations", file)}
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
    </div>
  );
}

/* ------------------------
   Reusable Upload Block
------------------------- */

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
