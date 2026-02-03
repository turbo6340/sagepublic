import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  // Protect app pages, but allow our server API endpoints to be called directly.
  // (The API routes themselves should enforce auth if needed.)
  matcher: [
    "/((?!api/auth|api/ping|api/status|api/costs|api/chat-send|_next/static|_next/image|favicon.ico).*)",
  ],
};
