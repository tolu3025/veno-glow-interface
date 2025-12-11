import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Printer, 
  RefreshCw, 
  Copy, 
  Check,
  FileDown,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import BotResponse from '@/components/bot/BotResponse';

interface RichTextPanelProps {
  content: string;
  onRegenerate: () => void;
  isLoading: boolean;
}

const RichTextPanel: React.FC<RichTextPanelProps> = ({ content, onRegenerate, isLoading }) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent || content);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>VenoBot AI - Print</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css">
            <style>
              body { font-family: 'Comfortaa', sans-serif; padding: 40px; line-height: 1.8; }
              h1, h2, h3 { color: #1a8754; }
              table { border-collapse: collapse; width: 100%; margin: 16px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
              code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
              pre { background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; }
              blockquote { border-left: 4px solid #1a8754; padding-left: 16px; margin: 16px 0; color: #666; }
            </style>
          </head>
          <body>
            <div id="content">${document.getElementById('print-content')?.innerHTML || ''}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadPDF = () => {
    // Create a simple PDF download using print
    toast.info('Opening print dialog for PDF export...');
    handlePrint();
  };

  const handleDownloadDOCX = async () => {
    try {
      const blob = new Blob([editedContent || content], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'venobot-output.doc';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Document downloaded');
    } catch {
      toast.error('Failed to download document');
    }
  };

  if (!content) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-xl bg-card overflow-hidden"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border bg-muted/30">
        <span className="text-sm font-comfortaa font-medium text-muted-foreground mr-2">
          Output Panel
        </span>
        
        <div className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="h-8 px-2 text-xs gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditing ? 'Preview' : 'Edit'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            disabled={isLoading}
            className="h-8 px-2 text-xs gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2 text-xs gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            Copy
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadPDF}
            className="h-8 px-2 text-xs gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadDOCX}
            className="h-8 px-2 text-xs gap-1"
          >
            <FileDown className="w-3.5 h-3.5" />
            DOCX
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            className="h-8 px-2 text-xs gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 max-h-[400px] overflow-y-auto" id="print-content">
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-[300px] p-3 bg-background border border-border rounded-lg resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        ) : (
          <BotResponse message={editedContent || content} />
        )}
      </div>
    </motion.div>
  );
};

export default RichTextPanel;
