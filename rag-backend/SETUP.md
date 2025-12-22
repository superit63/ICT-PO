# Quick Setup Guide

## 1. Install Dependencies

```bash
cd rag-backend
npm install
```

## 2. Configure Environment

Create a `.env` file (copy from `env.example.txt`):

```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

## 3. Set Up Database

### Enable pgvector Extension

In Supabase SQL Editor, run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Run Migration

Copy the contents of `migrations/001_create_document_chunks_table.sql` and run it in Supabase SQL Editor.

This creates:
- `document_chunks` table for storing document chunks with embeddings
- `match_document_chunks` function for vector similarity search

## 4. Start the Backend

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## 5. Sync Documents

After starting the backend, sync your existing documents:

```bash
curl -X POST http://localhost:3001/api/sync/all
```

Or use your API client (Postman, etc.)

This will:
- Fetch all documents from `product_knowledge` table
- Chunk each document
- Generate embeddings
- Store in `document_chunks` table

## 6. Update Frontend

The frontend has already been updated to use the new backend. Just make sure to set the environment variable:

```env
VITE_RAG_BACKEND_URL=http://localhost:3001/api/chat
```

Or it will default to `http://localhost:3001/api/chat`

## Testing

1. Health check: `GET http://localhost:3001/health`
2. Chat endpoint: `POST http://localhost:3001/api/chat` with body:
   ```json
   {
     "message": "What products do we offer?",
     "role": "sale"
   }
   ```

## Troubleshooting

- **pgvector extension error**: Make sure you've enabled the extension in Supabase
- **Embedding dimension mismatch**: Gemini text-embedding-004 produces 768-dimensional vectors
- **Rate limiting**: Reduce batch size in `embedding.service.ts` if you hit API limits
- **CORS errors**: Make sure `CORS_ORIGINS` in `.env` includes your frontend domain
- **Multilingual queries**: System automatically handles Vietnamese queries with English knowledge base (see MULTILINGUAL.md)
