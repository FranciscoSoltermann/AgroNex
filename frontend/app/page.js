import { Navbar } from '@/components/shared/layout/Navbar';
import { Hero } from '@/components/features/marketing/Hero';

export default function Home() {
  return (
      <main className="min-h-screen bg-white selection:bg-green-200 selection:text-green-900">
        <Navbar />
        <Hero />
      </main>
  );
}