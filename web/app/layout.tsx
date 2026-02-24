import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EXTRACTA — AI-Powered Knowledge Extraction',
  description: 'Transform documents into AI-ready knowledge. Upload PDF, EPUB, or TXT files and get structured, chunked output.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
