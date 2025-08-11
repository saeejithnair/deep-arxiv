# Deep-Arxiv - Academic Paper Analysis Platform

A modern, minimalistic web application for exploring and analyzing academic papers, inspired by DeepWiki's clean design.

## Features

- 🔍 **Smart Search**: Search papers by title, authors, or abstract
- 📊 **Paper Analysis**: Interactive PDF viewer and analysis tools
- 🎨 **Clean Interface**: Minimalistic design inspired by DeepWiki
- 🌙 **Dark Mode**: Toggle between light and dark themes with persistence
- 📱 **Responsive**: Works seamlessly across desktop, tablet, and mobile
- ⚡ **Fast**: Built with React, TypeScript, and Vite for optimal performance

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router v7
- **Build Tool**: Vite 6
- **Package Manager**: Bun
- **Deployment**: Cloudflare Workers

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/saeejithnair/deep-arxiv.git
   cd deep-arxiv
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Start development server**:
   ```bash
   bun run dev
   ```

4. **Build for production**:
   ```bash
   bun run build
   ```

## Project Structure

```
deep-arxiv/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PaperAnalysisPage.tsx  # Paper detail and analysis view
│   │   │   └── PDFViewer.tsx          # PDF viewing component
│   │   ├── App.tsx                    # Main app component
│   │   ├── main.tsx                   # App entry point
│   │   ├── index.css                  # Global styles and theme
│   │   ├── data.ts                    # Sample paper data
│   │   └── types.ts                   # TypeScript type definitions
│   ├── public/                        # Static assets
│   └── index.html                     # Main HTML file
├── worker/
│   └── src/
│       └── worker.ts                  # Cloudflare worker
├── netlify.toml                   # Netlify deployment config
├── wrangler.toml                  # Cloudflare worker config
└── package.json                   # Project dependencies
```

## Deployment

The application is deployed to Cloudflare Workers.

To run locally with wrangler:
```bash
wrangler dev
```

To deploy to Cloudflare:
```bash
wrangler deploy
```

## Supabase Functions & Storage

- Set env vars in the frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Set Supabase Edge Function secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `GEMINI_API_KEY`.

### Edge Function: index-paper

- Path: `supabase/functions/index-paper/index.ts`
- Deploy: `supabase functions deploy index-paper --no-verify-jwt`
- Invoke URL: `{SUPABASE_URL}/functions/v1/index-paper`
- Request body: `{ "arxiv_id": "<id or URL>" }`
- Behavior:
  - Fetches arXiv metadata
  - Downloads the PDF and uploads it to Storage bucket `papers` (public)
  - Calls Gemini (if `GEMINI_API_KEY` configured) to produce structured `wiki_content` JSON
  - Upserts into `public.papers` including `pdf_url`, `wiki_content`, `status`, `last_indexed`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m "Add feature"`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

Built with ❤️ using [Same](https://same.new)
