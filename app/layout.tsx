import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/src/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Artificial Expert",
  description: "Sage cockpit (chat, status, costs, notifications)",
};

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
    >
      {label}
    </Link>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const showNav = !!session;

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {showNav ? (
          <div className="min-h-dvh bg-gray-50">
            <header className="border-b bg-white">
              <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="font-semibold">Artificial Expert</div>
                  <nav className="flex gap-1">
                    <NavItem href="/" label="Chat" />
                    <NavItem href="/status" label="Status" />
                    <NavItem href="/costs" label="Costs" />
                    <NavItem href="/settings" label="Settings" />
                  </nav>
                </div>
                <div className="text-sm text-gray-600">
                  {session?.user?.email ?? ""}
                </div>
              </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
