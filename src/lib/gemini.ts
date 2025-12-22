const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';


export interface ParsedVisitData {
  doctor_name: string;
  hospital_name: string;
  outcome: 'positive' | 'neutral' | 'negative' | 'follow_up_needed';
  products_discussed: string[];
  notes: string;
}

export async function parseVisitNote(
  text: string,
  validProducts: string[] = []
): Promise<ParsedVisitData> {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY is not configured');
  }

  const productListText =
    validProducts.length > 0
      ? `\nVALID PRODUCT LIST (Select strictly from here): ${validProducts.join(', ')}`
      : '';

  // Prompt chuyên dụng cho Medical Sales tại Việt Nam
  const systemPrompt = `You are an expert AI Assistant for Medical Sales Representatives (Trình dược viên) in Vietnam.
  
  Your task is to process raw voice-to-text input, correct technical abbreviations, and extract structured data.

  ### 1. ABBREVIATION CORRECTION RULES (Vietnamese):
  - "bs", "bác sỹ" -> "Bác sĩ"
  - "bv", "bviện" -> "Bệnh viện"
  - "pk", "phòng khám" -> "Phòng khám"
  - "đd", "điều dưỡng" -> "Điều dưỡng"
  - "tk", "trưởng khoa" -> "Trưởng khoa"
  - "ck", "chuyên khoa" -> "Chuyên khoa"
  - Fix typos in hospital names (e.g., "chợ rẫy", "bạch mai", "từ dũ").

  ### 2. DATA EXTRACTION RULES:
  - **doctor_name**: Extract full name with title. Example: "Bác sĩ Nam", "Anh Hùng". If unknown, use "".
  - **hospital_name**: Extract facility name. Example: "Bệnh viện Chợ Rẫy". If unknown, use "".
  - **outcome**: Analyze sentiment. Must be: "positive", "neutral", "negative", or "follow_up_needed".
  - **products_discussed**: Map mentioned items to the VALID PRODUCT LIST provided. Use fuzzy matching (e.g., "anios gel" -> "Aniosgel"). If a product is not in the list, use "Other".

  ### 3. NOTE REWRITING (Professional Business Style):
  - Rewrite the content into a professional Daily Call Report.
  - Remove filler words (à, ừ, thì, mà).
  - Structure the note concisely: 
    1. Context (Meeting who/where).
    2. Key Discussion (Feedback, Competitor info, Pricing).
    3. Next Actions.
  
  ### 4. OUTPUT FORMAT:
  Return ONLY a valid JSON object. Do not wrap in markdown code blocks.
  {
    "doctor_name": "string",
    "hospital_name": "string",
    "outcome": "string",
    "products_discussed": ["string"],
    "notes": "string"
  }
  ${productListText}`;

  // Few-shot learning: Cung cấp ví dụ để AI học cách làm
  const userPrompt = `
  EXAMPLE INPUT: "nay ghé bv chợ rẫy gặp bs nam, ổng nói cái anios xài ok nhưng giá hơi cao so với bên đối thủ, tuần sau ghé lại gửi báo giá mới nha"
  
  EXAMPLE OUTPUT JSON:
  {
    "doctor_name": "Bác sĩ Nam",
    "hospital_name": "Bệnh viện Chợ Rẫy",
    "outcome": "follow_up_needed",
    "products_discussed": ["Aniosgel", "Aniospray"], 
    "notes": "Gặp Bác sĩ Nam tại Bệnh viện Chợ Rẫy. Khách hàng phản hồi chất lượng sản phẩm Anios tốt nhưng giá thành cao hơn đối thủ cạnh tranh. Kế hoạch: Gửi lại báo giá mới và ghé thăm lại vào tuần sau."
  }

  REAL INPUT TO PROCESS:
  "${text}"
  
  OUTPUT JSON:`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt + '\n\n' + userPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3, // Giảm độ sáng tạo để tăng tính chính xác
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;

    // Clean up: Đôi khi AI vẫn trả về ```json, cần xóa đi để parse không lỗi
    const cleanJson = generatedText.replace(/```json|```/g, '').trim();
    
    // Tìm chuỗi JSON hợp lệ đầu tiên
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedVisitData;

    return {
      doctor_name: parsed.doctor_name || '',
      hospital_name: parsed.hospital_name || '',
      outcome: parsed.outcome || 'neutral',
      products_discussed: Array.isArray(parsed.products_discussed)
        ? parsed.products_discussed
        : [],
      notes: parsed.notes || '',
    };
  } catch (error) {
    console.error('Error parsing visit note:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to parse visit note'
    );
  }
}