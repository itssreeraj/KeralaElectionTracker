"use client";
 
import { getConfig } from "@/config/env";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import CsvUploadAdminTab from "@/components/CsvUploadAdminTab";
import ConstituencyMappingAdminTab from "@/components/ConstituencyMappingAdminTab";
import LocalbodyAdminTab from "@/components/LocalBodyAdminTab";
import BoothManagerAdminTab from "@/components/BoothManagerAdminTab";
import ReassignBoothsAdminTab from "@/components/ReassignBoothsAdminTab";
import BoothVotesDataAdminTab from "@/components/BoothVotesDataAdminTab";
import CandidateMappingAdminTab from "@/components/CandidateMappingAdminTab";
import WardAssemblyMappingAdminTab from "@/components/WardAssemblyMappingAdminTab";
import PartyAllianceAdminTab from "@/components/PartyAllianceAdminTab";

// backend URL
const backend = getConfig().apiBase ?? "";

const tabs: { key: string; label: string }[] = [
  { key: "upload", label: "CSV Upload" },
  { key: "constituency", label: "Constituency Mapping" },
  { key: "localbody", label: "Localbody Mapping" },
  { key: "booth", label: "Booth Manager" },
  { key: "reassign", label: "Reassign Booths" },
  { key: "boothvotes", label: "Booth Vote Data" },
  { key: "candidate", label: "Candidate Mapping" },
  { key: "wardmap", label: "Ward Assembly Mapping" },
  { key: "partyalliance", label: "Party Alliance Mapping" },
];

console.log("API BASE =", backend);
console.log("FETCH URL =", `${backend}/v1/admin/test`);

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
        {tab === "upload" && <CsvUploadAdminTab backend={backend} />}
        {tab === "constituency" && <ConstituencyMappingAdminTab backend={backend} />}
        {tab === "localbody" && <LocalbodyAdminTab backend={backend} />}
        {tab === "booth" && <BoothManagerAdminTab backend={backend} />}
        {tab === "reassign" && <ReassignBoothsAdminTab backend={backend} />}
        {tab === "boothvotes" && <BoothVotesDataAdminTab backend={backend} />}
        {tab === "candidate" && <CandidateMappingAdminTab backend={backend} />}
        {tab === "wardmap" && <WardAssemblyMappingAdminTab backend={backend} />}
        {tab === "partyalliance" && <PartyAllianceAdminTab backend={backend} />}
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
