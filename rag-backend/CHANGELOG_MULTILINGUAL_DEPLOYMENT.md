# Changes for Multilingual Support and Production Deployment

## Summary

This update adds:
1. **Multilingual support** for Vietnamese queries with English/Vietnamese knowledge base
2. **Production deployment configuration** for VPS backend + Netlify frontend architecture

## Changes Made

### 1. Multilingual Query Support

#### Files Modified:
- `src/services/rag.service.ts`
  - Added Vietnamese language detection
  - Updated prompts to handle multilingual responses
  - Added instructions for translating English context to Vietnamese
  - Improved "no results" messages with language detection

#### How It Works:
- Detects Vietnamese characters in user queries
- Uses Gemini's multilingual embeddings for cross-language semantic search
- Responds in the same language as the query
- Automatically translates English knowledge base content to Vietnamese in responses

### 2. Production Deployment Configuration

#### Files Modified:
- `src/config/env.ts`
  - Added `CORS_ORIGINS` configuration
  - Supports multiple origins (comma-separated)
  
- `src/index.ts`
  - Updated CORS configuration with origin validation
  - Added proper CORS middleware for production
  - Handles requests from Netlify frontend

- `env.example.txt`
  - Added `CORS_ORIGINS` environment variable example

#### New Files:
- `DEPLOYMENT.md` - Complete deployment guide for VPS + Netlify
- `MULTILINGUAL.md` - Detailed multilingual support documentation

## Configuration Required

### Backend (.env)

Add to your backend `.env` file:

```env
# Add your Netlify domain(s) here
CORS_ORIGINS=https://your-app.netlify.app,https://www.yourdomain.com
```

For local development:
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (Netlify Environment Variables)

In Netlify dashboard:
```
VITE_RAG_BACKEND_URL=https://api.yourdomain.com/api/chat
```

## Testing

### Test Vietnamese Query

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Sản phẩm này có những tính năng gì?",
    "role": "sale"
  }'
```

Expected: Response in Vietnamese, even if knowledge base is in English.

### Test CORS from Browser

Open browser console on your Netlify site:
```javascript
fetch('https://api.yourdomain.com/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Test',
    role: 'sale'
  })
})
.then(r => r.json())
.then(console.log);
```

## Migration Notes

No database migration needed - these are code-only changes.

## Breaking Changes

None - all changes are backward compatible.

## Next Steps

1. Update backend `.env` with `CORS_ORIGINS`
2. Deploy backend to VPS (see DEPLOYMENT.md)
3. Set `VITE_RAG_BACKEND_URL` in Netlify environment variables
4. Test multilingual queries
5. Test CORS from production frontend

## Documentation

- See `DEPLOYMENT.md` for full deployment instructions
- See `MULTILINGUAL.md` for multilingual capabilities details
- See `README.md` for general usage
