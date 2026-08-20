import { Navbar } from '@/components/shared/layout/Navbar';
import { Hero } from '@/components/features/marketing/Hero';
import { OAuthRedirectHandler } from '@/components/shared/OAuthRedirectHandler';

export default function Home() {
  return (
      <main className="min-h-screen bg-[#0A1612] selection:bg-[#2D6A4F] selection:text-white">
        <OAuthRedirectHandler />
        <Navbar />
        <Hero />
      </main>
  );
}