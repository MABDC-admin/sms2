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
    
    console.log("Analyzing document:", { documentId, mimeType, originalFilename });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // System prompt for document analysis
    const systemPrompt = `You are an expert document analyzer for a school management system. Analyze the uploaded document image and extract all relevant information.

Your task is to:
1. Identify the document type (birth_certificate, report_card, id_photo, transcript, medical_record, diploma, recommendation_letter, clearance, enrollment_form, other)
2. Extract ALL visible text from the document using OCR
3. Generate a 2-3 sentence summary of the document content
4. Extract 5-10 relevant keywords for search/filtering
5. Identify key information fields (names, dates, ID numbers, addresses, grades, schools)
6. Detect the primary language (English, Tagalog, Arabic, etc.)
7. Provide a confidence score (0.0-1.0) for your analysis

Return your analysis in a structured format.`;

    const userPrompt = `Analyze this document image from a student file. Original filename: "${originalFilename}".

Extract all text and information you can see in this document. Be thorough and accurate.`;

    // Call Lovable AI with vision capabilities (using Gemini which supports multimodal)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "document_analysis",
              description: "Structured analysis of a document with extracted text and metadata",
              parameters: {
                type: "object",
                properties: {
                  document_type: {
                    type: "string",
                    enum: ["birth_certificate", "report_card", "id_photo", "transcript", "medical_record", "diploma", "recommendation_letter", "clearance", "enrollment_form", "other"],
                    description: "Type of document identified"
                  },
                  extracted_text: {
                    type: "string",
                    description: "All visible text extracted from the document via OCR"
                  },
                  summary: {
                    type: "string",
                    description: "2-3 sentence summary of the document content"
                  },
                  keywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "5-10 relevant keywords for search/filtering"
                  },
                  personal_info: {
                    type: "object",
                    properties: {
                      full_name: { type: "string" },
                      birth_date: { type: "string" },
                      gender: { type: "string" },
                      address: { type: "string" },
                      id_number: { type: "string" }
                    },
                    description: "Personal information found in the document"
                  },
                  academic_info: {
                    type: "object",
                    properties: {
                      school_name: { type: "string" },
                      grade_level: { type: "string" },
                      school_year: { type: "string" },
                      grades: { type: "string" },
                      courses: { type: "string" }
                    },
                    description: "Academic information found in the document"
                  },
                  detected_fields: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of data fields detected in the document"
                  },
                  language: {
                    type: "string",
                    description: "Primary language of the document (English, Tagalog, Arabic, etc.)"
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score for the analysis (0.0-1.0)"
                  },
                  suggested_filename: {
                    type: "string",
                    description: "Suggested meaningful filename based on content (e.g., Birth_Certificate_John_Doe_2024.jpg)"
                  }
                },
                required: ["document_type", "extracted_text", "summary", "keywords", "detected_fields", "language", "confidence", "suggested_filename"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "document_analysis" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits required. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI response received:", JSON.stringify(aiResponse).substring(0, 500));

    // Extract the tool call result
    let analysis: DocumentAnalysis | null = null;
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
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
    } else {
      // Fallback: try to extract from message content
      console.log("No tool call found, using fallback analysis");
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
            suggested_filename: analysis.suggested_filename
          },
          ai_processed_at: new Date().toISOString()
        })
        .eq("id", documentId);

      if (updateError) {
        console.error("Failed to update document record:", updateError);
      } else {
        console.log("Document analysis saved successfully");
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
