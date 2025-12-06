"use client";

import Link from "next/link";
import LocalbodyAnalysisTab from "@/components/LocalbodyAnalysisTab";

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0b0f19", color: "white" }}>
      {/* ====== TOP NAVBAR ====== */}
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
          zIndex: 20,
        }}
      >
        {/* LEFT SIDE \u2014 APP TITLE */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 0.5,
            color: "#e5e7eb",
          }}
        >
          Kerala Votes - Analysis
        </div>

        {/* RIGHT SIDE \u2014 ADMIN LOGIN */}
        <Link
          href="/admin/login"
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            background: "#2563eb",
            color: "white",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
            border: "1px solid #1e3a8a",
          }}
        >
          Admin Login
        </Link>
      </nav>

      {/* ====== MAIN CONTENT ====== */}
      <main
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "32px 24px 80px 24px",
        }}
      >
        {/* PAGE HEADER */}
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 12,
            color: "#f3f4f6",
          }}
        >
          Localbody Election Analysis
        </h1>

        <p
          style={{
            fontSize: 15,
            opacity: 0.85,
            marginBottom: 32,
            maxWidth: 700,
            lineHeight: 1.6,
          }}
        >
          Select a district and localbody to compare alliance performance across
          multiple election years. Generate export-ready posters and view
          detailed ward/booth performance data.
        </p>

        {/* ===== ANALYSIS TOOL ===== */}
        <div
          style={{
            background: "#111827",
            padding: 24,
            borderRadius: 12,
            border: "1px solid #1f2937",
            boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
          }}
        >
          <LocalbodyAnalysisTab />
        </div>
      </main>
    </div>
  );
}
