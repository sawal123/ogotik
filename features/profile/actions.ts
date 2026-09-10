'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function updateProfile(input: { display_name: string }): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in' };
  const { error } = await supabase.from('profiles').update({ display_name: input.display_name.trim() }).eq('id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard');
  return { ok: true };
}
