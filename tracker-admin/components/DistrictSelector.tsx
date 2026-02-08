"use client";

import React, { useEffect, useState } from "react";

export type District = {
  districtCode: number;
  name: string;
};

export default function DistrictSelector({
  backend,
  onSelectDistrict,
  selectedCode,
  label = "District",
  emptyLabel = "All Districts",
  style,
  labelStyle,
  selectWrapperStyle,
  selectStyle,
}: {
  backend: string;
  onSelectDistrict: (d: District | null) => void;
  selectedCode?: number | "";
  label?: string;
  emptyLabel?: string;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  selectWrapperStyle?: React.CSSProperties;
  selectStyle?: React.CSSProperties;
}) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [internalSelectedCode, setInternalSelectedCode] = useState<number | "">("");

  const isControlled = selectedCode !== undefined;
  const currentCode = isControlled ? selectedCode : internalSelectedCode;

  useEffect(() => {
    fetch(`/v1/public/districts`)
      .then((r) => r.json())
      .then((data) => setDistricts(Array.isArray(data) ? data : []))
      .catch(() => setDistricts([]));
  }, [backend]);

  useEffect(() => {
    if (selectedCode === undefined) {
      return;
    }
    setInternalSelectedCode(selectedCode);
  }, [selectedCode]);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value ? Number(e.target.value) : "";
    if (!isControlled) {
      setInternalSelectedCode(code);
    }

    const dist = districts.find((d) => d.districtCode === code) || null;

    onSelectDistrict(dist);
  };

  return (
    <div style={style}>
      <label style={{ fontSize: 12, color: "#9ca3af", ...labelStyle }}>
        {label}
      </label>

      <div style={{ display: "flex", gap: 6, marginTop: 4, ...selectWrapperStyle }}>
        <select
          value={currentCode}
          onChange={onChange}
          style={{
            flex: 1,
            padding: "8px 10px",
            background: "#0b0b0b",
            border: currentCode ? "1px solid #0d6efd" : "1px solid #333",
            borderRadius: 6,
            color: "white",
            fontSize: 12,
            ...selectStyle,
          }}
        >
          <option value="">{emptyLabel}</option>

          {[...districts]
            .sort((a, b) => {
              // numeric sort if codes are numbers or numeric strings
              const aCode = Number(a.districtCode);
              const bCode = Number(b.districtCode);

              if (!Number.isNaN(aCode) && !Number.isNaN(bCode)) {
                return aCode - bCode;
              }

              // fallback: lexicographic
              return String(a.districtCode).localeCompare(String(b.districtCode));
            })
            .map((d) => (
              <option key={d.districtCode} value={d.districtCode}>
                {d.districtCode} – {d.name}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}
