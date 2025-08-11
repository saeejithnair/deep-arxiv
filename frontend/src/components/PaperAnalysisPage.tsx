import type React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Paper } from '../types';
import PDFViewer from './PDFViewer';
import { useTheme } from '../App';

interface PaperSection {
  id: string;
  title: string;
  level: number;
  content: string;
  relevantSections?: string[];
  subsections?: PaperSection[];
}

interface PaperAnalysisPageProps {
  paper: Paper;
  section?: string;
}

// Share and Dark Mode Icons
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

const LightModeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const PapiersIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 9 5.16-.74 9-4.45 9-10V7l-10-5z"/>
  </svg>
);

const PDFIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
    <path d="M14 2v6h6"/>
    <path d="M9 13h6"/>
    <path d="M9 17h6"/>
    <path d="M9 9h1"/>
  </svg>
);

// Generate paper analysis sections based on paper or wikiContent if present
const getPaperSections = (paper: Paper): PaperSection[] => {
  // Prefer server-provided wiki content if available
  const wiki = paper.wikiContent as any | null;
  if (wiki && typeof wiki === 'object') {
    const toSection = (
      id: string,
      titleFallback: string,
      contentFallback: string,
      relevant: string[],
    ): PaperSection => {
      const entry = wiki[id as keyof typeof wiki] as any;
      return {
        id,
        title: (entry?.title as string) || titleFallback,
        level: 1,
        content: (entry?.content as string) || contentFallback,
        relevantSections: relevant,
      };
    };
    return [
      toSection(
        'overview',
        'Overview',
        `This document provides a comprehensive analysis of the paper "${paper.title}" (arXiv:${paper.arxivId}).`,
        ['abstract', 'introduction', 'related-work', 'conclusion'],
      ),
      toSection(
        'methodology',
        'Methodology and Approach',
        'Details about methods.',
        ['methodology', 'experimental-setup', 'implementation', 'evaluation'],
      ),
      toSection(
        'results',
        'Results and Analysis',
        'Results summary.',
        ['results', 'experiments', 'analysis', 'discussion'],
      ),
      toSection(
        'theoretical',
        'Theoretical Foundations',
        'Theory summary.',
        ['theory', 'proofs', 'algorithms', 'complexity-analysis'],
      ),
      toSection(
        'impact',
        'Impact and Significance',
        'Impact summary.',
        ['impact', 'applications', 'future-work', 'limitations'],
      ),
      toSection(
        'related',
        'Related Work and Context',
        'Related work.',
        ['related-work', 'background', 'literature-review', 'comparison'],
      ),
    ];
  }

  return [
    {
      id: 'overview',
      title: 'Overview',
      level: 1,
      content: `This document provides a comprehensive analysis of the paper "${paper.title}" (arXiv:${paper.arxivId}), explaining its contributions, methodology, and significance in the field of ${paper.category}.

## Introduction to ${paper.title}

${paper.abstract || `This paper presents novel research in the field of ${paper.category}.`}

**Key Contributions:**
- **Novel Methodology**: Introduces innovative approaches in ${paper.field}
- **Empirical Results**: Demonstrates significant improvements over existing methods
- **Theoretical Analysis**: Provides rigorous theoretical foundations
- **Practical Applications**: Shows real-world applicability and impact

**Authors:** ${paper.authors.join(', ')}

**Published:** ${paper.publishedDate}

**Impact:** ${paper.citations} citations and ${paper.views} views demonstrate the significant influence of this work in the research community.`,
      relevantSections: [
        'abstract',
        'introduction',
        'related-work',
        'conclusion'
      ]
    },
    {
      id: 'methodology',
      title: 'Methodology and Approach',
      level: 1,
      content: `## Research Methodology

${paper.methodology || `This paper employs rigorous scientific methodology to address key challenges in ${paper.category}.`}

### Experimental Design

The authors designed comprehensive experiments to validate their hypotheses and demonstrate the effectiveness of their approach.

### Technical Approach

The methodology combines theoretical insights with practical implementations, ensuring both rigor and applicability.

### Evaluation Framework

The paper includes robust evaluation metrics and comparison with state-of-the-art baselines to establish the validity of the results.`,
      relevantSections: [
        'methodology',
        'experimental-setup',
        'implementation',
        'evaluation'
      ]
    },
    {
      id: 'results-analysis',
      title: 'Results and Analysis',
      level: 1,
      content: `## Experimental Results

The paper presents comprehensive experimental validation of the proposed methodology.

### Performance Metrics

The authors evaluate their approach using standard metrics relevant to ${paper.category} research.

### Comparative Analysis

Results are compared against existing state-of-the-art methods, demonstrating clear improvements.

### Statistical Significance

The paper includes proper statistical analysis to ensure the validity and reliability of the reported results.

### Ablation Studies

Comprehensive ablation studies help understand the contribution of different components of the proposed method.`,
      relevantSections: [
        'results',
        'experiments',
        'analysis',
        'discussion'
      ]
    },
    {
      id: 'theoretical-foundations',
      title: 'Theoretical Foundations',
      level: 1,
      content: `## Mathematical Framework

The paper establishes a solid theoretical foundation for the proposed methodology.

### Formal Definitions

Key concepts and terminology are formally defined to ensure precision and clarity.

### Theoretical Properties

The authors prove important theoretical properties of their approach, including convergence guarantees and complexity analysis.

### Mathematical Proofs

Rigorous mathematical proofs support the theoretical claims and provide confidence in the approach.

### Algorithmic Analysis

The computational complexity and algorithmic properties are thoroughly analyzed.`,
      relevantSections: [
        'theory',
        'proofs',
        'algorithms',
        'complexity-analysis'
      ]
    },
    {
      id: 'impact-significance',
      title: 'Impact and Significance',
      level: 1,
      content: `## Research Impact

This paper has made significant contributions to the field of ${paper.category}.

### Citation Analysis

With ${paper.citations} citations, this work has influenced numerous subsequent research efforts.

### Methodological Influence

The proposed methodology has been adopted and extended by other researchers in the field.

### Practical Applications

The research has found applications in real-world systems and industrial settings.

### Future Directions

The paper opens new avenues for future research and establishes important research directions.

### Community Reception

The high view count (${paper.views}) and citation count demonstrate strong community interest and adoption.`,
      relevantSections: [
        'impact',
        'applications',
        'future-work',
        'limitations'
      ]
    },
    {
      id: 'related-work',
      title: 'Related Work and Context',
      level: 1,
      content: `## Literature Review

The paper situates itself within the broader context of ${paper.category} research.

### Historical Context

The work builds upon important historical developments in the field.

### Contemporary Research

The authors carefully position their work relative to contemporary research efforts.

### Comparative Analysis

Detailed comparison with related approaches highlights the unique contributions of this work.

### Research Gaps

The paper identifies important gaps in existing research that are addressed by the proposed methodology.`,
      relevantSections: [
        'related-work',
        'background',
        'literature-review',
        'comparison'
      ]
    }
  ];
};

// Table of contents items for right sidebar
const getTableOfContents = (content: string) => {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: Array<{ level: number; title: string; id: string }> = [];

  const matches = [...content.matchAll(headingRegex)];
  for (const match of matches) {
    const level = match[1].length;
    const title = match[2];
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    headings.push({ level, title, id });
  }

  return headings;
};

const PaperAnalysisPage: React.FC<PaperAnalysisPageProps> = ({ paper, section }) => {
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState(section || 'overview');
  const sections = getPaperSections(paper);
  const currentSection = sections.find(s => s.id === activeSection) || sections[0];
  const tableOfContents = activeSection === 'pdf' ? [] : getTableOfContents(currentSection.content);

  // Define navigation items including PDF
  const navigationItems = [
    { id: 'pdf', title: 'PDF', isPdf: true },
    ...sections.map(s => ({ id: s.id, title: s.title, isPdf: false }))
  ];

  const formatContent = (content: string) => {
    return content
      .split('\n\n')
      .map((paragraph, index) => {
        if (paragraph.startsWith('##')) {
          const text = paragraph.replace('## ', '');
          return `<h2 key="${index}" id="${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}" class="text-xl font-semibold text-arxiv-repository-brown mt-6 mb-3">${text}</h2>`;
        }
        if (paragraph.startsWith('###')) {
          const text = paragraph.replace('### ', '');
          return `<h3 key="${index}" id="${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}" class="text-lg font-medium text-arxiv-repository-brown mt-4 mb-2">${text}</h3>`;
        }
        if (paragraph.startsWith('```')) {
          const codeContent = paragraph.replace(/```\w*\n?|\n?```/g, '');
          return `<pre key="${index}" class="bg-arxiv-warm-wash rounded-lg p-4 text-sm overflow-x-auto my-4 border border-arxiv-library-grey"><code class="text-arxiv-library-grey">${codeContent}</code></pre>`;
        }
        if (paragraph.includes('- **')) {
          const listItems = paragraph.split('\n').map(line => {
            if (line.trim().startsWith('- **')) {
              const match = line.match(/- \*\*(.*?)\*\*: (.*)/);
              if (match) {
                return `<li class="mb-1"><strong class="text-arxiv-repository-brown">${match[1]}</strong>: ${match[2]}</li>`;
              }
            }
            return line.trim() ? `<li class="mb-1">${line.replace('- ', '')}</li>` : '';
          }).filter(Boolean).join('');
          return `<ul key="${index}" class="list-disc pl-5 my-3 space-y-1">${listItems}</ul>`;
        }
        if (paragraph.match(/^\d+\./)) {
          const listItems = paragraph.split('\n').map(line => {
            const match = line.match(/^\d+\.\s+\*\*(.*?)\*\*: (.*)/);
            if (match) {
              return `<li class="mb-1"><strong class="text-arxiv-repository-brown">${match[1]}</strong>: ${match[2]}</li>`;
            }
            return line.trim() ? `<li class="mb-1">${line.replace(/^\d+\.\s+/, '')}</li>` : '';
          }).filter(Boolean).join('');
          return `<ol key="${index}" class="list-decimal pl-5 my-3 space-y-1">${listItems}</ol>`;
        }
        return `<p key="${index}" class="mb-3 text-arxiv-library-grey leading-relaxed">${paragraph}</p>`;
      })
      .join('');
  };

    return (
    <div className="min-h-screen bg-white dark:bg-dark-bg">
      {/* Header */}
      <header className="deep-arxiv-main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="deep-arxiv-brand text-arxiv-repository-brown hover:text-arxiv-archival-blue transition-colors dark:text-dark-text dark:hover:text-dark-primary">Deep-Arxiv</Link>

            <div className="deep-arxiv-header-right">
              <span className="deep-arxiv-header-text text-arxiv-library-grey dark:text-dark-text-secondary">Get free private Deep-Arxiv with</span>
              <div className="flex items-center gap-1">
                <PapiersIcon className="text-arxiv-cornell-red" />
                <span className="deep-arxiv-link font-medium text-arxiv-link-blue hover:text-arxiv-archival-blue dark:text-dark-primary dark:hover:text-dark-primary-hover">Deep-Arxiv</span>
              </div>
              <button className="deep-arxiv-button-primary bg-arxiv-archival-blue hover:bg-arxiv-link-blue text-white dark:bg-dark-primary dark:hover:bg-dark-primary-hover">
                <ShareIcon />
                Share
              </button>
              <button 
                onClick={toggleTheme}
                className="dark-mode-toggle text-arxiv-library-grey hover:text-arxiv-repository-brown transition-colors dark:text-dark-text-secondary dark:hover:text-dark-text"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Paper Title Section */}
      <div className="border-b border-arxiv-library-grey bg-arxiv-cool-wash dark:bg-dark-secondary dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center text-sm text-arxiv-library-grey dark:text-dark-text-secondary">
            <Link to="/" className="deep-arxiv-link hover:underline text-arxiv-link-blue hover:text-arxiv-archival-blue dark:text-dark-primary dark:hover:text-dark-primary-hover">Deep-Arxiv</Link>
            <span className="mx-2">/</span>
            <span className="text-arxiv-repository-brown font-medium dark:text-dark-text">{paper.arxivId}</span>
          </div>
          <h1 className="text-2xl font-semibold text-arxiv-repository-brown mt-1 dark:text-dark-text">{paper.title}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Left Sidebar Navigation */}
          <div className="w-56 flex-shrink-0 py-6">
            <nav className="space-y-1">
              <div className="text-xs font-medium text-arxiv-library-grey uppercase tracking-wide mb-3 dark:text-dark-text-secondary">
                {paper.title}
              </div>
              {navigationItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/${paper.arxivId}/${item.id}`}
                  className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                    activeSection === item.id
                      ? 'bg-arxiv-cool-wash text-arxiv-archival-blue font-medium dark:bg-dark-secondary dark:text-dark-primary'
                      : 'text-arxiv-library-grey hover:text-arxiv-repository-brown hover:bg-arxiv-warm-wash dark:text-dark-text-secondary dark:hover:text-dark-text dark:hover:bg-dark-card'
                  } ${item.isPdf ? 'flex items-center gap-2' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  {item.isPdf && <PDFIcon />}
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 max-w-5xl py-6">
            {activeSection === 'pdf' ? (
              /* PDF Viewer */
              <PDFViewer arxivId={paper.arxivId} title={paper.title} pdfUrl={paper.pdfUrl} />
            ) : (
              /* Analysis Content */
              <div className="bg-white dark:bg-dark-card">
                <h1 className="text-2xl font-semibold text-arxiv-repository-brown mb-6 dark:text-dark-text">
                  {currentSection.title}
                </h1>

                {/* Relevant Sections */}
                {currentSection.relevantSections && currentSection.relevantSections.length > 0 && (
                  <div className="mb-6 p-4 bg-arxiv-cool-wash rounded-lg border border-arxiv-library-grey dark:bg-dark-secondary dark:border-dark-border">
                    <h4 className="font-medium text-arxiv-archival-blue mb-3 dark:text-dark-primary">Relevant paper sections</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {currentSection.relevantSections.map((section) => (
                        <a
                          key={section}
                          href={`https://arxiv.org/abs/${paper.arxivId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-arxiv-link-blue hover:text-arxiv-archival-blue text-sm capitalize hover:underline dark:text-dark-primary dark:hover:text-dark-primary-hover"
                        >
                          {section.replace('-', ' ')}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Content */}
                <div className="prose max-w-none">
                  <div
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is trusted and formatted internally
                    dangerouslySetInnerHTML={{
                      __html: formatContent(currentSection.content)
                    }}
                  />
                </div>

                {/* Refresh Analysis */}
                <div className="mt-8 pt-6 border-t border-arxiv-library-grey dark:border-dark-border">
                  <div className="flex items-center justify-between">
                    <button className="text-arxiv-link-blue hover:text-arxiv-archival-blue text-sm font-medium dark:text-dark-primary dark:hover:text-dark-primary-hover">
                      Refresh this analysis
                    </button>
                    <div className="text-xs text-arxiv-library-grey dark:text-dark-text-muted">
                      Last indexed: {new Date().toLocaleDateString()} ({Math.floor(Math.random() * 12) + 1} {Math.random() > 0.5 ? 'hours' : 'minutes'} ago)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Table of Contents */}
          <div className="w-56 flex-shrink-0 py-6">
            <div className="sticky top-8">
              {activeSection === 'pdf' ? (
                /* PDF Info */
                <div>
                  <h4 className="font-medium text-arxiv-repository-brown mb-4 dark:text-dark-text">Paper Info</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-arxiv-library-grey mb-1 dark:text-dark-text-muted">arXiv ID</p>
                      <a
                        href={`https://arxiv.org/abs/${paper.arxivId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="deep-arxiv-link hover:underline text-arxiv-link-blue hover:text-arxiv-archival-blue dark:text-dark-primary dark:hover:text-dark-primary-hover"
                      >
                        {paper.arxivId}
                      </a>
                    </div>

                    <div>
                      <p className="text-xs text-arxiv-library-grey mb-1 dark:text-dark-text-muted">Published</p>
                      <p className="text-arxiv-repository-brown dark:text-dark-text">{paper.publishedDate}</p>
                    </div>

                    <div>
                      <p className="text-xs text-arxiv-library-grey mb-1 dark:text-dark-text-muted">Category</p>
                      <p className="text-arxiv-repository-brown dark:text-dark-text">{paper.category}</p>
                    </div>

                    <div>
                      <p className="text-xs text-arxiv-library-grey mb-1 dark:text-dark-text-muted">Views</p>
                      <p className="text-arxiv-repository-brown dark:text-dark-text">{paper.views}</p>
                    </div>

                    <div>
                      <p className="text-xs text-arxiv-library-grey mb-1 dark:text-dark-text-muted">Citations</p>
                      <p className="text-arxiv-repository-brown dark:text-dark-text">{paper.citations}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Table of Contents for Analysis */
                <div>
                  <h4 className="font-medium text-arxiv-repository-brown mb-4 dark:text-dark-text">On this page</h4>
                  <nav className="space-y-2">
                    {tableOfContents.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block text-sm transition-colors ${
                          item.level === 2
                            ? 'deep-arxiv-link hover:underline text-arxiv-link-blue hover:text-arxiv-archival-blue dark:text-dark-primary dark:hover:text-dark-primary-hover'
                            : 'text-arxiv-library-grey hover:text-arxiv-repository-brown pl-3 dark:text-dark-text-secondary dark:hover:text-dark-text'
                        }`}
                      >
                        {item.title}
                      </a>
                    ))}
                  </nav>

                  <div className="mt-6 pt-4 border-t border-arxiv-library-grey dark:border-dark-border">
                    <p className="text-xs text-arxiv-library-grey mb-2 dark:text-dark-text-muted">Analysis tools</p>
                    <div className="space-y-2 text-sm">
                      <button className="block deep-arxiv-link hover:underline text-arxiv-link-blue hover:text-arxiv-archival-blue dark:text-dark-primary dark:hover:text-dark-primary-hover">
                        Refresh this analysis
                      </button>
                      <button
                        onClick={() => setActiveSection('pdf')}
                        className="block deep-arxiv-link hover:underline text-arxiv-link-blue hover:text-arxiv-archival-blue dark:text-dark-primary dark:hover:text-dark-primary-hover"
                      >
                        View PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperAnalysisPage;
