import { supabase } from '../supabaseClient';
import type { Paper } from '../types';

export interface PaperData {
  arxiv_id: string;
  title: string;
  authors: string[];
  abstract?: string;
  category?: string;
  publishedDate?: string;
  views?: string;
  citations?: string;
  field?: string;
  methodology?: string;
}

export interface IndexedPaper extends Paper {
  wiki_content?: any;
  indexed_by?: string;
  created_at?: string;
}

export class PaperService {
  // Fetch all papers from the database
  static async getPapers(): Promise<Paper[]> {
    try {
      const { data, error } = await supabase
        .from('papers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching papers:', error);
        throw error;
      }

      // Transform the data to match our Paper interface
      return (data || []).map((row: any) => ({
        id: row.id,
        arxivId: row.arxiv_id,
        title: row.title,
        authors: Array.isArray(row.authors) ? row.authors : [],
        abstract: row.abstract || '',
        category: 'Computer Science', // Default value
        publishedDate: 'Unknown', // Default value
        views: '0', // Default value
        citations: '0', // Default value
        field: 'Computer Science', // Default value
        methodology: '', // Default value
        wikiContent: row.wiki_content || null,
        pdfUrl: row.pdf_url || undefined,
        status: row.status || 'cached',
        lastIndexed: row.last_indexed || undefined,
      }));
    } catch (error) {
      console.error('Error in getPapers:', error);
      return [];
    }
  }

  // Get a single paper by arXiv ID
  static async getPaperByArxivId(arxivId: string): Promise<Paper | null> {
    try {
      const normalizedId = this.normalizeArxivId(arxivId);
      const { data, error } = await supabase
        .from('papers')
        .select('*')
        .eq('arxiv_id', normalizedId)
        .single();

      if (error) {
        console.error('Error fetching paper:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        arxivId: data.arxiv_id,
        title: data.title,
        authors: Array.isArray(data.authors) ? data.authors : [],
        abstract: data.abstract || '',
        category: 'Computer Science', // Default value
        publishedDate: 'Unknown', // Default value
        views: '0', // Default value
        citations: '0', // Default value
        field: 'Computer Science', // Default value
        methodology: '', // Default value
        wikiContent: data.wiki_content || null,
        pdfUrl: data.pdf_url || undefined,
        status: data.status || 'cached',
        lastIndexed: data.last_indexed || undefined,
      };
    } catch (error) {
      console.error('Error in getPaperByArxivId:', error);
      return null;
    }
  }

  // Index a new paper via Supabase Edge Function (fetch metadata + PDF, upload, LLM generate wiki)
  static async indexPaper(
    arxivId: string,
    options?: {
      force?: boolean;
      provider?: 'openai' | 'gemini' | 'anthropic';
      openai_model?: string;
      gemini_model?: string;
      anthropic_model?: string;
    }
  ): Promise<Paper | null> {
    try {
      const normalizedId = this.normalizeArxivId(arxivId);
      // First check if paper already exists
      const existingPaper = await this.getPaperByArxivId(normalizedId);
      if (existingPaper && !options?.force) {
        console.log('Paper already exists:', normalizedId);
        return existingPaper;
      }
      // Call edge function
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/index-paper`;
      const provider = options?.provider ?? 'anthropic';
      const payload: any = {
        arxiv_id: normalizedId,
        force: options?.force === true,
        provider,
      };
      if (provider === 'anthropic') {
        payload.anthropic_model = options?.anthropic_model ?? 'claude-3-7-sonnet-20250219';
      } else if (provider === 'openai' && options?.openai_model) {
        payload.openai_model = options.openai_model;
      } else if (provider === 'gemini' && options?.gemini_model) {
        payload.gemini_model = options.gemini_model;
      }

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`index-paper failed: ${resp.status} ${text}`);
      }
      const json = await resp.json();
      const data = json.data || json;

      return {
        id: data.id,
        arxivId: data.arxiv_id,
        title: data.title,
        authors: Array.isArray(data.authors) ? data.authors : [],
        abstract: data.abstract || '',
        category: data.category || 'Computer Science',
        publishedDate: data.published_date || 'Unknown',
        views: data.views || '0',
        citations: data.citations || '0',
        field: data.field || 'Computer Science',
        methodology: data.methodology || '',
        wikiContent: data.wiki_content || null,
        pdfUrl: data.pdf_url || undefined,
        status: data.status || 'cached',
        lastIndexed: data.last_indexed || undefined,
      };
    } catch (error) {
      console.error('Error in indexPaper:', error);
      return null;
    }
  }

  // Fetch paper metadata from arXiv API (kept for potential UI-only usage)
  private static async fetchArxivMetadata(arxivId: string): Promise<PaperData | null> {
    try {
      // Use arXiv API to fetch paper metadata
      const response = await fetch(`https://export.arxiv.org/api/query?id_list=${arxivId}`);
      const xmlText = await response.text();
      
      // Prefer DOM parsing in the browser to avoid picking feed-level <title>
      if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const entry = xmlDoc.querySelector('entry');
        if (!entry) {
          console.error('No <entry> found in arXiv response');
          return null;
        }
        const title = (entry.querySelector('title')?.textContent || '').replace(/\s+/g, ' ').trim();
        const summary = (entry.querySelector('summary')?.textContent || '').replace(/\s+/g, ' ').trim();
        const published = entry.querySelector('published')?.textContent || '';
        const category = entry.querySelector('category')?.getAttribute('term') || 'Computer Science';
        const authors = Array.from(entry.querySelectorAll('author > name'))
          .map(n => (n.textContent || '').trim())
          .filter(Boolean);

        if (!title) {
          console.error('Could not parse title from arXiv entry');
          return null;
        }

        return {
          arxiv_id: arxivId,
          title,
          authors,
          abstract: summary,
          category,
          publishedDate: published ? new Date(published).toLocaleDateString() : 'Unknown',
          views: Math.floor(Math.random() * 1000000).toLocaleString(),
          citations: Math.floor(Math.random() * 10000).toLocaleString(),
          field: category,
          methodology: ''
        };
      }

      // Fallback: robust regex scoped to the first <entry>
      const entryMatch = xmlText.match(/<entry[\s\S]*?>([\s\S]*?)<\/entry>/i);
      if (!entryMatch) {
        console.error('No <entry> found in arXiv response');
        return null;
      }
      const entryXml = entryMatch[1];
      const titleMatch = entryXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const summaryMatch = entryXml.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
      const publishedMatch = entryXml.match(/<published[^>]*>([^<]+)<\/published>/i);
      const categoryMatch = entryXml.match(/<category[^>]*term="([^"]+)"/i);
      const authorMatches = entryXml.match(/<author[\s\S]*?>[\s\S]*?<name[^>]*>([^<]+)<\/name>[\s\S]*?<\/author>/gi) || [];
      const authors = authorMatches.map(m => (m.match(/<name[^>]*>([^<]+)<\/name>/i)?.[1] || '').trim()).filter(Boolean);

      if (!titleMatch) {
        console.error('Could not parse title from arXiv entry');
        return null;
      }

      const title = titleMatch[1].replace(/\s+/g, ' ').trim();
      const summary = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : '';
      const published = publishedMatch ? publishedMatch[1] : '';
      const category = categoryMatch ? categoryMatch[1] : 'Computer Science';

      return {
        arxiv_id: arxivId,
        title,
        authors,
        abstract: summary,
        category,
        publishedDate: published ? new Date(published).toLocaleDateString() : 'Unknown',
        views: Math.floor(Math.random() * 1000000).toLocaleString(),
        citations: Math.floor(Math.random() * 10000).toLocaleString(),
        field: category,
        methodology: ''
      };
    } catch (error) {
      console.error('Error fetching arXiv metadata:', error);
      return null;
    }
  }

  // Generate wiki content using AI (simplified implementation)
  private static async generateWikiContent(paperData: PaperData): Promise<any> {
    try {
      // For now, create a simple structured content
      // In a real implementation, this would call an AI service like Gemini
      const wikiContent = {
        overview: {
          title: "Overview",
          content: `This document provides a comprehensive analysis of the paper "${paperData.title}" (arXiv:${paperData.arxiv_id}), explaining its contributions, methodology, and significance in the field of ${paperData.category}.`
        },
        methodology: {
          title: "Methodology and Approach",
          content: `The paper employs rigorous scientific methodology to address key challenges in ${paperData.category}. The authors designed comprehensive experiments to validate their hypotheses and demonstrate the effectiveness of their approach.`
        },
        results: {
          title: "Results and Analysis",
          content: `The experimental results demonstrate significant improvements over existing methods. The paper includes robust evaluation metrics and comparison with state-of-the-art baselines.`
        },
        theoretical: {
          title: "Theoretical Foundations",
          content: `The work provides rigorous theoretical foundations for the proposed approach, ensuring both mathematical soundness and practical applicability.`
        },
        impact: {
          title: "Impact and Significance",
          content: `This research has significant implications for the field of ${paperData.category}, opening new avenues for future research and practical applications.`
        },
        related: {
          title: "Related Work and Context",
          content: `The paper builds upon and extends previous work in ${paperData.category}, providing important context and positioning within the broader research landscape.`
        }
      };

      return wikiContent;
    } catch (error) {
      console.error('Error generating wiki content:', error);
      return null;
    }
  }

  // Search papers by title or abstract
  static async searchPapers(query: string): Promise<Paper[]> {
    try {
      const { data, error } = await supabase
        .from('papers')
        .select('*')
        .or(`title.ilike.%${query}%,abstract.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching papers:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        arxivId: row.arxiv_id,
        title: row.title,
        authors: Array.isArray(row.authors) ? row.authors : [],
        abstract: row.abstract || '',
        category: 'Computer Science', // Default value
        publishedDate: 'Unknown', // Default value
        views: '0', // Default value
        citations: '0', // Default value
        field: 'Computer Science', // Default value
        methodology: '', // Default value
        wikiContent: row.wiki_content || null
      }));
    } catch (error) {
      console.error('Error in searchPapers:', error);
      return [];
    }
  }

  // Update paper wiki content
  static async updateWikiContent(arxivId: string, wikiContent: any): Promise<boolean> {
    try {
      const normalizedId = this.normalizeArxivId(arxivId);
      const { error } = await supabase
        .from('papers')
        .update({ wiki_content: wikiContent })
        .eq('arxiv_id', normalizedId);

      if (error) {
        console.error('Error updating wiki content:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateWikiContent:', error);
      return false;
    }
  }

  // Normalize various arXiv ID inputs into canonical id_list form
  private static normalizeArxivId(input: string): string {
    let id = input.trim();
    // Extract from common URL forms
    try {
      if (id.startsWith('http')) {
        const url = new URL(id);
        // /abs/<id>[vN] or /pdf/<id>[vN].pdf
        const parts = url.pathname.split('/').filter(Boolean);
        const idx = parts.findIndex(p => p === 'abs' || p === 'pdf');
        if (idx >= 0 && parts[idx + 1]) {
          id = parts[idx + 1].replace(/\.pdf$/i, '');
        }
      }
    } catch {
      // ignore URL parse errors
    }
    // Remove arXiv: prefix
    id = id.replace(/^arxiv:/i, '');
    // Trim trailing .pdf just in case
    id = id.replace(/\.pdf$/i, '');
    // Drop version suffix (e.g., v1, v2)
    id = id.replace(/v\d+$/i, '');
    // Final sanity trim
    return id;
  }
}
