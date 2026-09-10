'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile } from '@/features/profile/actions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsForm({ displayName, email }: { displayName: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await updateProfile({ display_name: name });
    setLoading(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success('Profile updated');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border bg-card p-6">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} disabled className="bg-secondary/50" />
        <p className="text-xs text-muted-foreground">Your login email cannot be changed in Phase 1.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Display name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />} Save changes</Button>
      </div>
    </form>
  );
}
