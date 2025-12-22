# RAG Backend Architecture

## Overview

This RAG (Retrieval-Augmented Generation) backend implements a scalable solution for querying large product knowledge documents using semantic search and Gemini API.

## Architecture Flow

```
User Query
    ↓
[Frontend] Research.tsx
    ↓ POST /api/chat
[RAG Backend] Express Server
    ↓
[Embedding Service] Generate query embedding
    ↓
[Vector Service] Find similar chunks (cosine similarity)
    ↓
[RAG Service] Build context from chunks
    ↓
[Gemini API] Generate response with context
    ↓
[Response] Answer + Sources
    ↓
[Frontend] Display to user
```

## Components

### 1. Embedding Service (`embedding.service.ts`)
- Uses Gemini's `text-embedding-004` model
- Generates 768-dimensional vector embeddings
- Supports batch processing for efficiency

### 2. Chunking Service (`chunking.service.ts`)
- Splits large documents into ~1000 character chunks
- 200 character overlap for context preservation
- Breaks at sentence boundaries when possible

### 3. Vector Service (`vector.service.ts`)
- Stores document chunks with embeddings in Supabase
- Uses pgvector extension for similarity search
- Implements cosine similarity search via `match_document_chunks` function
- Falls back to text search if vector search unavailable

### 4. RAG Service (`rag.service.ts`)
- Orchestrates the RAG pipeline
- Retrieves relevant chunks based on query
- Builds context from chunks
- Generates role-specific prompts (sale vs admin)
- Calls Gemini API for final response generation

### 5. Document Service (`document.service.ts`)
- Syncs documents from `product_knowledge` table
- Handles document indexing and updates

## Database Schema

### `document_chunks` Table
- `id`: UUID primary key
- `document_id`: Reference to source document
- `content`: Chunk text content
- `embedding`: vector(768) - pgvector embedding
- `metadata`: JSONB with title, category, product_id, chunk_index
- `created_at`, `updated_at`: Timestamps

### Indexes
- Index on `document_id` for fast lookups
- Index on `metadata->>'product_id'` for filtering
- IVFFlat index on `embedding` for fast similarity search

## API Endpoints

### POST /api/chat
Main query endpoint for RAG queries.

**Request:**
```json
{
  "message": "What are the key features?",
  "role": "sale",
  "productId": "optional"
}
```

**Response:**
```json
{
  "answer": "The key features are...",
  "sources": [
    {
      "title": "Product Documentation",
      "category": "features",
      "productId": "product_x",
      "snippet": "..."
    }
  ]
}
```

### POST /api/sync/all
Sync all documents from `product_knowledge` table.

### POST /api/sync/:documentId
Sync a specific document by ID.

## Key Features

1. **Semantic Search**: Uses vector embeddings for meaning-based search, not just keyword matching
2. **Scalable**: Handles 100-200 page documents efficiently through chunking
3. **Context-Aware**: Overlapping chunks preserve context across boundaries
4. **Role-Based**: Different response styles for sales reps (brief) vs admins (detailed)
5. **Source Attribution**: Returns sources for transparency
6. **Multilingual Support**: 
   - Handles Vietnamese queries with English/Vietnamese knowledge base
   - Cross-language semantic search using Gemini's multilingual embeddings
   - Automatic language detection and response translation
   - Users can ask in Vietnamese, system responds in Vietnamese even if knowledge base is in English

## Performance Considerations

- **Embedding Generation**: Batch processing to handle rate limits
- **Vector Search**: IVFFlat index for fast similarity search
- **Chunk Size**: 1000 chars balances context and retrieval precision
- **Retrieval**: Top 3-5 chunks based on role (fewer for sales, more for admin)

## Future Enhancements

- Cache embeddings to avoid regenerating
- Implement incremental updates (only re-index changed documents)
- Add hybrid search (combine vector + keyword search)
- Support for multiple embedding models
- Query expansion for better retrieval
- Conversation history support
