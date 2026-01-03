import { getConfig } from "@/config/env";
const config = getConfig();

export async function uploadCsv(
  endpoint: string,
  file: File,
  params: Record<string, string> = {}
) {
  const form = new FormData();
  form.append("file", file);

  Object.entries(params).forEach(([k, v]) => {
    form.append(k, v);
  });

  const res = await fetch(
    `${config.apiBase}${endpoint}`,
    {
      method: "POST",
      body: form,
    }
  );

  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text;
}
