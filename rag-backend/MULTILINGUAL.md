# Multilingual Support Guide

## Overview

The RAG backend supports multilingual queries and responses, specifically designed for:
- **User queries in Vietnamese**
- **Knowledge base in English** (and sometimes Vietnamese)
- **Responses in the same language as the query**

## How It Works

### 1. Cross-Language Semantic Search

Gemini's `text-embedding-004` model produces multilingual embeddings that work across languages. This means:
- A Vietnamese query can find relevant English documents
- The embedding space is shared across languages
- Semantic similarity works regardless of language

### 2. Automatic Language Detection

The system detects the query language by checking for Vietnamese characters:

```typescript
const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/.test(question);
```

### 3. Language-Aware Prompts

The system prompts Gemini to:
- Respond in the same language as the user's question
- Translate English context to Vietnamese when needed
- Use appropriate terminology for the target language
- Maintain technical accuracy during translation

### 4. Response Generation

Gemini API handles:
- Natural translation from English to Vietnamese
- Maintaining technical/medical terminology accuracy
- Context-aware translation (not word-for-word)
- Preserving meaning and nuance

## Example Flows

### Example 1: Vietnamese Question → English Knowledge Base

**User Query (Vietnamese):**
```
"Sản phẩm này có những tính năng gì?"
```

**Knowledge Base (English):**
```
Product X features:
- Advanced monitoring capabilities
- Real-time data analytics
- Cloud integration
```

**System Response (Vietnamese):**
```
Sản phẩm này có các tính năng sau:
- Khả năng giám sát tiên tiến
- Phân tích dữ liệu theo thời gian thực
- Tích hợp đám mây
```

### Example 2: Mixed Language Knowledge Base

**User Query (Vietnamese):**
```
"Giá cả như thế nào?"
```

**Knowledge Base (Mixed):**
```
Pricing Information:
- Standard package: $999/month
- Premium package: $1,499/month
- Contact sales for enterprise pricing
```

**System Response (Vietnamese):**
```
Thông tin về giá cả:
- Gói tiêu chuẩn: $999/tháng
- Gói cao cấp: $1,499/tháng
- Liên hệ bộ phận bán hàng để biết giá doanh nghiệp
```

## Configuration

No special configuration needed! The multilingual support is built-in and works automatically.

However, you can customize the language detection if needed by modifying:
- `src/services/rag.service.ts` - `buildSystemPrompt()` method

## Testing Multilingual Queries

### Test Vietnamese Query

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Sản phẩm này có những tính năng chính nào?",
    "role": "sale"
  }'
```

### Expected Response Format

```json
{
  "answer": "Sản phẩm này có các tính năng chính sau: [Vietnamese response]",
  "sources": [
    {
      "title": "Product Documentation",
      "category": "features",
      "productId": "product_x",
      "snippet": "[English or Vietnamese snippet]"
    }
  ]
}
```

## Best Practices

1. **Knowledge Base Quality**: 
   - Keep knowledge base content clear and well-structured
   - Use consistent terminology
   - The better the source, the better the translation

2. **Query Language**:
   - Users should ask in their preferred language (Vietnamese)
   - The system will automatically handle translation

3. **Mixed Content**:
   - The system handles knowledge bases with mixed English/Vietnamese content
   - It will translate English portions to Vietnamese in responses

4. **Technical Terms**:
   - Medical/technical terms are typically preserved or transliterated
   - Gemini handles this intelligently based on context

## Limitations

1. **Translation Quality**: Depends on Gemini's translation capabilities (which are excellent)
2. **Very Specialized Terms**: Some highly specialized terms may need manual review
3. **Cultural Context**: Some expressions may need localization beyond translation

## Future Enhancements

Potential improvements:
- Custom translation dictionaries for specific terminology
- Language detection for knowledge base content
- Support for additional languages
- Translation caching for common phrases
