export const AVAILABLE_YEARS: number[] = [
  2009, 2011, 2014, 2015, 2016, 2019, 2020, 2021, 2024, 2025, 2026,
];

export const LOCALBODY_ELECTION_YEARS: number[] = [
  2015, 2020, 2025,
];

export const NATIONAL_ELECTION_YEARS: number[] = [
  2009, 2014, 2019, 2024,
];

export const KERALA_ASSEMBLY_ELECTION_YEARS: number[] = [
  2011, 2016, 2021, 2026,
];

export const GENERAL_ELECTION_YEARS = [
  ...NATIONAL_ELECTION_YEARS,
  ...KERALA_ASSEMBLY_ELECTION_YEARS,
].sort((a, b) => a - b);

export const LOCALBODY_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "All Types" },
  { value: "Municipality", label: "Municipality" },
  { value: "Corporation", label: "Corporation" },
  { value: "grama_panchayath", label: "Grama Panchayath" },
  { value: "block_panchayath", label: "Block Panchayath" },
  { value: "district_panchayath", label: "District Panchayath" },
];
