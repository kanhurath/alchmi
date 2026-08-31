import { useReveal } from '../hooks/useReveal';
import InnerPageHero from '../components/Sections/InnerPageHero';
import TeachingSection from '../components/Sections/TeachingSection';
import InnerPageCTA from '../components/Sections/InnerPageCTA';

function ThemesPage() {
  useReveal();

  return (
    <main>
      <InnerPageHero
        eyebrow="Teaching"
        title="Teaching &"
        titleEm="Pedagogy"
        subtitle="From certificate courses and faculty development to university curriculum design and corporate leadership retreats — built on immersive, experiential pedagogy with IKS at its core."
        breadcrumb="Teaching"
      />
      <TeachingSection />
      <InnerPageCTA />
    </main>
  );
}

export default ThemesPage;
