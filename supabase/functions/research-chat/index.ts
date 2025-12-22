import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const GEMINI_API_KEY = Deno.env.get('VITE_GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface RequestBody {
  message: string;
  role: 'sale' | 'admin';
  productId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, role, productId }: RequestBody = await req.json();

    if (!message || !message.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('product_knowledge')
      .select('*')
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data: knowledgeBase, error: dbError } = await query;

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    let contextText = '';
    if (knowledgeBase && knowledgeBase.length > 0) {
      contextText = knowledgeBase
        .map((doc: any) => {
          return `# ${doc.title}\n\nCategory: ${doc.category}\n\n${doc.content}\n\n---\n`;
        })
        .join('\n');
    } else {
      contextText = 'No product knowledge available in the database yet. Please inform the user that the knowledge base is empty and needs to be populated.';
    }

    let systemPrompt = '';
    if (role === 'sale') {
      systemPrompt = `You are a helpful AI assistant for medical sales representatives.

Your role:
- Provide brief, actionable answers (2-3 sentences max unless more detail requested)
- Focus on key selling points, pricing, and customer benefits
- Use simple language suitable for quick reference during sales calls
- Be encouraging and solution-oriented

Knowledge Base:
${contextText}

User Question: ${message}

Provide a brief, actionable answer:`;
    } else if (role === 'admin') {
      systemPrompt = `You are a comprehensive AI assistant for administrators and managers.

Your role:
- Provide detailed, thorough answers with citations
- Include technical specifications, full pricing details, and policy information
- Reference specific sections from the knowledge base
- Use professional, detailed language

Knowledge Base:
${contextText}

User Question: ${message}

Provide a detailed answer with citations:`;
    } else {
      systemPrompt = `You are a helpful AI assistant.

Knowledge Base:
${contextText}

User Question: ${message}

Provide a helpful answer:`;
    }

    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: role === 'sale' ? 0.5 : 0.7,
          maxOutputTokens: role === 'sale' ? 512 : 2048,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.statusText} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    const answer = geminiData.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({ answer }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in research-chat function:', error);
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
