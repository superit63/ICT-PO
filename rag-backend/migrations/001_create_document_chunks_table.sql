-- Migration: Create document_chunks table with pgvector support
-- This table stores document chunks with embeddings for vector similarity search

-- Enable pgvector extension (run this in Supabase SQL editor if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Create document_chunks table
CREATE TABLE IF NOT EXISTS document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id text NOT NULL,
  content text NOT NULL,
  embedding vector(768), -- Gemini text-embedding-004 produces 768-dimensional vectors
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_metadata_product_id ON document_chunks((metadata->>'product_id'));
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops);

-- Enable RLS
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
-- Note: In production, you might want more restrictive policies

-- Create function for vector similarity search
-- Note: The query_embedding parameter should be passed as a text representation of the vector
-- Example: '[0.1,0.2,0.3,...]' which will be cast to vector(768)
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding text, -- Accept as text, cast to vector inside
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_product_id text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_vector vector(768);
BEGIN
  -- Cast text to vector
  query_vector := query_embedding::vector;
  
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    document_chunks.metadata,
    1 - (document_chunks.embedding <=> query_vector) as similarity
  FROM document_chunks
  WHERE
    (filter_product_id IS NULL OR document_chunks.metadata->>'product_id' = filter_product_id)
    AND (1 - (document_chunks.embedding <=> query_vector)) >= match_threshold
  ORDER BY document_chunks.embedding <=> query_vector
  LIMIT match_count;
END;
$$;
