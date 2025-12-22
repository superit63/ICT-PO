import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY!,
  },
  cors: {
    // Allow multiple origins (comma-separated)
    // For production: "https://your-app.netlify.app,https://www.yourdomain.com"
    // For development: "http://localhost:5173,http://localhost:3000"
    origins: process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || ['*'],
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GEMINI_API_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
