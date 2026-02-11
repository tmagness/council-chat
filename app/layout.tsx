import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Council',
  description: 'Two-model council for collaborative AI decision making',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
