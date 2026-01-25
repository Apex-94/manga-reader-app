import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Manga Reader",
  description: "Read manga using a pluggable backend.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <Providers>
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center gap-6 py-4 border-b mb-6">
              <a href="/browse" className="text-lg font-bold hover:opacity-80">Manga Reader</a>
              <div className="flex gap-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                <a href="/browse" className="hover:text-blue-600">Browse</a>
                <a href="/library" className="hover:text-blue-600">Library</a>
                <a href="/sources" className="hover:text-blue-600">Sources</a>
              </div>
            </nav>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
