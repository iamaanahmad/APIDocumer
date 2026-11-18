import { cn } from '@/lib/utils';

const methodColors: Record<string, string> = {
  get: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  post: 'border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  put: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  delete: 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400',
  patch: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  options: 'border-slate-500/40 bg-slate-500/10 text-slate-600 dark:text-slate-400',
  head: 'border-slate-500/40 bg-slate-500/10 text-slate-600 dark:text-slate-400',
};

export function MethodBadge({ method, size = 'md', className }: { method: string; size?: 'sm' | 'md'; className?: string }) {
  const lowerMethod = method.toLowerCase();

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md border font-bold uppercase tracking-wide',
        size === 'sm' ? 'h-5 min-w-[2.75rem] px-1 text-[9px]' : 'h-6 min-w-[3.5rem] px-1.5 text-[10px]',
        methodColors[lowerMethod] || 'border-slate-500/40 bg-slate-500/10 text-slate-600 dark:text-slate-400',
        className
      )}
    >
      {method}
    </span>
  );
}
