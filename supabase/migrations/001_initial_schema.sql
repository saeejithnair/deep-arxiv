-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Public Papers (readable and writable by all)
CREATE TABLE IF NOT EXISTS public.papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  arxiv_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  authors JSONB,
  abstract TEXT,
  pdf_url TEXT,
  wiki_content JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Public Chats (public conversations about papers)
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paper_id UUID REFERENCES public.papers(id) ON DELETE CASCADE,
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Papers: Anyone can read and write
CREATE POLICY paper_public_access ON public.papers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Chats: Anyone can read and write
CREATE POLICY chat_public_access ON public.chats
  FOR ALL
  USING (true)
  WITH CHECK (true);
