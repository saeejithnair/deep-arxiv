import type React from 'react';
import { useState, useMemo, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import type { Paper, User, ChatMessage, SearchFilters } from './types';
import { categories } from './data';
import PaperAnalysisPage from './components/PaperAnalysisPage';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from './supabaseClient';
import { PaperService } from './services/paperService';

// Theme Context
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) return savedTheme;
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    // Update document class and localStorage
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Icons
const ViewIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
  </svg>
);

const CitationIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChatIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
  </svg>
);

const DarkModeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const LightModeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const PapiersIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
  </svg>
);

// Auth Modal Component (simplified)
const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void; onLogin: (user: User) => void }> = ({ isOpen, onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user: User = {
      id: '1',
      name: name || email.split('@')[0],
      email,
      papers: []
    };
    onLogin(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 border border-arxiv-library-grey">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-arxiv-repository-brown">{isLogin ? 'Sign In' : 'Sign Up'}</h2>
          <button onClick={onClose} className="text-arxiv-library-grey hover:text-arxiv-repository-brown">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-arxiv-library-grey mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-arxiv-library-grey rounded-md focus:outline-none focus:ring-2 focus:ring-arxiv-archival-blue text-arxiv-repository-brown placeholder-arxiv-library-grey"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-arxiv-library-grey mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-arxiv-library-grey rounded-md focus:outline-none focus:ring-2 focus:ring-arxiv-archival-blue text-arxiv-repository-brown placeholder-arxiv-library-grey"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-arxiv-library-grey mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-arxiv-library-grey rounded-md focus:outline-none focus:ring-2 focus:ring-arxiv-archival-blue text-arxiv-repository-brown placeholder-arxiv-library-grey"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-arxiv-archival-blue text-white py-2 px-4 rounded-md hover:bg-arxiv-link-blue transition-colors"
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-arxiv-link-blue hover:text-arxiv-archival-blue"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Chat Component (simplified)
const ChatInterface: React.FC<{ isOpen: boolean; onClose: () => void; paperContext?: Paper }> = ({ isOpen, onClose, paperContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: paperContext
        ? `Hi! I'm here to help you understand the paper "${paperContext.title}". What would you like to know about this research?`
        : "Hi! I'm Deep-Arxiv AI. I can help you understand any research paper. What would you like to know?",
      sender: 'ai',
      timestamp: new Date(),
      paperContext: paperContext?.id
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date(),
      paperContext: paperContext?.id
    };

    setMessages(prev => [...prev, userMessage]);

    // Mock AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(newMessage, paperContext),
        sender: 'ai',
        timestamp: new Date(),
        paperContext: paperContext?.id
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);

    setNewMessage('');
  };

  const generateAIResponse = (userMessage: string, paper?: Paper): string => {
    const message = userMessage.toLowerCase();

    if (paper) {
      if (message.includes('methodology') || message.includes('method')) {
        return paper.methodology || `The methodology of "${paper.title}" involves innovative approaches in ${paper.field}.`;
      }
      if (message.includes('summary') || message.includes('abstract')) {
        return paper.summary || paper.abstract || `${paper.title} explores important concepts in ${paper.category}.`;
      }
      if (message.includes('authors') || message.includes('who wrote')) {
        return `This paper was written by ${paper.authors.slice(0, 3).join(', ')}${paper.authors.length > 3 ? ' and others' : ''}.`;
      }
      if (message.includes('citation') || message.includes('impact')) {
        return `This paper has been cited ${paper.citations} times and has received ${paper.views} views, indicating significant impact in the ${paper.category} field.`;
      }
    }

    return "I'd be happy to help! Could you be more specific about what you'd like to know? I can help with methodology, findings, implications, or understanding the research approach.";
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-xl border border-arxiv-library-grey flex flex-col z-50 dark:bg-dark-card dark:border-dark-border">
      <div className="flex justify-between items-center p-4 border-b border-arxiv-library-grey bg-arxiv-cool-wash dark:bg-dark-secondary dark:border-dark-border">
        <h3 className="text-lg font-semibold text-arxiv-repository-brown dark:text-dark-text">
          {paperContext ? `${paperContext.arxivId}` : 'Deep-Arxiv AI'}
        </h3>
        <button onClick={onClose} className="text-arxiv-library-grey hover:text-arxiv-repository-brown dark:text-dark-text-secondary dark:hover:text-dark-text">
          <CloseIcon />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-arxiv-warm-wash dark:bg-dark-bg">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-arxiv-archival-blue text-white dark:bg-dark-primary'
                  : 'bg-white text-arxiv-repository-brown border border-arxiv-library-grey dark:bg-dark-card dark:text-dark-text dark:border-dark-border'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-arxiv-library-grey bg-white dark:bg-dark-card dark:border-dark-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask about this paper..."
            className="flex-1 px-3 py-2 border border-arxiv-library-grey rounded-md focus:outline-none focus:ring-2 focus:ring-arxiv-archival-blue text-arxiv-repository-brown placeholder-arxiv-library-grey dark:bg-dark-secondary dark:border-dark-border dark:focus:ring-dark-primary dark:text-dark-text dark:placeholder-dark-text-muted"
          />
          <button
            type="submit"
            className="bg-arxiv-archival-blue text-white p-2 rounded-md hover:bg-arxiv-link-blue transition-colors dark:bg-dark-primary dark:hover:bg-dark-primary-hover"
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
};

const AddPaperCard: React.FC<{ onPaperAdded: (paper: Paper) => void }> = ({ onPaperAdded }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [arxivId, setArxivId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arxivId.trim()) return;

    try {
      setLoading(true);
      setError('');
      
      const paper = await PaperService.indexPaper(arxivId.trim(), {
        force: true,
        provider: 'anthropic',
        anthropic_model: 'claude-3-7-sonnet-20250219'
      });
      if (paper) {
        onPaperAdded(paper);
        setIsModalOpen(false);
        setArxivId('');
        // Navigate directly to the paper wiki page
        navigate(`/${paper.arxivId}`);
      } else {
        setError('Failed to index paper. Please check the arXiv ID and try again.');
      }
    } catch (err) {
      setError('An error occurred while indexing the paper.');
      console.error('Error indexing paper:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="add-paper-card bg-arxiv-warm-wash border-dashed border-arxiv-library-grey hover:bg-arxiv-cool-wash hover:border-arxiv-archival-blue dark:bg-dark-secondary dark:border-dashed dark:border-dark-border dark:hover:bg-dark-card dark:hover:border-dark-primary cursor-pointer"
      >
        <div className="add-paper-card-icon text-arxiv-library-grey group-hover:text-arxiv-archival-blue dark:text-dark-text-muted dark:group-hover:text-dark-primary">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div className="add-paper-card-title text-arxiv-repository-brown dark:text-dark-text">Add paper</div>
        <div className="add-paper-card-description text-arxiv-library-grey dark:text-dark-text-secondary">Analyze any research paper</div>
      </div>

      {/* Add Paper Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-arxiv-repository-brown dark:text-dark-text mb-4">Add New Paper</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="arxivId" className="block text-sm font-medium text-arxiv-library-grey dark:text-dark-text-secondary mb-2">
                  arXiv ID
                </label>
                <input
                  type="text"
                  id="arxivId"
                  value={arxivId}
                  onChange={(e) => setArxivId(e.target.value)}
                  placeholder="e.g., 1502.03167"
                  className="w-full px-3 py-2 border border-arxiv-library-grey rounded-md focus:outline-none focus:ring-2 focus:ring-arxiv-archival-blue dark:bg-dark-input dark:border-dark-border dark:text-dark-text dark:focus:ring-dark-primary"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-arxiv-library-grey border border-arxiv-library-grey rounded-md hover:bg-arxiv-warm-wash dark:text-dark-text-secondary dark:border-dark-border dark:hover:bg-dark-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-arxiv-archival-blue text-white rounded-md hover:bg-arxiv-link-blue dark:bg-dark-primary dark:hover:bg-dark-primary-hover disabled:opacity-50"
                  disabled={loading || !arxivId.trim()}
                >
                  {loading ? 'Indexing...' : 'Index Paper'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const PaperCard: React.FC<{ paper: Paper; user?: User }> = ({ paper, user }) => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <div className="paper-card bg-white border-arxiv-library-grey hover:border-arxiv-archival-blue dark:bg-dark-card dark:border-dark-border dark:hover:border-dark-primary" onClick={() => navigate(`/${paper.arxivId}`)}>
        <Link
          to={`/${paper.arxivId}`}
          className="paper-card-title text-arxiv-repository-brown hover:text-arxiv-archival-blue dark:text-dark-text dark:hover:text-dark-primary"
        >
          {paper.title}
        </Link>

        <div className="paper-card-authors text-arxiv-library-grey dark:text-dark-text-secondary">
          {paper.authors.slice(0, 2).join(', ')}{paper.authors.length > 2 ? ' et al.' : ''}
        </div>

        {paper.abstract && (
          <div className="paper-card-description text-arxiv-library-grey dark:text-dark-text-secondary">
            {paper.abstract}
          </div>
        )}

          <div className="paper-card-stats text-arxiv-library-grey dark:text-dark-text-muted">
          <div className="flex items-center gap-1">
            <ViewIcon className="text-arxiv-library-grey dark:text-dark-text-muted" />
            <span>{paper.views}</span>
          </div>
          {paper.citations && (
            <div className="flex items-center gap-1">
              <CitationIcon className="text-arxiv-library-grey dark:text-dark-text-muted" />
              <span>{paper.citations}</span>
            </div>
          )}
        </div>

        <div className="paper-card-arrow text-arxiv-library-grey group-hover:text-arxiv-archival-blue dark:text-dark-text-muted dark:group-hover:text-dark-primary">
          <ArrowRightIcon />
        </div>
      </div>

      <ChatInterface
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        paperContext={paper}
      />
    </>
  );
};

// Helper to normalize arXiv IDs/URLs from the search bar
function normalizeArxivIdInput(input: string): string {
  let id = input.trim();
  try {
    if (id.startsWith('http')) {
      const url = new URL(id);
      const parts = url.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex((p) => p === 'abs' || p === 'pdf');
      if (idx >= 0 && parts[idx + 1]) {
        id = parts[idx + 1].replace(/\.pdf$/i, '');
      }
    }
  } catch {
    // ignore
  }
  id = id.replace(/^arxiv:/i, '').replace(/\.pdf$/i, '').replace(/v\d+$/i, '');
  return id;
}

const HomePage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'all',
    sortBy: 'views',
    field: ''
  });

  // Load papers from backend
  useEffect(() => {
    const loadPapers = async () => {
      try {
        setLoading(true);
        const papersData = await PaperService.getPapers();
        setPapers(papersData);
      } catch (error) {
        console.error('Error loading papers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPapers();
  }, []);

  // Filter and sort papers
  const filteredPapers = useMemo(() => {
    let filtered = [...papers];

    // Filter by search query
    if (filters.query) {
      const qLower = filters.query.toLowerCase();
      const normalizedId = normalizeArxivIdInput(filters.query);
      filtered = filtered.filter((paper) =>
        paper.title.toLowerCase().includes(qLower) ||
        paper.authors.some((author) => author.toLowerCase().includes(qLower)) ||
        paper.abstract?.toLowerCase().includes(qLower) ||
        paper.arxivId === normalizedId ||
        qLower.includes(paper.arxivId.toLowerCase())
      );
    }

    // Filter by category
    if (filters.category !== 'all') {
      const categoryName = categories.find(c => c.id === filters.category)?.name;
      if (categoryName) {
        filtered = filtered.filter(paper => paper.category === categoryName);
      }
    }

    // Filter by field
    if (filters.field) {
      filtered = filtered.filter(paper => paper.field === filters.field);
    }

    // Sort papers
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'views':
          return Number.parseFloat(b.views.replace(/[kM]/g, '')) - Number.parseFloat(a.views.replace(/[kM]/g, ''));
        case 'citations': {
          const aCitations = Number.parseFloat(a.citations?.replace(/[kM]/g, '') || '0');
          const bCitations = Number.parseFloat(b.citations?.replace(/[kM]/g, '') || '0');
          return bCitations - aCitations;
        }
        case 'published':
          return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [filters, papers]);

  // Safety: dedupe by stable id to avoid React key collisions if a paper is added twice
  const dedupedPapers = useMemo(() => {
    const seen = new Set<string>();
    return filteredPapers.filter((p) => {
      if (!p?.id) return true;
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [filteredPapers]);

  // Allow Enter in search to open/index arXiv links/IDs directly
  const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const value = (e.currentTarget.value || '').trim();
    if (!value) return;

    const looksLikeArxiv =
      value.includes('arxiv.org') ||
      /^(arxiv:)?\d{4}\.\d{4,5}(v\d+)?$/i.test(value) ||
      /^[a-z\-]+\/\d{7}(v\d+)?$/i.test(value); // legacy ids like cs/0112017

    if (!looksLikeArxiv) return;

    e.preventDefault();
    const id = normalizeArxivIdInput(value);
    try {
      const existing = await PaperService.getPaperByArxivId(id);
      if (existing) {
        navigate(`/${existing.arxivId}`);
        return;
      }
      const indexed = await PaperService.indexPaper(id, {
        force: true,
        provider: 'anthropic',
        anthropic_model: 'claude-3-7-sonnet-20250219'
      });
      if (indexed) {
        setPapers((prev) =>
          prev.some((p) => p.id === indexed.id || p.arxivId === indexed.arxivId)
            ? prev
            : [indexed, ...prev]
        );
        navigate(`/${indexed.arxivId}`);
      }
    } catch (err) {
      console.error('Search navigation error:', err);
    }
  };

  return (
    <>
      <div className="deep-arxiv-container">
        {/* Header */}
        <header className="deep-arxiv-main-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <Link to="/" className="deep-arxiv-brand text-arxiv-repository-brown hover:text-arxiv-archival-blue transition-colors">
                Deep-Arxiv
              </Link>

              <div className="deep-arxiv-header-right">
                <span className="deep-arxiv-header-text text-arxiv-library-grey">Get unlimited papers with</span>
                <div className="flex items-center gap-1">
                  <PapiersIcon className="text-arxiv-cornell-red" />
                  <span className="deep-arxiv-link font-medium text-arxiv-link-blue hover:text-arxiv-archival-blue">Deep-Arxiv</span>
                </div>
                <button className="deep-arxiv-button-primary bg-arxiv-archival-blue hover:bg-arxiv-link-blue text-white">
                  <ShareIcon />
                  Share
                </button>
                <button 
                  onClick={toggleTheme}
                  className="dark-mode-toggle text-arxiv-library-grey hover:text-arxiv-repository-brown transition-colors"
                  title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                  {theme === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  {/* Search Section */}
        <div className="deep-arxiv-search-section bg-arxiv-cool-wash dark:bg-dark-bg py-16">
          <h1 className="deep-arxiv-main-title text-arxiv-repository-brown dark:text-dark-text">
            Which paper would you like to understand?
          </h1>

          <div className="deep-arxiv-search-container">
            <div className="relative">
              <div className="deep-arxiv-search-icon text-arxiv-library-grey dark:text-dark-text-muted">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search for papers (or paste a link)"
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                onKeyDown={handleSearchKeyDown}
                className="deep-arxiv-search-input border-arxiv-library-grey focus:border-arxiv-archival-blue focus:ring-arxiv-archival-blue text-arxiv-repository-brown placeholder-arxiv-library-grey dark:bg-dark-card dark:border-dark-border dark:focus:border-dark-primary dark:focus:ring-dark-primary dark:text-dark-text dark:placeholder-dark-text-muted"
              />
            </div>
          </div>
        </div>

          {/* Papers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
            {/* Add Paper Card */}
            <AddPaperCard
              onPaperAdded={(newPaper) =>
                setPapers((prev) =>
                  prev.some((p) => p.id === newPaper.id || p.arxivId === newPaper.arxivId)
                    ? prev
                    : [newPaper, ...prev]
                )
              }
            />

            {dedupedPapers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} user={user || undefined} />
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="deep-arxiv-text-secondary text-lg">Loading papers...</p>
            </div>
          ) : dedupedPapers.length === 0 ? (
            <div className="text-center py-12">
              <p className="deep-arxiv-text-secondary text-lg">No papers found matching your search.</p>
            </div>
          ) : null}
        </main>

        {/* Floating Chat Button */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 bg-arxiv-archival-blue text-white p-4 rounded-full shadow-lg hover:bg-arxiv-link-blue dark:bg-dark-primary dark:hover:bg-dark-primary-hover transition-colors z-40"
          >
            <ChatIcon />
          </button>
        )}
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={setUser}
      />

      <ChatInterface
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </>
  );
};

// Main App with Router
function App() {
  return (
    <Router>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:arxivId" element={<PaperAnalysisWrapper />} />
          <Route path="/:arxivId/:section" element={<PaperAnalysisWrapper />} />
        </Routes>
      </ThemeProvider>
    </Router>
  );
}

// Wrapper component for paper analysis route
const PaperAnalysisWrapper: React.FC = () => {
  const { arxivId, section } = useParams<{ arxivId: string; section?: string }>();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPaper = async () => {
      if (!arxivId) return;
      
      try {
        setLoading(true);
        const paperData = await PaperService.getPaperByArxivId(arxivId);
        setPaper(paperData);
      } catch (error) {
        console.error('Error loading paper:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPaper();
  }, [arxivId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4">Paper Not Found</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-800 dark:text-dark-primary dark:hover:text-dark-primary-hover">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return <PaperAnalysisPage paper={paper} section={section} />;
};

export default App;
