const logger = {
  log: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [CONFIG] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [CONFIG_ERROR] ${message}`, error ? JSON.stringify(error) : '');
  },
};

export function getConfig() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;
  const backendApiBase = process.env.NEXT_BACKEND_API_BASE;
  const posterBase = process.env.NEXT_PUBLIC_POSTER_BASE;
  const env = process.env.NEXT_PUBLIC_ENV;
  const nodeEnv = process.env.NODE_ENV;

  logger.log('Environment Configuration Loaded', {
    env,
    nodeEnv,
    apiBase,
    backendApiBase,
    posterBase,
    timestamp: new Date().toISOString(),
  });

  // if (!apiBase || !backendApiBase) {
  //   logger.error('Missing required environment variables', {
  //     apiBase: apiBase ? 'SET' : 'MISSING',
  //     backendApiBase: backendApiBase ? 'SET' : 'MISSING',
  //     posterBase: posterBase ? 'SET' : 'MISSING',
  //   });
  // }

  return {
    env,
    apiBase,
    backendApiBase,
    posterBase,
  };
}