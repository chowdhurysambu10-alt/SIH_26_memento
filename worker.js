export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy dynamic /api calls to your backend if BACKEND_API_URL is configured
    if (url.pathname.startsWith('/api')) {
      const backendUrl = env.BACKEND_API_URL;
      if (backendUrl) {
        const targetUrl = new URL(url.pathname + url.search, backendUrl);
        return fetch(new Request(targetUrl, request));
      }
    }

    // Serve static frontend assets (HTML/CSS/JS) with SPA client-side routing fallback
    return env.ASSETS.fetch(request);
  },
};
