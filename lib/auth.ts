import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
export async function requireUser(next='/dashboard') {
  const supabase=await createClient();
  if(!supabase) redirect('/?setup=supabase');
  const {data:{user},error}=await supabase.auth.getUser();
  if(error||!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return {supabase,user};
}
