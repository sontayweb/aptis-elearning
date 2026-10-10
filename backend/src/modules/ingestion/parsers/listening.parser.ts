import { ExamSkill, QuestionType } from '@prisma/client';
import { IngestedExam, IngestedPart, IngestedQuestion } from '../ingestion.types';
import { ttsAudioService } from '../tts-audio.service';

export interface RawListeningScriptItem {
  partNumber: number;
  title: string;
  transcript: string;
  speakerType?: 'SOLO' | 'DIALOGUE';
  dialogue?: { speaker: 'MAN' | 'WOMAN' | 'NARRATOR'; text: string }[];
  questions: {
    questionNumber: number;
    questionType: QuestionType;
    prompt: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
  }[];
}

export class ListeningParser {
  /**
   * Phân tích và tự động sinh file âm thanh ("nó sẽ nói") cho bài thi Listening
   */
  public async parseAndSynthesizeListeningExam(
    title: string,
    rawParts: RawListeningScriptItem[]
  ): Promise<IngestedExam> {
    const parts: IngestedPart[] = [];

    for (const raw of rawParts) {
      let audioPublicUrl: string | undefined;

      // Tự động sinh audio nếu có lời thoại (Transcript)
      if (raw.dialogue && raw.dialogue.length > 0) {
        const generated = await ttsAudioService.generateDialogue(
          raw.dialogue,
          `listening_p${raw.partNumber}_dialogue`
        );
        audioPublicUrl = generated.publicUrl;
      } else if (raw.transcript) {
        const generated = await ttsAudioService.generateSpeech(
          raw.transcript,
          `listening_p${raw.partNumber}_solo`
        );
        audioPublicUrl = generated.publicUrl;
      }

      parts.push({
        partNumber: raw.partNumber,
        title: raw.title,
        instructions: `Listen carefully to the recording and answer the questions.`,
        passageText: raw.transcript || undefined,
        audioUrl: audioPublicUrl,
        questions: raw.questions.map((q) => ({
          questionNumber: q.questionNumber,
          questionType: q.questionType,
          prompt: q.prompt,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || 'Transcript confirmed answer.',
          maxScore: 2.0,
        })),
      });
    }

    return {
      title,
      description: 'Bài thi thử Listening chuẩn Aptis ESOL 40 phút kèm âm thanh bản ngữ tự động sinh.',
      skill: ExamSkill.LISTENING,
      durationMinutes: 40,
      isPro: false,
      hotLevel: 2,
      forecastTag: 'Đề tủ Listening có âm thanh',
      source: 'WEB',
      parts,
    };
  }
}

export const listeningParser = new ListeningParser();
