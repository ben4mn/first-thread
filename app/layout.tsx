import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'First Thread — Flow studio',
  description:
    'Define digital business flows, rehearse decisions and exceptions, and design bounded AI delegation across industries.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
