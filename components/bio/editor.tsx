'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { BioPreview, type PreviewBlock, SOCIAL_PLATFORMS } from '@/components/bio/preview';
import { CopyButton } from '@/components/ui/copy-button';
import {
  updateBioMeta, addBlock, addLinkBlock, updateBlock, deleteBlock, reorderBlocks,
  checkSlug, uploadBioAvatar,
} from '@/features/bio/actions';
import { bioUrlFor, bioHref } from '@/lib/domains';
import type { ThemeConfig, SocialLink } from '@/types/db';
import {
  ChevronLeft, GripVertical, Trash2, Loader2, Plus, Link2, Heading, Type, Minus,
  ExternalLink, Check, X, Upload, Save, Smartphone, PenLine,
} from 'lucide-react';
import { toast } from 'sonner';

type PageMeta = {
  id: string; title: string; bio: string | null; slug: string; avatar_url: string | null;
  theme_config: ThemeConfig; socials: SocialLink[]; is_published: boolean;
};

const FONT_OPTIONS = [
  { v: 'inter', l: 'Inter' }, { v: 'geist', l: 'Geist' },
  { v: 'serif', l: 'Serif' }, { v: 'mono', l: 'Mono' },
];

function SortableBlock({
  block, onChange, onDelete, onToggle,
}: {
  block: PreviewBlock;
  onChange: (data: Record<string, unknown>) => void;
  onDelete: () => void;
  onToggle: (v: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const d = block.data;

  return (
    <div ref={setNodeRef} style={style} className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <button className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="flex items-center gap-1.5 text-xs font-medium capitalize text-muted-foreground">
          {block.type === 'link' && <Link2 className="h-3.5 w-3.5" />}
          {block.type === 'heading' && <Heading className="h-3.5 w-3.5" />}
          {block.type === 'text' && <Type className="h-3.5 w-3.5" />}
          {block.type === 'divider' && <Minus className="h-3.5 w-3.5" />}
          {block.type}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Switch checked={block.is_active} onCheckedChange={onToggle} />
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="space-y-2 p-3">
        {block.type === 'link' && (
          <>
            <Input defaultValue={String(d.label || '')} placeholder="Button label" onBlur={(e) => onChange({ ...d, label: e.target.value })} />
            <Input defaultValue={String(d.destination || '')} placeholder="https://..." onBlur={(e) => onChange({ ...d, destination: e.target.value })} />
            <div className="flex items-center gap-2">
              <Select value={String(d.style || 'solid')} onValueChange={(v) => onChange({ ...d, style: v })}>
                <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="soft">Soft</SelectItem>
                </SelectContent>
              </Select>
              {d.shortCode ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">o.go-tik.com/{String(d.shortCode)}<CopyButton value={bioHrefForCode(String(d.shortCode))} size="icon" variant="ghost" className="h-6 w-6" /></span>
              ) : null}
            </div>
          </>
        )}
        {block.type === 'heading' && (
          <Input defaultValue={String(d.text || '')} placeholder="Heading text" onBlur={(e) => onChange({ ...d, text: e.target.value })} />
        )}
        {block.type === 'text' && (
          <Textarea defaultValue={String(d.text || '')} placeholder="Your text" onBlur={(e) => onChange({ ...d, text: e.target.value })} />
        )}
        {block.type === 'divider' && <p className="text-xs text-muted-foreground">A horizontal divider.</p>}
      </div>
    </div>
  );
}

function bioHrefForCode(code: string) {
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${code}`;
}

export function BioEditor({ page, initialBlocks }: { page: PageMeta; initialBlocks: PreviewBlock[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [bio, setBio] = useState(page.bio || '');
  const [slug, setSlug] = useState(page.slug);
  const [avatarUrl, setAvatarUrl] = useState(page.avatar_url);
  const [theme, setTheme] = useState<ThemeConfig>(page.theme_config);
  const [socials, setSocials] = useState<SocialLink[]>(page.socials);
  const [published, setPublished] = useState(page.is_published);
  const [blocks, setBlocks] = useState<PreviewBlock[]>(initialBlocks);
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'bad'>('idle');
  const [slugMsg, setSlugMsg] = useState('');
  const [saving, startSaving] = useTransition();
  const [linkDialog, setLinkDialog] = useState(false);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkDest, setLinkDest] = useState('');
  const [addingLink, setAddingLink] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Live slug availability
  useEffect(() => {
    if (slug === page.slug) { setSlugStatus('idle'); return; }
    setSlugStatus('checking');
    const t = setTimeout(async () => {
      const res = await checkSlug(slug, page.id);
      setSlugStatus(res.available ? 'ok' : 'bad');
      setSlugMsg(res.reason || '');
    }, 450);
    return () => clearTimeout(t);
  }, [slug, page.slug, page.id]);

  function saveMeta() {
    startSaving(async () => {
      const res = await updateBioMeta(page.id, {
        title, bio, slug, avatar_url: avatarUrl, theme_config: theme, socials,
      });
      if (res.error) { toast.error(res.error); return; }
      toast.success('Saved');
      router.refresh();
    });
  }

  async function togglePublish(v: boolean) {
    setPublished(v);
    const res = await updateBioMeta(page.id, { is_published: v });
    if (res.error) { toast.error(res.error); setPublished(!v); return; }
    toast.success(v ? 'Page published \u2014 it is now live!' : 'Page unpublished');
    router.refresh();
  }

  async function onAddBlock(type: 'heading' | 'text' | 'divider') {
    const res = await addBlock(page.id, type);
    if (res.error || !res.block) { toast.error(res.error || 'Failed'); return; }
    setBlocks((b) => [...b, res.block as PreviewBlock]);
  }

  async function onAddLink() {
    if (!linkLabel.trim() || !linkDest.trim()) { toast.error('Label and URL required'); return; }
    setAddingLink(true);
    const res = await addLinkBlock(page.id, { label: linkLabel, destination: linkDest });
    setAddingLink(false);
    if (res.error || !res.block) { toast.error(res.error || 'Failed'); return; }
    setBlocks((b) => [...b, res.block as PreviewBlock]);
    setLinkDialog(false); setLinkLabel(''); setLinkDest('');
    toast.success('Link block added');
  }

  function onChangeBlock(id: string, data: Record<string, unknown>) {
    setBlocks((b) => b.map((x) => (x.id === id ? { ...x, data } : x)));
    updateBlock(id, { data }).then((r) => { if (r.error) toast.error(r.error); });
  }
  function onToggleBlock(id: string, v: boolean) {
    setBlocks((b) => b.map((x) => (x.id === id ? { ...x, is_active: v } : x)));
    updateBlock(id, { is_active: v });
  }
  function onDeleteBlock(id: string) {
    setBlocks((b) => b.filter((x) => x.id !== id));
    deleteBlock(id).then((r) => { if (r.error) toast.error(r.error); });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    const next = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(next);
    reorderBlocks(page.id, next.map((b) => b.id)).then((r) => { if (r.error) toast.error(r.error); });
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadBioAvatar(page.id, fd);
    setUploading(false);
    if (res.error || !res.url) { toast.error(res.error || 'Upload failed'); return; }
    setAvatarUrl(res.url);
    toast.success('Avatar updated');
  }

  const preview = (
    <div className="mx-auto w-full max-w-[340px]">
      <div className="overflow-hidden rounded-[2.2rem] border-[10px] border-brand-dark/90 shadow-2xl">
        <div className="h-[620px] overflow-y-auto no-scrollbar bg-white">
          <BioPreview title={title || 'Your title'} bio={bio} avatarUrl={avatarUrl} theme={theme} socials={socials} blocks={blocks} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/pages" className="text-muted-foreground hover:text-foreground"><ChevronLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{title || 'Untitled page'}</h1>
            <a href={bioHref(slug)} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">{bioUrlFor(slug)}</a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5">
            <span className="text-xs font-medium">{published ? 'Published' : 'Draft'}</span>
            <Switch checked={published} onCheckedChange={togglePublish} />
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5"><a href={bioHref(slug)} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> View</a></Button>
          <Button size="sm" className="gap-1.5" onClick={saveMeta} disabled={saving || slugStatus === 'bad'}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </Button>
        </div>
      </div>

      {/* Mobile toggle */}
      <div className="flex gap-2 lg:hidden">
        <Button variant={mobileView === 'edit' ? 'default' : 'outline'} size="sm" className="flex-1 gap-1.5" onClick={() => setMobileView('edit')}><PenLine className="h-4 w-4" /> Edit</Button>
        <Button variant={mobileView === 'preview' ? 'default' : 'outline'} size="sm" className="flex-1 gap-1.5" onClick={() => setMobileView('preview')}><Smartphone className="h-4 w-4" /> Preview</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Editor panel */}
        <div className={mobileView === 'preview' ? 'hidden lg:block' : ''}>
          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="appearance">Style</TabsTrigger>
              <TabsTrigger value="blocks">Blocks</TabsTrigger>
              <TabsTrigger value="socials">Socials</TabsTrigger>
            </TabsList>

            {/* Profile */}
            <TabsContent value="profile" className="mt-4 space-y-4 rounded-xl border bg-card p-5">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary">
                  {avatarUrl ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" /> : <span className="text-lg font-bold">{(title || 'GT').slice(0, 2).toUpperCase()}</span>}
                </div>
                <div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload avatar
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WEBP up to 5MB</p>
                </div>
              </div>
              <div className="space-y-2"><Label>Page title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div className="space-y-2"><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell visitors who you are" /></div>
              <div className="space-y-2">
                <Label>Public link</Label>
                <div className="flex items-center rounded-md border focus-within:ring-2 focus-within:ring-ring">
                  <span className="select-none px-3 text-sm text-muted-foreground">bio.go-tik.com/</span>
                  <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} className="h-10 flex-1 bg-transparent px-1 text-sm outline-none" />
                  <span className="px-3">
                    {slugStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    {slugStatus === 'ok' && <Check className="h-4 w-4 text-green-600" />}
                    {slugStatus === 'bad' && <X className="h-4 w-4 text-destructive" />}
                  </span>
                </div>
                {slugStatus === 'bad' && <p className="text-xs text-destructive">{slugMsg}</p>}
              </div>
            </TabsContent>

            {/* Appearance */}
            <TabsContent value="appearance" className="mt-4 space-y-4 rounded-xl border bg-card p-5">
              <ColorRow label="Background" value={theme.bgColor} onChange={(v) => setTheme({ ...theme, bgColor: v })} />
              <div className="flex items-center justify-between">
                <Label>Gradient background</Label>
                <Switch checked={theme.bgGradient} onCheckedChange={(v) => setTheme({ ...theme, bgGradient: v })} />
              </div>
              {theme.bgGradient && <ColorRow label="Gradient end" value={theme.bgColor2 || '#ffffff'} onChange={(v) => setTheme({ ...theme, bgColor2: v })} />}
              <Separator />
              <ColorRow label="Button color" value={theme.buttonColor} onChange={(v) => setTheme({ ...theme, buttonColor: v })} />
              <ColorRow label="Text color" value={theme.textColor} onChange={(v) => setTheme({ ...theme, textColor: v })} />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Button style</Label>
                  <Select value={theme.buttonStyle} onValueChange={(v) => setTheme({ ...theme, buttonStyle: v as ThemeConfig['buttonStyle'] })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="solid">Solid</SelectItem><SelectItem value="outline">Outline</SelectItem><SelectItem value="soft">Soft</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Corner radius</Label>
                  <Select value={theme.buttonRadius} onValueChange={(v) => setTheme({ ...theme, buttonRadius: v as ThemeConfig['buttonRadius'] })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="none">Sharp</SelectItem><SelectItem value="md">Rounded</SelectItem><SelectItem value="full">Pill</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Font</Label>
                  <Select value={theme.font} onValueChange={(v) => setTheme({ ...theme, font: v as ThemeConfig['font'] })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{FONT_OPTIONS.map((f) => <SelectItem key={f.v} value={f.v}>{f.l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Alignment</Label>
                  <Select value={theme.align} onValueChange={(v) => setTheme({ ...theme, align: v as ThemeConfig['align'] })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="center">Center</SelectItem><SelectItem value="left">Left</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Remember to press Save to keep appearance changes.</p>
            </TabsContent>

            {/* Blocks */}
            <TabsContent value="blocks" className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Dialog open={linkDialog} onOpenChange={setLinkDialog}>
                  <DialogTrigger asChild><Button size="sm" className="gap-1.5"><Link2 className="h-4 w-4" /> Link</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add link block</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1.5"><Label>Button label</Label><Input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Buy Tickets" /></div>
                      <div className="space-y-1.5"><Label>Destination URL</Label><Input value={linkDest} onChange={(e) => setLinkDest(e.target.value)} placeholder="https://go-tik.com/event/example" /></div>
                      <p className="text-xs text-muted-foreground">A trackable short link is created automatically for this button.</p>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setLinkDialog(false)}>Cancel</Button>
                      <Button onClick={onAddLink} disabled={addingLink} className="gap-1.5">{addingLink && <Loader2 className="h-4 w-4 animate-spin" />} Add</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onAddBlock('heading')}><Heading className="h-4 w-4" /> Heading</Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onAddBlock('text')}><Type className="h-4 w-4" /> Text</Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onAddBlock('divider')}><Minus className="h-4 w-4" /> Divider</Button>
              </div>

              {blocks.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">No blocks yet. Add a link to get started.</div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {blocks.map((b) => (
                        <SortableBlock key={b.id} block={b}
                          onChange={(data) => onChangeBlock(b.id, data)}
                          onDelete={() => onDeleteBlock(b.id)}
                          onToggle={(v) => onToggleBlock(b.id, v)} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </TabsContent>

            {/* Socials */}
            <TabsContent value="socials" className="mt-4 space-y-3 rounded-xl border bg-card p-5">
              {socials.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select value={s.platform} onValueChange={(v) => setSocials(socials.map((x, j) => j === i ? { ...x, platform: v } : x))}>
                    <SelectTrigger className="h-9 w-32 capitalize"><SelectValue /></SelectTrigger>
                    <SelectContent>{SOCIAL_PLATFORMS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input value={s.url} placeholder="https://..." onChange={(e) => setSocials(socials.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} />
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setSocials(socials.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSocials([...socials, { platform: 'instagram', url: '' }])}><Plus className="h-4 w-4" /> Add social</Button>
              <p className="text-xs text-muted-foreground">Press Save to keep social changes.</p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        <div className={`lg:sticky lg:top-20 lg:self-start ${mobileView === 'edit' ? 'hidden lg:block' : ''}`}>
          {preview}
        </div>
      </div>
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-28" />
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-10 cursor-pointer rounded border" />
      </div>
    </div>
  );
}
