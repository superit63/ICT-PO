import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { VectorService } from './services/vector.service.js';
import { RAGService } from './services/rag.service.js';
import { DocumentService } from './services/document.service.js';
import { createChatRoutes } from './routes/chat.routes.js';
import { createSyncRoutes } from './routes/sync.routes.js';

const app = express();

// CORS configuration for production deployment
// Frontend on Netlify, Backend on VPS
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or if wildcard is configured
    if (config.cors.origins.includes('*') || config.cors.origins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Initialize services
const vectorService = new VectorService(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  config.gemini.apiKey
);

const ragService = new RAGService(config.gemini.apiKey, vectorService);

const documentService = new DocumentService(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  ragService
);

// Routes
app.use('/api', createChatRoutes(ragService));
app.use('/api', createSyncRoutes(documentService));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 RAG Backend server running on port ${PORT}`);
  console.log(`📚 Ready to handle RAG queries`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
