export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // --- API routes -------------------------------------------------
    if (url.pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      });
    }

    // --- Static files ----------------------------------------------
    // With the `assets` config in wrangler.toml, Cloudflare automatically
    // handles static files. Just return null to let the default handler work.
    return env.ASSETS.fetch(request);
  },
};
