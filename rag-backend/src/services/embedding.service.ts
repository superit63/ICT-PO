export class EmbeddingService {
  private apiKey: string;
  private embeddingUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Using text-embedding-004 model for embeddings
    this.embeddingUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
  }

  /**
   * Generate embeddings for a given text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(this.embeddingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: {
            parts: [{ text }],
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.embedding || !data.embedding.values) {
        throw new Error('Invalid response from embedding API');
      }

      return data.embedding.values;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const embeddings: number[][] = [];
      // Process in batches to avoid rate limits
      const batchSize = 5;
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchPromises = batch.map(text => this.generateEmbedding(text));
        const batchEmbeddings = await Promise.all(batchPromises);
        embeddings.push(...batchEmbeddings);
      }
      
      return embeddings;
    } catch (error) {
      console.error('Error generating embeddings batch:', error);
      throw error;
    }
  }
}
