import { Navbar } from '@/components/shared/layout/Navbar';
import { Hero } from '@/components/features/marketing/Hero';
import { OAuthRedirectHandler } from '@/components/shared/OAuthRedirectHandler';

export default function Home() {
  return (
      <main className="min-h-screen bg-white selection:bg-green-200 selection:text-green-900">
        <OAuthRedirectHandler />
        <Navbar />
        <Hero />
      </main>
  );
}