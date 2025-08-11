-- Add PDF storage URL and indexing status fields
ALTER TABLE public.papers 
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'cached',
  ADD COLUMN IF NOT EXISTS last_indexed TIMESTAMP WITH TIME ZONE;

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_papers_arxiv_id ON public.papers (arxiv_id);

