// @ts-nocheck
// Supabase Edge Function: index-paper (hardened JSON + better errors)
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as b64encode } from "https://deno.land/std@0.203.0/encoding/base64.ts";

type WikiContent = Record<string, { title: string; content: string }>;

interface IndexPaperRequest {
  arxiv_id?: string;
  force?: boolean;
  provider?: "openai" | "gemini" | "anthropic";
  openai_model?: string;
  gemini_model?: string;
  anthropic_model?: string;
  debug?: boolean;
}

const OPENAI_BASE_URL = "https://api.openai.com/v1"; // keep hardcoded

function buildPublicStorageUrl(baseUrl: string, bucket: string, objectPath: string): string {
  const trimmed = baseUrl.replace(/\/$/, "");
  return `${trimmed}/storage/v1/object/public/${bucket}/${objectPath}`;
}

function buildStubWiki(title: string, arxivId: string, category: string): WikiContent {
  return {
    overview: { title: "Overview", content: `Concise analysis of "${title}" (arXiv:${arxivId}) in ${category}.` },
    methodology: { title: "Methodology and Approach", content: "Problem setup, assumptions, experiments." },
    results: { title: "Results and Analysis", content: "Key results and comparisons to prior work." },
    theoretical: { title: "Theoretical Foundations", content: "Core formalism and reasoning." },
    impact: { title: "Impact and Significance", content: `Implications for ${category} research and practice.` },
    related: { title: "Related Work and Context", content: "Positioning in the literature and notable refs." },
  };
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

/* ---------------- JSON sanitizer ---------------- */

function parseJsonFromText(text: string): any {
  const trimmed = (text || "").trim();

  // ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) {
    const inner = fenceMatch[1].trim();
    return JSON.parse(inner);
  }

  // any fenced block somewhere
  const anyFence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (anyFence) {
    return JSON.parse(anyFence[1].trim());
  }

  // raw parse
  try {
    return JSON.parse(trimmed);
  } catch {}

  // slice from first { to last }
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const slice = trimmed.slice(first, last + 1);
    return JSON.parse(slice);
  }

  throw new Error(`Non-JSON response: ${trimmed.slice(0, 500)}`);
}

/* ---------------- Provider clients ---------------- */

// OpenAI: chat.completions with JSON-only instruction
async function callOpenAIForWiki(
  apiKey: string,
  model: string,
  args: { title: string; arxivId: string; abstract?: string; category?: string; pdfUrl?: string }
): Promise<WikiContent> {
  const { title, arxivId, abstract = "", category = "Computer Science", pdfUrl } = args;

  const sys = "You are a strict JSON formatter. Output ONLY a JSON object. No code fences. No prose.";
  const instructions = `Generate a concise wiki-style JSON for an arXiv paper with exactly these keys: overview, methodology, results, theoretical, impact, related. Each value must be {"title":"...","content":"..."}.
Keep it factual and concise.

Title: ${title} | arXiv: ${arxivId} | Category: ${category}
Abstract: ${abstract}
PDF: ${pdfUrl ?? "(not provided)"}

Output VALID JSON ONLY.`;

  const endpoint = `${OPENAI_BASE_URL}/chat/completions`;
  const body = {
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sys },
      { role: "user", content: instructions },
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
    return parseJsonFromText(text) as WikiContent;
  } catch (e) {
    throw new Error(`OpenAI returned non-JSON after sanitize: ${(e as Error).message}`);
  }
}

// Anthropic: text-only with strong JSON instructions
async function callAnthropicForWiki(
  apiKey: string,
  model: string,
  args: { title: string; arxivId: string; abstract?: string; category?: string; pdfUrl?: string }
): Promise<WikiContent> {
  const { title, arxivId, abstract = "", category = "Computer Science", pdfUrl } = args;

  const system = "You are a JSON formatter. Output ONLY a JSON object, no code fences, no prose.";

  const prompt =
`Generate a concise wiki-style JSON for this arXiv paper.
Keys exactly: overview, methodology, results, theoretical, impact, related.
Each value: {"title":"...","content":"..."}.
Be factual and concise.

Title: ${title}
arXiv: ${arxivId}
Category: ${category}
Abstract: ${abstract}
PDF: ${pdfUrl ?? "(not provided)"}

Output VALID JSON ONLY.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${errText.slice(0, 2000)}`);
  }

  const json = await res.json();
  const text = (json?.content || []).filter((c: any) => c?.type === "text").map((c: any) => c.text).join("\n");

  try {
    return parseJsonFromText(text) as WikiContent;
  } catch (e) {
    throw new Error(`Anthropic returned non-JSON after sanitize: ${(e as Error).message}`);
  }
}

// Gemini: inline PDF ≤20MB; responseMimeType JSON; sanitize
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
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent";
  const MAX_INLINE = 20 * 1024 * 1024;

  const prompt =
`Return ONLY a JSON object with keys: overview, methodology, results, theoretical, impact, related.
Each value is {"title":"...","content":"..."}.
Be factual and concise.

Title: ${title} | arXiv: ${arxivId} | Category: ${category}
Abstract: ${abstract}
PDF: ${pdfUrl ?? "(not provided)"} `;

  const parts: any[] = [];
  if (pdfBytes && pdfBytes.byteLength <= MAX_INLINE) {
    const b64 = b64encode(pdfBytes);
    parts.push({ inlineData: { mimeType: "application/pdf", data: b64 } });
  }
  parts.push({ text: prompt });

  const body = {
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
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
  const text =
    json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("\n") || "";

  try {
    return parseJsonFromText(text) as WikiContent;
  } catch (e) {
    throw new Error(`Gemini returned non-JSON after sanitize: ${(e as Error).message}`);
  }
}

/* ---------------- Utils ---------------- */

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

    const supabaseUrl =
      Deno.env.get("PROJECT_URL") || Deno.env.get("SUPABASE_URL") || Deno.env.get("SB_URL") || "";
    const supabaseServiceKey =
      Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SB_SERVICE_ROLE_KEY") || "";
    const geminiKey = Deno.env.get("GEMINI_API_KEY") || "";
    const openaiKey = Deno.env.get("OPENAI_API_KEY") || "";
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") || "";

    const openaiModel = openai_model || Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
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

    // Validate explicit provider override against available keys
    if (providerOverride === "openai" && !openaiKey) throw new Error("OPENAI_API_KEY missing (provider=openai)");
    if (providerOverride === "anthropic" && !anthropicKey) throw new Error("ANTHROPIC_API_KEY missing (provider=anthropic)");
    if (providerOverride === "gemini" && !geminiKey) throw new Error("GEMINI_API_KEY missing (provider=gemini)");

    // Validate Anthropic model name if provider is Anthropic
    if ((providerOverride === "anthropic" || anthropicKey) && providerOverride !== "openai" && providerOverride !== "gemini") {
      if (!VALID_ANTHROPIC.test(anthropicModel)) {
        throw new Error(`Invalid Anthropic model: ${anthropicModel}`);
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const normalized = normalizeArxivId(arxiv_id);
    log("normalized arxiv id", { input: arxiv_id, normalized });

    // Existing?
    if (!force) {
      const { data: existing, error: exErr } = await supabase.from("papers").select("*").eq("arxiv_id", normalized).maybeSingle();
      if (exErr) log("existing lookup error", exErr);
      if (existing) {
        const resp = { ok: true, data: existing, alreadyIndexed: true, debug: debug ? debugLog : undefined };
        return new Response(JSON.stringify(resp), { headers: { ...corsHeaders, "content-type": "application/json" } });
      }
    }

    // 1) Metadata
    const meta = await fetchArxivEntry(normalized);
    log("metadata", { title: meta.title, category: meta.category, authorsCount: meta.authors?.length });

    // 2) PDF ensure in storage + bytes
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

    // 3) Provider resolution - prefer Anthropic by default; allow override; try fallbacks
    let pick: "openai" | "anthropic" | "gemini" | "stub" = "stub";
    const providersToTry: Array<"openai" | "anthropic" | "gemini"> = [];
    if (providerOverride) {
      providersToTry.push(providerOverride);
      if (providerOverride !== "anthropic" && anthropicKey) providersToTry.push("anthropic");
      if (providerOverride !== "openai" && openaiKey) providersToTry.push("openai");
      if (providerOverride !== "gemini" && geminiKey) providersToTry.push("gemini");
    } else {
      if (anthropicKey) providersToTry.push("anthropic");
      if (openaiKey) providersToTry.push("openai");
      if (geminiKey) providersToTry.push("gemini");
    }
    log("provider order", { providersToTry });

    // 4) Attempt providers in order (with loud errors). Validate Anthropic model when attempting it.
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

    // 5) Upsert
    const payload = {
      arxiv_id: normalized,
      title: meta.title,
      authors: meta.authors,
      abstract: meta.summary,
      pdf_url: pdfPublicUrl,
      wiki_content: wiki!,
      status: "cached",
      last_indexed: new Date().toISOString(),
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
