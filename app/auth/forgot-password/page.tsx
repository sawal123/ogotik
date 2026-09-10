'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/auth/confirm?next=/auth/reset-password`,
    });
    setSent(true);
    setLoading(false);
    toast.success('If that email exists, a reset link is on its way.');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
      <p className="mt-1 text-sm text-muted-foreground">We&apos;ll email you a secure reset link.</p>
      {sent ? (
        <div className="mt-6 rounded-lg border bg-secondary/50 p-4 text-sm">
          Check your inbox for a link to reset your password.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send reset link
          </Button>
        </form>
      )}
      <p className="mt-5 text-center text-sm text-muted-foreground">
        <Link href="/auth/sign-in" className="font-medium text-primary hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}
