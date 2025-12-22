import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const GEMINI_API_KEY = Deno.env.get('VITE_GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface VisitLog {
  id: string;
  visit_date: string;
  notes: string;
  outcome: string;
  products_discussed: string[];
  doctors?: {
    name: string;
    doctor_role: string;
    department: string;
  };
}

// Retry function with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  baseDelay = 1000
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);
    
    // If successful or not a rate limit error, return immediately
    if (response.ok || response.status !== 429) {
      return response;
    }
    
    // If it's the last attempt, return the error response
    if (attempt === maxRetries - 1) {
      return response;
    }
    
    // Calculate exponential backoff delay
    const delay = baseDelay * Math.pow(2, attempt);
    
    // Check for Retry-After header if available
    const retryAfter = response.headers.get('Retry-After');
    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay;
    
    console.log(`Rate limited. Retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // This should never be reached, but TypeScript needs it
  throw new Error('Max retries exceeded');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Check if the feature is enabled (check on each request)
    const enableHospitalSummary = Deno.env.get('ENABLE_HOSPITAL_SUMMARY');
    console.log('ENABLE_HOSPITAL_SUMMARY env var:', enableHospitalSummary);
    
    if (enableHospitalSummary !== 'true') {
      return new Response(
        JSON.stringify({ error: 'Hospital summary feature is currently disabled.' }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { hospitalId } = await req.json();

    if (!hospitalId) {
      return new Response(
        JSON.stringify({ error: 'Hospital ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch hospital information for context
    const { data: hospital } = await supabase
      .from('hospitals')
      .select('name')
      .eq('id', hospitalId)
      .single();

    const hospitalName = hospital?.name || 'Bệnh viện này';

    // Filter visits directly by hospital_id (more efficient than getting doctors first)
    const { data: visits, error: visitError } = await supabase
      .from('visits')
      .select(`
        id,
        visit_date,
        notes,
        outcome,
        products_discussed,
        doctor:doctors(
          name,
          doctor_role,
          department
        )
      `)
      .eq('hospital_id', hospitalId)
      .order('visit_date', { ascending: false })
      .limit(20); // Limit to 20 most recent visits to reduce token usage

    if (visitError) {
      throw new Error(`Failed to fetch visit logs: ${visitError.message}`);
    }

    if (!visits || visits.length === 0) {
      return new Response(
        JSON.stringify({ summary: 'Không tìm thấy nhật ký thăm khám nào cho bệnh viện này.' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Limit and format visit logs - only send most recent 20 to reduce token costs
    const recentVisits = visits.slice(0, 20);
    const logsText = recentVisits
      .map((log: any) => {
        const doctor = log.doctor || {};
        const products = Array.isArray(log.products_discussed) 
          ? log.products_discussed.join(', ') 
          : (typeof log.products_discussed === 'string' ? log.products_discussed : 'Không có');
        const outcomeMap: Record<string, string> = {
          'positive': 'Tích cực',
          'neutral': 'Trung tính',
          'negative': 'Tiêu cực',
          'follow_up_needed': 'Cần theo dõi'
        };
        // Condensed format to reduce token usage
        const notes = log.notes ? (log.notes.length > 100 ? log.notes.substring(0, 100) + '...' : log.notes) : 'Không có ghi chú';
        return `${log.visit_date} | ${doctor.name || 'N/A'} (${doctor.department || 'N/A'}) | ${outcomeMap[log.outcome] || log.outcome} | ${products} | ${notes}`;
      })
      .join('\n');

    const prompt = `Phân tích ngắn gọn các nhật ký thăm khám cho bệnh viện "${hospitalName}" (chỉ phân tích dữ liệu của bệnh viện này).

Viết tóm tắt bằng tiếng Việt, ngắn gọn (150-200 từ), tập trung vào 3 điểm:

1. **MỐI QUAN HỆ & TƯƠNG TÁC**: Đánh giá ngắn gọn mối quan hệ, mức độ hợp tác, xu hướng (cải thiện/ổn định/giảm sút).

2. **BÁC SĨ & KHOA PHÒNG CHÍNH**: Liệt kê ngắn gọn các bác sĩ/khoa được thăm nhiều nhất và mức độ quan tâm.

3. **SẢN PHẨM & PHẢN HỒI**: Các sản phẩm được thảo luận nhiều nhất và phản hồi chính (tích cực/tiêu cực).

Nhật ký (định dạng: Ngày | Bác sĩ (Khoa) | Kết quả | Sản phẩm | Ghi chú):
${logsText}

Viết ngắn gọn, súc tích, chỉ nêu điểm chính. Không lặp lại thông tin.`;

    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const geminiResponse = await fetchWithRetry(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512, // Reduced for shorter output
          },
        }),
      },
      3, // max retries
      2000 // base delay in ms (2 seconds)
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      let errorMessage = `Gemini API error: ${geminiResponse.statusText}`;
      let statusCode = geminiResponse.status;
      
      if (errorText) {
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
          
          // Log detailed error for debugging
          console.error('Gemini API error details:', {
            status: statusCode,
            error: errorData,
            message: errorMessage
          });
        } catch {
          errorMessage = errorText || errorMessage;
        }
      }
      
      // Return appropriate status code for rate limits
      if (statusCode === 429) {
        return new Response(
          JSON.stringify({
            error: 'API rate limit exceeded. Please wait a moment and try again.',
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error(errorMessage);
    }

    const geminiData = await geminiResponse.json();

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    const summary = geminiData.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({ summary }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in hospital-summary function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
