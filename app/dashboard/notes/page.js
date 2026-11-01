import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authCookie, getAccount } from '../../../lib/auth-proxy.mjs';
import NotesReader from './notes-reader';
import './notes.css';

export const metadata = { title: 'Your notes — Beyond Marks' };

export default async function NotesPage() {
  const account = await getAccount((await cookies()).get(authCookie)?.value);
  if (!account) redirect('/?signin=1');
  return <NotesReader />;
}
