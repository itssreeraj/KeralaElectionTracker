export function getConfig() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  const backendApiBase = process.env.NEXT_BACKEND_API_BASE;
  const posterBase = process.env.NEXT_PUBLIC_POSTER_BASE;
  const env = process.env.NEXT_PUBLIC_ENV;

  return {
    env,
    apiBase,
    backendApiBase,
    posterBase,
  };
}