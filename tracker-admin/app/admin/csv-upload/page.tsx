"use client";

import React, { useState } from "react";
import { uploadCsv } from "../../../lib/api";

export default function CsvUploadPage() {
  const [lsCode, setLsCode] = useState("");
  const [boothFile, setBoothFile] = useState<File | null>(null);
  const [form20File, setForm20File] = useState<File | null>(null);
  const [totalsFile, setTotalsFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");

  const handleUpload = async (type: "booth" | "form20" | "totals") => {
    try {
      if (type === "booth") {
        if (!lsCode || !boothFile) {
          return setMsg("Please select LS Code and Booth CSV");
        }

        const response = await uploadCsv("/import/booths", boothFile, {
          lsCode,
        });
        setMsg(response);
      }

      if (type === "form20") {
        if (!form20File) return setMsg("Select Form20 CSV");

        const response = await uploadCsv("/import/form20", form20File);
        setMsg(response);
      }

      if (type === "totals") {
        if (!totalsFile) return setMsg("Select Form20 Totals CSV");

        const response = await uploadCsv(
          "/import/form20-totals",
          totalsFile
        );
        setMsg(response);
      }
    } catch (error: any) {
      setMsg("Error: " + error.message);
    }
  };

  return (
    <div style={{ padding: "24px", maxWidth: "700px" }}>
      <h1>Admin CSV Import</h1>

      {/* Booths */}
      <section style={{ marginBottom: "32px" }}>
        <h2>Booths CSV</h2>
        <input
          type="text"
          placeholder="LS Code (e.g. 01)"
          value={lsCode}
          onChange={(e) => setLsCode(e.target.value)}
        />

        <div style={{ marginTop: "12px" }}>
          <input
            type="file"
            onChange={(e) =>
              setBoothFile(e.target.files?.[0] || null)
            }
          />
          <button
            style={{ marginLeft: "12px" }}
            onClick={() => handleUpload("booth")}
          >
            Upload Booths
          </button>
        </div>
      </section>

      {/* Form 20 */}
      <section style={{ marginBottom: "32px" }}>
        <h2>Form 20 CSV</h2>
        <input
          type="file"
          onChange={(e) =>
            setForm20File(e.target.files?.[0] || null)
          }
        />
        <button
          style={{ marginLeft: "12px" }}
          onClick={() => handleUpload("form20")}
        >
          Upload Form 20
        </button>
      </section>

      {/* Totals */}
      <section>
        <h2>Form 20 Totals CSV</h2>
        <input
          type="file"
          onChange={(e) =>
            setTotalsFile(e.target.files?.[0] || null)
          }
        />
        <button
          style={{ marginLeft: "12px" }}
          onClick={() => handleUpload("totals")}
        >
          Upload Totals
        </button>
      </section>

      {/* Message */}
      {msg && (
        <p
          style={{
            marginTop: "24px",
            padding: "10px",
            background: "#eee",
          }}
        >
          {msg}
        </p>
      )}
    </div>
  );
}
