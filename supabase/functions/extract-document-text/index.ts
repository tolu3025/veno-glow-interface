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
    
    // Find slide content - each slide is in ppt/slides/slideX.xml
    const slides: string[] = [];
    let slideNum = 1;
    
    // Extract text from each slide by finding slide boundaries
    const slidePattern = /slide\d+\.xml/gi;
    const slideMatches = zipContent.match(slidePattern) || [];
    const uniqueSlides = [...new Set(slideMatches)].sort();
    
    console.log(`Found ${uniqueSlides.length} slides in PPTX`);
    
    // Process the entire content, grouping by paragraph structures
    const paragraphs: string[] = [];
    
    // Extract from <a:p> paragraph blocks containing <a:t> text
    const paragraphRegex = /<a:p[^>]*>([\s\S]*?)<\/a:p>/g;
    let pMatch;
    
    while ((pMatch = paragraphRegex.exec(zipContent)) !== null) {
      const paragraphContent = pMatch[1];
      const textParts: string[] = [];
      
      // Get all text within this paragraph
      const textRegex = /<a:t>([^<]+)<\/a:t>/g;
      let tMatch;
      
      while ((tMatch = textRegex.exec(paragraphContent)) !== null) {
        if (tMatch[1] && tMatch[1].trim()) {
          textParts.push(tMatch[1].trim());
        }
      }
      
      if (textParts.length > 0) {
        const paragraphText = textParts.join(' ').trim();
        // Only add meaningful paragraphs (more than just a number or single char)
        if (paragraphText.length > 2 && !/^[\d\.\s]+$/.test(paragraphText)) {
          paragraphs.push(paragraphText);
        }
      }
    }
    
    // Remove duplicates while preserving order
    const uniqueParagraphs: string[] = [];
    const seen = new Set<string>();
    
    for (const p of paragraphs) {
      const normalized = p.toLowerCase().trim();
      if (!seen.has(normalized) && normalized.length > 2) {
        seen.add(normalized);
        uniqueParagraphs.push(p);
      }
    }
    
    // Join paragraphs with proper line breaks
    let extractedText = uniqueParagraphs.join('\n\n');
    
    // Clean up any remaining artifacts
    extractedText = extractedText
      .replace(/\s{3,}/g, '\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    console.log(`Extracted ${extractedText.length} characters, ${uniqueParagraphs.length} paragraphs from PPTX`);
    
    if (extractedText.length < 100) {
      // Fallback: extract all readable text
      const fallbackParts: string[] = [];
      const simpleTextRegex = /<a:t>([^<]+)<\/a:t>/g;
      let sMatch;
      
      while ((sMatch = simpleTextRegex.exec(zipContent)) !== null) {
        if (sMatch[1] && sMatch[1].trim().length > 2) {
          fallbackParts.push(sMatch[1].trim());
        }
      }
      
      extractedText = fallbackParts.join(' ').replace(/\s+/g, ' ').trim();
    }
    
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
