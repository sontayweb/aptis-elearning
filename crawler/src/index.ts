import { HttpClient } from "./clients/http-client";
import { ReadingScraper } from "./scrapers/reading.scraper";
import { ListeningScraper } from "./scrapers/listening.scraper";
import { GrammarScraper } from "./scrapers/grammar.scraper";
import { DictationScraper } from "./scrapers/dictation.scraper";
import { VocabularyScraper } from "./scrapers/vocabulary.scraper";
import { DatabaseImporter } from "./importers/db-importer";

async function main() {
  console.log("=================================================");
  console.log("   🚀 APTIS KY TICH CRAWLER & DATABASE IMPORTER  ");
  console.log("=================================================");

  const args = process.argv.slice(2);
  const isAll = args.includes("--all") || args.length === 0;
  const targetSkill = args.find((a) => a.startsWith("--skill="))?.split("=")[1]?.toLowerCase();

  const http = new HttpClient();
  const importer = new DatabaseImporter();

  try {
    // 1. Module Reading
    if (isAll || targetSkill === "reading") {
      console.log("\n--- [1/5] CÀO DỮ LIỆU READING ---");
      const readingScraper = new ReadingScraper(http);
      const readingExams = await readingScraper.scrapeExams();
      for (const ex of readingExams) {
        await importer.importExam(ex);
      }
    }

    // 2. Module Listening
    if (isAll || targetSkill === "listening") {
      console.log("\n--- [2/5] CÀO DỮ LIỆU LISTENING ---");
      const listeningScraper = new ListeningScraper(http);
      const listeningExams = await listeningScraper.scrapeExams();
      for (const ex of listeningExams) {
        await importer.importExam(ex);
      }
    }

    // 3. Module Grammar & Vocabulary
    if (isAll || targetSkill === "grammar") {
      console.log("\n--- [3/5] CÀO DỮ LIỆU GRAMMAR & VOCABULARY ---");
      const grammarScraper = new GrammarScraper(http);
      const grammarExams = await grammarScraper.scrapeExams();
      for (const ex of grammarExams) {
        await importer.importExam(ex);
      }
    }

    // 4. Module Dictation & Shadowing
    if (isAll || targetSkill === "dictation") {
      console.log("\n--- [4/5] CÀO DỮ LIỆU NGHE CHÉP & NÓI NHẠI ---");
      const dictationScraper = new DictationScraper(http);
      const sentences = await dictationScraper.scrapeSentences();
      await importer.importDictation(sentences);
    }

    // 5. Module Vocabulary Sets
    if (isAll || targetSkill === "vocabulary") {
      console.log("\n--- [5/5] CÀO KHO TỪ VỰNG ---");
      const vocabScraper = new VocabularyScraper(http);
      const vocabSets = await vocabScraper.scrapeVocabSets();
      await importer.importVocabulary(vocabSets);
    }

    console.log("\n=================================================");
    console.log("   ✅ HOÀN THÀNH TẤT CẢ TIẾN TRÌNH CÀO DỮ LIỆU! ");
    console.log("   Dữ liệu đã được nạp và xuất ra crawler/output/ ");
    console.log("=================================================");
  } catch (err: any) {
    console.error("❌ Lỗi nghiêm trọng trong quá trình cào:", err);
  } finally {
    await importer.close();
  }
}

main();
