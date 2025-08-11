// @ts-nocheck
// Supabase Edge Function: index-paper (research-grade wiki generation)
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as b64encode } from "https://deno.land/std@0.203.0/encoding/base64.ts";

type WikiSection = {
  id: string;
  title: string;
  content?: string;
  children?: WikiSection[];
};

type WikiContent = WikiSection[];

interface IndexPaperRequest {
  arxiv_id?: string;
  force?: boolean;
  provider?: "openai" | "gemini" | "anthropic";
  openai_model?: string;
  gemini_model?: string;
  anthropic_model?: string;
  debug?: boolean;
}

const OPENAI_BASE_URL = "https://api.openai.com/v1";

function buildPublicStorageUrl(baseUrl: string, bucket: string, objectPath: string): string {
  const trimmed = baseUrl.replace(/\/$/, "");
  return `${trimmed}/storage/v1/object/public/${bucket}/${objectPath}`;
}

// Improved stub with research-oriented structure
function buildStubWiki(title: string, arxivId: string, category: string): WikiContent {
  const sections: WikiSection[] = [
    {
      id: "pipeline-overview",
      title: "Pipeline Overview",
      content: `## What This Paper Does\n*Analysis pending for "${title}" (arXiv:${arxivId})*\n\n## Input → Output Transformation\n- **Input**: [Pending analysis]\n- **Output**: [Pending analysis]\n- **Key Transformation**: [Pending analysis]`,
    },
    {
      id: "technical-approach",
      title: "Technical Approach",
      content: "## Architecture\n[Pending analysis]\n\n## Training Pipeline\n[Pending analysis]\n\n## Loss Functions\n[Pending analysis]",
    },
    {
      id: "experiments",
      title: "Experiments & Results",
      content: "## Evaluation Setup\n[Pending analysis]\n\n## Key Results\n[Pending analysis]\n\n## Comparison to Baselines\n[Pending analysis]",
    },
    {
      id: "implementation",
      title: "Implementation Details",
      content: "## Reproducibility\n[Pending analysis]\n\n## Computational Requirements\n[Pending analysis]",
    },
  ];
  return sections;
}

async function fetchArxivEntry(arxivId: string) {
  const res = await fetch(`https://export.arxiv.org/api/query?id_list=${arxivId}`);
  if (!res.ok) throw new Error(`arXiv API failed: ${res.status}`);
  const xmlText = await res.text();
  const entryMatch = xmlText.match(/<entry[\s\S]*?>([\s\S]*?)<\/entry>/i);
  if (!entryMatch) throw new Error("No <entry> found in arXiv response");
  const entryXml = entryMatch[1];
  const title = (entryXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/\s+/g, " ").trim();
  const summary = (entryXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] || "").replace(/\s+/g, " ").trim();
  const published = entryXml.match(/<published[^>]*>([^<]+)<\/published>/i)?.[1] || "";
  const category = entryXml.match(/<category[^>]*term="([^"]+)"/i)?.[1] || "Computer Science";
  const authors = Array.from(entryXml.matchAll(/<author[\s\S]*?>[\s\S]*?<name[^>]*>([^<]+)<\/name>[\s\S]*?<\/author>/gi)).map((m) =>
    (m[1] || "").trim()
  );
  if (!title) throw new Error("Failed to parse title from arXiv entry");
  return { title, summary, published, category, authors };
}

async function downloadPdfFromArxiv(arxivId: string): Promise<Uint8Array> {
  const pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
  const res = await fetch(pdfUrl);
  if (!res.ok) throw new Error(`PDF download failed: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function uploadPdf(supabase: any, objectPath: string, pdfBytes: Uint8Array) {
  const fileName = objectPath.split("/").pop();
  const { data: existing } = await supabase.storage.from("papers").list("", { search: fileName });
  const already = Array.isArray(existing) && existing.some((o: any) => o.name === fileName);
  if (!already) {
    const { error } = await supabase.storage.from("papers").upload(objectPath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (error) throw error;
  }
}

/* ---------------- Enhanced JSON Parser ---------------- */
function parseJsonFromText(text: string): any {
  const trimmed = (text || "").trim();
  
  // Try various extraction methods
  const strategies = [
    // Direct parse
    () => JSON.parse(trimmed),
    // Code fence extraction
    () => {
      const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      return match ? JSON.parse(match[1].trim()) : null;
    },
    // Find JSON boundaries
    () => {
      const start = trimmed.indexOf('[') !== -1 ? trimmed.indexOf('[') : trimmed.indexOf('{');
      const end = trimmed.lastIndexOf(']') !== -1 ? trimmed.lastIndexOf(']') : trimmed.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        return JSON.parse(trimmed.slice(start, end + 1));
      }
      return null;
    }
  ];
  
  for (const strategy of strategies) {
    try {
      const result = strategy();
      if (result) return result;
    } catch {}
  }
  
  throw new Error(`Failed to extract JSON from response: ${trimmed.slice(0, 500)}`);
}

/* ---------------- Provider Implementations with Enhanced Prompts ---------------- */

function slugifyId(input: string): string {
  return (input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeWiki(input: any): WikiContent {
  if (!input) throw new Error("Empty wiki JSON");
  
  if (Array.isArray(input)) {
    return input.map((s: any) => ({
      id: s?.id || slugifyId(s?.title || "section"),
      title: s?.title || s?.id || "Section",
      content: typeof s?.content === "string" ? s.content : undefined,
      children: Array.isArray(s?.children) ? normalizeWiki(s.children) as any : undefined,
    }));
  }
  
  if (Array.isArray(input?.sections)) {
    return normalizeWiki(input.sections);
  }
  
  throw new Error("Unrecognized wiki JSON format");
}

// Enhanced prompts for research-grade output
const RESEARCH_WIKI_SYSTEM_PROMPT = `You are an expert ML/AI researcher creating technical documentation for other researchers. Your analysis must be:
1. TECHNICALLY PRECISE: Use exact terminology, equations, and implementation details
2. PIPELINE-FOCUSED: Always frame the work as input→transformations→output
3. REPRODUCIBILITY-ORIENTED: Include all details needed to reimplement
4. EVIDENCE-BASED: Only state what you can verify from the source material
Output ONLY valid JSON. No markdown code fences, no prose outside JSON.`;

const RESEARCH_WIKI_USER_PROMPT = (title: string, arxivId: string, category: string, abstract: string, pdfUrl?: string) => `
Analyze this paper and create a researcher-grade wiki as a JSON array of sections.

CRITICAL REQUIREMENTS:
1. READ THE PDF if available (${pdfUrl ? 'PDF PROVIDED' : 'PDF NOT PROVIDED'}). Extract actual technical details.
2. Structure sections based on THIS paper's content, not a generic template
3. Every section must have substantive technical content or be omitted entirely
4. Use this exact JSON format: [{"id": "string", "title": "string", "content": "markdown", "children": [optional]}]

SECTION STRUCTURE GUIDELINES:

**"pipeline-overview"**: The Complete Data Flow
- Map the ENTIRE pipeline: raw inputs → preprocessing → model stages → outputs
- Specify data types, dimensions, formats at each stage
- Include pseudocode for key transformations
Example content structure:
## Input Pipeline
- **Raw Input**: Images (224×224×3 RGB) from ImageNet
- **Preprocessing**: ResNet normalization, random crops, horizontal flips
- **Batch Formation**: 256 samples, mixed precision

## Model Pipeline  
\`\`\`python
x = self.encoder(images)  # [B, 256, 56, 56]
z = self.bottleneck(x)     # [B, 512, 28, 28]
logits = self.head(z)      # [B, num_classes]
\`\`\`

## Output Space
- **Training**: Cross-entropy loss over 1000 classes
- **Inference**: Top-5 predictions with confidence scores

**"architecture"**: Complete Technical Specification
- Layer-by-layer architecture with dimensions
- Key innovations and why they work
- Attention mechanisms, normalization, activations
- Include architecture diagrams as ASCII or described precisely

**"training"**: Full Training Recipe
- Dataset details (size, source, preprocessing, augmentations)
- Optimization (optimizer, LR schedule, warmup, decay)
- Loss functions with mathematical formulation
- Training dynamics (convergence, instabilities, solutions)
- Hyperparameters (batch size, epochs, regularization)
Example:
## Loss Function
$$\\mathcal{L} = \\mathcal{L}_{CE} + \\lambda_{reg}||\\theta||_2 + \\beta\\mathcal{L}_{aux}$$
where $\\mathcal{L}_{CE}$ is cross-entropy, $\\lambda_{reg}=0.0001$

**"experiments"**: Detailed Evaluation
- Evaluation metrics and datasets
- Main results with EXACT numbers from tables
- Ablation studies showing impact of each component
- Failure modes and limitations observed
- Statistical significance if provided

**"implementation"**: Reproducibility Details
- Compute requirements (GPUs, memory, training time)
- Framework and version requirements
- Critical implementation details often in appendix
- Known issues or tricks for stability
- Code snippets for tricky parts

**"key-insights"**: Why This Works (Research Understanding)
- Core innovations and why they're effective
- Theoretical justification if provided
- Connections to related work
- What makes this better than prior work

**"related-work"**: Contextual Positioning
- How this extends/differs from cited papers
- What problems it solves that others don't
- Performance comparisons with specific baselines

Paper Details:
Title: ${title}
ArXiv: ${arxivId}  
Category: ${category}
Abstract: ${abstract}
${pdfUrl ? `PDF URL: ${pdfUrl}` : ''}

IMPORTANT:
- If you cannot access the PDF or find specific details, create sections based on the abstract but mark limitations clearly
- Include actual numbers, equations, and code when available
- Omit sections if no substantive content available
- For each claim, indicate source: [Section X.Y], [Table N], [Figure M], [Abstract], or [Inferred]

Output the JSON array directly with no additional text.`;

async function callOpenAIForWiki(
  apiKey: string,
  model: string,
  args: { title: string; arxivId: string; abstract?: string; category?: string; pdfUrl?: string }
): Promise<WikiContent> {
  const { title, arxivId, abstract = "", category = "Computer Science", pdfUrl } = args;
  
  const endpoint = `${OPENAI_BASE_URL}/chat/completions`;
  const body = {
    model,
    temperature: 0.1,
    max_tokens: 4000,
    messages: [
      { role: "system", content: RESEARCH_WIKI_SYSTEM_PROMPT },
      { role: "user", content: RESEARCH_WIKI_USER_PROMPT(title, arxivId, category, abstract, pdfUrl) },
    ],
  };
  
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}: ${errText.slice(0, 2000)}`);
  }
  
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content ?? "";
  
  try {
    const parsed = parseJsonFromText(text);
    return normalizeWiki(parsed);
  } catch (e) {
    throw new Error(`OpenAI returned invalid wiki JSON: ${(e as Error).message}`);
  }
}

async function callAnthropicForWiki(
  apiKey: string,
  model: string,
  args: { title: string; arxivId: string; abstract?: string; category?: string; pdfUrl?: string }
): Promise<WikiContent> {
  const { title, arxivId, abstract = "", category = "Computer Science", pdfUrl } = args;
  
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      temperature: 0.1,
      system: RESEARCH_WIKI_SYSTEM_PROMPT,
      messages: [{ 
        role: "user", 
        content: [{ 
          type: "text", 
          text: RESEARCH_WIKI_USER_PROMPT(title, arxivId, category, abstract, pdfUrl) 
        }] 
      }],
    }),
  });
  
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${errText.slice(0, 2000)}`);
  }
  
  const json = await res.json();
  const text = (json?.content || []).filter((c: any) => c?.type === "text").map((c: any) => c.text).join("\n");
  
  try {
    const parsed = parseJsonFromText(text);
    return normalizeWiki(parsed);
  } catch (e) {
    throw new Error(`Anthropic returned invalid wiki JSON: ${(e as Error).message}`);
  }
}

async function callGeminiForWiki(
  apiKey: string,
  title: string,
  arxivId: string,
  pdfBytes: Uint8Array | null,
  model: string,
  abstract: string,
  category: string,
  pdfUrl?: string
): Promise<WikiContent> {
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");
  
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent";
  const MAX_INLINE = 20 * 1024 * 1024;
  
  // Enhanced prompt for Gemini with PDF access
  const geminiPrompt = `${RESEARCH_WIKI_USER_PROMPT(title, arxivId, category, abstract, pdfUrl)}

${pdfBytes && pdfBytes.byteLength <= MAX_INLINE ? 
  'IMPORTANT: A PDF is attached. Read it thoroughly and extract specific technical details, equations, hyperparameters, and results.' : 
  'Note: PDF too large to attach inline. Work with available information.'}`;
  
  const parts: any[] = [];
  if (pdfBytes && pdfBytes.byteLength <= MAX_INLINE) {
    const b64 = b64encode(pdfBytes);
    parts.push({ inlineData: { mimeType: "application/pdf", data: b64 } });
  }
  parts.push({ text: geminiPrompt });
  
  const body = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  };
  
  const res = await fetch(`${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 2000)}`);
  }
  
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("\n") || "";
  
  try {
    const parsed = parseJsonFromText(text);
    return normalizeWiki(parsed);
  } catch (e) {
    throw new Error(`Gemini returned invalid wiki JSON: ${(e as Error).message}`);
  }
}

/* ---------------- Utilities ---------------- */
function normalizeArxivId(input: string): string {
  let id = input.trim();
  try {
    if (id.startsWith("http")) {
      const url = new URL(id);
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "abs" || p === "pdf");
      if (idx >= 0 && parts[idx + 1]) id = parts[idx + 1].replace(/\.pdf$/i, "");
    }
  } catch {}
  return id.replace(/^arxiv:/i, "").replace(/\.pdf$/i, "").replace(/v\d+$/i, "");
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_ANTHROPIC = /^(claude-3-(opus|sonnet|haiku)-\d{8}|claude-3-7-sonnet-\d{8})$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  
  const t0 = Date.now();
  const debugLog: any = { t0, notes: [] };
  
  function log(note: string, extra?: any) {
    const item = extra ? { note, extra } : { note };
    debugLog.notes.push(item);
    console.log("[index-paper]", note, extra ?? "");
  }
  
  try {
    const body: IndexPaperRequest = await req.json().catch(() => ({}));
    const { arxiv_id, force, provider: providerOverride, openai_model, gemini_model, anthropic_model, debug } = body || {};
    
    if (!arxiv_id) {
      return new Response(JSON.stringify({ error: "Missing arxiv_id" }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
    
    const supabaseUrl = Deno.env.get("PROJECT_URL") || Deno.env.get("SUPABASE_URL") || Deno.env.get("SB_URL") || "";
    const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SB_SERVICE_ROLE_KEY") || "";
    const geminiKey = Deno.env.get("GEMINI_API_KEY") || "";
    const openaiKey = Deno.env.get("OPENAI_API_KEY") || "";
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") || "";
    
    // Use more capable models by default for better results
    const openaiModel = openai_model || Deno.env.get("OPENAI_MODEL") || "gpt-4o";
    const geminiModel = gemini_model || Deno.env.get("GEMINI_MODEL") || "gemini-2.5-pro";
    const anthropicModel = anthropic_model || Deno.env.get("ANTHROPIC_MODEL") || "claude-3-7-sonnet-20250219";
    
    log("env summary", {
      hasServiceKey: !!supabaseServiceKey,
      supabaseUrl,
      hasOpenAI: !!openaiKey,
      hasAnthropic: !!anthropicKey,
      hasGemini: !!geminiKey,
      openaiModel,
      anthropicModel,
      geminiModel,
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase secrets: set SERVICE_ROLE_KEY and PROJECT_URL (or SUPABASE_URL)");
    }
    
    // Validate provider availability
    if (providerOverride === "openai" && !openaiKey) throw new Error("OPENAI_API_KEY missing (provider=openai)");
    if (providerOverride === "anthropic" && !anthropicKey) throw new Error("ANTHROPIC_API_KEY missing (provider=anthropic)");
    if (providerOverride === "gemini" && !geminiKey) throw new Error("GEMINI_API_KEY missing (provider=gemini)");
    
    // Validate Anthropic model
    if ((providerOverride === "anthropic" || anthropicKey) && providerOverride !== "openai" && providerOverride !== "gemini") {
      if (!VALID_ANTHROPIC.test(anthropicModel)) {
        throw new Error(`Invalid Anthropic model: ${anthropicModel}`);
      }
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const normalized = normalizeArxivId(arxiv_id);
    log("normalized arxiv id", { input: arxiv_id, normalized });
    
    // Check for existing entry
    if (!force) {
      const { data: existing, error: exErr } = await supabase.from("papers").select("*").eq("arxiv_id", normalized).maybeSingle();
      if (exErr) log("existing lookup error", exErr);
      if (existing) {
        const resp = { ok: true, data: existing, alreadyIndexed: true, debug: debug ? debugLog : undefined };
        return new Response(JSON.stringify(resp), { headers: { ...corsHeaders, "content-type": "application/json" } });
      }
    }
    
    // Fetch metadata
    const meta = await fetchArxivEntry(normalized);
    log("metadata", { title: meta.title, category: meta.category, authorsCount: meta.authors?.length });
    
    // Get PDF
    const objectPath = `${normalized}.pdf`;
    const { data: dl } = await supabase.storage.from("papers").download(objectPath);
    let pdfBytes: Uint8Array | null = null;
    
    if (dl) {
      pdfBytes = new Uint8Array(await dl.arrayBuffer());
      log("pdf found in storage", { bytes: pdfBytes.byteLength });
    } else {
      pdfBytes = await downloadPdfFromArxiv(normalized);
      log("downloaded pdf", { bytes: pdfBytes.byteLength });
      await uploadPdf(supabase, objectPath, pdfBytes);
      log("uploaded pdf to storage", { objectPath });
    }
    
    const pdfPublicUrl = buildPublicStorageUrl(supabaseUrl, "papers", objectPath);
    log("pdfPublicUrl", { pdfPublicUrl });
    
    // Provider selection strategy - prioritize Gemini for PDF reading
    let pick: "openai" | "anthropic" | "gemini" | "stub" = "stub";
    const providersToTry: Array<"openai" | "anthropic" | "gemini"> = [];
    
    if (providerOverride) {
      providersToTry.push(providerOverride);
      // Add fallbacks
      if (providerOverride !== "gemini" && geminiKey) providersToTry.push("gemini");
      if (providerOverride !== "anthropic" && anthropicKey) providersToTry.push("anthropic");
      if (providerOverride !== "openai" && openaiKey) providersToTry.push("openai");
    } else {
      // Default order: Gemini (best PDF reading), then Anthropic, then OpenAI
      if (geminiKey) providersToTry.push("gemini");
      if (anthropicKey) providersToTry.push("anthropic");
      if (openaiKey) providersToTry.push("openai");
    }
    
    log("provider order", { providersToTry });
    
    // Try providers in order
    let wiki: WikiContent | null = null;
    const providerErrors: Record<string, string> = {};
    
    for (const attempt of providersToTry) {
      try {
        if (attempt === "anthropic") {
          if (!VALID_ANTHROPIC.test(anthropicModel)) {
            throw new Error(`Invalid Anthropic model: ${anthropicModel}`);
          }
          wiki = await callAnthropicForWiki(anthropicKey, anthropicModel, {
            title: meta.title,
            arxivId: normalized,
            abstract: meta.summary,
            category: meta.category,
            pdfUrl: pdfPublicUrl,
          });
        } else if (attempt === "openai") {
          wiki = await callOpenAIForWiki(openaiKey, openaiModel, {
            title: meta.title,
            arxivId: normalized,
            abstract: meta.summary,
            category: meta.category,
            pdfUrl: pdfPublicUrl,
          });
        } else if (attempt === "gemini") {
          wiki = await callGeminiForWiki(
            geminiKey,
            meta.title,
            normalized,
            pdfBytes,
            geminiModel,
            meta.summary,
            meta.category,
            pdfPublicUrl,
          );
        }
        pick = attempt;
        log("provider chosen", { pick });
        break;
      } catch (err) {
        const msg = String((err as Error)?.message || err);
        providerErrors[attempt] = msg;
        log("provider error", { provider: attempt, error: msg });
      }
    }
    
    if (!wiki) {
      wiki = buildStubWiki(meta.title, normalized, meta.category);
      pick = "stub";
    }
    
    // Upsert to database
    const payload = {
      arxiv_id: normalized,
      title: meta.title,
      authors: meta.authors,
      abstract: meta.summary,
      pdf_url: pdfPublicUrl,
      wiki_content: wiki!,
      status: "cached",
      last_indexed: new Date().toISOString(),
      category: meta.category,
      published_date: meta.published || "Unknown",
    };
    
    let data, error;
    const { data: existing2 } = await supabase.from("papers").select("id").eq("arxiv_id", normalized).maybeSingle();
    
    if (existing2) {
      ({ data, error } = await supabase.from("papers").update(payload).eq("arxiv_id", normalized).select("*").single());
    } else {
      ({ data, error } = await supabase.from("papers").insert(payload).select("*").single());
    }
    
    if (error) throw error;
    
    const t1 = Date.now();
    log("done", { ms: t1 - t0 });
    
    return new Response(
      JSON.stringify({
        ok: true,
        data,
        provider: pick,
        providerErrors,
        debug: debug ? debugLog : undefined,
      }),
      { headers: { ...corsHeaders, "content-type": "application/json" } },
    );
  } catch (err) {
    const t1 = Date.now();
    log("fatal", { err: String(err), ms: t1 - t0 });
    return new Response(JSON.stringify({ error: String(err), debug: debugLog }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});