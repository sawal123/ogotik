import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/dashboard/settings-form';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user!.id).maybeSingle();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and profile.</p>
      </div>
      <SettingsForm displayName={profile?.display_name || ''} email={user?.email || ''} />
    </div>
  );
}
