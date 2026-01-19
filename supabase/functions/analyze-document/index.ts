import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DocumentAnalysis {
  document_type: string;
  extracted_text: string;
  summary: string;
  keywords: string[];
  metadata: {
    personal_info?: Record<string, string>;
    academic_info?: Record<string, string>;
    detected_fields: string[];
    language: string;
    confidence: number;
  };
  suggested_filename: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, imageUrl, mimeType, originalFilename } = await req.json();
    
    console.log("Analyzing document with DeepSeek:", { documentId, mimeType, originalFilename });

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // System prompt for document analysis
    const systemPrompt = `You are an expert document analyzer for a school management system. Analyze the document and extract all relevant information.

Your task is to:
1. Identify the document type (birth_certificate, report_card, id_photo, transcript, medical_record, diploma, recommendation_letter, clearance, enrollment_form, other)
2. Extract ALL visible text from the document
3. Generate a 2-3 sentence summary of the document content
4. Extract 5-10 relevant keywords for search/filtering
5. Identify key information fields (names, dates, ID numbers, addresses, grades, schools)
6. Detect the primary language (English, Tagalog, Arabic, etc.)
7. Provide a confidence score (0.0-1.0) for your analysis

You MUST respond with valid JSON in this exact format:
{
  "document_type": "birth_certificate|report_card|id_photo|transcript|medical_record|diploma|recommendation_letter|clearance|enrollment_form|other",
  "extracted_text": "all visible text from the document",
  "summary": "2-3 sentence summary",
  "keywords": ["keyword1", "keyword2", ...],
  "personal_info": {
    "full_name": "if found",
    "birth_date": "if found",
    "gender": "if found",
    "address": "if found",
    "id_number": "if found"
  },
  "academic_info": {
    "school_name": "if found",
    "grade_level": "if found",
    "school_year": "if found",
    "grades": "if found",
    "courses": "if found"
  },
  "detected_fields": ["list", "of", "field", "types", "found"],
  "language": "English|Tagalog|Arabic|etc",
  "confidence": 0.85,
  "suggested_filename": "Meaningful_Filename_Based_On_Content.ext"
}`;

    const userPrompt = `Analyze this document from a student file. Original filename: "${originalFilename}".
Document URL: ${imageUrl}

Please analyze and extract all information from this document. Return ONLY valid JSON, no other text.`;

    // Call DeepSeek API
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402 || response.status === 401) {
        return new Response(
          JSON.stringify({ error: "DeepSeek API authentication failed. Please check your API key." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("DeepSeek response received:", JSON.stringify(aiResponse).substring(0, 500));

    // Extract the response content
    let analysis: DocumentAnalysis | null = null;
    const messageContent = aiResponse.choices?.[0]?.message?.content;
    
    if (messageContent) {
      try {
        const parsed = JSON.parse(messageContent);
        analysis = {
          document_type: parsed.document_type || "other",
          extracted_text: parsed.extracted_text || "",
          summary: parsed.summary || "",
          keywords: parsed.keywords || [],
          metadata: {
            personal_info: parsed.personal_info || {},
            academic_info: parsed.academic_info || {},
            detected_fields: parsed.detected_fields || [],
            language: parsed.language || "Unknown",
            confidence: parsed.confidence || 0.5
          },
          suggested_filename: parsed.suggested_filename || originalFilename
        };
      } catch (parseError) {
        console.error("Failed to parse DeepSeek response:", parseError);
        // Fallback analysis
        analysis = {
          document_type: "other",
          extracted_text: messageContent.substring(0, 5000),
          summary: `Document uploaded: ${originalFilename}`,
          keywords: [originalFilename.split('.')[0]],
          metadata: {
            detected_fields: [],
            language: "Unknown",
            confidence: 0.3
          },
          suggested_filename: originalFilename
        };
      }
    } else {
      // Fallback: no content received
      console.log("No content in DeepSeek response, using fallback analysis");
      analysis = {
        document_type: "other",
        extracted_text: "Analysis pending - document uploaded successfully",
        summary: `Document uploaded: ${originalFilename}`,
        keywords: [originalFilename.split('.')[0]],
        metadata: {
          detected_fields: [],
          language: "Unknown",
          confidence: 0.3
        },
        suggested_filename: originalFilename
      };
    }

    // Update the document record with AI analysis
    if (documentId) {
      const { error: updateError } = await supabase
        .from("documents")
        .update({
          document_type: analysis.document_type,
          ai_extracted_text: analysis.extracted_text,
          ai_summary: analysis.summary,
          ai_metadata: {
            keywords: analysis.keywords,
            ...analysis.metadata,
            suggested_filename: analysis.suggested_filename,
            ai_provider: "deepseek"
          },
          ai_processed_at: new Date().toISOString()
        })
        .eq("id", documentId);

      if (updateError) {
        console.error("Failed to update document record:", updateError);
      } else {
        console.log("Document analysis saved successfully (DeepSeek)");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysis
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Document analysis error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
