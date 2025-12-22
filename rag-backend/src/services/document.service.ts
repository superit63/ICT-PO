import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RAGService } from './rag.service';

export interface ProductKnowledge {
  id: string;
  product_id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

/**
 * Service to sync documents from Supabase product_knowledge table to vector store
 */
export class DocumentService {
  private supabase: SupabaseClient;
  private ragService: RAGService;

  constructor(supabaseUrl: string, supabaseKey: string, ragService: RAGService) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.ragService = ragService;
  }

  /**
   * Sync all documents from product_knowledge table to vector store
   */
  async syncAllDocuments(): Promise<{ synced: number; errors: number }> {
    try {
      const { data: documents, error } = await this.supabase
        .from('product_knowledge')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch documents: ${error.message}`);
      }

      if (!documents || documents.length === 0) {
        console.log('No documents to sync');
        return { synced: 0, errors: 0 };
      }

      let synced = 0;
      let errors = 0;

      for (const doc of documents) {
        try {
          await this.ragService.indexDocument(doc.id, doc.content, {
            title: doc.title,
            category: doc.category,
            productId: doc.product_id,
          });
          synced++;
        } catch (error) {
          console.error(`Error syncing document ${doc.id}:`, error);
          errors++;
        }
      }

      console.log(`Sync completed: ${synced} synced, ${errors} errors`);
      return { synced, errors };
    } catch (error) {
      console.error('Error syncing documents:', error);
      throw error;
    }
  }

  /**
   * Sync a single document by ID
   */
  async syncDocument(documentId: string): Promise<void> {
    try {
      const { data: document, error } = await this.supabase
        .from('product_knowledge')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch document: ${error.message}`);
      }

      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }

      await this.ragService.indexDocument(document.id, document.content, {
        title: document.title,
        category: document.category,
        productId: document.product_id,
      });
    } catch (error) {
      console.error(`Error syncing document ${documentId}:`, error);
      throw error;
    }
  }
}
