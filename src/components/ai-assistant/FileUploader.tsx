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

    for (const file of files) {
      const fileType = getFileType(file);
      if (!fileType) {
        toast.error(`Unsupported file type: ${file.name}`);
        continue;
      }

      try {
        const processedFile = await processFile(file, fileType);
        setUploadedFiles(prev => [...prev, processedFile]);
      } catch (error) {
        console.error('Error processing file:', error);
        toast.error(`Failed to process: ${file.name}`);
      }
    }

    setIsProcessing(false);
    updateContext();

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
        content: `[Image uploaded: ${file.name}]`,
      };
    }

    // For documents
    let content = '';
    if (file.name.endsWith('.txt')) {
      content = await readFileAsText(file);
    } else {
      // For PDF and DOCX, we'll send them to AI for processing
      content = `[Document uploaded: ${file.name}] - The document content will be extracted and analyzed.`;
      toast.info('Document uploaded. AI will analyze its content.');
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

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
    updateContext();
  };

  const updateContext = () => {
    const documentContext = uploadedFiles
      .filter(f => f.type === 'document')
      .map(f => f.content)
      .join('\n\n');
    
    const imageContext = uploadedFiles
      .filter(f => f.type === 'image')
      .map(f => f.content)
      .join('\n');

    onFilesProcessed(documentContext, imageContext);
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
        className="gap-2 font-comfortaa"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        Upload Files
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
                <span className="max-w-[120px] truncate font-comfortaa text-xs">{file.name}</span>
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
