/**
 * Connects Convex to Clerk so that `ctx.auth.getUserIdentity()` works.
 * The `domain` is your Clerk Issuer URL (CLERK_JWT_ISSUER_DOMAIN).
 * The `applicationID` must match the JWT template name you create in Clerk
 * (Clerk Dashboard -> JWT Templates -> "convex").
 *
 * See DEVELOPER_GUIDE.md -> "Wiring Clerk to Convex" for the exact steps.
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
