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
    fetch(`${backend}/v1/public/districts`)
      .then((r) => r.json())
      .then(setDistricts)
      .catch(console.error);
  }, [backend]);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value ? Number(e.target.value) : "";
    setSelectedCode(code);

    const dist =
      districts.find((d) => d.districtCode === code) || null;

    onSelectDistrict(dist); // ✅ FIXED
  };

  return (
    <div>
      <label style={{ fontSize: 13, opacity: 0.85 }}>District</label>
      <select
        value={selectedCode}
        onChange={onChange}
        style={{
          width: "100%",
          marginTop: 6,
          padding: 6,
          background: "#0f172a",
          color: "white",
          border: "1px solid #334155",
          borderRadius: 6,
        }}
      >
        <option value="">Select District</option>
        {districts.map((d) => (
          <option key={d.districtCode} value={d.districtCode}>
            {d.name}
          </option>
        ))}
      </select>
    </div>
  );
}
