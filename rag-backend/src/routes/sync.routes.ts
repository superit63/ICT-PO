import { Router, Request, Response } from 'express';
import { DocumentService } from '../services/document.service';

export function createSyncRoutes(documentService: DocumentService) {
  const router = Router();

  /**
   * POST /sync/all
   * Sync all documents from product_knowledge table to vector store
   */
  router.post('/sync/all', async (req: Request, res: Response) => {
    try {
      const result = await documentService.syncAllDocuments();

      res.json({
        success: true,
        ...result,
        message: `Synced ${result.synced} documents, ${result.errors} errors`,
      });
    } catch (error) {
      console.error('Error syncing all documents:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  /**
   * POST /sync/:documentId
   * Sync a specific document by ID
   */
  router.post('/sync/:documentId', async (req: Request, res: Response) => {
    try {
      const { documentId } = req.params;

      if (!documentId) {
        return res.status(400).json({ error: 'Document ID is required' });
      }

      await documentService.syncDocument(documentId);

      res.json({
        success: true,
        message: `Document ${documentId} synced successfully`,
      });
    } catch (error) {
      console.error('Error syncing document:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  return router;
}
