"use client";

import React, { useState, useEffect } from "react";

export default function CsvUploadTab({ backend }: { backend: string }) {
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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