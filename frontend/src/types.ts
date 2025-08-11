// Paper type definition with enhanced fields
export interface Paper {
  id: string;
  arxivId: string;
  title: string;
  authors: string[];
  abstract?: string;
  views: string;
  citations?: string;
  category: string;
  field: string;
  publishedDate: string;
  summary?: string;
  methodology?: string;
  wikiContent?: any;
  pdfUrl?: string;
  status?: 'pending' | 'cached' | 'failed';
  lastIndexed?: string;
}

// User type definition
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  papers: string[]; // Paper IDs
}

// Chat message type
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  paperContext?: string;
}

// Category type
export interface Category {
  id: string;
  name: string;
  count: number;
  color: string;
}

// Search filters
export interface SearchFilters {
  query: string;
  category: string;
  sortBy: 'views' | 'citations' | 'published' | 'title';
  field: string;
}
