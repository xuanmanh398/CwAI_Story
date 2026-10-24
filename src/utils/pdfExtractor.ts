import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Thiết lập worker cho pdfjs-dist trong môi trường Vite
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export interface ExtractedChapter {
  fileName: string;
  suggestedTitle: string;
  chapterNumber?: number;
  content: string;
  wordCount: number;
  pageCount: number;
}

/**
 * Trích xuất toàn bộ văn bản từ 1 file PDF
 */
export async function extractTextFromPdfFile(file: File): Promise<ExtractedChapter> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;

  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Ghép các chuỗi chữ, xử lý khoảng trắng hợp lý
    let lastY: number | null = null;
    let pageLines: string[] = [];
    let currentLine = '';

    for (const item of textContent.items as any[]) {
      const str = item.str || '';
      if (!str) continue;

      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        if (currentLine.trim()) {
          pageLines.push(currentLine.trim());
        }
        currentLine = str;
      } else {
        currentLine += (currentLine.length > 0 && !currentLine.endsWith(' ') ? ' ' : '') + str;
      }
      lastY = item.transform[5];
    }
    if (currentLine.trim()) {
      pageLines.push(currentLine.trim());
    }

    fullText += pageLines.join('\n') + '\n\n';
  }

  const cleanContent = fullText.trim();
  const wordCount = cleanContent.split(/\s+/).filter(Boolean).length;

  // Đoán số chương và tiêu đề từ tên file (ví dụ: Chuong_1_Khoi_Dau.pdf, Tap 1.pdf, chapter-2.pdf)
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const numMatch = baseName.match(/(\d+)/);
  const chapterNumber = numMatch ? parseInt(numMatch[1], 10) : undefined;

  let suggestedTitle = baseName
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Chuẩn hóa tiêu đề nếu chưa có chữ Chương
  if (chapterNumber && !suggestedTitle.toLowerCase().includes('chương')) {
    suggestedTitle = `Chương ${chapterNumber}: ${suggestedTitle.replace(new RegExp(`^${chapterNumber}\\s*[:.-]?\\s*`), '')}`;
  }

  return {
    fileName: file.name,
    suggestedTitle,
    chapterNumber,
    content: cleanContent,
    wordCount,
    pageCount: pdf.numPages,
  };
}
