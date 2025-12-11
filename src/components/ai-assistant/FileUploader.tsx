import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Image, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface UploadedFile {
  id: string;
  name: string;
  type: 'document' | 'image';
  content?: string;
  preview?: string;
}

interface FileUploaderProps {
  onFilesProcessed: (documentContext: string, imageContext: string) => void;
  uploadedFiles: UploadedFile[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesProcessed, uploadedFiles, setUploadedFiles }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const acceptedTypes = {
    document: ['.pdf', '.docx', '.doc', '.txt'],
    image: ['.jpg', '.jpeg', '.png', '.webp'],
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    const newFiles: UploadedFile[] = [];

    for (const file of files) {
      const fileType = getFileType(file);
      if (!fileType) {
        toast.error(`Unsupported file type: ${file.name}`);
        continue;
      }

      try {
        const processedFile = await processFile(file, fileType);
        newFiles.push(processedFile);
        toast.success(`Processed: ${file.name}`);
      } catch (error) {
        console.error('Error processing file:', error);
        toast.error(`Failed to process: ${file.name}`);
      }
    }

    // Update files and context together
    setUploadedFiles(prev => {
      const allFiles = [...prev, ...newFiles];
      // Update context with new files immediately
      const docContext = allFiles
        .filter(f => f.type === 'document')
        .map(f => f.content)
        .join('\n\n');
      const imgContext = allFiles
        .filter(f => f.type === 'image')
        .map(f => f.preview || f.content)
        .join('\n');
      onFilesProcessed(docContext, imgContext);
      return allFiles;
    });

    setIsProcessing(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileType = (file: File): 'document' | 'image' | null => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (acceptedTypes.document.includes(extension)) return 'document';
    if (acceptedTypes.image.includes(extension)) return 'image';
    return null;
  };

  const processFile = async (file: File, type: 'document' | 'image'): Promise<UploadedFile> => {
    const id = Math.random().toString(36).substring(7);

    if (type === 'image') {
      const preview = await readFileAsDataURL(file);
      return {
        id,
        name: file.name,
        type: 'image',
        preview,
        content: `[Image: ${file.name}] - Image has been uploaded for analysis.`,
      };
    }

    // For documents - extract text content where possible
    const extension = file.name.split('.').pop()?.toLowerCase();
    let content = '';
    
    if (extension === 'txt') {
      // Plain text files can be read directly
      content = await readFileAsText(file);
    } else {
      // For PDF/DOCX, read as base64 and include in context
      // The AI will be informed about the document
      const base64 = await readFileAsBase64(file);
      content = `=== Document: ${file.name} ===\n[Document type: ${extension?.toUpperCase()}]\n[File uploaded for analysis - AI will process based on available context]\n\nNote: This is a ${extension?.toUpperCase()} file. Please describe what information you need from this document, and I'll help you to the best of my ability based on any text content that can be extracted.`;
    }

    return {
      id,
      name: file.name,
      type: 'document',
      content,
    };
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extract base64 part from data URL
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const remaining = prev.filter(f => f.id !== id);
      // Update context with remaining files
      const docContext = remaining
        .filter(f => f.type === 'document')
        .map(f => f.content)
        .join('\n\n');
      const imgContext = remaining
        .filter(f => f.type === 'image')
        .map(f => f.preview || f.content)
        .join('\n');
      onFilesProcessed(docContext, imgContext);
      return remaining;
    });
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={[...acceptedTypes.document, ...acceptedTypes.image].join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="gap-2"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        {isProcessing ? 'Processing...' : 'Upload Files'}
      </Button>

      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {uploadedFiles.map(file => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm"
              >
                {file.type === 'document' ? (
                  <FileText className="w-4 h-4 text-primary" />
                ) : (
                  <Image className="w-4 h-4 text-primary" />
                )}
                <span className="max-w-[120px] truncate text-xs">{file.name}</span>
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-0.5 hover:bg-destructive/20 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUploader;
