# Deep-Arxiv.ai Development TODOs

## Project Overview
Building a subscription-based AI-powered wiki for arXiv papers, similar to DeepWiki but for academic papers. Users can browse cached papers for free, but need subscriptions to index new papers or chat with them.

## ✅ COMPLETED

### Initial Setup & Supabase Integration
- [x] Added Supabase dependencies (`@supabase/supabase-js`, auth UI components)
- [x] Created basic Supabase client (`frontend/src/supabaseClient.ts`)
- [x] Fixed TypeScript config (JSX import source)
- [x] Set up Supabase project structure with initial schema
- [x] Created database tables: profiles, papers, chats, private_papers
- [x] Configured Row Level Security (RLS) policies
- [x] Set up local Supabase development environment

## 🚀 IN PROGRESS
*Currently working on items will be marked here*

## 📋 Hackathon MVP (No Cloudflare, No Auth/Stripe)

### What we’re building now
- Public MVP: Search cached papers, view wiki content, and “Index this paper” using a Supabase Edge Function. Defer Cloudflare/Stripe/Auth/Chat.

### Prereqs (You)
- [ ] Provide `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API).
- [ ] Provide `GEMINI_API_KEY`.

### Database (MVP)
- [ ] Ensure `public.papers` has columns: `arxiv_id (unique)`, `title`, `authors jsonb`, `abstract`, `pdf_url`, `wiki_content jsonb`, `created_at`.
- [ ] Enable RLS with public read policy; writes only via Edge Function (Service Role).

### Edge Function: index-paper
- [ ] Create `index-paper` (Supabase Edge Function):
  - Input: `{ arxiv_id }`
  - Steps:
    - Fetch metadata via `https://export.arxiv.org/api/query?id_list=<id>`.
    - Download `https://arxiv.org/pdf/<id>.pdf` and base64.
    - Call Gemini (gemini-1.5-pro) to produce JSON wiki.
    - Upsert into `public.papers` (`wiki_content` + metadata fields).
  - Output: `{ ok: true }` or `{ error }`.
- [ ] Set secrets on Supabase: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`.
- [ ] Deploy function and note URL.

### Frontend wiring
- [ ] Replace `data.ts` list with `supabase.from('papers').select('*').not('wiki_content','is',null)`.
- [ ] Paper route: `supabase.from('papers').select('*').eq('arxiv_id', id).single()`.
- [ ] If `wiki_content` is null: show “Index this paper” button → POST to function → poll the paper row every 2–3s until content exists → render wiki.
- [ ] Dev target: if `import.meta.env.DEV`, call local function serve URL; else production function URL.

### Dev/Deploy
- [ ] Local: `supabase functions serve --env-file supabase/.env`.
- [ ] Frontend: `bun run dev`.
- [ ] Deploy function: `supabase functions deploy index-paper`.

### Deferred to Phase 2
- Cloudflare Worker API gateway, Stripe subscriptions, quotas, chat, realtime, rate limiting, email notifications.

## 📋 TODO - PHASE 1: Core Backend (Cloudflare Workers) – Deferred

### Core API Infrastructure  
- [ ] Set up Worker with itty-router
- [ ] Create Supabase client in Worker
- [ ] Create Stripe client in Worker
- [ ] Implement Gemini API integration helper
- [ ] Create authentication middleware
- [ ] Set up error handling and logging

### Database Schema Enhancements
- [ ] Add missing tables from PRD:
  - [ ] subscriptions table
  - [ ] usage table (for quotas)
  - [ ] indexing_jobs table
  - [ ] wiki_contents table (separate from papers)
- [ ] Create Supabase RPC function for quota management
- [ ] Set up monthly usage reset cron job
- [ ] Add database triggers for arXiv metadata fetching

### Public API Endpoints (No Auth Required)
- [ ] GET /api/papers/search - Search cached papers
- [ ] GET /api/papers/:arxiv_id - Get paper wiki content
- [ ] GET /api/papers/trending - Get popular papers
- [ ] Implement arXiv metadata fetching helper

### Authentication Endpoints
- [ ] POST /api/auth/signup - User registration
- [ ] POST /api/auth/login - User login  
- [ ] GET /api/user - Get current user profile

## 📋 TODO - PHASE 2: Subscription & Payment System

### Stripe Integration
- [ ] Create Stripe products and prices for tiers (Basic, Pro, Unlimited)
- [ ] POST /api/subscribe - Create subscription
- [ ] POST /api/subscribe/cancel - Cancel subscription
- [ ] POST /api/stripe/webhook - Handle Stripe webhooks
- [ ] Implement subscription status checks
- [ ] Set up webhook endpoint verification

### Quota Management
- [ ] Implement quota checking logic
- [ ] Create usage tracking system
- [ ] Set up monthly quota resets
- [ ] Add quota enforcement to protected endpoints

## 📋 TODO - PHASE 3: Paper Indexing System

### Indexing API
- [ ] POST /api/papers/:arxiv_id/index - Queue indexing job
- [ ] Implement quota checks before indexing
- [ ] Set up Cloudflare Queue consumer
- [ ] Create job status tracking

### AI Content Generation
- [ ] Implement PDF download from arXiv
- [ ] Create base64 encoding for Gemini API
- [ ] Design AI prompts for wiki generation
- [ ] Implement structured content parsing (sections, diagrams, tables)
- [ ] Set up Mermaid diagram generation
- [ ] Create content storage in wiki_contents table

### Job Processing
- [ ] Build queue consumer for indexing jobs
- [ ] Implement error handling and retries  
- [ ] Set up email notifications (SendGrid)
- [ ] Add real-time status updates via Supabase

## 📋 TODO - PHASE 4: Chat System

### Chat API
- [ ] POST /api/papers/:arxiv_id/chat - Initialize chat session
- [ ] POST /api/chat/:session_id/message - Send chat message
- [ ] Implement chat quota management
- [ ] Set up session management and expiry

### AI Chat Integration
- [ ] Create context loading (wiki + PDF)
- [ ] Implement conversation history management
- [ ] Design chat prompts for Gemini
- [ ] Add streaming responses (if needed)

## 📋 TODO - PHASE 5: Frontend Integration

### Authentication UI
- [ ] Integrate Supabase Auth UI components
- [ ] Create login/signup flows
- [ ] Add authentication state management
- [ ] Implement protected route logic

### Main Application Features  
- [ ] Update paper search to use real API
- [ ] Integrate subscription management UI
- [ ] Add indexing request interface
- [ ] Build chat interface
- [ ] Implement real-time indexing status
- [ ] Add usage quota display

### User Dashboard
- [ ] Create subscription status display
- [ ] Add usage tracking visualization  
- [ ] Build indexing history
- [ ] Create chat session management

## 📋 TODO - PHASE 6: Testing & Deployment

### Testing
- [ ] Test all API endpoints with Postman/curl
- [ ] Test Stripe webhook integration
- [ ] Test indexing workflow end-to-end
- [ ] Test chat functionality
- [ ] Load testing for Workers
- [ ] Test quota enforcement

### Production Deployment
- [ ] Deploy Cloudflare Worker to production
- [ ] Configure production Supabase project
- [ ] Set up production Stripe webhooks
- [ ] Configure DNS and domain routing
- [ ] Set up monitoring and alerting
- [ ] Test production workflows

### Documentation & Maintenance
- [ ] Create API documentation
- [ ] Set up error monitoring
- [ ] Create backup strategies
- [ ] Plan scaling considerations

---

## Notes
- This project follows the detailed PRD at `/prd.md`
- Frontend is built in this repo. Current preview: https://deep-arxiv.saeejithn.workers.dev/. The `deep-arxiv.ai` domain is not live yet.
- Focus is on backend implementation using Cloudflare Workers + Supabase
- Target architecture: Serverless, scalable, subscription-based
- AI powered by Google Gemini with full PDF context (no chunking)

## Current Priority
Starting with **Phase 1: Core Backend** - setting up the foundational Cloudflare Workers infrastructure and basic API endpoints.