import { cn } from '@/lib/utils';

const methodColors: Record<string, string> = {
  get: 'border-emerald-500/40 bg-emerald-500/12 text-emerald-400',
  post: 'border-sky-500/40 bg-sky-500/12 text-sky-400',
  put: 'border-amber-500/40 bg-amber-500/12 text-amber-400',
  delete: 'border-rose-500/40 bg-rose-500/12 text-rose-400',
  patch: 'border-indigo-500/40 bg-indigo-500/12 text-indigo-400',
  options: 'border-slate-500/40 bg-slate-500/12 text-slate-400',
  head: 'border-slate-500/40 bg-slate-500/12 text-slate-400',
};

export function MethodBadge({ method }: { method: string }) {
  const lowerMethod = method.toLowerCase();

  return (
    <div
      className={cn(
        'h-6 w-14 shrink-0 rounded-md border text-[10px] font-bold uppercase tracking-wide',
        'flex items-center justify-center transition-colors',
        'group-data-[state=collapsed]:h-5 group-data-[state=collapsed]:w-6',
        methodColors[lowerMethod] || 'border-slate-500/40 bg-slate-500/12 text-slate-400'
      )}
    >
      <span className="group-data-[state=collapsed]:hidden">{method}</span>
      <span className="hidden group-data-[state=collapsed]:block">{method.charAt(0)}</span>
    </div>
  );
}
