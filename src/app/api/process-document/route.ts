import { NextRequest } from "next/server";
import { geminiModel } from "@/services/gemini";
import { createClient } from "@/services/supabase/server";

const EXTRACTION_PROMPT = `You are a medical document parser for Singapore's subsidy system.

Analyse the provided medical document image and extract the following:
1. Medical codes (ICD-10, SNOMED, or local clinic codes)
2. Diagnosis or condition names
3. Date of visit
4. Healthcare institution name

IMPORTANT: Automatically redact any NRIC numbers (format: [SFTG]XXXXXXX[A-Z]) by replacing them with [REDACTED].

Respond ONLY with a JSON object in this exact shape:
{
  "medicalCodes": ["string"],
  "diagnoses": ["string"],
  "visitDate": "YYYY-MM-DD or null",
  "institution": "string or null",
  "rawText": "full extracted text with NRIC redacted"
}`;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const supabase = await createClient();

  // Upload original file to Supabase Storage
  const fileBuffer = await file.arrayBuffer();
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("documents")
    .upload(fileName, fileBuffer, { contentType: file.type });

  if (uploadError) {
    return Response.json({ error: "Failed to upload file" }, { status: 500 });
  }

  // Send to Gemini for extraction
  const base64 = Buffer.from(fileBuffer).toString("base64");
  const result = await geminiModel.generateContent([
    EXTRACTION_PROMPT,
    { inlineData: { data: base64, mimeType: file.type } },
  ]);

  const responseText = result.response.text().trim();

  let extracted: {
    medicalCodes: string[];
    diagnoses: string[];
    visitDate: string | null;
    institution: string | null;
    rawText: string;
  };

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    extracted = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
  } catch {
    return Response.json({ error: "Failed to parse extraction result" }, { status: 500 });
  }

  // Save result to Supabase
  const { data: submission, error: dbError } = await supabase
    .from("document_submissions")
    .insert({
      storage_path: uploadData.path,
      medical_codes: extracted.medicalCodes,
      diagnoses: extracted.diagnoses,
      visit_date: extracted.visitDate,
      institution: extracted.institution,
      raw_text: extracted.rawText,
    })
    .select()
    .single();

  if (dbError) {
    return Response.json({ error: "Failed to save submission" }, { status: 500 });
  }

  return Response.json({ submission, extracted });
}
