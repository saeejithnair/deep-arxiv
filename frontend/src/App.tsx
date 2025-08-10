import type React from 'react';
import { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import type { Paper, User, ChatMessage, SearchFilters } from './types';
import { papers, categories } from './data';
import PaperAnalysisPage from './components/PaperAnalysisPage';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from './supabaseClient';

// Icons
const ViewIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
  </svg>
);

const CitationIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
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

const DarkModeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const PapiersIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
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
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{isLogin ? 'Sign In' : 'Sign Up'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800"
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
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">
          {paperContext ? `${paperContext.arxivId}` : 'Deep-Arxiv AI'}
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <CloseIcon />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
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

      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask about this paper..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  );
};

const PaperCard: React.FC<{ paper: Paper; user?: User }> = ({ paper, user }) => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <div className="paper-card" onClick={() => navigate(`/${paper.arxivId}`)}>
        <Link
          to={`/${paper.arxivId}`}
          className="paper-card-title"
        >
          {paper.title}
        </Link>

        <div className="paper-card-authors">
          {paper.authors.slice(0, 2).join(', ')}{paper.authors.length > 2 ? ' et al.' : ''}
        </div>

        {paper.abstract && (
          <div className="paper-card-description">
            {paper.abstract}
          </div>
        )}

        <div className="paper-card-stats">
          <div className="flex items-center gap-1">
            <ViewIcon />
            <span>{paper.views}</span>
          </div>
          {paper.citations && (
            <div className="flex items-center gap-1">
              <CitationIcon />
              <span>{paper.citations}</span>
            </div>
          )}
        </div>

        <div className="paper-card-arrow">
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

const HomePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'all',
    sortBy: 'views',
    field: ''
  });

  // Filter and sort papers
  const filteredPapers = useMemo(() => {
    let filtered = papers;

    // Filter by search query
    if (filters.query) {
      filtered = filtered.filter(paper =>
        paper.title.toLowerCase().includes(filters.query.toLowerCase()) ||
        paper.authors.some(author => author.toLowerCase().includes(filters.query.toLowerCase())) ||
        paper.abstract?.toLowerCase().includes(filters.query.toLowerCase())
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
  }, [filters]);

  return (
    <>
      <div className="deep-arxiv-container">
        {/* Header */}
        <header className="deep-arxiv-main-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <Link to="/" className="deep-arxiv-brand">Deep-Arxiv</Link>

              <div className="deep-arxiv-header-right">
                <span className="deep-arxiv-header-text">Get unlimited papers with</span>
                <div className="flex items-center gap-1">
                  <PapiersIcon />
                  <span className="deep-arxiv-link font-medium">Deep-Arxiv</span>
                </div>
                <button className="deep-arxiv-button-primary">
                  <ShareIcon />
                  Share
                </button>
                <button className="dark-mode-toggle">
                  <DarkModeIcon />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Section */}
          <div className="deep-arxiv-search-section">
            <h1 className="deep-arxiv-main-title">
              Which paper would you like to understand?
            </h1>

            <div className="deep-arxiv-search-container">
              <div className="relative">
                <div className="deep-arxiv-search-icon">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search for papers (or paste a link)"
                  value={filters.query}
                  onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                  className="deep-arxiv-search-input"
                />
              </div>
            </div>
          </div>

          {/* Papers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
            {/* Add Paper Card */}
            <div className="add-paper-card">
              <div className="add-paper-card-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="add-paper-card-title">Add paper</div>
              <div className="add-paper-card-description">Analyze any research paper</div>
            </div>

            {filteredPapers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} user={user || undefined} />
            ))}
          </div>

          {filteredPapers.length === 0 && (
            <div className="text-center py-12">
              <p className="deep-arxiv-text-secondary text-lg">No papers found matching your search.</p>
            </div>
          )}
        </main>

        {/* Floating Chat Button */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
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
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:arxivId" element={<PaperAnalysisWrapper />} />
        <Route path="/:arxivId/:section" element={<PaperAnalysisWrapper />} />
      </Routes>
    </Router>
  );
}

// Wrapper component for paper analysis route
const PaperAnalysisWrapper: React.FC = () => {
  const { arxivId, section } = useParams<{ arxivId: string; section?: string }>();

  // Find paper by arXiv ID
  const paper = papers.find(p => p.arxivId === arxivId);

  if (!paper) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Paper Not Found</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-800">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return <PaperAnalysisPage paper={paper} section={section} />;
};

export default App;
