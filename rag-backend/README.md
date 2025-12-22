# INCOTEC RAG Backend

A Retrieval-Augmented Generation (RAG) backend service for product knowledge queries using Gemini API and vector similarity search.

## Features

- **Vector Embeddings**: Uses Gemini's text-embedding-004 model to generate embeddings
- **Semantic Search**: Finds relevant document chunks using cosine similarity
- **Document Chunking**: Intelligently chunks large documents (100-200 pages) for efficient retrieval
- **Role-based Responses**: Tailored responses for sales reps (brief) vs admins (detailed)
- **Supabase Integration**: Syncs with your existing `product_knowledge` table

## Architecture

```
User Query → Vector Embedding → Similarity Search → Relevant Chunks → Gemini API → Response
```

1. User submits a query
2. Query is converted to an embedding vector
3. Vector similarity search finds relevant document chunks
4. Top chunks are retrieved from the database
5. Context is sent to Gemini API with the query
6. Gemini generates a response based on the context

## Prerequisites

- Node.js 18+ and npm
- Supabase project with:
  - `product_knowledge` table
  - pgvector extension enabled
- Gemini API key

## Setup

### 1. Install Dependencies

```bash
cd rag-backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Set Up Database

Run the migration SQL in your Supabase SQL editor:

```bash
# Copy the contents of migrations/001_create_document_chunks_table.sql
# and run it in Supabase SQL Editor
```

This creates:
- `document_chunks` table with vector support
- Indexes for efficient search
- `match_document_chunks` function for similarity search

**Important**: Make sure the pgvector extension is enabled in Supabase:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4. Build and Run

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

## API Endpoints

### POST /api/chat

Query the RAG system with a question.

**Request:**
```json
{
  "message": "What are the key features of product X?",
  "role": "sale",  // or "admin"
  "productId": "optional_product_id"
}
```

**Response:**
```json
{
  "answer": "The key features are...",
  "sources": [
    {
      "title": "Product X Documentation",
      "category": "features",
      "productId": "product_x",
      "snippet": "Product X offers..."
    }
  ]
}
```

### POST /api/sync/all

Sync all documents from `product_knowledge` table to the vector store.

**Response:**
```json
{
  "success": true,
  "synced": 10,
  "errors": 0,
  "message": "Synced 10 documents, 0 errors"
}
```

### POST /api/sync/:documentId

Sync a specific document by ID.

**Response:**
```json
{
  "success": true,
  "message": "Document abc123 synced successfully"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Initial Data Sync

After setting up the backend, you need to sync your existing documents:

```bash
# Using curl
curl -X POST http://localhost:3001/api/sync/all

# Or using the frontend after updating the endpoint
```

This will:
1. Fetch all documents from `product_knowledge` table
2. Chunk each document (handling 100-200 page documents)
3. Generate embeddings for each chunk
4. Store chunks with embeddings in `document_chunks` table

## How It Works

### Document Chunking

- Documents are split into chunks of ~1000 characters
- 200 character overlap between chunks preserves context
- Chunks are broken at sentence boundaries when possible

### Vector Search

- Each chunk is embedded using Gemini's embedding model
- Queries are embedded and compared using cosine similarity
- Top K most similar chunks are retrieved (K=3 for sales, K=5 for admin)

### Response Generation

- Retrieved chunks are formatted as context
- Context is sent to Gemini with a role-specific prompt
- Gemini generates a response based on the context
- Sources are included in the response

## Updating Documents

When documents are added or updated in `product_knowledge`:

1. **Automatic sync** (recommended): Set up a Supabase webhook or trigger
2. **Manual sync**: Call `/api/sync/:documentId` endpoint
3. **Full sync**: Call `/api/sync/all` to re-index everything

## Configuration

### Chunking Parameters

Edit `src/services/chunking.service.ts`:
```typescript
this.chunkingService = new ChunkingService(1000, 200); // chunkSize, chunkOverlap
```

### Retrieval Parameters

Edit `src/services/rag.service.ts`:
```typescript
const relevantChunks = await this.vectorService.findSimilarChunks(
  question,
  role === 'sale' ? 3 : 5, // number of chunks
  productId,
  0.7 // similarity threshold
);
```

## Troubleshooting

### "document_chunks table not found"

Run the migration SQL in Supabase SQL Editor.

### "pgvector extension not found"

Enable the extension in Supabase:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Poor search results

- Try adjusting the similarity threshold
- Increase the number of retrieved chunks
- Check if documents are properly synced
- Verify embeddings are being generated correctly

### Rate limiting

Gemini API has rate limits. If you hit them:
- Reduce batch size in `embedding.service.ts`
- Add retry logic with exponential backoff
- Consider caching embeddings

## Frontend Integration

The frontend `Research.tsx` has been updated to use the new backend. Configure the backend URL via environment variable:

```env
VITE_RAG_BACKEND_URL=https://api.yourdomain.com/api/chat
```

For local development, it defaults to `http://localhost:3001/api/chat`.

## Multilingual Support

The system supports multilingual queries:
- ✅ Vietnamese questions → Vietnamese responses (with English/Vietnamese knowledge base)
- ✅ English questions → English responses
- ✅ Cross-language semantic search using Gemini's multilingual embeddings

The backend automatically detects the question language and responds accordingly.

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick checklist:
1. Set environment variables (including `CORS_ORIGINS` with your Netlify domain)
2. Build the project: `npm run build`
3. Run migrations in Supabase
4. Deploy backend to VPS
5. Initial sync: `POST /api/sync/all`
6. Set up webhooks/triggers for document updates (optional)
7. Configure frontend `VITE_RAG_BACKEND_URL` in Netlify environment variables

## License

MIT
