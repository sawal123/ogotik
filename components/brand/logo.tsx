import Link from 'next/link';
import { Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({
  className,
  href = '/',
  showText = true,
}: {
  className?: string;
  href?: string | null;
  showText?: boolean;
}) {
  const inner = (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
        <Link2 className="h-5 w-5" />
      </span>
      {showText && (
        <span className="text-[17px] font-bold tracking-tight text-foreground">
          Go Tik <span className="text-primary">Links</span>
        </span>
      )}
    </span>
  );
  if (href === null) return inner;
  return <Link href={href}>{inner}</Link>;
}
