import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth()

  if (!session?.user) return redirect('/auth/signin')

  return redirect('/dashboard')
}
