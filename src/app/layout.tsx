import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
// import { GeistMono } from 'geist/font/mono'; // Removed due to import error
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

const geistSans = GeistSans;
// const geistMono = GeistMono; // Removed due to import error

export const metadata: Metadata = {
  title: 'Recipe Genie',
  description: 'AI-powered recipe suggestions based on your ingredients and calorie needs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
