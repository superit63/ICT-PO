/**
 * Service for chunking large documents into smaller pieces
 * Optimized for RAG retrieval with overlap for context preservation
 */

export interface Chunk {
  text: string;
  startIndex: number;
  endIndex: number;
  metadata?: {
    documentId?: string;
    title?: string;
    category?: string;
    productId?: string;
  };
}

export class ChunkingService {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(chunkSize: number = 1000, chunkOverlap: number = 200) {
    this.chunkSize = chunkSize; // Characters per chunk
    this.chunkOverlap = chunkOverlap; // Overlap between chunks
  }

  /**
   * Chunk text into smaller pieces with overlap
   */
  chunkText(text: string, metadata?: Chunk['metadata']): Chunk[] {
    if (!text || text.length === 0) {
      return [];
    }

    const chunks: Chunk[] = [];
    const textLength = text.length;

    // If text is smaller than chunk size, return as single chunk
    if (textLength <= this.chunkSize) {
      return [
        {
          text: text.trim(),
          startIndex: 0,
          endIndex: textLength,
          metadata,
        },
      ];
    }

    let startIndex = 0;

    while (startIndex < textLength) {
      const endIndex = Math.min(startIndex + this.chunkSize, textLength);
      let chunkText = text.substring(startIndex, endIndex);

      // Try to break at sentence boundaries for better context
      if (endIndex < textLength) {
        const lastSentenceEnd = Math.max(
          chunkText.lastIndexOf('.'),
          chunkText.lastIndexOf('!'),
          chunkText.lastIndexOf('?'),
          chunkText.lastIndexOf('\n')
        );

        if (lastSentenceEnd > this.chunkSize * 0.5) {
          // If we found a sentence boundary in the second half, use it
          chunkText = chunkText.substring(0, lastSentenceEnd + 1);
          startIndex += lastSentenceEnd + 1;
        } else {
          startIndex = endIndex;
        }
      } else {
        startIndex = endIndex;
      }

      chunks.push({
        text: chunkText.trim(),
        startIndex: startIndex - chunkText.length,
        endIndex: startIndex,
        metadata,
      });

      // Move back for overlap
      startIndex -= this.chunkOverlap;
      if (startIndex < 0) startIndex = 0;
    }

    return chunks;
  }

  /**
   * Chunk a document with metadata
   */
  chunkDocument(
    content: string,
    metadata: {
      documentId: string;
      title: string;
      category?: string;
      productId?: string;
    }
  ): Chunk[] {
    return this.chunkText(content, metadata);
  }
}
