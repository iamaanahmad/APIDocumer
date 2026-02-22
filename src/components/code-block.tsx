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
        backgroundColor: 'hsl(var(--card))',
        margin: '0',
        padding: '1.25rem',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        lineHeight: '1.6',
    },
};

const lightCodeTheme = {
    ...vs,
    'pre[class*="language-"]': {
        ...vs['pre[class*="language-"]'],
        backgroundColor: 'hsl(var(--card))',
        margin: '0',
        padding: '1.25rem',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        lineHeight: '1.6',
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
      title: 'Copied!',
      description: 'The example has been copied to your clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('relative rounded-lg border group shadow-professional overflow-hidden', className)}>
      <SyntaxHighlighter 
        language={language} 
        style={isDark ? darkCodeTheme : lightCodeTheme}
        showLineNumbers={true}
        customStyle={{
          margin: 0,
          background: 'transparent',
        }}
        lineNumberStyle={{
          minWidth: '2.5em',
          paddingRight: '1em',
          color: 'hsl(var(--muted-foreground))',
          opacity: 0.5,
          userSelect: 'none',
        }}
      >
        {code}
      </SyntaxHighlighter>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-primary/20"
        onClick={handleCopy}
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Clipboard className="h-4 w-4" />
        )}
        <span className="sr-only">Copy to clipboard</span>
      </Button>
    </div>
  );
}
