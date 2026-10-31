import PricingBackdrop from '../components/PricingBackdrop';
import StudentWelcome from './model-card';
import { getDashboardPlanName, plans } from './preview-data.mjs';
import './model-card.css';
import './orby.css';
import './ai-classes.css';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authCookie, getAccount } from '../../lib/auth-proxy.mjs';

export const metadata = { title: 'Your classroom — Flowcus' };

export default async function Dashboard({ searchParams }) {
  const account = await getAccount(cookies().get(authCookie)?.value);
  if (!account) redirect('/?signin=1');
  return <main className="pricing-page model-header-page" aria-label="Student dashboard">
    <PricingBackdrop />
    <StudentWelcome account={account} planName={getDashboardPlanName(searchParams?.plan)} hasCourse={typeof searchParams?.plan === 'string' && Object.hasOwn(plans, searchParams.plan)} />
  </main>;
}
