import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

/**
 * HTTP endpoints. Clerk webhooks land here so user lifecycle events keep the
 * `users` table in sync. The signature is verified with Svix using
 * CLERK_WEBHOOK_SECRET before any database write.
 *
 * Set the endpoint in Clerk Dashboard -> Webhooks to:
 *   https://<your-deployment>.convex.site/clerk-webhook
 */
const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) return new Response("Missing webhook secret", { status: 500 });

    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");
    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing Svix headers", { status: 400 });
    }

    const payload = await request.text();
    let evt: any;
    try {
      evt = new Webhook(secret).verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch {
      return new Response("Invalid signature", { status: 400 });
    }

    const type = evt.type as string;
    const data = evt.data;

    if (type === "user.created" || type === "user.updated") {
      const email =
        data.email_addresses?.[0]?.email_address ?? "unknown@example.com";
      await ctx.runMutation(internal.users.upsertFromClerk, {
        clerkId: data.id,
        email,
        firstName: data.first_name ?? undefined,
        lastName: data.last_name ?? undefined,
        imageUrl: data.image_url ?? undefined,
      });
    } else if (type === "user.deleted") {
      if (data.id) {
        await ctx.runMutation(internal.users.deleteFromClerk, {
          clerkId: data.id,
        });
      }
    }

    return new Response("ok", { status: 200 });
  }),
});

export default http;
