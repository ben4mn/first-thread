import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'First Thread — Scenario workshop',
  description:
    'Map one scenario, understand the handoffs, and define a first move toward a better future state. A working prototype by Ben and Paul.',
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
