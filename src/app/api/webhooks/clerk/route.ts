import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Clerk webhook — informational endpoint.
 *
 * The CANONICAL Clerk webhook for this project is handled by Convex, not here.
 * Convex exposes a Svix-verified HTTP action at:
 *
 *     https://<your-deployment>.convex.site/clerk-webhook
 *
 * (see `convex/http.ts`). Point your Clerk Dashboard → Webhooks endpoint there,
 * subscribe to `user.created`, `user.updated`, and `user.deleted`, and copy the
 * signing secret into `CLERK_WEBHOOK_SECRET` in the Convex environment.
 *
 * Keeping a SINGLE verified handler avoids drift between two implementations and
 * lets the webhook write directly to the database inside Convex. This Next.js
 * route exists only so the path is documented and reserved; it deliberately does
 * not process events. See docs/DEVELOPER_GUIDE.md → "Wiring Clerk to Convex".
 */

const INFO = {
  ok: true,
  handler: "convex",
  canonicalEndpoint: "https://<your-deployment>.convex.site/clerk-webhook",
  events: ["user.created", "user.updated", "user.deleted"],
  note:
    "Configure your Clerk webhook to point at the Convex .site endpoint above. This Next.js route does not process events.",
};

export async function GET() {
  return NextResponse.json(INFO);
}

export async function POST() {
  // Explicitly refuse to process here so misconfigured webhooks fail loudly
  // rather than silently succeeding against a no-op endpoint.
  return NextResponse.json(
    {
      ...INFO,
      ok: false,
      error:
        "This route does not process Clerk events. Point the webhook at the Convex .site/clerk-webhook endpoint instead.",
    },
    { status: 421 }
  );
}
