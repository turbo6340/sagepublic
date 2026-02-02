import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

function parseAllowList() {
  const raw = process.env.ALLOWED_EMAILS;
  if (!raw) return null;
  const set = new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
  return set.size ? set : null;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const allow = parseAllowList();
      if (!allow) return true;
      const email = (profile as any)?.email?.toLowerCase?.();
      if (!email) return false;
      return allow.has(email);
    },
  },
});
