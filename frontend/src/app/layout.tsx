import "./globals.css";

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
        <div className="max-w-7xl mx-auto px-4">
          {children}
        </div>
      </body>
    </html>
  );
}
