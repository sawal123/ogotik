export type ShortLink = {
  id: string;
  user_id: string;
  short_code: string;
  title: string | null;
  destination_url: string;
  is_active: boolean;
  expires_at: string | null;
  total_clicks: number;
  created_at: string;
  updated_at: string;
};

export type ClickEvent = {
  id: number;
  short_link_id: string;
  clicked_at: string;
  referrer: string | null;
  country: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
};

export type SocialLink = {
  platform: string;
  url: string;
};

export type ThemeConfig = {
  bgColor: string;
  bgGradient: boolean;
  bgColor2?: string;
  buttonStyle: 'solid' | 'outline' | 'soft';
  buttonRadius: 'none' | 'md' | 'full';
  textColor: string;
  buttonColor: string;
  font: 'inter' | 'geist' | 'serif' | 'mono';
  align: 'center' | 'left';
};

export type BioPage = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  bio: string | null;
  avatar_url: string | null;
  theme_config: ThemeConfig;
  socials: SocialLink[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type BlockType = 'link' | 'heading' | 'text' | 'divider';

export type BioBlock = {
  id: string;
  bio_page_id: string;
  type: BlockType;
  position: number;
  short_link_id: string | null;
  data: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export const DEFAULT_THEME: ThemeConfig = {
  bgColor: '#F7F8FA',
  bgGradient: true,
  bgColor2: '#FFF3EB',
  buttonStyle: 'solid',
  buttonRadius: 'md',
  textColor: '#2F2E2E',
  buttonColor: '#EC5B00',
  font: 'inter',
  align: 'center',
};
