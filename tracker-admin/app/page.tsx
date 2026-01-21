"use client";

import Link from "next/link";
import React, { useState } from "react";
import LocalbodyAnalysisTab from "@/components/LocalbodyAnalysisTab";
import LocalbodySwingAnalysisTab from "@/components/LocalbodySwingAnalysisTab";
import LocalbodyAggregationAnalysisTab from "@/components/LocalbodyAggregationAnalysisTab";

export default function HomePage() {
  const [tab, setTab] = useState<"localbody" | "alliance" | "assembly">("localbody");

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f19", color: "white" }}>
      {/* NAVBAR */}
      <nav
        style={{
          width: "100%",
          padding: "16px 32px",
          background: "#111827",
          borderBottom: "1px solid #1f2937",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 0.5,
            color: "#e5e7eb",
          }}
        >
          Kerala Votes – Analysis
        </div>

        <Link
          href="/login"
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            background: "#2563eb",
            color: "white",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Admin Login
        </Link>
      </nav>

      {/* MAIN */}
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: 32 }}>
        {/* TABS */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setTab("localbody")}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: tab === "localbody" ? "#2563eb" : "#1f2937",
              color: "white",
              border: "1px solid #374151",
              cursor: "pointer",
            }}
          >
            Localbody Analysis
          </button>

          <button
            onClick={() => setTab("alliance")}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: tab === "alliance" ? "#2563eb" : "#1f2937",
              color: "white",
              border: "1px solid #374151",
              cursor: "pointer",
            }}
          >
            Localbody Alliance Target Analysis
          </button>

          {/* NEW: Assembly Analysis Tab */}
          <button
            onClick={() => setTab("assembly")}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: tab === "assembly" ? "#2563eb" : "#1f2937",
              color: "white",
              border: "1px solid #374151",
              cursor: "pointer",
            }}
          >
            Localbody Aggregation Analysis
          </button>
        </div>

        {/* CONTENT PANEL */}
        <div
          style={{
            background: "#111827",
            padding: 24,
            borderRadius: 12,
            border: "1px solid #1f2937",
          }}
        >
          {tab === "localbody" && <LocalbodyAnalysisTab />}
          {tab === "alliance" && <LocalbodySwingAnalysisTab />}
          {tab === "assembly" && <LocalbodyAggregationAnalysisTab />}
        </div>
      </main>
    </div>
  );
}
