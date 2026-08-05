import HeroSection from '@/components/home/HeroSection';
import WelcomeSection from '@/components/home/WelcomeSection';
import QuickAccessSection from '@/components/home/QuickAccessSection';
import SupportSection from '@/components/home/SupportSection';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home | Helios Towers Supply Chain Handbook',
  description: 'Welcome to the Helios Towers Supply Chain Handbook. Your guide to procurement procedures, delivery timelines and supply chain processes.',
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <WelcomeSection />
      <QuickAccessSection />
      <SupportSection />
    </>
  );
}
