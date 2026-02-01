import { AboutHero } from '../components/about/AboutHero';
import { AboutMission } from '../components/about/AboutMission';
import { AboutWhatWeDo } from '../components/about/AboutWhatWeDo';
import { AboutForPatients } from '../components/about/AboutForPatients';
import { AboutForClinics } from '../components/about/AboutForClinics';
import { AboutHowItWorks } from '../components/about/AboutHowItWorks';
import { AboutTrust } from '../components/about/AboutTrust';
import { AboutDemoForm } from '../components/about/AboutDemoForm';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-[hsl(220,12%,98%)]">
      <AboutHero />
      <AboutMission />
      <AboutWhatWeDo />
      <AboutForPatients />
      <AboutForClinics />
      <AboutHowItWorks />
      <AboutTrust />
      <AboutDemoForm />
    </div>
  );
}
