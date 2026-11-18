"use client";

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Clipboard, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

const codeFont = 'JetBrains Mono, Fira Code, ui-monospace, SFMono-Regular, Menlo, monospace';

function buildTheme(base: typeof vscDarkPlus) {
  return {
    ...base,
    'pre[class*="language-"]': {
      ...base['pre[class*="language-"]'],
      backgroundColor: 'transparent',
      margin: '0',
      padding: '1rem',
      borderRadius: '0',
      fontSize: '0.8125rem',
      lineHeight: '1.65',
      fontFamily: codeFont,
    },
    'code[class*="language-"]': {
      ...base['code[class*="language-"]'],
      fontFamily: codeFont,
    },
  };
}

const darkCodeTheme = buildTheme(vscDarkPlus);
const lightCodeTheme = buildTheme(vs);

interface CodeBlockProps {
  code: string;
  className?: string;
  language?: string;
  /** `panel` always renders dark (Stripe/ReadMe style) and hides line numbers. */
  variant?: 'default' | 'panel';
  /** Hides the header bar. Use when the parent already shows a title. */
  hideHeader?: boolean;
  maxHeightClass?: string;
}

export function CodeBlock({ code, className, language = 'json', variant = 'default', hideHeader = false, maxHeightClass }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const isPanel = variant === 'panel';

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const useDarkTheme = isPanel || isDark;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border',
        isPanel ? 'border-white/10 bg-[#0b1020] text-slate-200' : 'border-border/70 bg-card/80',
        className
      )}
    >
      {hideHeader ? (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute right-2 top-2 z-10 h-7 w-7 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100',
            isPanel && 'text-slate-300 hover:bg-white/10 hover:text-white'
          )}
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Clipboard className="h-4 w-4" />}
          <span className="sr-only">Copy to clipboard</span>
        </Button>
      ) : (
        <div className={cn('flex items-center justify-between border-b px-3 py-1.5', isPanel ? 'border-white/10 bg-white/[0.03]' : 'bg-secondary/40')}>
          <span className={cn('font-code text-[11px] uppercase tracking-[0.14em]', isPanel ? 'text-slate-400' : 'text-muted-foreground')}>{language}</span>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7', isPanel ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'hover:bg-primary/15')}
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Clipboard className="h-4 w-4" />}
            <span className="sr-only">Copy to clipboard</span>
          </Button>
        </div>
      )}

      <div className={cn('overflow-auto', maxHeightClass ?? 'max-h-[60vh]')}>
        <SyntaxHighlighter
          language={language}
          style={useDarkTheme ? darkCodeTheme : lightCodeTheme}
          showLineNumbers={!isPanel}
          customStyle={{ margin: 0, background: 'transparent' }}
          lineNumberStyle={{
            minWidth: '2.25em',
            paddingRight: '1em',
            color: 'hsl(var(--muted-foreground))',
            opacity: 0.45,
            userSelect: 'none',
          }}
          wrapLongLines
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
