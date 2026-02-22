"use client";

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Clipboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const codeTheme = {
    ...vscDarkPlus,
    'pre[class*="language-"]': {
        ...vscDarkPlus['pre[class*="language-"]'],
        backgroundColor: 'hsl(var(--card))',
        margin: '0',
        padding: '1rem',
    },
};

export function CodeBlock({ code, className, language = 'json' }: { code: string; className?: string; language?: string }) {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: 'The example has been copied to your clipboard.',
    });
  };

  return (
    <div className={cn('relative rounded-lg border group', className)}>
      <SyntaxHighlighter language={language} style={codeTheme} >
        {code}
      </SyntaxHighlighter>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        <Clipboard className="h-4 w-4" />
        <span className="sr-only">Copy to clipboard</span>
      </Button>
    </div>
  );
}
