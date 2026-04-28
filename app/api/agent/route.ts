import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/agent
 *
 * Stub handler for the "Read with [agent]" CTA that lives on every figure in the
 * editorial publication wrap. Until the real agent (Bobbito) is wired up to the
 * data narrative pipeline, this route returns a tiny on-brand HTML page so the
 * CTA is interactive — not a 404 dead-end.
 *
 * Returns JSON when the client sends `Accept: application/json` (so future
 * client-side fetch flows can poll/render in-line) and HTML otherwise so a
 * direct anchor click lands somewhere readable.
 *
 * Replace with the real agent integration in the brand-wrap plan's Phase 4 work.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const prompt = url.searchParams.get("prompt")?.trim() ?? "";
  const agent = url.searchParams.get("agent")?.trim() || "Bobbito";
  const figure = url.searchParams.get("figure")?.trim() ?? null;
  const referer = request.headers.get("referer");
  const back = referer && referer.startsWith(url.origin) ? referer : "/overview";

  const wantsJson =
    request.headers.get("accept")?.toLowerCase().includes("application/json") ?? false;

  if (wantsJson) {
    return NextResponse.json(
      {
        ok: true,
        status: "queued",
        agent,
        figure,
        prompt,
        message:
          prompt.length > 0
            ? `${agent} is on the bench — your figure prompt is queued for the next briefing.`
            : `${agent} is on the bench — wire a prompt to a figure to get a real reading.`,
        requestId: crypto.randomUUID(),
      },
      { status: 202, headers: { "cache-control": "no-store" } },
    );
  }

  const safePrompt = escapeHtml(prompt);
  const safeAgent = escapeHtml(agent);
  const safeBack = escapeHtml(back);

  return new NextResponse(
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${safeAgent} is on the bench · Every Court Vision</title>
<style>
  :root { color-scheme: dark; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    background: #0d0a07;
    color: #f4efe6;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    padding: 2rem;
    background-image:
      radial-gradient(ellipse 80rem 40rem at 18% -10%, rgba(255,193,102,0.05), transparent 60%),
      radial-gradient(ellipse 60rem 36rem at 88% 12%, rgba(102,180,230,0.04), transparent 65%);
  }
  main { max-width: 38rem; }
  .eyebrow {
    font-family: ui-monospace, "SFMono-Regular", monospace;
    font-size: .6875rem;
    letter-spacing: .22em;
    text-transform: uppercase;
    color: #ff9d42;
    font-variant-numeric: tabular-nums;
  }
  h1 {
    font-family: "Iowan Old Style", Georgia, serif;
    font-size: clamp(2rem, 4vw + .5rem, 3rem);
    line-height: 1.04;
    letter-spacing: -.025em;
    margin: .75rem 0 1rem;
  }
  p { font-family: "Iowan Old Style", Georgia, serif; font-size: 1.0625rem; line-height: 1.68; color: rgba(244,239,230,.88); }
  blockquote {
    margin: 1.5rem 0; padding: 1rem 1.25rem;
    border-left: 2px solid #7b5bc9;
    background: rgba(255,255,255,.02);
    font-family: "Iowan Old Style", Georgia, serif; font-style: italic;
  }
  a {
    color: #2bcaa6; text-decoration: underline; text-underline-offset: 3px;
    font-family: ui-monospace, monospace; font-size: .8125rem;
    letter-spacing: .04em; text-transform: uppercase;
  }
  .rule { height:1px; width: 3rem; background: rgba(244,239,230,.3); margin: 1.25rem 0; }
</style>
</head>
<body>
<main>
  <p class="eyebrow">Every Court Vision · Stub Agent</p>
  <h1>${safeAgent} is on the bench.</h1>
  <p>The named analyst that lives in every <em>Read with ${safeAgent}</em> CTA isn&rsquo;t wired up yet — Phase 4 of the brand-wrap plan reconnects this route to the real data-narrative pipeline.</p>
  ${
    safePrompt
      ? `<blockquote>The prompt this figure would have sent: &ldquo;${safePrompt}&rdquo;</blockquote>`
      : `<p>No prompt was supplied — once the agent ships, every figure passes a contextual question into this handler.</p>`
  }
  <div class="rule"></div>
  <a href="${safeBack}">← Back to the briefing</a>
</main>
</body>
</html>`,
    {
      status: 202,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
