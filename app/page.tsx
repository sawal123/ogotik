import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Link2, BarChart3, LayoutTemplate, Zap, ShieldCheck, MousePointerClick,
  ArrowRight, Check, Instagram, Globe, Play,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo href="/" />
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">Features</a>
            <a href="#links" className="text-sm font-medium text-muted-foreground hover:text-foreground">Short Links</a>
            <a href="#bio" className="text-sm font-medium text-muted-foreground hover:text-foreground">Bio Pages</a>
            <a href="#analytics" className="text-sm font-medium text-muted-foreground hover:text-foreground">Analytics</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link href="/auth/sign-in">Sign in</Link></Button>
            <Button asChild size="sm"><Link href="/auth/sign-up">Mulai Gratis</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-40 h-[360px] w-[520px] rounded-full bg-brand-blue/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col justify-center">
            <Badge variant="secondary" className="mb-5 w-fit gap-1.5 rounded-full px-3 py-1 text-xs">
              <Zap className="h-3.5 w-3.5 text-primary" /> One place for every link
            </Badge>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Shorten. <span className="brand-gradient-text">Share.</span> Grow.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Go Tik Links lets you shorten URLs, build a beautiful bio page, and track every click — all from one clean dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/auth/sign-up">Mulai Gratis <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <a href="#how"><Play className="h-4 w-4" /> Lihat Cara Kerja</a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> No credit card</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Real-time analytics</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Custom aliases</span>
            </div>
          </div>

          {/* Product mockup */}
          <div className="relative flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-2xl shadow-black/[0.06]">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold">Your links</span>
                <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">+2 today</span>
              </div>
              <div className="space-y-3">
                {[
                  { t: 'Buy Tickets', u: 'o.go-tik.com/konser', c: '1,284' },
                  { t: 'Instagram', u: 'o.go-tik.com/ig', c: '842' },
                  { t: 'Website', u: 'o.go-tik.com/gotik2026', c: '531' },
                ].map((r) => (
                  <div key={r.u} className="flex items-center gap-3 rounded-xl border bg-background p-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Link2 className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{r.t}</div>
                      <div className="truncate text-xs text-primary">{r.u}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{r.c}</div>
                      <div className="text-[10px] text-muted-foreground">clicks</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-gradient-to-br from-primary/5 to-brand-blue/5 p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Clicks this week</span><span className="font-semibold text-foreground">2,657</span></div>
                <div className="mt-3 flex h-16 items-end gap-1.5">
                  {[30, 45, 38, 62, 55, 80, 70].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-primary/70" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need to share smarter</h2>
          <p className="mt-3 text-muted-foreground">Powerful link management and a stunning bio page, backed by one consistent analytics engine.</p>
        </div>
        <div id="how" className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Link2, title: 'Smart short links', desc: 'Custom aliases, expiration dates, and instant 302 redirects that stay editable.' },
            { icon: LayoutTemplate, title: 'Bio pages', desc: 'A drag-and-drop link-in-bio builder with live mobile preview and themes.' },
            { icon: BarChart3, title: 'Real analytics', desc: 'Clicks over time, referrers, devices and browsers — no fake numbers.' },
            { icon: MousePointerClick, title: 'One click engine', desc: 'Every bio button is powered by the same trackable short link engine.' },
            { icon: ShieldCheck, title: 'Secure by default', desc: 'Row-level security, validated destinations, and safe uploads.' },
            { icon: Zap, title: 'Fast & lightweight', desc: 'Server-rendered pages and a redirect path optimized for speed.' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><f.icon className="h-5 w-5" /></span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Short link + Bio examples */}
      <section id="links" className="bg-secondary/40 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge variant="secondary" className="mb-3 rounded-full">Short Links</Badge>
            <h2 className="text-3xl font-bold tracking-tight">Links that are short, branded and trackable</h2>
            <p className="mt-3 text-muted-foreground">Turn long, messy URLs into clean links like <span className="font-medium text-primary">o.go-tik.com/konser</span>. Edit the destination anytime — the link never changes.</p>
            <ul className="mt-6 space-y-3">
              {['Custom aliases & auto-generated codes', 'Enable, disable, or expire links', 'Copy & share in one click'].map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" /> {t}</li>
              ))}
            </ul>
          </div>
          <div id="bio" className="mx-auto w-full max-w-[300px]">
            {/* Bio page phone mockup */}
            <div className="rounded-[2rem] border-8 border-brand-dark/90 bg-background p-4 shadow-2xl">
              <div className="rounded-2xl bg-gradient-to-b from-[#FFF3EB] to-white p-5 text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/20" />
                <div className="mt-3 font-bold">Go Tik</div>
                <div className="text-xs text-muted-foreground">Platform ticketing & event Indonesia</div>
                <div className="mt-4 space-y-2.5">
                  {['Lihat Event', 'Instagram', 'Website', 'Hubungi Kami'].map((b, i) => (
                    <div key={b} className={`rounded-xl py-2.5 text-sm font-medium ${i === 0 ? 'bg-primary text-primary-foreground' : 'border bg-white'}`}>{b}</div>
                  ))}
                </div>
                <div className="mt-4 flex justify-center gap-3 text-muted-foreground">
                  <Instagram className="h-4 w-4" /><Globe className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics */}
      <section id="analytics" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border bg-gradient-to-br from-card to-secondary/30 p-8 sm:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-3 rounded-full">Analytics</Badge>
            <h2 className="text-3xl font-bold tracking-tight">Know what&apos;s working</h2>
            <p className="mt-3 text-muted-foreground">Track clicks over time, top referrers, devices and browsers for every link — plus page views and CTR for your bio pages.</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[{ k: 'Clicks over time', v: 'Daily trends' }, { k: 'Top referrers', v: 'Where traffic comes from' }, { k: 'Devices & browsers', v: 'Who is clicking' }].map((s) => (
              <div key={s.k} className="rounded-xl border bg-card p-5 text-center">
                <div className="text-sm font-semibold">{s.k}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-brand-dark px-6 py-14 text-center text-white sm:px-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
          <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">Ready to grow your links?</h2>
          <p className="relative mx-auto mt-3 max-w-md text-white/70">Create your first short link and bio page in under a minute.</p>
          <div className="relative mt-8">
            <Button asChild size="lg" className="gap-2"><Link href="/auth/sign-up">Mulai Gratis <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Logo href="/" />
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Go Tik Links. Shorten. Share. Grow.</p>
        </div>
      </footer>
    </div>
  );
}
