"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AVAILABLE_YEARS as ANALYSIS_YEARS } from "../lib/constants";
import { getConfig } from "@/config/env";

/* ===================== TYPES ===================== */
type MappingRow = {
  partyId: number;
  partyName: string;
  partyShortName: string | null;
  allianceId: number | null;
  allianceName: string;
};

type Alliance = {
  id?: number | null;
  name: string;
  code?: string | null;
  color?: string | null;
};

type RowState = {
  selectedAllianceId: string;
  dirty: boolean;
};

const TYPES = ["LOCALBODY", "ASSEMBLY", "LOKSABHA"];

const config = getConfig();
const backend = `${config.apiBase}` || "http://localhost:3000/api";


/* ===================== BUTTON STYLE ===================== 
const primaryBtn: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 6,
  background: "#0d6efd",
  color: "white",
  border: "none",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 6,
  background: "#374151",
  color: "white",
  border: "none",
  fontSize: 12,
  cursor: "pointer",
};
*/

/* ===================== COMMON STYLES ===================== */
const boxStyle: React.CSSProperties = {
  background: "#020617",
  border: "1px solid #374151",
  borderRadius: 8,
  padding: 16,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "#0b0b0b",
  border: "1px solid #333",
  borderRadius: 6,
  color: "white",
  fontSize: 13,
};

const primaryBtn: React.CSSProperties = {
  padding: "8px 14px",
  background: "#0d6efd",
  color: "white",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};

const secondaryBtn: React.CSSProperties = {
  padding: "8px 14px",
  background: "#1f2933",
  color: "white",
  borderRadius: 6,
  border: "1px solid #374151",
  cursor: "pointer",
  fontSize: 13,
};

/* ===================== COMPONENT ===================== */
export default function PartyAllianceAdminTab() {
  const [year, setYear] = useState<number>(ANALYSIS_YEARS[0] ?? 2024);
  const [type, setType] = useState<string>("");

  const [rows, setRows] = useState<MappingRow[]>([]);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [rowState, setRowState] = useState<Record<number, RowState>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);

  const [newAllianceName, setNewAllianceName] = useState("");
  const [newAllianceColor, setNewAllianceColor] = useState("");

  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyShort, setNewPartyShort] = useState("");
  const [newPartyAlliance, setNewPartyAlliance] = useState("");

  /* ===================== HELPERS ===================== */
  const normalizeAlliances = (arr: any[]) =>
    arr.map(a => ({
      id: a.id ?? a.allianceId ?? null,
      name: a.name ?? a.code ?? String(a.id),
      code: a.code ?? null,
      color: a.color ?? null,
    }));

  /* ===================== LOAD DATA ===================== */
  const loadAlliances = async () => {
    const r = await fetch(`${backend}/public/alliances`);
    const data = await r.json();
    const arr = Array.isArray(data) ? data : data?.alliances ?? [];
    setAlliances(normalizeAlliances(arr));
  };

  const loadMappings = () => {
    setLoading(true);
    fetch(`${backend}/admin/party-alliance?year=${year}&type=${type}`)
      .then(r => r.json())
      .then((data: MappingRow[]) => {
        setRows(data);
        const next: Record<number, RowState> = {};
        data.forEach(r => {
          next[r.partyId] = {
            selectedAllianceId: r.allianceId != null ? String(r.allianceId) : "",
            dirty: false,
          };
        });
        setRowState(next);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAlliances();
  }, []);

  useEffect(() => {
    if (!type) return;
    loadMappings();
  }, [year, type]);


  /* ===================== ACTIONS ===================== */
  const onAllianceChange = (partyId: number, value: string) => {
    setRowState(prev => ({
      ...prev,
      [partyId]: { selectedAllianceId: value, dirty: true },
    }));
  };

  const saveRow = async (partyId: number) => {
    const state = rowState[partyId];
    if (!state || !state.dirty) return;

    if (!type) {
      alert("Please select Election Type before saving");
      return;
    }


    setSaving(partyId);

    await fetch(`${backend}/admin/party-alliance`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        partyId: String(partyId),
        allianceId: state.selectedAllianceId,
        year: String(year),
        type,
      }).toString(),
    });

    setSaving(null);
    loadMappings();
  };

  /* ===================== ADD ALLIANCE ===================== */
  const addAlliance = async () => {
    if (!newAllianceName.trim()) return;

    await fetch(`${backend}/admin/alliances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newAllianceName.trim(),
        color: newAllianceColor || null,
      }),
    });

    setNewAllianceName("");
    setNewAllianceColor("");
    await loadAlliances();
  };

  /* ===================== ADD PARTY ===================== */
  const addParty = async () => {
    if (!newPartyName || !newPartyAlliance) return;

    await fetch(`${backend}/admin/party-with-mapping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partyName: newPartyName.trim(),
        partyShortName: newPartyShort.trim() || null,
        allianceId: Number(newPartyAlliance),
        electionYear: year,
        electionType: type,
      }),
    });

    setNewPartyName("");
    setNewPartyShort("");
    setNewPartyAlliance("");
    loadMappings();
  };

  /* ===================== RENDER ===================== */
  return (
    <div style={{ padding: 24, color: "white" }}>
      <h2 style={{ fontSize: 20, marginBottom: 16 }}>
        Party – Alliance Mapping
      </h2>
      {/* ================= FILTER BAR ================= */}
      <div
        style={{
          display: "flex",
          gap: 24,
          marginBottom: 24,
          padding: 16,
          borderRadius: 8,
          border: "1px solid #374151",
          background: "#020617",
          alignItems: "center",
        }}
      >
        {/* YEAR */}
        <div>
          <label style={{ fontSize: 11, color: "#9ca3af" }}>Election Year</label>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            {ANALYSIS_YEARS.map(y => (
              <button
                key={y}
                onClick={() => setYear(y)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: year === y ? "1px solid #0d6efd" : "1px solid #555",
                  background: year === y ? "#0d6efd33" : "transparent",
                  color: "#fff",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* TYPE (PROMINENT + REQUIRED) */}
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            //border: type ? "1px solid #0d6efd" : "2px solid #dc2626",
            background: "#020617",
            minWidth: 260,
          }}
        >
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: type ? "#9ca3af" : "#dc2626",
              display: "block",
              marginBottom: 6,
            }}
          >
            Election Type {type ? "" : " (required)"}
          </label>

          <select
            value={type}
            onChange={e => setType(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              background: "#0b0b0b",
              border: "1px solid #333",
              borderRadius: 6,
              color: "white",
              fontSize: 13,
            }}
          >
            <option value="">— Select Type —</option>
            {TYPES.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ================= ADD ALLIANCE + ADD PARTY ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* ========== ADD ALLIANCE ========== */}
        <div
          style={{
            background: "#020617",
            border: "1px solid #374151",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: 12,
              paddingBottom: 6,
              borderBottom: "1px solid #334155",
            }}
          >
            Add Alliance
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              placeholder="Alliance name"
              value={newAllianceName}
              onChange={e => setNewAllianceName(e.target.value)}
              style={{
                flex: 2,
                padding: "8px 10px",
                background: "#0b0b0b",
                border: "1px solid #333",
                borderRadius: 6,
                color: "white",
              }}
            />

            <input
              placeholder="#hex"
              value={newAllianceColor}
              onChange={e => setNewAllianceColor(e.target.value)}
              style={{
                width: 120,
                padding: "8px 10px",
                background: "#0b0b0b",
                border: "1px solid #333",
                borderRadius: 6,
                color: "white",
              }}
            />
          </div>

          <button
            style={{
              ...primaryBtn,
              opacity: type ? 1 : 0.5,
              cursor: type ? "pointer" : "not-allowed",
            }}
            disabled={!type}
            onClick={addAlliance}
          >
            Add Alliance
          </button>
        </div>

        {/* ========== ADD PARTY ========== */}
        <div
          style={{
            background: "#020617",
            border: "1px solid #374151",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: 12,
              paddingBottom: 6,
              borderBottom: "1px solid #334155",
            }}
          >
            Add Party & Initial Mapping
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1.5fr auto",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              placeholder="Party name"
              value={newPartyName}
              onChange={e => setNewPartyName(e.target.value)}
              style={{
                padding: "8px 10px",
                background: "#0b0b0b",
                border: "1px solid #333",
                borderRadius: 6,
                color: "white",
              }}
            />

            <input
              placeholder="Short"
              value={newPartyShort}
              onChange={e => setNewPartyShort(e.target.value)}
              style={{
                padding: "8px 10px",
                background: "#0b0b0b",
                border: "1px solid #333",
                borderRadius: 6,
                color: "white",
              }}
            />

            <select
              value={newPartyAlliance}
              onChange={e => setNewPartyAlliance(e.target.value)}
              style={{
                padding: "8px 10px",
                background: "#0b0b0b",
                border: "1px solid #333",
                borderRadius: 6,
                color: "white",
              }}
            >
              <option value="">Select Alliance</option>
              {alliances.map(a => (
                <option key={a.id} value={a.id ?? ""}>
                  {a.name}
                </option>
              ))}
            </select>

            <button
              style={{
                ...primaryBtn,
                opacity: type ? 1 : 0.5,
                cursor: type ? "pointer" : "not-allowed",
              }}
              disabled={!type}
              onClick={addParty}
            >
              Add
            </button>
          </div>
        </div>
      </div>


      {/* ================= TABLE ================= */}
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          background: "#0b0b0b",
          border: "1px solid #333",
          borderRadius: 8,
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "#111" }}>
            <tr>
              <th style={{ padding: "10px 12px", textAlign: "left" }}>Party</th>
              <th style={{ padding: "10px 12px", textAlign: "left" }}>Alliance</th>
              <th style={{ padding: "10px 12px" }} />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} style={{ padding: 12 }}>Loading…</td>
              </tr>
            )}

            {!loading &&
              rows.map(r => {
                const state = rowState[r.partyId];
                return (
                  <tr key={r.partyId} style={{ borderBottom: "1px solid #1f1f1f" }}>
                    <td style={{ padding: "8px 12px" }}>
                      <div style={{ fontWeight: 600 }}>{r.partyName}</div>
                      {r.partyShortName && (
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>
                          {r.partyShortName}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <select
                        value={state?.selectedAllianceId ?? ""}
                        onChange={e =>
                          onAllianceChange(r.partyId, e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          background: "#020617",
                          border: "1px solid #374151",
                          borderRadius: 6,
                          color: "#e5e7eb",
                          fontSize: 12,
                        }}
                      >
                        <option value="">Select alliance</option>
                        {alliances.map(a => (
                          <option key={a.id} value={a.id ?? ""}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>
                      <button
                        disabled={!state?.dirty || saving === r.partyId}
                        onClick={() => saveRow(r.partyId)}
                        style={{
                          ...primaryBtn,
                          background: state?.dirty ? "#0d6efd" : "#374151",
                          cursor: state?.dirty ? "pointer" : "not-allowed",
                        }}
                      >
                        {saving === r.partyId ? "Saving…" : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
