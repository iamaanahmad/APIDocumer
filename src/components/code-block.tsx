"use client";

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Clipboard, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

const darkCodeTheme = {
  ...vscDarkPlus,
  'pre[class*="language-"]': {
    ...vscDarkPlus['pre[class*="language-"]'],
    backgroundColor: 'transparent',
    margin: '0',
    padding: '1rem',
    borderRadius: '0',
    fontSize: '0.8125rem',
    lineHeight: '1.65',
    fontFamily: 'JetBrains Mono, Fira Code, ui-monospace, SFMono-Regular, Menlo, monospace',
  },
};

const lightCodeTheme = {
  ...vs,
  'pre[class*="language-"]': {
    ...vs['pre[class*="language-"]'],
    backgroundColor: 'transparent',
    margin: '0',
    padding: '1rem',
    borderRadius: '0',
    fontSize: '0.8125rem',
    lineHeight: '1.65',
    fontFamily: 'JetBrains Mono, Fira Code, ui-monospace, SFMono-Regular, Menlo, monospace',
  },
};

export function CodeBlock({ code, className, language = 'json' }: { code: string; className?: string; language?: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: 'Copied',
      description: 'Code snippet copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={cn('group overflow-hidden rounded-xl border border-border/70 bg-card/80 shadow-sm', className)}>
      <div className="flex items-center justify-between border-b bg-secondary/40 px-3 py-2">
        <span className="font-code text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{language}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-90 transition-opacity hover:bg-primary/15 hover:opacity-100"
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Clipboard className="h-4 w-4" />}
          <span className="sr-only">Copy to clipboard</span>
        </Button>
      </div>

      <div className="max-h-[28rem] overflow-auto">
        <SyntaxHighlighter
          language={language}
          style={isDark ? darkCodeTheme : lightCodeTheme}
          showLineNumbers
          customStyle={{ margin: 0, background: 'transparent' }}
          lineNumberStyle={{
            minWidth: '2.25em',
            paddingRight: '1em',
            color: 'hsl(var(--muted-foreground))',
            opacity: 0.45,
            userSelect: 'none',
          }}
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
