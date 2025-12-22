import { GoogleGenerativeAI } from '@google/generative-ai';
import { VectorService } from './vector.service';
import { ChunkingService } from './chunking.service';

export interface RAGResponse {
  answer: string;
  sources: Array<{
    title?: string;
    category?: string;
    productId?: string;
    snippet: string;
  }>;
}

export class RAGService {
  private genAI: GoogleGenerativeAI;
  private vectorService: VectorService;
  private chunkingService: ChunkingService;

  constructor(geminiApiKey: string, vectorService: VectorService) {
    this.genAI = new GoogleGenerativeAI(geminiApiKey);
    this.vectorService = vectorService;
    this.chunkingService = new ChunkingService(1000, 200); // 1000 chars per chunk, 200 overlap
  }

  /**
   * Process and index documents from Supabase product_knowledge table
   */
  async indexDocuments(): Promise<void> {
    // This would be called to re-index all documents
    // Implementation depends on how you want to trigger indexing
    // For now, we'll handle indexing on-demand when documents are queried
  }

  /**
   * Query the RAG system and generate a response
   */
  async query(
    question: string,
    role: 'sale' | 'admin',
    productId?: string
  ): Promise<RAGResponse> {
    try {
      // 1. Retrieve relevant chunks using vector similarity search
      const relevantChunks = await this.vectorService.findSimilarChunks(
        question,
        role === 'sale' ? 3 : 5, // Fewer chunks for sales, more for admin
        productId
      );

      if (relevantChunks.length === 0) {
        // Detect if question is in Vietnamese
        const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(question);
        const noResultsMessage = isVietnamese
          ? 'Tôi không tìm thấy thông tin liên quan trong cơ sở tri thức để trả lời câu hỏi của bạn. Vui lòng thử diễn đạt lại câu hỏi hoặc liên hệ hỗ trợ.'
          : 'I could not find relevant information in the knowledge base to answer your question. Please try rephrasing your query or contact support for assistance.';
        
        return {
          answer: noResultsMessage,
          sources: [],
        };
      }

      // 2. Build context from retrieved chunks
      const contextText = relevantChunks
        .map((chunk, index) => {
          const metadata = chunk.metadata || {};
          return `[Source ${index + 1}]
Title: ${metadata.title || 'Untitled'}
Category: ${metadata.category || 'General'}
${chunk.content}`;
        })
        .join('\n\n---\n\n');

      // 3. Build system prompt based on role
      const systemPrompt = this.buildSystemPrompt(role, contextText, question);

      // 4. Generate response using Gemini
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const generationConfig = {
        temperature: role === 'sale' ? 0.5 : 0.7,
        maxOutputTokens: role === 'sale' ? 512 : 2048,
        topP: 0.9,
        topK: 40,
      };

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        generationConfig,
      });

      const response = result.response;
      const answer = response.text();

      // 5. Extract sources
      const sources = relevantChunks.map((chunk) => ({
        title: chunk.metadata?.title,
        category: chunk.metadata?.category,
        productId: chunk.metadata?.product_id,
        snippet: chunk.content.substring(0, 200) + '...',
      }));

      return {
        answer,
        sources,
      };
    } catch (error) {
      console.error('Error in RAG query:', error);
      throw new Error(`RAG query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build system prompt based on user role
   * Handles multilingual queries (Vietnamese questions with English/Vietnamese knowledge base)
   */
  private buildSystemPrompt(role: 'sale' | 'admin', context: string, question: string): string {
    // Detect if question is in Vietnamese (simple check for common Vietnamese characters)
    const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(question);
    
    const languageInstruction = isVietnamese 
      ? `\nIMPORTANT LANGUAGE HANDLING:
- The user's question is in Vietnamese
- The knowledge base contains information in English and sometimes Vietnamese
- Respond to the user in Vietnamese
- If the context is in English, translate the relevant information naturally to Vietnamese
- Maintain technical accuracy while making it natural in Vietnamese
- Use appropriate Vietnamese terminology for medical/technical terms`
      : `\nIMPORTANT: Respond in the same language as the user's question. The knowledge base may contain information in English or Vietnamese.`;

    if (role === 'sale') {
      return `You are a helpful AI assistant for medical sales representatives.

Your role:
- Provide brief, actionable answers (2-3 sentences max unless more detail requested)
- Focus on key selling points, pricing, and customer benefits
- Use simple language suitable for quick reference during sales calls
- Be encouraging and solution-oriented
${languageInstruction}

Relevant Information from Knowledge Base:
${context}

User Question: ${question}

Provide a brief, actionable answer based on the context above. Respond in the same language as the user's question. If the context doesn't contain enough information, say so clearly.`;
    } else {
      return `You are a comprehensive AI assistant for administrators and managers.

Your role:
- Provide detailed, thorough answers with citations
- Include technical specifications, full pricing details, and policy information
- Reference specific sections from the knowledge base (mention Source 1, Source 2, etc.)
- Use professional, detailed language
${languageInstruction}

Relevant Information from Knowledge Base:
${context}

User Question: ${question}

Provide a detailed answer with citations based on the context above. Reference the sources by number (e.g., "According to Source 1..." or "Theo Nguồn 1..."). Respond in the same language as the user's question. If the context doesn't contain enough information, say so clearly.`;
    }
  }

  /**
   * Index a single document (for updating/adding documents)
   */
  async indexDocument(
    documentId: string,
    content: string,
    metadata: {
      title: string;
      category?: string;
      productId?: string;
    }
  ): Promise<void> {
    try {
      // Delete existing chunks for this document
      await this.vectorService.deleteDocumentChunks(documentId);

      // Chunk the document
      const chunks = this.chunkingService.chunkDocument(content, {
        documentId,
        ...metadata,
      });

      // Store chunks with embeddings
      await this.vectorService.storeChunks(chunks);

      console.log(`Indexed document ${documentId} with ${chunks.length} chunks`);
    } catch (error) {
      console.error(`Error indexing document ${documentId}:`, error);
      throw error;
    }
  }
}
