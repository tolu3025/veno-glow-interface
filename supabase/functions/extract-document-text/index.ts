import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract text from PDF (basic extraction)
function extractPdfText(data: Uint8Array): string {
  try {
    const decoder = new TextDecoder('latin1');
    const content = decoder.decode(data);
    
    // Find all text streams in the PDF
    const textParts: string[] = [];
    
    // Extract text from stream objects
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let match;
    
    while ((match = streamRegex.exec(content)) !== null) {
      const streamContent = match[1];
      // Try to extract readable text from the stream
      const textMatch = streamContent.match(/\(([^)]+)\)/g);
      if (textMatch) {
        textMatch.forEach(t => {
          const cleaned = t.slice(1, -1)
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '')
            .replace(/\\\(/g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\');
          if (cleaned.length > 0 && !/^[\x00-\x1f]+$/.test(cleaned)) {
            textParts.push(cleaned);
          }
        });
      }
      
      // Also try BT...ET text blocks with Tj/TJ operators
      const btBlocks = streamContent.match(/BT[\s\S]*?ET/g);
      if (btBlocks) {
        btBlocks.forEach(block => {
          // Extract Tj strings
          const tjMatches = block.match(/\(([^)]*)\)\s*Tj/g);
          if (tjMatches) {
            tjMatches.forEach(tj => {
              const text = tj.match(/\(([^)]*)\)/)?.[1] || '';
              if (text) textParts.push(text);
            });
          }
          // Extract TJ arrays
          const tjArrays = block.match(/\[(.*?)\]\s*TJ/g);
          if (tjArrays) {
            tjArrays.forEach(arr => {
              const strings = arr.match(/\(([^)]*)\)/g);
              if (strings) {
                strings.forEach(s => {
                  const text = s.slice(1, -1);
                  if (text) textParts.push(text);
                });
              }
            });
          }
        });
      }
    }
    
    // Also try to find direct text content
    const directTextRegex = /\(([^()]+)\)/g;
    let directMatch;
    while ((directMatch = directTextRegex.exec(content)) !== null) {
      const text = directMatch[1];
      if (text.length > 3 && /[a-zA-Z]{2,}/.test(text)) {
        textParts.push(text);
      }
    }
    
    const extractedText = textParts
      .filter(t => t.trim().length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (extractedText.length < 50) {
      return '[PDF text extraction limited - some PDFs use complex encoding. Please paste the text content directly for best results.]';
    }
    
    return extractedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '[Error extracting PDF text. Please paste the text content directly.]';
  }
}

// Extract text from DOCX (ZIP containing XML)
async function extractDocxText(data: Uint8Array): Promise<string> {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const zipContent = decoder.decode(data);
    
    const textParts: string[] = [];
    
    // Extract text between <w:t> and </w:t> tags
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let match;
    
    while ((match = textRegex.exec(zipContent)) !== null) {
      if (match[1]) {
        textParts.push(match[1]);
      }
    }
    
    let extractedText = textParts.join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (extractedText.length < 50) {
      const readableText = zipContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/[^\x20-\x7E\n]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (readableText.length > extractedText.length) {
        extractedText = readableText.substring(0, 10000);
      }
    }
    
    if (extractedText.length < 20) {
      return '[DOCX text extraction limited. Please paste the text content directly for best results.]';
    }
    
    return extractedText;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return '[Error extracting DOCX text. Please paste the text content directly.]';
  }
}

// Extract text from PPTX (ZIP containing XML)
async function extractPptxText(data: Uint8Array): Promise<string> {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const zipContent = decoder.decode(data);
    
    console.log('PPTX raw content length:', zipContent.length);
    
    const allText: string[] = [];
    
    // Method 1: Extract from all text tags with various namespace patterns
    // PowerPoint uses namespaces like a:t, p:t, etc.
    const textPatterns = [
      /<a:t>([^<]+)<\/a:t>/gi,           // DrawingML text
      /<p:txBody[^>]*>([\s\S]*?)<\/p:txBody>/gi,  // Text body
      /<a:r[^>]*>([\s\S]*?)<\/a:r>/gi,   // Run elements
      />([^<]{3,})</g,                    // Any text between tags
    ];
    
    // Extract from <a:t> tags first (most common in PPTX)
    const atPattern = /<a:t>([^<]+)<\/a:t>/gi;
    let atMatch;
    while ((atMatch = atPattern.exec(zipContent)) !== null) {
      const text = atMatch[1].trim();
      if (text && text.length > 0 && !/^[\d\s\.\,]+$/.test(text)) {
        allText.push(text);
      }
    }
    
    console.log('Found text segments from a:t tags:', allText.length);
    
    // If no a:t tags found, try broader pattern
    if (allText.length === 0) {
      // Try extracting from t elements with any namespace
      const tPattern = /:t>([^<]+)<\//gi;
      let tMatch;
      while ((tMatch = tPattern.exec(zipContent)) !== null) {
        const text = tMatch[1].trim();
        if (text && text.length > 1 && /[a-zA-Z]/.test(text)) {
          allText.push(text);
        }
      }
      console.log('Found text segments from :t pattern:', allText.length);
    }
    
    // Fallback: extract all readable text from between angle brackets
    if (allText.length === 0) {
      const generalPattern = />([^<]{4,})</g;
      let gMatch;
      while ((gMatch = generalPattern.exec(zipContent)) !== null) {
        const text = gMatch[1].trim();
        // Filter out XML artifacts and keep meaningful text
        if (text && 
            text.length > 3 && 
            /[a-zA-Z]{2,}/.test(text) &&
            !text.includes('xmlns') &&
            !text.includes('xml:') &&
            !text.match(/^[\d\s\.\,\-]+$/)) {
          allText.push(text);
        }
      }
      console.log('Found text from general extraction:', allText.length);
    }
    
    // Remove duplicates while preserving order
    const seen = new Set<string>();
    const uniqueText: string[] = [];
    
    for (const text of allText) {
      const normalized = text.toLowerCase().trim();
      if (!seen.has(normalized) && normalized.length > 1) {
        seen.add(normalized);
        uniqueText.push(text);
      }
    }
    
    // Join with proper spacing and sanitize
    let extractedText = uniqueText.join(' ')
      .replace(/\s+/g, ' ')
      .replace(/([.!?])\s*/g, '$1 ')
      // Remove NULL bytes and unsupported Unicode escape sequences
      .replace(/\u0000/g, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/[^\x20-\x7E\xA0-\xFF\u0100-\uFFFF\n\r\t ]/g, '')
      .trim();
    
    console.log(`Extracted ${extractedText.length} characters from PPTX, ${uniqueText.length} unique segments`);
    
    if (extractedText.length < 50) {
      return '[PPTX text extraction limited. The file may contain mostly images or complex formatting. Please paste the text content directly for best results.]';
    }
    
    return extractedText;
  } catch (error) {
    console.error('PPTX extraction error:', error);
    return '[Error extracting PPTX text. Please paste the text content directly.]';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileData, fileName, fileType } = await req.json();
    
    if (!fileData || !fileName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing file data or name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing file: ${fileName}, type: ${fileType}`);
    
    // Decode base64 file data
    const binaryData = decode(fileData);
    
    let extractedText = '';
    const extension = fileName.toLowerCase().split('.').pop();
    
    if (extension === 'pdf') {
      console.log('Extracting PDF text...');
      extractedText = extractPdfText(binaryData);
    } else if (extension === 'docx' || extension === 'doc') {
      console.log('Extracting DOCX text...');
      extractedText = await extractDocxText(binaryData);
    } else if (extension === 'pptx' || extension === 'ppt') {
      console.log('Extracting PPTX text...');
      extractedText = await extractPptxText(binaryData);
    } else if (extension === 'txt') {
      const decoder = new TextDecoder('utf-8');
      extractedText = decoder.decode(binaryData);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: `Unsupported file type: ${extension}. Supported: PDF, DOCX, PPTX, TXT` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Extracted ${extractedText.length} characters from ${fileName}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        text: extractedText,
        fileName,
        charCount: extractedText.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Document extraction error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to extract text' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
