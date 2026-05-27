"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Bot, Copy, FileText, ExternalLink, Sparkles } from "lucide-react";
import type { OpenAPISpec } from "@/types/openapi";
import { useToast } from "@/hooks/use-toast";
import { generateMarkdown } from "@/lib/export-markdown";

export function AskAIButton({ spec }: { spec: OpenAPISpec | null }) {
  const { toast } = useToast();
  const [markdownOpen, setMarkdownOpen] = useState(false);
  const [markdownContent, setMarkdownContent] = useState("");

  const handleOpenAI = (type: "chatgpt" | "claude") => {
    const url = window.location.href;
    const prompt = `Hi, read this API documentation (${url}) and be ready to answer questions about it.`;
    const encodedPrompt = encodeURIComponent(prompt);

    let targetUrl = "";
    if (type === "chatgpt") {
      targetUrl = `https://chatgpt.com/?q=${encodedPrompt}`;
    } else if (type === "claude") {
      targetUrl = `https://claude.ai/new?q=${encodedPrompt}`;
    }

    window.open(targetUrl, "_blank");
  };

  const handleViewMarkdown = () => {
    const md = generateMarkdown(spec);
    setMarkdownContent(md);
    setMarkdownOpen(true);
  };

  const handleCopyMarkdown = async () => {
    const md = generateMarkdown(spec);
    try {
      await navigator.clipboard.writeText(md);
      toast({
        title: "Copied!",
        description: "Markdown copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy markdown to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex h-8 items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Ask AI</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleOpenAI("chatgpt")} className="cursor-pointer">
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>Open in ChatGPT</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOpenAI("claude")} className="cursor-pointer">
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>Open in Claude</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleViewMarkdown} className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            <span>View as Markdown</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyMarkdown} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy as Markdown</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={markdownOpen} onOpenChange={setMarkdownOpen}>
        <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-3xl flex-col sm:max-h-[80vh] sm:w-auto">
          <DialogHeader>
            <DialogTitle>API Documentation (Markdown)</DialogTitle>
            <DialogDescription>
              A markdown representation of the OpenAPI specification.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-auto rounded-md border bg-muted p-4">
            <pre className="whitespace-pre-wrap font-mono text-xs">
              {markdownContent}
            </pre>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleCopyMarkdown} size="sm">
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
