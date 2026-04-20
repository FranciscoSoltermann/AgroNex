import { Navbar } from '@/components/shared/layout/Navbar';
import WebGLHero from '@/components/features/marketing/WebGLHero';

export default function Home() {
  return (
      <main className="min-h-screen bg-[#050f0c] selection:bg-green-200 selection:text-green-900">
        <Navbar />
        <WebGLHero />
      </main>
  );
}