import PricingBackdrop from '../components/PricingBackdrop';
import StudentWelcome from './model-card';
import { getDashboardPlanName } from './preview-data.mjs';
import './model-card.css';
import './orby.css';
import './ai-classes.css';

export const metadata = { title: 'Your classroom — Flowcus' };

export default function Dashboard({ searchParams }) {
  return <main className="pricing-page model-header-page" aria-label="Student dashboard">
    <PricingBackdrop />
    <StudentWelcome planName={getDashboardPlanName(searchParams?.plan)} />
  </main>;
}
