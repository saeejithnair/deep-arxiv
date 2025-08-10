-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (private user data)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Public Papers (readable by all, write requires auth)
CREATE TABLE IF NOT EXISTS public.papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  arxiv_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  authors JSONB,
  abstract TEXT,
  wiki_content JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  indexed_by UUID REFERENCES auth.users(id)
);

-- Private Chats (user-specific)
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id UUID REFERENCES public.papers(id) ON DELETE CASCADE,
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Private Papers (future: user-uploaded PDFs)
CREATE TABLE IF NOT EXISTS public.private_papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  title TEXT,
  wiki_content JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_papers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Only owner can read/write
CREATE POLICY profile_owner ON public.profiles
  FOR ALL
  USING (auth.uid() = id);

-- Papers: Anyone can read, auth required to write
CREATE POLICY paper_public_read ON public.papers
  FOR SELECT
  USING (true);
CREATE POLICY paper_auth_write ON public.papers
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Chats: Only owner can read/write
CREATE POLICY chat_owner ON public.chats
  FOR ALL
  USING (auth.uid() = user_id);

-- Private Papers: Only owner can read/write
CREATE POLICY private_paper_owner ON public.private_papers
  FOR ALL
  USING (auth.uid() = user_id);