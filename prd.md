# Product Requirements Document (PRD) and Execution Plan for Deep-Arxiv.ai Backend
## 1. Introduction
### 1.1 Project Overview
Deep-Arxiv.ai is a web application that provides AI-generated, wiki-style documentation and explanations for arXiv papers, modeled after DeepWiki.com (which does the same for GitHub repositories). Users can browse pre-indexed (cached) papers for free without login. However, to index a new (uncached) paper or to chat with a paper's content (using an AI-powered Q&A interface), users must authenticate, and a paid subscription is required.
- **Key Similarities to DeepWiki**:
  - Home page with search bar, grid of trending/cached papers.
  - Indexed paper pages with structured wiki content (sections, diagrams, tables, source references to PDF pages/sections/equations).
  - Unindexed paper flow: Prompt user to initiate indexing (but with subscription instead of just email).
  - Infinite scroll, dark mode, share features.
  - Generated content patterns: Hierarchical sections, visual diagrams (e.g., model architectures, workflows), tables (e.g., hyperparameters, results), pseudocode snippets, source linking (to arXiv PDF pages/sections).
- **Key Differences**:
  - Domain: arXiv papers (identified by arXiv ID or URL) instead of GitHub repos.
  - Authentication: Required for subscription features (indexing new papers, chatting).
  - Payments: Via Stripe for subscription tiers.
  - Not fully free: Core browsing is free/no-login, but actions like indexing and chat require subscription.
 The frontend is built in this repo. A preview is available at https://deep-arxiv.saeejithn.workers.dev/. The custom domain `deep-arxiv.ai` is not live yet. This PRD focuses on the **backend implementation** using:
- **Cloudflare Workers**: For serverless API endpoints, handling requests, business logic, authentication, and integrations.
- **Supabase**: For database (PostgreSQL), authentication (built-in Supabase Auth), storage (for generated wiki content, if needed), and real-time features (e.g., indexing status updates).
- **Stripe**: For subscriptions (e.g., monthly tiers).
- **arXiv API**: To fetch paper metadata and PDFs.
- **AI Integration**: Use Google's Gemini (e.g., gemini-1.5-pro) for generating wiki content and handling chat. Leverage its large multimodal context window (up to 1M+ tokens) to process entire PDFs without chunking—pass the full PDF as input for generation/chat.
This document is designed to be extremely detailed for an AI agent (e.g., a coding model) to implement the backend step-by-step. It includes data models, API endpoints, flows, code snippets/examples, and an execution plan.
 
 Hackathon MVP pivot (read first):
 - We will ship a no-auth, no-Stripe MVP in ~5 hours.
 - Reads happen directly from Supabase (supabase-js from the frontend).
 - “Index this paper” is a single Supabase Edge Function (`index-paper`) that fetches arXiv PDF, calls Gemini, and writes wiki JSON into `public.papers.wiki_content`.
 - Chat, subscriptions/quotas, Cloudflare Workers, and webhooks are deferred to Phase 2.
### 1.2 Assumptions
- **AI Generation**: Wiki content is generated using Gemini API. Chat uses the same API with paper context.
- **Subscriptions**: Managed via Stripe. Webhooks handle create/update/cancel. Quotas: Track monthly usage in Supabase (e.g., indexes_used_this_month).
- **Pricing Model**:
  - Basic ($10/month): 5 new paper indexes + 10 chat sessions/month.
  - Pro ($20/month): 20 indexes + unlimited chats/month.
  - Unlimited ($30/month): Unlimited indexes + unlimited chats/month.
  - Quotas reset monthly; track usage per user.
  - Free tier: View cached papers only (no indexing/chat).
- **Free Tier**: Viewing cached papers is free/no-login. Indexing/chat requires login and subscription.
- **Indexing Process**: Asynchronous; user subscribes/checks quota, job queues, processes via Worker, notifies via email (use Supabase Edge Functions or SendGrid integration).
- **arXiv Integration**: Use arXiv API (https://arxiv.org/help/api) to fetch metadata/PDFs. Download PDF, base64-encode, send to Gemini as multimodal content (Gemini supports PDF files directly in API calls).
- **Content Storage**: Store generated wiki as JSON (sections, diagrams as Mermaid/SVG strings, tables as Markdown) in Supabase.
- **Diagrams/Tables**: AI prompt to generate Mermaid code for diagrams, Markdown for tables.
- **Source Linking**: Link to arXiv PDF with page/section anchors (e.g., https://arxiv.org/pdf/<id>.pdf#page=5).
- **No Private Papers**: All arXiv papers are public; no private indexing needed.
- **Scalability**: Cloudflare Workers handle scale; Supabase for data.
- **Security**: Use JWT from Supabase Auth; validate in Workers.
- **PDF Processing**: No chunking; Gemini handles full PDFs. In Worker: Fetch PDF from arXiv, base64, include in API payload.
- **Quotas**: Enforced in API; e.g., before indexing, check subscription active and quota available.
If these assumptions are incorrect, provide clarifications.
### 1.3 High-Level Architecture
- **Frontend**: Calls API endpoints on Cloudflare Workers (e.g., via fetch('/api/papers')).
- **Workers**: Handle routing, auth, subscription checks, queue jobs. Use KV for caching, Queues for async tasks. Use Durable Objects or KV for quota caching if needed.
- **Supabase**: DB schemas for users, papers, wiki content, subscriptions, usage. Auth for login/signup.
- **External**: Stripe webhook for subscriptions, Gemini API for AI, arXiv API for papers, email service (e.g., SendGrid) for notifications.
- **Flows**:
  - Search/Browse: No auth, query Supabase.
  - Index New: Auth + check sub/quota → Queue job → Generate → Store → Notify.
  - Chat: Auth + check sub/quota → Session → AI queries with context.
## 2. Functional Requirements
### 2.1 User Authentication
- Signup/Login: Email/password or OAuth (Google/GitHub) via Supabase Auth.
- Roles: User (default), Admin (for moderation).
- JWT tokens for API auth.
### 2.2 Paper Browsing (Free)
- Search trending/cached papers.
- View wiki for cached papers: Sections, TOC, search within paper, diagrams/tables/snippets.
### 2.3 Indexing New Paper (Subscription-Based)
- Auth + active sub required.
- Check tier quota (e.g., indexes_used < limit).
- If ok: Queue job, increment usage.
- Generation: Fetch PDF, base64, send to Gemini with prompt: "Generate wiki-style summary for this arXiv paper PDF. Output JSON: {sections: [...], diagrams: [{mermaid: '...', sources: [{page: int}]} ], tables: [...], snippets: [...] }. Structure: Abstract, Introduction, Methods, Experiments, Results, etc. Use Mermaid for diagrams (e.g., model architectures), Markdown for tables (e.g., metrics), LaTeX for equations. Reference sources by page/section/equation."
- Store JSON, notify.
### 2.4 Chat with Paper (Subscription-Based)
- Similar: Check sub/quota (for Basic tier).
- Chat: Load wiki/PDF context into Gemini (multimodal), handle conversation.
### 2.5 Subscriptions
- Create/cancel via Stripe.
- Webhooks update DB (e.g., activate sub, reset quotas on renew).
- Monthly reset: Use Supabase cron or Worker scheduler to reset usage monthly.
### 2.6 Admin Features
- Moderation via frontend calls (optional).
### 2.7 Non-Functional
- Performance: <500ms API response for reads; async for indexing.
- Security: HTTPS, input validation, rate limiting.
- Error Handling: Graceful errors (e.g., "Paper not found").
- Logging: Use Cloudflare logs.
- Real-Time: Use Supabase Realtime for indexing status updates.
- Quota enforcement.
 
## 3. Data Model (MVP)
Use Supabase SQL editor to create the following minimal table. Enable RLS but allow public read; writes will be via Service Role inside the Edge Function only.

```
create table if not exists public.papers (
  id uuid primary key default gen_random_uuid(),
  arxiv_id text unique not null,
  title text,
  authors jsonb,
  abstract text,
  pdf_url text,
  wiki_content jsonb,
  created_at timestamptz default now()
);

alter table public.papers enable row level security;
-- Public read (MVP)
create policy papers_public_read on public.papers
  for select using (true);
```
## 3. Data Models (Supabase Schemas)
Use Supabase Dashboard or SQL to create these tables. Enable Row Level Security (RLS) for auth.
### 3.1 Profiles
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT, -- Active sub ID
  current_tier TEXT CHECK (current_tier IN ('basic', 'pro', 'unlimited')), -- NULL for free
  created_at TIMESTAMP DEFAULT NOW()
);
```
### 3.2 Papers
```sql
CREATE TABLE papers (
  id SERIAL PRIMARY KEY,
  arxiv_id TEXT UNIQUE NOT NULL, -- e.g., '2401.12345'
  title TEXT,
  authors TEXT[],
  abstract TEXT,
  pdf_url TEXT, -- e.g., 'https://arxiv.org/pdf/<id>.pdf'
  stars INTEGER DEFAULT 0, -- Popularity metric (e.g., from citations)
  last_indexed TIMESTAMP,
  status TEXT DEFAULT 'uncached' -- 'uncached', 'indexing', 'cached', 'failed'
);
```
- Add on-insert trigger to fetch metadata/citations:
```sql
-- Example trigger (in Supabase SQL)
CREATE FUNCTION fetch_arxiv_metadata() RETURNS TRIGGER AS $$
BEGIN
  -- Pseudo: Call arXiv API via Edge Function, update title/authors/abstract/pdf_url/stars (citations)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER on_paper_insert AFTER INSERT ON papers FOR EACH ROW EXECUTE PROCEDURE fetch_arxiv_metadata();
```
### 3.3 Wiki Contents
```sql
CREATE TABLE wiki_contents (
  id SERIAL PRIMARY KEY,
  paper_id INTEGER REFERENCES papers(id),
  sections JSONB, -- Array of {title: str, content: str, subsections: [...]}
  diagrams JSONB, -- Array of {type: 'flowchart', mermaid_code: str, sources: [{page: int, section: str}]}
  tables JSONB, -- Array of {title: str, markdown: str, sources: [...]}
  snippets JSONB, -- Array of {code: str, language: 'latex', sources: [...]}
  full_json JSONB -- Complete structured wiki as JSON for rendering
);
```
### 3.4 Indexing Jobs
```sql
CREATE TABLE indexing_jobs (
  id SERIAL PRIMARY KEY,
  paper_id INTEGER REFERENCES papers(id),
  user_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'queued',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```
### 3.5 Chat Sessions
```sql
CREATE TABLE chat_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  paper_id INTEGER REFERENCES papers(id),
  session_id TEXT UNIQUE, -- Generated UUID
  messages JSONB[], -- Array of {role: 'user'/'assistant', content: str}
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP -- e.g., 1 hour after start
);
```
### 3.6 Subscriptions
```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  stripe_subscription_id TEXT UNIQUE,
  tier TEXT CHECK (tier IN ('basic', 'pro', 'unlimited')),
  status TEXT DEFAULT 'active', -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```
### 3.7 Usage (for Quotas)
```sql
CREATE TABLE usage (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  month_year TEXT, -- e.g., '2025-08'
  indexes_used INTEGER DEFAULT 0,
  chats_used INTEGER DEFAULT 0,
  last_reset TIMESTAMP DEFAULT NOW()
);
-- Index on user_id, month_year
```
- Monthly reset: Supabase pg_cron job: `SELECT cron.schedule('monthly_reset', '0 0 1 * *', 'UPDATE usage SET indexes_used=0, chats_used=0, last_reset=NOW() WHERE month_year = to_char(NOW(), ''YYYY-MM'');');`
Enable RLS:
- For papers/wiki_contents: Allow public read if status='cached'.
- For jobs/sessions/subscriptions/usage: Authenticated user only, own rows.
## 4. API/Functions (MVP)
We avoid Cloudflare for the hackathon. Reads happen via supabase-js directly from the frontend. Writes happen through a single Supabase Edge Function.

### 4.1 Reads (frontend → Supabase)
- Search: `supabase.from('papers').select('*').or('title.ilike.%q%,abstract.ilike.%q%').not('wiki_content','is',null)` with simple pagination.
- Get Paper: `supabase.from('papers').select('*').eq('arxiv_id', arxivId).single()`.

### 4.2 Supabase Edge Function: index-paper
- Path: `POST /index-paper`
- Body: `{ arxiv_id: string }`
- Steps:
  1) Fetch metadata from `https://export.arxiv.org/api/query?id_list=<id>`
  2) Fetch PDF from `https://arxiv.org/pdf/<id>.pdf`, base64 encode
  3) Call Gemini (gemini-1.5-pro) with prompt to produce JSON wiki
  4) Upsert into `public.papers` (`arxiv_id`, `title`, `authors`, `abstract`, `pdf_url`, `wiki_content`)
- Response: `{ ok: true }` or `{ error: string }`

## 4B. API Endpoints (Cloudflare Workers) – Deferred for Phase 2
Implement as a single Worker script with routing (e.g., using itty-router). Use environment variables for secrets (SUPABASE_URL, SUPABASE_KEY, STRIPE_SECRET, GEMINI_API_KEY, SENDGRID_KEY, STRIPE_BASIC_PRICE, STRIPE_PRO_PRICE, STRIPE_UNLIMITED_PRICE).
### 4.1 Worker Setup
- Bindings: KV (for caching), Queues (for jobs).
- Code Skeleton:
  ```javascript
  import { Router } from 'itty-router';
  const router = Router();
  // Supabase client
  import { createClient } from '@supabase/supabase-js';
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
  // Stripe
  import Stripe from 'stripe';
  const stripe = new Stripe(env.STRIPE_SECRET);
  // Gemini API
  async function callGemini(prompt, pdfBase64 = null) {
    const content = [{ type: 'text', text: prompt }];
    if (pdfBase64) content.push({ type: 'file_data', file_data: { mime_type: 'application/pdf', data: pdfBase64 } }); // Gemini multimodal
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' + env.GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: content }] })
    });
    const { candidates } = await response.json();
    return candidates[0].content.parts[0].text; // Parse JSON from response
  }
  // Auth middleware
  async function auth(req) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('Unauthorized');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error('Invalid token');
    return user;
  }
  // Error handler
  router.all('*', (req) => { /* handle errors */ });
  export default { fetch: router.handle };
  ```
### 4.2 Endpoints
#### 4.2.1 Search Papers (GET /api/papers/search)
- No auth.
- Params: query (string), limit (int=10), page (int=1).
- Logic: Query Supabase for papers where title/abstract ILIKE %query%, status='cached', order by stars DESC. Paginate.
- Response: { papers: [{id, arxiv_id, title, ...}], total: int }
- Example Code:
  ```javascript
  router.get('/api/papers/search', async (req) => {
    const { query, limit=10, page=1 } = req.query;
    const { data, error } = await supabase.from('papers').select('*')
      .or(`title.ilike.%${query}%,abstract.ilike.%${query}%`)
      .eq('status', 'cached')
      .order('stars', { ascending: false })
      .range((page-1)*limit, page*limit - 1);
    if (error) throw error;
    return new Response(JSON.stringify({ papers: data }), { headers: { 'Content-Type': 'application/json' } });
  });
  ```
#### 4.2.2 Get Paper Wiki (GET /api/papers/:arxiv_id)
- No auth if cached.
- Logic: Fetch from papers/wiki_contents. If uncached, return { status: 'uncached', metadata: await fetchArxivMetadata(arxiv_id) }.
- fetchArxivMetadata: Use browse_page tool or fetch('https://export.arxiv.org/api/query?id_list=<id>') to get title/authors/abstract/pdf_url.
- Response: { wiki: {sections, diagrams, ...}, metadata: {...} }
- If uncached: { status: 'uncached', metadata: {...} }
#### 4.2.3 Subscribe to Tier (POST /api/subscribe)
- Auth.
- Body: { tier: 'basic' | 'pro' | 'unlimited' }
- Logic: Create Stripe customer if none, create subscription.
- Response: { subscription_id }
- Code:
  ```javascript
  router.post('/api/subscribe', async (req) => {
    const user = await auth(req);
    const { tier } = await req.json();
    // Map tier to Stripe price ID (set in env, e.g., env.STRIPE_BASIC_PRICE)
    const priceId = env[`STRIPE_${tier.toUpperCase()}_PRICE`];
    if (!user.stripe_customer_id) {
      const customer = await stripe.customers.create({ email: user.email });
      await supabase.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', user.id);
      user.stripe_customer_id = customer.id;
    }
    const sub = await stripe.subscriptions.create({
      customer: user.stripe_customer_id,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent']
    });
    await supabase.from('subscriptions').insert({ user_id: user.id, stripe_subscription_id: sub.id, tier, current_period_start: new Date(sub.current_period_start * 1000), current_period_end: new Date(sub.current_period_end * 1000) });
    await supabase.from('profiles').update({ stripe_subscription_id: sub.id, current_tier: tier }).eq('id', user.id);
    // Insert initial usage
    const monthYear = new Date().toISOString().slice(0,7);
    await supabase.from('usage').insert({ user_id: user.id, month_year: monthYear });
    return new Response(JSON.stringify({ subscription_id: sub.id }));
  });
  ```
#### 4.2.4 Cancel Subscription (POST /api/subscribe/cancel)
- Auth.
- Logic: stripe.subscriptions.cancel(profile.stripe_subscription_id);
- Update DB: Set status='canceled', current_tier=NULL.
#### 4.2.5 Initiate Indexing (POST /api/papers/:arxiv_id/index)
- Auth.
- Logic: Check sub active, get quota, if ok: Increment used (RPC for atomicity), queue job.
- Supabase RPC example (create in DB):
  ```sql
  CREATE FUNCTION check_and_increment_quota(p_user_id UUID, p_type TEXT) RETURNS BOOLEAN AS $$
  DECLARE
    v_tier TEXT;
    v_used INT;
    v_limit INT;
  BEGIN
    SELECT current_tier INTO v_tier FROM profiles WHERE id = p_user_id;
    IF v_tier IS NULL THEN RAISE EXCEPTION 'No subscription'; END IF;
    -- Get limit: basic index=5, pro=20, unlimited=999999
    v_limit = CASE v_tier WHEN 'basic' THEN 5 WHEN 'pro' THEN 20 ELSE 999999 END;
    IF p_type = 'chat' THEN v_limit = CASE v_tier WHEN 'basic' THEN 10 ELSE 999999 END; END IF;
    -- Get used
    SELECT CASE p_type WHEN 'index' THEN indexes_used ELSE chats_used END INTO v_used
    FROM usage WHERE user_id = p_user_id AND month_year = to_char(NOW(), 'YYYY-MM');
    IF v_used >= v_limit THEN RETURN FALSE; END IF;
    -- Increment
    UPDATE usage SET
      indexes_used = indexes_used + CASE WHEN p_type='index' THEN 1 ELSE 0 END,
      chats_used = chats_used + CASE WHEN p_type='chat' THEN 1 ELSE 0 END
    WHERE user_id = p_user_id AND month_year = to_char(NOW(), 'YYYY-MM');
    RETURN TRUE;
  END;
  $$ LANGUAGE plpgsql;
  ```
- Code:
  ```javascript
  router.post('/api/papers/:arxiv_id/index', async (req) => {
    const user = await auth(req);
    const { arxiv_id } = req.params;
    // Check if exists/cached
    let { data: paper } = await supabase.from('papers').select('*').eq('arxiv_id', arxiv_id).single();
    if (!paper) {
      // Create uncached entry
      const metadata = await fetchArxivMetadata(arxiv_id);
      await supabase.from('papers').insert({ arxiv_id, ...metadata, status: 'uncached' });
    } else if (paper.status === 'cached') return new Response('Already cached', { status: 400 });
    // Check quota
    const { data: canProceed } = await supabase.rpc('check_and_increment_quota', { p_user_id: user.id, p_type: 'index' });
    if (!canProceed) return new Response(JSON.stringify({ error: 'Quota exceeded or no sub' }), { status: 403 });
    // Create job
    const { data: job } = await supabase.from('indexing_jobs').insert({ paper_id: paper.id, user_id: user.id, status: 'queued' }).select().single();
    await env.INDEX_QUEUE.send({ job_id: job.id }); // Queue for processing
    // Update paper status to 'indexing'
    await supabase.from('papers').update({ status: 'indexing' }).eq('id', paper.id);
    return new Response(JSON.stringify({ job_id: job.id }));
  });
  ```
#### 4.2.6 Stripe Webhook (POST /api/stripe/webhook)
- No auth (validate signature).
- Logic: Handle 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted', 'invoice.paid' (renew: update period, reset usage if new month).
- Code:
  ```javascript
  router.post('/api/stripe/webhook', async (req) => {
    const sig = req.headers.get('stripe-signature');
    let event;
    try {
      event = stripe.webhooks.constructEvent(await req.text(), sig, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) { return new Response('Invalid', { status: 400 }); }
   
    if (event.type === 'customer.subscription.created') {
      const { id, customer, items } = event.data.object;
      const tier = items.data[0].price.id === env.STRIPE_BASIC_PRICE ? 'basic' : items.data[0].price.id === env.STRIPE_PRO_PRICE ? 'pro' : 'unlimited';
      const { data: profile } = await supabase.from('profiles').select('*').eq('stripe_customer_id', customer).single();
      await supabase.from('subscriptions').insert({ user_id: profile.id, stripe_subscription_id: id, tier, current_period_start: new Date(event.data.object.current_period_start * 1000), current_period_end: new Date(event.data.object.current_period_end * 1000) });
      await supabase.from('profiles').update({ stripe_subscription_id: id, current_tier: tier }).eq('id', profile.id);
      // Insert usage
      const monthYear = new Date().toISOString().slice(0,7);
      await supabase.from('usage').insert({ user_id: profile.id, month_year: monthYear });
    } else if (event.type === 'invoice.paid') {
      // Update period, reset if new month
      const subId = event.data.object.subscription;
      const { data: sub } = await supabase.from('subscriptions').select('*').eq('stripe_subscription_id', subId).single();
      await supabase.from('subscriptions').update({ current_period_start: new Date(event.data.object.period_start * 1000), current_period_end: new Date(event.data.object.period_end * 1000) }).eq('id', sub.id);
      const monthYear = new Date(event.data.object.period_start * 1000).toISOString().slice(0,7);
      const { data: usage } = await supabase.from('usage').select('*').eq('user_id', sub.user_id).eq('month_year', monthYear).single();
      if (!usage) {
        await supabase.from('usage').insert({ user_id: sub.user_id, month_year: monthYear });
      } else {
        await supabase.from('usage').update({ indexes_used: 0, chats_used: 0, last_reset: new Date() }).eq('id', usage.id);
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subId = event.data.object.id;
      await supabase.from('subscriptions').update({ status: 'canceled' }).eq('stripe_subscription_id', subId);
      const { data: sub } = await supabase.from('subscriptions').select('*').eq('stripe_subscription_id', subId).single();
      await supabase.from('profiles').update({ current_tier: null, stripe_subscription_id: null }).eq('id', sub.user_id);
    } // Handle updated similarly
    return new Response('OK');
  });
  ```
#### 4.2.7 Process Indexing Job (Queue Consumer)
- In Worker: Handle queue messages.
- Logic: Fetch PDF, base64 = await (await fetch(pdf_url)).arrayBuffer().toString('base64');
- AI Prompt for Generation: "Generate a wiki-style summary for this arXiv paper. Structure like: sections (Abstract, Methods, Results, etc.), diagrams (Mermaid for models), tables (Markdown for results), snippets (LaTeX equations), sources (page numbers). Input: [paper PDF]"
- Store result in wiki_contents, update status to 'cached', send email.
- Email: Use fetch to SendGrid API.
- Code (in Worker fetch, but for queue):
  ```javascript
  export default {
    async queue(batch, env) {
      for (const msg of batch.messages) {
        const { job_id } = msg.body;
        const { data: job } = await supabase.from('indexing_jobs').select('*').eq('id', job_id).single();
        // Fetch paper
        const { data: paper } = await supabase.from('papers').select('*').eq('id', job.paper_id).single();
        // Download PDF
        const pdfResponse = await fetch(paper.pdf_url);
        const pdfBuffer = await pdfResponse.arrayBuffer();
        const pdfBase64 = btoa(new Uint8Array(pdfBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
        const aiResponse = await callGemini(`Generate wiki-style summary for this arXiv paper PDF. Output JSON: {sections: [...], diagrams: [...], tables: [...], snippets: [...] }`, pdfBase64); // Parse to JSON
        await supabase.from('wiki_contents').insert({ paper_id: job.paper_id, full_json: JSON.parse(aiResponse) });
        await supabase.from('papers').update({ status: 'cached', last_indexed: new Date() }).eq('id', job.paper_id);
        await supabase.from('indexing_jobs').update({ status: 'completed' }).eq('id', job_id);
        // Send email
        await sendEmail(job.user_id, `Paper ${paper.arxiv_id} indexed!`);
        msg.ack();
      }
    }
  };
  ```
#### 4.2.8 Initiate Chat (POST /api/papers/:arxiv_id/chat)
- Auth.
- Logic: Check quota (if basic), create session.
- Code: Similar to indexing, use RPC for 'chat', insert chat_sessions, return session_id.
#### 4.2.9 Send Chat Message (POST /api/chat/:session_id/message)
- Auth, check session active.
- Body: { message: str }
- Logic: Append to messages, call Gemini with context (wiki json + history + PDF base64 if needed), append response.
- Update DB.
- Response: { response: str }
#### 4.2.10 Other Endpoints
- GET /api/papers/trending: Top 20 by stars.
- POST /api/auth/signup: Supabase auth.signUp.
- POST /api/auth/login: supabase.auth.signInWithPassword.
- GET /api/user: Auth, return profile.
## 5. Authentication Flow
1. Frontend: Call /api/auth/signup or login → Get JWT.
2. Store JWT in localStorage.
3. Include in headers for protected endpoints.
4. Worker: Validate with supabase.auth.getUser.
## 6. Subscription Integration
- Create prices in Stripe (e.g., basic: $10 recurring monthly).
- Webhooks ensure DB sync.
- On renew (invoice.paid): If new month, insert new usage row or reset.
- Handle downgrades (e.g., pro to basic: adjust quotas).
## 7. Indexing Process
- User requests index → Sub check → Increment quota → Queue job → Worker consumer: Fetch PDF → Base64 → Gemini generate → Store → Update status → Email.
- Real-time: Frontend subscribes to Supabase Realtime on indexing_jobs for status.
## 8. Chat Feature
- Pay → Create session → Messages exchanged via API → AI calls with "You are a paper expert. Context: [wiki json or PDF]. User: [msg]"
## 9. Sequence Diagrams
(Text-based)
For Indexing:
```
User -> Frontend -> Worker: POST /index
Worker -> Supabase: RPC check_and_increment_quota
If ok -> Queue: Send job
Queue -> arXiv: Fetch PDF
Queue -> Gemini: Generate with PDF
Queue -> Supabase: Store, update
Queue -> Email: Notify
```
For Chat: Similar, but messages loop with quota check at init.
## 10. Execution Plan
Step-by-step for AI agent to implement:
1. **Setup Environment**:
   - Create Cloudflare account, deploy empty Worker.
   - Create Supabase project, add schemas from Section 3.
   - Add env vars: SUPABASE_URL, SUPABASE_KEY, STRIPE_SECRET, STRIPE_WEBHOOK_SECRET, GEMINI_API_KEY, SENDGRID_KEY, STRIPE_BASIC_PRICE, STRIPE_PRO_PRICE, STRIPE_UNLIMITED_PRICE.
   - Create Stripe account, add webhook endpoint (your Worker URL /api/stripe/webhook).
   - Create Cloudflare Queue named INDEX_QUEUE.
   - Create Supabase RPC for quota.
2. **Implement Auth Endpoints**:
   - Add signup/login routes using supabase.auth.
   - Test: curl POST with email/pass.
3. **Implement Search/Browse Endpoints**:
   - Add /search and /:arxiv_id.
   - Seed DB with sample papers (manual insert).
   - Test: Fetch trending, get wiki.
4. **Implement Subscription Endpoints**:
   - Add /subscribe, /cancel, webhook.
   - Test: Create session, simulate webhook with Stripe CLI.
5. **Implement Quota RPC**:
   - Add to DB.
6. **Implement Index/Chat Endpoints**:
   - Update to use RPC, Gemini.
   - Test: Simulate subs (Stripe test mode), quotas, PDF processing.
7. **Implement Queue Consumer**:
   - Add queue handler.
   - Implement fetchArxivMetadata: Use fetch to arXiv API, parse XML.
   - Update to base64 PDF, Gemini call.
   - Craft detailed AI prompt: "Output JSON: {sections: [], diagrams: [{mermaid: '...', sources: []}], ...} based on paper text. Adapt to paper type (e.g., ML: model diagrams, tables for results)."
8. **Integrate Email**:
   - Function sendEmail(user_id, msg): Fetch user email, fetch to SendGrid.
9. **Error Handling & Logging**:
   - Wrap in try/catch, log to console.
   - Rate limit with Cloudflare.
10. **Test Flows**:
    - End-to-end: Search uncached → Index (sub check) → Wait for queue → View wiki.
    - Use Postman for APIs.
11. **Deploy & Monitor**:
    - Deploy Worker.
    - Monitor logs in Cloudflare.
    - Iterate based on tests.
This should enable full implementation. If clarifications needed (e.g., exact AI prompts, PDF extraction details), please provide.

