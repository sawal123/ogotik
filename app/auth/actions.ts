'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

type ActionResult = { ok?: true; error?: string };

// Sign-up via the admin API with email_confirm=true so users can log in
// immediately (email confirmation disabled for Phase 1, per configuration).
export async function adminSignUp(
  email: string,
  password: string,
  displayName: string,
): Promise<ActionResult> {
  const clean = (email || '').trim().toLowerCase();
  if (!clean || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
    return { error: 'Please enter a valid email address' };
  }
  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email: clean,
    password,
    email_confirm: true,
    user_metadata: { display_name: (displayName || '').trim() },
  });

  if (error) {
    if (/already/i.test(error.message)) {
      return { error: 'An account with this email already exists' };
    }
    return { error: error.message };
  }
  return { ok: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/sign-in');
}
