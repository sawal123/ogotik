import {
  Instagram, Youtube, Facebook, Twitter, Linkedin, Globe, Mail,
  MessageCircle, Music2, type LucideIcon,
} from 'lucide-react';
import { shortHref } from '@/lib/domains';
import type { ThemeConfig, SocialLink, BlockType } from '@/types/db';

export type PreviewBlock = {
  id: string;
  type: BlockType;
  is_active: boolean;
  data: Record<string, unknown>;
};

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  instagram: Instagram, tiktok: Music2, youtube: Youtube, facebook: Facebook,
  x: Twitter, twitter: Twitter, linkedin: Linkedin, whatsapp: MessageCircle,
  website: Globe, email: Mail,
};

const FONTS: Record<string, string> = {
  inter: "'Inter', sans-serif",
  geist: "'Inter', system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, 'SFMono-Regular', Menlo, monospace",
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

function radiusClass(r: ThemeConfig['buttonRadius']) {
  return r === 'none' ? '4px' : r === 'full' ? '999px' : '14px';
}

function buttonStyle(theme: ThemeConfig, style: string): React.CSSProperties {
  const radius = radiusClass(theme.buttonRadius);
  if (style === 'outline') {
    return { border: `2px solid ${theme.buttonColor}`, color: theme.buttonColor, background: 'transparent', borderRadius: radius };
  }
  if (style === 'soft') {
    return { background: hexToRgba(theme.buttonColor, 0.14), color: theme.buttonColor, borderRadius: radius };
  }
  return { background: theme.buttonColor, color: '#fff', borderRadius: radius };
}

export function BioPreview({
  title, bio, avatarUrl, theme, socials, blocks, interactive = false,
}: {
  title: string;
  bio: string | null;
  avatarUrl: string | null;
  theme: ThemeConfig;
  socials: SocialLink[];
  blocks: PreviewBlock[];
  interactive?: boolean;
}) {
  const bg = theme.bgGradient
    ? `linear-gradient(160deg, ${theme.bgColor} 0%, ${theme.bgColor2 || theme.bgColor} 100%)`
    : theme.bgColor;
  const align = theme.align === 'left' ? 'text-left items-start' : 'text-center items-center';
  const initials = (title || 'GT').slice(0, 2).toUpperCase();

  return (
    <div
      className="min-h-full w-full px-5 py-8"
      style={{ background: bg, color: theme.textColor, fontFamily: FONTS[theme.font] || FONTS.inter }}
    >
      <div className={`mx-auto flex w-full max-w-md flex-col ${align}`}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={title} className="h-20 w-20 rounded-full object-cover shadow-md" />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-full text-xl font-bold shadow-md" style={{ background: hexToRgba(theme.buttonColor, 0.18), color: theme.buttonColor }}>{initials}</div>
        )}
        <h1 className="mt-4 text-xl font-bold">{title}</h1>
        {bio && <p className="mt-1.5 text-sm opacity-80">{bio}</p>}

        <div className="mt-6 w-full space-y-3">
          {blocks.filter((b) => b.is_active).map((b) => {
            if (b.type === 'divider') return <hr key={b.id} className="my-2 border-t" style={{ borderColor: hexToRgba(theme.textColor, 0.15) }} />;
            if (b.type === 'heading') return <h2 key={b.id} className="pt-2 text-base font-bold">{String(b.data.text || '')}</h2>;
            if (b.type === 'text') return <p key={b.id} className="text-sm opacity-80">{String(b.data.text || '')}</p>;
            // link
            const label = String(b.data.label || 'Link');
            const style = String(b.data.style || 'solid');
            const code = String(b.data.shortCode || '');
            const href = code ? shortHref(code) : '#';
            const cls = 'block w-full px-5 py-3.5 text-center text-sm font-semibold transition-transform hover:scale-[1.02]';
            if (interactive && code) {
              return <a key={b.id} href={href} target="_blank" rel="noreferrer" className={cls} style={buttonStyle(theme, style)}>{label}</a>;
            }
            return <div key={b.id} className={cls} style={buttonStyle(theme, style)}>{label}</div>;
          })}
        </div>

        {socials.filter((s) => s.url && s.platform).length > 0 && (
          <div className="mt-7 flex flex-wrap justify-center gap-4">
            {socials.filter((s) => s.url && s.platform).map((s, i) => {
              const Icon = SOCIAL_ICONS[s.platform.toLowerCase()] || Globe;
              const inner = <Icon className="h-5 w-5" />;
              return interactive ? (
                <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{ color: theme.textColor }} className="opacity-70 transition-opacity hover:opacity-100">{inner}</a>
              ) : (
                <span key={i} style={{ color: theme.textColor }} className="opacity-70">{inner}</span>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-[11px] opacity-40">Powered by Go Tik Links</div>
      </div>
    </div>
  );
}

export const SOCIAL_PLATFORMS = [
  'instagram', 'tiktok', 'youtube', 'facebook', 'x', 'linkedin', 'whatsapp', 'website', 'email',
] as const;
