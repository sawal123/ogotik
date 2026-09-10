'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function CopyButton({
  value,
  className,
  size = 'icon',
  variant = 'outline',
  label,
}: {
  value: string;
  className?: string;
  size?: 'icon' | 'sm' | 'default';
  variant?: 'outline' | 'ghost' | 'default' | 'secondary';
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy');
    }
  }
  return (
    <Button type="button" onClick={copy} size={size} variant={variant} className={cn('gap-2', className)}>
      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
      {label && <span>{copied ? 'Copied' : label}</span>}
    </Button>
  );
}
