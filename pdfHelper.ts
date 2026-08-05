import * as pdfjsLib from 'pdfjs-dist';

// Set up worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;

export interface PDFExtractionResult {
  fileName: string;
  fileSize: number;
  pageCount: number;
  text: string;
  summaryPreview: string;
}

export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    const numPages = pdf.numPages;

    for (let i = 1; i <= Math.min(numPages, 30); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => item.str || '')
        .join(' ');
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }

    const cleanText = fullText.trim();
    const summaryPreview = cleanText.length > 300 
      ? cleanText.slice(0, 300) + '...' 
      : cleanText;

    return {
      fileName: file.name,
      fileSize: file.size,
      pageCount: numPages,
      text: cleanText,
      summaryPreview
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    // Fallback plain text reading if PDF parser encounters issue
    const text = await file.text();
    return {
      fileName: file.name,
      fileSize: file.size,
      pageCount: 1,
      text: text.slice(0, 10000),
      summaryPreview: text.slice(0, 300)
    };
  }
}
