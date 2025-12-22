import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EmbeddingService } from './embedding.service';

export interface DocumentChunk {
  id?: string;
  document_id: string;
  content: string;
  embedding: number[];
  metadata: {
    title?: string;
    category?: string;
    product_id?: string;
    chunk_index?: number;
  };
  created_at?: string;
}

export class VectorService {
  private supabase: SupabaseClient;
  private embeddingService: EmbeddingService;

  constructor(supabaseUrl: string, supabaseKey: string, geminiApiKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.embeddingService = new EmbeddingService(geminiApiKey);
    this.initializeDatabase();
  }

  /**
   * Initialize the vector database table for storing chunks
   * Note: This requires pgvector extension in Supabase
   */
  private async initializeDatabase() {
    // Check if table exists, if not create it
    // This should ideally be done via migration, but we'll handle it here for convenience
    try {
      const { error } = await this.supabase.rpc('check_table_exists', { table_name: 'document_chunks' });
      if (error && error.message.includes('does not exist')) {
        console.warn('document_chunks table not found. Please run the migration SQL to create it with pgvector support.');
      }
    } catch (error) {
      // Table creation should be done via migration
      console.warn('Could not check for document_chunks table. Ensure migrations are run.');
    }
  }

  /**
   * Store document chunks with embeddings
   */
  async storeChunks(chunks: Array<{ text: string; metadata: any }>): Promise<void> {
    if (chunks.length === 0) return;

    try {
      // Generate embeddings for all chunks
      const texts = chunks.map(chunk => chunk.text);
      const embeddings = await this.embeddingService.generateEmbeddings(texts);

      // Prepare chunks with embeddings
      const chunksWithEmbeddings = chunks.map((chunk, index) => ({
        document_id: chunk.metadata.documentId || '',
        content: chunk.text,
        embedding: embeddings[index], // Keep as array for now, convert to string format when inserting
        metadata: {
          title: chunk.metadata.title,
          category: chunk.metadata.category,
          product_id: chunk.metadata.productId,
          chunk_index: index,
        },
      }));

      // Store in database (using Supabase's vector similarity search)
      // Note: This assumes the table has been created with pgvector
      // Convert embeddings to string format for pgvector
      const chunksToInsert = chunksWithEmbeddings.map((chunk) => ({
        ...chunk,
        embedding: `[${chunk.embedding.join(',')}]`, // Convert to PostgreSQL array string format
      }));

      const { error } = await this.supabase
        .from('document_chunks')
        .insert(chunksToInsert);

      if (error) {
        // If table doesn't exist, fall back to storing without vector search
        // This is a fallback - ideally the migration should be run first
        console.warn('Could not store in document_chunks table:', error.message);
        throw error;
      }
    } catch (error) {
      console.error('Error storing chunks:', error);
      throw error;
    }
  }

  /**
   * Find similar chunks using vector similarity search
   */
  async findSimilarChunks(
    query: string,
    limit: number = 5,
    productId?: string,
    threshold: number = 0.7
  ): Promise<DocumentChunk[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // Build the query - convert embedding array to string format for pgvector
      const embeddingString = `[${queryEmbedding.join(',')}]`;
      const { data, error } = await this.supabase.rpc('match_document_chunks', {
        query_embedding: embeddingString, // Pass as string '[1,2,3,...]' format
        match_threshold: threshold,
        match_count: limit,
        filter_product_id: productId || null,
      });

      if (error) {
        // Fallback to simple text search if vector search is not available
        console.warn('Vector search not available, falling back to text search:', error.message);
        return this.fallbackTextSearch(query, limit, productId);
      }

      return (data || []) as DocumentChunk[];
    } catch (error) {
      console.error('Error finding similar chunks:', error);
      // Fallback to text search
      return this.fallbackTextSearch(query, limit, productId);
    }
  }

  /**
   * Fallback text-based search when vector search is not available
   */
  private async fallbackTextSearch(
    query: string,
    limit: number,
    productId?: string
  ): Promise<DocumentChunk[]> {
    let searchQuery = this.supabase
      .from('document_chunks')
      .select('*')
      .textSearch('content', query, { type: 'websearch' })
      .limit(limit);

    if (productId) {
      searchQuery = searchQuery.eq('metadata->>product_id', productId);
    }

    const { data, error } = await searchQuery;

    if (error) {
      console.error('Fallback search error:', error);
      return [];
    }

    return (data || []) as DocumentChunk[];
  }

  /**
   * Delete chunks for a specific document
   */
  async deleteDocumentChunks(documentId: string): Promise<void> {
    const { error } = await this.supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);

    if (error) {
      throw new Error(`Failed to delete chunks: ${error.message}`);
    }
  }
}
