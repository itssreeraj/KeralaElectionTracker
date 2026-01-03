"use client";

import { getConfig } from "@/config/env";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import CsvUploadTab from "@/components/CsvUploadTab";
import LsMappingTab from "@/components/LsMappingTab";
import LocalbodyTab from "@/components/LocalBodyTab";
import BoothManagerTab from "@/components/BoothManagerTab";
import ReassignBoothsTab from "@/components/ReassignBoothsTab";
import PartyMappingTab from "@/components/PartyMappingTab";
import WardAssemblyMappingTab from "@/components/WardAssemblyMappingTab";
import PartyAllianceAdminTab from "@/components/PartyAllianceAdminTab";

// backend URL
const backend = `${getConfig().apiBase}` || "http://localhost:8080/api";

const tabs: { key: string; label: string }[] = [
  { key: "upload", label: "CSV Upload" },
  { key: "ls", label: "LS Mapping" },
  { key: "localbody", label: "Localbody Mapping" },
  { key: "booth", label: "Booth Manager" },
  { key: "reassign", label: "Reassign Booths" },
  { key: "party", label: "Party Mapping" },
  { key: "wardmap", label: "Ward Assembly Mapping" },
  { key: "partyalliance", label: "Party Alliance Mapping" },
];

export default function AdminPage() {
  const [tab, setTab] = useState("upload");
  const router = useRouter();

  function logout() {
    document.cookie = "token=; Max-Age=0; path=/;";
    router.push("/");
  }

  return (
    <div className="admin-wrapper">
      {/* HEADER */}
      <div className="admin-header">
        <h1>Admin Panel</h1>

        <div className="admin-actions">
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
          <Link href="/" className="home-link">
            ← Home
          </Link>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs-container">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`tab-btn ${tab === t.key ? "active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="tab-content">
        {tab === "upload" && <CsvUploadTab backend={backend} />}
        {tab === "ls" && <LsMappingTab backend={backend} />}
        {tab === "localbody" && <LocalbodyTab backend={backend} />}
        {tab === "booth" && <BoothManagerTab backend={backend} />}
        {tab === "reassign" && <ReassignBoothsTab backend={backend} />}
        {tab === "party" && <PartyMappingTab backend={backend} />}
        {tab === "wardmap" && <WardAssemblyMappingTab backend={backend} />}
        {tab === "partyalliance" && <PartyAllianceAdminTab />}
      </div>

      {/* STYLES */}
      <style jsx>{`
        .admin-wrapper {
          padding: 40px;
          background: #0f1624;
          min-height: 100vh;
          color: white;
          font-family: Inter, sans-serif;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .admin-actions {
          display: flex;
          gap: 16px;
        }

        .logout-btn {
          background: #ef4444;
          padding: 8px 14px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          color: white;
          font-weight: 600;
        }

        .home-link {
          color: #6ea8fe;
          text-decoration: none;
          font-size: 15px;
        }

        .tabs-container {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .tab-btn {
          padding: 10px 16px;
          background: #1f2937;
          border: 1px solid #475569;
          border-radius: 8px;
          color: #d1d5db;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .tab-btn.active {
          background: #2563eb;
          border-color: #1d4ed8;
          color: white;
        }

        .tab-btn:hover:not(.active) {
          background: #334155;
        }

        .tab-content {
          margin-top: 20px;
          padding: 20px;
          background: #111827;
          border-radius: 12px;
          border: 1px solid #1e293b;
          min-height: 350px;
        }
      `}</style>
    </div>
  );
}
