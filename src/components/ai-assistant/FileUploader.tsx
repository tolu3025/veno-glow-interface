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

  const extractDocumentText = async (file: File): Promise<string> => {
    try {
      // Read file as base64
      const base64 = await readFileAsBase64(file);
      
      // Call backend to extract text
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-document-text`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            fileData: base64,
            fileName: file.name,
            fileType: file.type,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to extract text');
      }

      const result = await response.json();
      
      if (result.success && result.text) {
        console.log(`Extracted ${result.charCount} characters from ${file.name}`);
        return result.text;
      } else {
        throw new Error(result.error || 'No text extracted');
      }
    } catch (error) {
      console.error('Document extraction error:', error);
      throw error;
    }
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

    // For documents - extract text using backend
    const extension = file.name.split('.').pop()?.toLowerCase();
    let content = '';
    
    if (extension === 'txt') {
      // Plain text files can be read directly in browser
      content = await readFileAsText(file);
    } else if (extension === 'pdf' || extension === 'docx' || extension === 'doc') {
      // Use backend extraction for PDF/DOCX
      toast.info(`Extracting text from ${file.name}...`);
      try {
        content = await extractDocumentText(file);
      } catch (error) {
        console.error('Extraction failed:', error);
        content = `[Document: ${file.name}] - Text extraction failed. Please describe the content or paste text directly.`;
      }
    } else {
      content = `[Unsupported document format: ${file.name}]`;
    }

    // Add file metadata header
    const finalContent = `=== Document: ${file.name} ===\n${content}`;

    return {
      id,
      name: file.name,
      type: 'document',
      content: finalContent,
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
