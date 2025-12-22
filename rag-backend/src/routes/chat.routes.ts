import { Router, Request, Response } from 'express';
import { RAGService } from '../services/rag.service';

export function createChatRoutes(ragService: RAGService) {
  const router = Router();

  interface ChatRequest {
    message: string;
    role: 'sale' | 'admin';
    productId?: string;
  }

  /**
   * POST /chat
   * Query the RAG system with a question
   */
  router.post('/chat', async (req: Request, res: Response) => {
    try {
      const { message, role, productId }: ChatRequest = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }

      if (!role || !['sale', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Valid role (sale or admin) is required' });
      }

      const response = await ragService.query(message, role, productId);

      res.json(response);
    } catch (error) {
      console.error('Error in chat endpoint:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  });

  return router;
}
