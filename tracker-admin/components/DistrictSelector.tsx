"use client";

import React, { useEffect, useState } from "react";

type District = {
  districtCode: number;
  name: string;
};

export default function DistrictSelector({
  backend,
  onSelectDistrict,
}: {
  backend: string;
  onSelectDistrict: (d: District | null) => void;
}) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedCode, setSelectedCode] = useState<number | "">("");

  useEffect(() => {
    fetch(`/v1/public/districts`)
      .then((r) => r.json())
      .then(setDistricts)
      .catch(console.error);
  }, [backend]);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value ? Number(e.target.value) : "";
    setSelectedCode(code);

    const dist =
      districts.find((d) => d.districtCode === code) || null;

    onSelectDistrict(dist);
  };

  return (
    <div>
      <label style={{ fontSize: 12, color: "#9ca3af" }}>District</label>

      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <select
          value={selectedCode}
          onChange={onChange}
          style={{
            flex: 1,
            padding: "8px 10px",
            background: "#0b0b0b",
            border: selectedCode ? "1px solid #0d6efd" : "1px solid #333",
            borderRadius: 6,
            color: "white",
            fontSize: 12,
          }}
        >
          <option value="">All Districts</option>

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
