export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  supabase: {
    url: process.env.SUPABASE_URL || 'https://demo.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || 'demo-anon-key',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'demo-service-role-key',
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'challenge-media',
  },
  ai: {
    defaultProvider: process.env.DEFAULT_AI_PROVIDER || 'gemma',
    gemma: {
      apiKey: process.env.GEMMA_API_KEY || '',
      model: process.env.GEMMA_MODEL || 'gemma-2-9b-it',
      apiUrl: process.env.GEMMA_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models',
    },
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'gemma2:9b',
    },
  },
});
