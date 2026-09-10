import { Logo } from '@/components/brand/logo';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-[420px] w-[620px] rounded-full bg-brand-blue/10 blur-3xl" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <div className="mb-6">
          <Logo href="/" />
        </div>
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl shadow-black/[0.03] sm:p-8">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to the Go Tik Links{' '}
          <Link href="/" className="underline underline-offset-2">Terms</Link>.
        </p>
      </div>
    </div>
  );
}
