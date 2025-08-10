import type React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Paper } from '../types';
import PDFViewer from './PDFViewer';

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

const PapiersIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 9 5.16-.74 9-4.45 9-10V7l-10-5z"/>
  </svg>
);

// Generate paper analysis sections based on paper
const getPaperSections = (paper: Paper): PaperSection[] => {
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
          return `<h2 key="${index}" id="${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}" class="text-xl font-semibold text-gray-900 mt-6 mb-3">${text}</h2>`;
        }
        if (paragraph.startsWith('###')) {
          const text = paragraph.replace('### ', '');
          return `<h3 key="${index}" id="${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}" class="text-lg font-medium text-gray-900 mt-4 mb-2">${text}</h3>`;
        }
        if (paragraph.startsWith('```')) {
          const codeContent = paragraph.replace(/```\w*\n?|\n?```/g, '');
          return `<pre key="${index}" class="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto my-4 border border-gray-200"><code class="text-gray-800">${codeContent}</code></pre>`;
        }
        if (paragraph.includes('- **')) {
          const listItems = paragraph.split('\n').map(line => {
            if (line.trim().startsWith('- **')) {
              const match = line.match(/- \*\*(.*?)\*\*: (.*)/);
              if (match) {
                return `<li class="mb-1"><strong class="text-gray-900">${match[1]}</strong>: ${match[2]}</li>`;
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
              return `<li class="mb-1"><strong class="text-gray-900">${match[1]}</strong>: ${match[2]}</li>`;
            }
            return line.trim() ? `<li class="mb-1">${line.replace(/^\d+\.\s+/, '')}</li>` : '';
          }).filter(Boolean).join('');
          return `<ol key="${index}" class="list-decimal pl-5 my-3 space-y-1">${listItems}</ol>`;
        }
        return `<p key="${index}" class="mb-3 text-gray-700 leading-relaxed">${paragraph}</p>`;
      })
      .join('');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="deep-arxiv-main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="deep-arxiv-brand">Deep-Arxiv</Link>

            <div className="deep-arxiv-header-right">
              <span className="deep-arxiv-header-text">Get free private Deep-Arxiv with</span>
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

      {/* Paper Title Section */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link to="/" className="deep-arxiv-link hover:underline">Deep-Arxiv</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{paper.arxivId}</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">{paper.title}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Left Sidebar Navigation */}
          <div className="w-64 flex-shrink-0 py-6">
            <nav className="space-y-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                {paper.title}
              </div>
              {navigationItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/${paper.arxivId}/${item.id}`}
                  className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  } ${item.isPdf ? 'flex items-center gap-2' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  {item.isPdf && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.5 2A1.5 1.5 0 0 0 7 3.5v17A1.5 1.5 0 0 0 8.5 22h7a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 15.5 2h-7zM9 4h6v16H9V4zm2 2v2h2V6h-2zm0 3v7h2V9h-2z"/>
                    </svg>
                  )}
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 max-w-4xl py-6">
            {activeSection === 'pdf' ? (
              /* PDF Viewer */
              <PDFViewer arxivId={paper.arxivId} title={paper.title} />
            ) : (
              /* Analysis Content */
              <div className="bg-white">
                <h1 className="text-2xl font-semibold text-gray-900 mb-6">
                  {currentSection.title}
                </h1>

                {/* Relevant Sections */}
                {currentSection.relevantSections && currentSection.relevantSections.length > 0 && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-3">Relevant paper sections</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {currentSection.relevantSections.map((section) => (
                        <a
                          key={section}
                          href={`https://arxiv.org/abs/${paper.arxivId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:text-blue-900 text-sm capitalize hover:underline"
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
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Refresh this analysis
                    </button>
                    <div className="text-xs text-gray-500">
                      Last indexed: {new Date().toLocaleDateString()} ({Math.floor(Math.random() * 12) + 1} {Math.random() > 0.5 ? 'hours' : 'minutes'} ago)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Table of Contents */}
          <div className="w-64 flex-shrink-0 py-6">
            <div className="sticky top-8">
              {activeSection === 'pdf' ? (
                /* PDF Info */
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Paper Info</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">arXiv ID</p>
                      <a
                        href={`https://arxiv.org/abs/${paper.arxivId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="deep-arxiv-link hover:underline"
                      >
                        {paper.arxivId}
                      </a>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Published</p>
                      <p className="text-gray-900">{paper.publishedDate}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Category</p>
                      <p className="text-gray-900">{paper.category}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Views</p>
                      <p className="text-gray-900">{paper.views}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Citations</p>
                      <p className="text-gray-900">{paper.citations}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Table of Contents for Analysis */
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">On this page</h4>
                  <nav className="space-y-2">
                    {tableOfContents.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block text-sm transition-colors ${
                          item.level === 2
                            ? 'deep-arxiv-link hover:underline'
                            : 'text-gray-600 hover:text-gray-900 pl-3'
                        }`}
                      >
                        {item.title}
                      </a>
                    ))}
                  </nav>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Analysis tools</p>
                    <div className="space-y-2 text-sm">
                      <button className="block deep-arxiv-link hover:underline">
                        Refresh this analysis
                      </button>
                      <button
                        onClick={() => setActiveSection('pdf')}
                        className="block deep-arxiv-link hover:underline"
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
