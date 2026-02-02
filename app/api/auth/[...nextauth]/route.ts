import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

function allowlist() {
  const raw = process.env.ALLOWED_EMAILS;
  if (!raw) return null;
  return new Set(
    raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
  );
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const allow = allowlist();
      if (!allow) return true;
      const email = (profile as any)?.email?.toLowerCase?.();
      return !!email && allow.has(email);
    },
  },
});

export { handler as GET, handler as POST };
