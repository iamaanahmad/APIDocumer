import { cn } from '@/lib/utils';

const methodColors: Record<string, string> = {
  get: 'border-green-500/50 bg-green-500/10 text-green-500',
  post: 'border-blue-500/50 bg-blue-500/10 text-blue-500',
  put: 'border-orange-500/50 bg-orange-500/10 text-orange-500',
  delete: 'border-red-500/50 bg-red-500/10 text-red-500',
  patch: 'border-purple-500/50 bg-purple-500/10 text-purple-500',
  options: 'border-gray-500/50 bg-gray-500/10 text-gray-500',
  head: 'border-gray-500/50 bg-gray-500/10 text-gray-500',
};

export function MethodBadge({ method }: { method: string }) {
  const lowerMethod = method.toLowerCase();
  return (
    <div
      className={cn(
        'w-16 group-data-[state=collapsed]:w-7 h-7 uppercase font-bold text-xs rounded-md flex justify-center items-center transition-all border shrink-0',
        methodColors[lowerMethod] || 'border-gray-500/50 bg-gray-500/10 text-gray-500'
      )}
    >
      <span className="group-data-[state=collapsed]:hidden">{method}</span>
      <span className="hidden group-data-[state=collapsed]:block">{method.charAt(0)}</span>
    </div>
  );
}
