import { Hero } from '../../components/sections/Hero';
import { PageTransition } from '../../components/ui/PageTransition';

export default function HomePage() {
  return (
    <PageTransition>
      <div className="w-full min-h-screen bg-[#3c0f0e]">
        <Hero />
      </div>
    </PageTransition>
  );
}
