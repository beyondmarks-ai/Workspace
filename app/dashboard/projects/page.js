import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authCookie, getAccount } from '../../../lib/auth-proxy.mjs';
import ProjectStudio from './project-studio';
import './projects.css';

export const metadata = { title: 'Project studio — Beyond Marks' };

export default async function ProjectsPage() {
  const account = await getAccount((await cookies()).get(authCookie)?.value);
  if (!account) redirect('/?signin=1');
  return <ProjectStudio />;
}
