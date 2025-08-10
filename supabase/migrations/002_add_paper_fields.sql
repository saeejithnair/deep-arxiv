-- Add missing fields to papers table
ALTER TABLE public.papers 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Computer Science',
ADD COLUMN IF NOT EXISTS published_date TEXT DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS views TEXT DEFAULT '0',
ADD COLUMN IF NOT EXISTS citations TEXT DEFAULT '0',
ADD COLUMN IF NOT EXISTS field TEXT DEFAULT 'Computer Science',
ADD COLUMN IF NOT EXISTS methodology TEXT DEFAULT '';

-- Update existing papers with default values if needed
UPDATE public.papers 
SET 
  category = COALESCE(category, 'Computer Science'),
  published_date = COALESCE(published_date, 'Unknown'),
  views = COALESCE(views, '0'),
  citations = COALESCE(citations, '0'),
  field = COALESCE(field, 'Computer Science'),
  methodology = COALESCE(methodology, '')
WHERE category IS NULL OR published_date IS NULL OR views IS NULL OR citations IS NULL OR field IS NULL OR methodology IS NULL;
