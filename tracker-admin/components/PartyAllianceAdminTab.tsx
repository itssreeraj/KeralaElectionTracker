"use client";

import React, { useEffect, useState, useMemo } from "react";

/* ===================== TYPES ===================== */
type MappingRow = {
  partyId: number;
  partyName: string;
  partyShortName: string | null;
  allianceId: number | null;
  allianceName: string;
};

type Alliance = {
  id: number;        // REQUIRED
  name: string;
  color?: string;

};

type RowState = {
  selectedAllianceId: string;
  dirty: boolean;
};

const backend =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";

const YEARS = [2010, 2015, 2019, 2020, 2024, 2025];
const TYPES = ["LOCALBODY", "ASSEMBLY", "LOKSABHA"];

/* ===================== COMPONENT ===================== */
export default function PartyAllianceAdminTab() {
    const [year, setYear] = useState(2025);
    const [type, setType] = useState("LOCALBODY");

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

    const reloadMappings = () => {
        setLoading(true);
        fetch(`${backend}/admin/party-alliance?year=${year}&type=${type}`)
            .then(r => r.json())
            .then(setRows)
            .finally(() => setLoading(false));
    };



  /* ---------------- Load alliances ---------------- */
  useEffect(() => {
    fetch(`${backend}/public/alliances`)
      .then(r => r.json())
      .then(data =>
        // backend may return either an array or an object like { alliances: [...] }
        setAlliances(Array.isArray(data) ? data : data?.alliances ?? [])
      )
      .catch(() => setAlliances([]));
  }, []);

  // map allianceName (from mappings) -> numeric allianceId
  const allianceNameToId = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach(r => {
      if (r.allianceName && r.allianceId != null) m.set(r.allianceName, r.allianceId);
    });
    return m;
  }, [rows]);

  /* ---------------- Load mappings ---------------- */
  useEffect(() => {
    setLoading(true);

    fetch(`${backend}/admin/party-alliance?year=${year}&type=${type}`)
      .then(r => r.json())
      .then((data: MappingRow[]) => {
        setRows(data);

        // Reset rowState to reflect the newly loaded mappings for the selected year/type.
        // This ensures the select controls update when filters (year/type) change.
        const nextState: Record<number, RowState> = {};
        data.forEach(r => {
          nextState[r.partyId] = {
            selectedAllianceId: r.allianceId != null ? String(r.allianceId) : r.allianceName ?? "",
            dirty: false,
          };
        });

        setRowState(nextState);
      })
      .finally(() => setLoading(false));
  }, [year, type]);

  /* ---------------- Local change only ---------------- */
  const onAllianceChange = (partyId: number, value: string) => {
    setRowState(prev => ({
      ...prev,
      [partyId]: {
        selectedAllianceId: value,
        dirty: true,
      },
    }));
  };

  /* ---------------- Save (explicit action) ---------------- */
  const saveRow = async (partyId: number) => {
    const state = rowState[partyId];
    if (!state || state.selectedAllianceId === "") return;

    const key = state.selectedAllianceId;
    let numeric = Number(key);

    // try resolving from allianceNameToId if key is not numeric
    if (!Number.isInteger(numeric)) {
      const mapped = allianceNameToId.get(key);
      if (mapped != null) numeric = mapped;
    }

    if (!Number.isInteger(numeric)) {
      alert("Cannot save: selected alliance has no numeric id on server");
      return;
    }

    setSaving(partyId);

    const params = new URLSearchParams({
      partyId: String(partyId),
      allianceId: String(numeric),
      year: String(year),
      type,
    });

    await fetch(`${backend}/admin/party-alliance`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    // reflect saved value
    setRows(prev =>
      prev.map(r =>
        r.partyId === partyId
          ? {
              ...r,
              allianceId: numeric,
              allianceName:
                alliances.find(a => (a.id === numeric || (a.code ?? a.name) === key))?.name ?? key ?? r.allianceName,
            }
          : r
      )
    );

    setRowState(prev => ({
      ...prev,
      [partyId]: {
        ...prev[partyId],
        dirty: false,
      },
    }));

    setSaving(null);
  };

  /* ===================== RENDER ===================== */
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 20, marginBottom: 12 }}>
        Party – Alliance Mapping
      </h2>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <select value={year} onChange={e => setYear(+e.target.value)}>
          {YEARS.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select value={type} onChange={e => setType(e.target.value)}>
          {TYPES.map(t => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

        <h3>Add Alliance</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
                placeholder="Alliance name"
                value={newAllianceName}
                onChange={e => setNewAllianceName(e.target.value)}
            />
            <input
                placeholder="Color (#hex)"
                value={newAllianceColor}
                onChange={e => setNewAllianceColor(e.target.value)}
            />
            <button
                type="button"
                onClick={async () => {
                    await fetch(`${backend}/admin/alliances`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    body: JSON.stringify({
                        name: newAllianceName,
                        color: newAllianceColor,
                    }),
                    });

                    setNewAllianceName("");
                    setNewAllianceColor("");

                    const res = await fetch(`${backend}/public/alliances`);
                    setAlliances(await res.json());
                }}
                >
                Add
            </button>
        </div>

        <h3>Add Party & Mapping</h3>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8 }}>
        <input
            placeholder="Party name"
            value={newPartyName}
            onChange={e => setNewPartyName(e.target.value)}
        />
        <input
            placeholder="Short name"
            value={newPartyShort}
            onChange={e => setNewPartyShort(e.target.value)}
        />
        <select
          value={newPartyAlliance}
          onChange={e => setNewPartyAlliance(e.target.value)}
        >
          <option value="">Alliance</option>
          {alliances.map(a => {
            const numericId = a.id ?? allianceNameToId.get(a.name) ?? null;
            const key = numericId != null ? String(numericId) : a.code ?? a.name;
            const val = numericId != null ? String(numericId) : "";
            return (
              <option key={key} value={val} disabled={numericId == null}>
                {a.name}
                {numericId == null ? " (no id)" : ""}
              </option>
            );
          })}
        </select>
        <button
            type="button"
            onClick={async () => {
                if (!newPartyName || !newPartyAlliance) {
                alert("Party name and alliance are required");
                return;
                }

                const payload = {
                    partyName: newPartyName.trim(),
                    partyShortName: newPartyShort.trim() || null,
                    allianceId: Number(newPartyAlliance),
                    electionYear: year,
                    electionType: type,
                };

                console.log("Submitting payload:", payload);

                // backend expects a JSON body for CreatePartyWithMappingRequest
                await fetch(`${backend}/admin/party-with-mapping`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Accept": "application/json",
                },
                body: JSON.stringify(payload),
                });

                setNewPartyName("");
                setNewPartyShort("");
                setNewPartyAlliance("");

                reloadMappings();
            }}
            >
            Add
        </button>
    </div>

      {/* Table */}
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          background: "#111827",
          borderRadius: 8,
          padding: 12,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            color: "#e5e7eb",
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8, width: "45%" }}>
                Party
              </th>
              <th style={{ textAlign: "left", padding: 8, width: "35%" }}>
                Alliance
              </th>
              <th style={{ padding: 8, width: "20%" }} />
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={3} style={{ padding: 12 }}>
                  Loading…
                </td>
              </tr>
            )}

            {!loading &&
              rows.map(r => {
                const state = rowState[r.partyId];

                return (
                  <tr key={r.partyId}>
                    <td style={{ padding: 8 }}>
                      <div style={{ fontWeight: 600 }}>{r.partyName}</div>
                      {r.partyShortName && (
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          {r.partyShortName}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: 8 }}>
                                {(() => {
                                  // normalize alliances: prefer numeric id when available (either from public/allies or from rows)
                                  const normalized = alliances.map(a => {
                                    const numericId = a.id ?? allianceNameToId.get(a.name) ?? null;
                                    const key = numericId != null ? String(numericId) : a.code ?? a.name;
                                    return { key, label: a.name, numericId: numericId ?? null };
                                  });

                                  return (
                                    <select
                                      value={state?.selectedAllianceId ?? ""}
                                      onChange={e =>
                                        onAllianceChange(r.partyId, e.target.value)
                                      }
                                      style={{
                                        width: "100%",
                                        padding: "6px 8px",
                                        background: "#020617",
                                        color: "#e5e7eb",
                                        border: "1px solid #374151",
                                        borderRadius: 6,
                                      }}
                                    >
                                      <option value="" disabled>
                                        Select alliance
                                      </option>
                                      {normalized.map(a => (
                                        <option key={a.key} value={a.key}>
                                          {a.label}
                                        </option>
                                      ))}
                                    </select>
                                  );
                                })()}
                    </td>

                    <td style={{ padding: 8 }}>
                      <button
                        disabled={!state?.dirty || saving === r.partyId}
                        onClick={() => saveRow(r.partyId)}
                        style={{
                          padding: "6px 12px",
                          background: state?.dirty
                            ? "#0d6efd"
                            : "#374151",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
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
