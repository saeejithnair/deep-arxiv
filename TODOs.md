# Deep-Arxiv.ai Development TODOs

## Project Overview
Building a public AI-powered wiki for arXiv papers, similar to DeepWiki but for academic papers. All features are free and publicly accessible - users can browse papers, index new papers, and chat with them without authentication.

## ✅ COMPLETED

### Initial Setup & Supabase Integration
- [x] Added Supabase dependencies (`@supabase/supabase-js`)
- [x] Created basic Supabase client (`frontend/src/supabaseClient.ts`)
- [x] Fixed TypeScript config (JSX import source)
- [x] Set up Supabase project structure with simplified schema
- [x] Created simplified database tables: papers, chats (public access)
- [x] Configured Row Level Security (RLS) policies for public access
- [x] Set up local Supabase development environment
- [x] Removed authentication and subscription dependencies

## 🚀 IN PROGRESS
*Currently working on items will be marked here*

## 📋 Hackathon MVP (No Cloudflare, No Auth/Stripe)

### What we're building now
- Public MVP: Search cached papers, view wiki content, and "Index this paper" using a Supabase Edge Function. Everything is public access.

### Prereqs (You)
- [x] Provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API).
- [ ] Provide `GEMINI_API_KEY`.

### Database (MVP)
- [x] Simplified database schema to remove auth dependencies
- [x] Ensure `public.papers` has columns: `arxiv_id (unique)`, `title`, `authors jsonb`, `abstract`, `pdf_url`, `wiki_content jsonb`, `created_at`.
- [x] Enable RLS with public read/write policies
- [ ] Test database connection and verify schema works

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
- [ ] Remove authentication components and flows from frontend
- [ ] Replace `data.ts` list with `supabase.from('papers').select('*').not('wiki_content','is',null)`.
- [ ] Paper route: `supabase.from('papers').select('*').eq('arxiv_id', id).single()`.
- [ ] If `wiki_content` is null: show "Index this paper" button → POST to function → poll the paper row every 2–3s until content exists → render wiki.
- [ ] Dev target: if `import.meta.env.DEV`, call local function serve URL; else production function URL.
- [ ] Test end-to-end workflow locally

### Dev/Deploy
- [ ] Local: `supabase functions serve --env-file supabase/.env`.
- [ ] Frontend: `bun run dev`.
- [ ] Deploy function: `supabase functions deploy index-paper`.

### Deferred to Phase 2
- Cloudflare Worker API gateway, advanced chat features, realtime updates, rate limiting, email notifications.

## 📋 TODO - PHASE 2: Enhanced Features (Post-Hackathon)

### Advanced Chat System
- [ ] Implement public chat functionality with papers
- [ ] Create conversation threading
- [ ] Add chat history and persistence
- [ ] Implement real-time chat updates

### Community Features
- [ ] Add public paper collections
- [ ] Implement community annotations
- [ ] Create paper discussion threads
- [ ] Add collaborative wiki editing

### Performance & Scaling
- [ ] Implement caching strategies
- [ ] Add search optimization
- [ ] Set up CDN for static assets
- [ ] Optimize database queries

## 📋 TODO - PHASE 3: Advanced Analytics & Insights

### Research Analytics
- [ ] Implement research trend analysis
- [ ] Create citation network visualization
- [ ] Add topic modeling and clustering
- [ ] Build research impact metrics

### Data Visualization
- [ ] Create interactive paper relationship graphs
- [ ] Add research timeline visualizations
- [ ] Implement author collaboration networks
- [ ] Build field-specific trend dashboards

## 📋 TODO - PHASE 4: API & Integrations

### Public API
- [ ] Create REST API for third-party access
- [ ] Implement GraphQL endpoint
- [ ] Add API rate limiting
- [ ] Create developer documentation

### External Integrations
- [ ] Integrate with reference managers (Zotero, Mendeley)
- [ ] Add export to various formats (BibTeX, RIS)
- [ ] Connect with academic social networks
- [ ] Implement citation tracking services

## 📋 TODO - PHASE 5: Testing & Production

### Testing Strategy
- [ ] Test all core functionality end-to-end
- [ ] Test Edge Function performance
- [ ] Verify database schema and policies
- [ ] Test frontend integration locally
- [ ] Load testing for public access

### Production Deployment
- [ ] Deploy Supabase Edge Functions
- [ ] Configure production environment variables
- [ ] Set up monitoring and logging
- [ ] Test production workflows
- [ ] Configure domain and SSL

### Maintenance & Monitoring
- [ ] Set up error tracking
- [ ] Create backup strategies
- [ ] Plan scaling considerations
- [ ] Monitor usage patterns

---

## Notes
- This project follows the updated PRD at `/prd.md` (simplified for hackathon MVP)
- Frontend is built in this repo. Current preview: https://deep-arxiv.saeejithn.workers.dev/. The `deep-arxiv.ai` domain is not live yet.
- Focus is on public access MVP using Supabase Edge Functions
- Target architecture: Serverless, scalable, fully public
- AI powered by Google Gemini with full PDF context (no chunking)
- No authentication or payment systems for hackathon MVP

## Current Priority
**Hackathon MVP** - Get core paper indexing functionality working locally within 4 hours. Everything public access, no auth required.
