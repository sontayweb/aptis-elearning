import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

export interface ExtractedDocxContent {
  paragraphs: string[];
  tables: string[][][];
  mediaFiles: {
    originalName: string;
    localPath: string;
    publicUrl: string;
  }[];
}

export class DocxExtractor {
  private uploadDir: string;

  constructor(customUploadDir?: string) {
    this.uploadDir = customUploadDir || path.resolve(process.env.UPLOAD_DIR || './uploads');
  }

  /**
   * Giải nén và trích xuất nội dung văn bản + hình ảnh từ file .docx
   */
  public extract(docxPath: string, mediaSubfolder = 'speaking'): ExtractedDocxContent {
    if (!fs.existsSync(docxPath)) {
      throw new Error(`Tập tin docx không tồn tại: ${docxPath}`);
    }

    const zip = new AdmZip(docxPath);
    const zipEntries = zip.getEntries();

    // 1. Trích xuất hình ảnh từ thư mục word/media/
    const mediaFiles: ExtractedDocxContent['mediaFiles'] = [];
    const targetMediaDir = path.join(this.uploadDir, 'exams', mediaSubfolder);
    if (!fs.existsSync(targetMediaDir)) {
      fs.mkdirSync(targetMediaDir, { recursive: true });
    }

    const fileBaseName = path.basename(docxPath, path.extname(docxPath)).replace(/[^a-zA-Z0-9_-]/g, '_');

    for (const entry of zipEntries) {
      if (entry.entryName.startsWith('word/media/')) {
        const ext = path.extname(entry.entryName) || '.jpg';
        const imgName = path.basename(entry.entryName, ext);
        const outputFilename = `${fileBaseName}_${imgName}${ext}`;
        const outputPath = path.join(targetMediaDir, outputFilename);

        fs.writeFileSync(outputPath, entry.getData());

        mediaFiles.push({
          originalName: entry.entryName,
          localPath: outputPath,
          publicUrl: `/uploads/exams/${mediaSubfolder}/${outputFilename}`,
        });
      }
    }

    // 2. Trích xuất văn bản từ word/document.xml
    const docXmlEntry = zip.getEntry('word/document.xml');
    const paragraphs: string[] = [];
    const tables: string[][][] = [];

    if (docXmlEntry) {
      const xmlString = docXmlEntry.getData().toString('utf8');

      // Tách từng đoạn <w:p>
      const pRegex = /<w:p\b[^>]*>(.*?)<\/w:p>/gs;
      let pMatch: RegExpExecArray | null;

      while ((pMatch = pRegex.exec(xmlString)) !== null) {
        const pContent = pMatch[1];
        // Bóc tách text trong <w:t>
        const tRegex = /<w:t\b[^>]*>(.*?)<\/w:t>/gs;
        let tMatch: RegExpExecArray | null;
        let pText = '';

        while ((tMatch = tRegex.exec(pContent)) !== null) {
          pText += tMatch[1];
        }

        const trimmed = pText.trim();
        if (trimmed.length > 0) {
          paragraphs.push(this.decodeXmlEntities(trimmed));
        }
      }

      // Tách bảng <w:tbl>
      const tblRegex = /<w:tbl\b[^>]*>(.*?)<\/w:tbl>/gs;
      let tblMatch: RegExpExecArray | null;

      while ((tblMatch = tblRegex.exec(xmlString)) !== null) {
        const tblContent = tblMatch[1];
        const rowRegex = /<w:tr\b[^>]*>(.*?)<\/w:tr>/gs;
        let rowMatch: RegExpExecArray | null;
        const currentTable: string[][] = [];

        while ((rowMatch = rowRegex.exec(tblContent)) !== null) {
          const rowContent = rowMatch[1];
          const cellRegex = /<w:tc\b[^>]*>(.*?)<\/w:tc>/gs;
          let cellMatch: RegExpExecArray | null;
          const currentRow: string[] = [];

          while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
            const cellContent = cellMatch[1];
            const cellTRegex = /<w:t\b[^>]*>(.*?)<\/w:t>/gs;
            let ctMatch: RegExpExecArray | null;
            let cellText = '';

            while ((ctMatch = cellTRegex.exec(cellContent)) !== null) {
              cellText += ctMatch[1];
            }
            currentRow.push(this.decodeXmlEntities(cellText.trim()));
          }
          if (currentRow.length > 0) {
            currentTable.push(currentRow);
          }
        }
        if (currentTable.length > 0) {
          tables.push(currentTable);
        }
      }
    }

    return {
      paragraphs,
      tables,
      mediaFiles,
    };
  }

  private decodeXmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  }
}

export const docxExtractor = new DocxExtractor();
