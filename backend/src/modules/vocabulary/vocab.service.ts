import { prisma } from '../../config/database';

export class VocabService {
  async getSets() {
    let sets = await prisma.vocabSet.findMany({
      orderBy: { created_at: 'asc' },
      include: {
        _count: { select: { words: true } },
      },
    });

    // Auto-seed essential Aptis vocabulary sets if system has fewer than 2 sets
    if (sets.length < 2) {
      try {
        const seedSets = [
          {
            title: "Từ Vựng Chủ Đề Công Sở & Doanh Nghiệp (Workplace & Business)",
            category: "B2 Business",
            total_words: 6,
            is_free: false,
            words: {
              create: [
                {
                  word: "Collaborate",
                  phonetic: "/kəˈlæb.ə.reɪt/",
                  meaning_vi: "Hợp tác, cộng tác làm việc cùng nhau",
                  example_sentence: "We need to collaborate closely with the marketing team on this launch.",
                  cefr_level: "B2",
                },
                {
                  word: "Negotiation",
                  phonetic: "/nəˌɡoʊ.ʃiˈeɪ.ʃən/",
                  meaning_vi: "Cuộc đàm phán, thương lượng hợp đồng",
                  example_sentence: "The contract is currently under negotiation between both parties.",
                  cefr_level: "B2",
                },
                {
                  word: "Deadline",
                  phonetic: "/ˈded.laɪn/",
                  meaning_vi: "Hạn chót hoàn thành nhiệm vụ",
                  example_sentence: "All exam submissions must be finalized before the strict deadline.",
                  cefr_level: "B1",
                },
                {
                  word: "Feasible",
                  phonetic: "/ˈfiː.zə.bəl/",
                  meaning_vi: "Khả thi, có thể thực hiện được",
                  example_sentence: "It is feasible to complete this project within two months.",
                  cefr_level: "B2",
                },
                {
                  word: "Subordinate",
                  phonetic: "/səˈbɔː.dɪ.nət/",
                  meaning_vi: "Cấp dưới, người dưới quyền quản lý",
                  example_sentence: "A good manager always listens to suggestions from their subordinates.",
                  cefr_level: "C1",
                },
                {
                  word: "Objective",
                  phonetic: "/əbˈdʒek.tɪv/",
                  meaning_vi: "Mục tiêu chiến lược, khách quan",
                  example_sentence: "Our primary objective is to boost student Aptis passing rates.",
                  cefr_level: "B2",
                },
              ],
            },
          },
          {
            title: "Từ Vựng Đời Sống & Du Lịch Xã Hội (Travel & Daily Social)",
            category: "B1-B2 Social",
            total_words: 5,
            is_free: true,
            words: {
              create: [
                {
                  word: "Destination",
                  phonetic: "/ˌdes.tɪˈneɪ.ʃən/",
                  meaning_vi: "Điểm đến, nơi dự định tới",
                  example_sentence: "Da Nang is a very popular travel destination for foreign tourists.",
                  cefr_level: "B1",
                },
                {
                  word: "Itinerary",
                  phonetic: "/aɪˈtɪn.ər.ər.i/",
                  meaning_vi: "Lịch trình chuyến đi chi tiết",
                  example_sentence: "We checked our itinerary to confirm the departure time.",
                  cefr_level: "B2",
                },
                {
                  word: "Hospitality",
                  phonetic: "/ˌhɒs.pɪˈtæl.ə.ti/",
                  meaning_vi: "Lòng hiếu khách, ngành dịch vụ khách sạn",
                  example_sentence: "We were deeply impressed by the warm hospitality of the locals.",
                  cefr_level: "B2",
                },
                {
                  word: "Luggage",
                  phonetic: "/ˈlʌɡ.ɪdʒ/",
                  meaning_vi: "Hành lý xách tay hoặc ký gửi",
                  example_sentence: "Passengers should keep their luggage in sight at all times.",
                  cefr_level: "B1",
                },
                {
                  word: "Public Transport",
                  phonetic: "/ˈpʌb.lɪk ˈtræn.spɔːt/",
                  meaning_vi: "Phương tiện giao thông công cộng",
                  example_sentence: "Using public transport helps reduce traffic congestion in the city.",
                  cefr_level: "B1",
                },
              ],
            },
          },
          {
            title: "Cụm Từ Collocations Điểm Cao Writing & Speaking (Aptis Band C)",
            category: "C1 Advanced",
            total_words: 5,
            is_free: false,
            words: {
              create: [
                {
                  word: "Substantial impact",
                  phonetic: "/səbˈstæn.ʃəl ˈɪm.pækt/",
                  meaning_vi: "Tác động đáng kể, ảnh hưởng to lớn",
                  example_sentence: "The new educational policy has had a substantial impact on student performance.",
                  cefr_level: "C1",
                },
                {
                  word: "Pave the way",
                  phonetic: "/peɪv ðə weɪ/",
                  meaning_vi: "Mở đường, tạo tiền đề cho sự phát triển",
                  example_sentence: "Innovative research will pave the way for sustainable energy solutions.",
                  cefr_level: "C1",
                },
                {
                  word: "Play a pivotal role",
                  phonetic: "/pleɪ ə ˈpɪv.ə.təl rəʊl/",
                  meaning_vi: "Đóng vai trò then chốt / mang tính bước ngoặt",
                  example_sentence: "English proficiency plays a pivotal role in international career growth.",
                  cefr_level: "C1",
                },
                {
                  word: "In stark contrast",
                  phonetic: "/ɪn stɑːk ˈkɒn.trɑːst/",
                  meaning_vi: "Trái ngược hoàn toàn, tương phản rõ rệt",
                  example_sentence: "His second writing essay stood in stark contrast to his initial attempt.",
                  cefr_level: "C1",
                },
                {
                  word: "Grasp the opportunity",
                  phonetic: "/ɡrɑːsp ði ˌɒp.əˈtʃuː.nə.ti/",
                  meaning_vi: "Nắm bắt cơ hội ngay khi có thể",
                  example_sentence: "Hard-working candidates are quick to grasp every learning opportunity.",
                  cefr_level: "B2",
                },
              ],
            },
          },
        ];

        for (const item of seedSets) {
          await prisma.vocabSet.create({ data: item });
        }

        sets = await prisma.vocabSet.findMany({
          orderBy: { created_at: 'asc' },
          include: {
            _count: { select: { words: true } },
          },
        });
      } catch (err) {
        console.error("Auto-seed error:", err);
      }
    }

    return sets;
  }

  async createSet(data: { title: string; category: string; is_free?: boolean }) {
    return prisma.vocabSet.create({
      data: {
        title: data.title,
        category: data.category,
        is_free: data.is_free ?? true,
        total_words: 0,
      },
    });
  }

  async deleteSet(setId: string) {
    return prisma.vocabSet.delete({
      where: { id: setId },
    });
  }

  async createWord(
    setId: string,
    data: {
      word: string;
      phonetic?: string;
      meaning_vi: string;
      example_sentence?: string;
      cefr_level?: string;
    }
  ) {
    const word = await prisma.vocabWord.create({
      data: {
        set_id: setId,
        word: data.word,
        phonetic: data.phonetic || null,
        meaning_vi: data.meaning_vi,
        example_sentence: data.example_sentence || null,
        cefr_level: data.cefr_level || 'B1',
      },
    });

    await prisma.vocabSet.update({
      where: { id: setId },
      data: { total_words: { increment: 1 } },
    });

    return word;
  }

  async updateWord(
    wordId: string,
    data: {
      word?: string;
      phonetic?: string;
      meaning_vi?: string;
      example_sentence?: string;
      cefr_level?: string;
    }
  ) {
    return prisma.vocabWord.update({
      where: { id: wordId },
      data,
    });
  }

  async deleteWord(wordId: string) {
    const word = await prisma.vocabWord.findUnique({ where: { id: wordId } });
    if (!word) throw { statusCode: 404, message: 'Từ vựng không tồn tại' };

    await prisma.vocabWord.delete({ where: { id: wordId } });

    await prisma.vocabSet.update({
      where: { id: word.set_id },
      data: { total_words: { decrement: 1 } },
    });

    return { success: true };
  }

  async importWords(
    setId: string,
    wordsList: Array<{
      word: string;
      phonetic?: string;
      meaning_vi: string;
      example_sentence?: string;
      cefr_level?: string;
    }>
  ) {
    const set = await prisma.vocabSet.findUnique({ where: { id: setId } });
    if (!set) throw { statusCode: 404, message: 'Bộ từ vựng không tồn tại' };

    const created = await prisma.$transaction(
      wordsList.map((w) =>
        prisma.vocabWord.create({
          data: {
            set_id: setId,
            word: w.word,
            phonetic: w.phonetic || null,
            meaning_vi: w.meaning_vi,
            example_sentence: w.example_sentence || null,
            cefr_level: w.cefr_level || 'B1',
          },
        })
      )
    );

    await prisma.vocabSet.update({
      where: { id: setId },
      data: { total_words: { increment: created.length } },
    });

    return { count: created.length };
  }

  async getSetWords(setId: string) {
    const set = await prisma.vocabSet.findUnique({
      where: { id: setId },
      include: {
        words: {
          orderBy: { word: 'asc' },
        },
      },
    });

    if (!set) {
      throw { statusCode: 404, message: 'Bộ từ vựng không tồn tại' };
    }

    return set;
  }

  async addToNotebook(userId: string, wordId: string) {
    const word = await prisma.vocabWord.findUnique({
      where: { id: wordId },
    });

    if (!word) {
      throw { statusCode: 404, message: 'Từ vựng không tồn tại' };
    }

    return prisma.vocabNotebook.upsert({
      where: {
        user_id_word_id: {
          user_id: userId,
          word_id: wordId,
        },
      },
      update: {
        is_memorized: false,
      },
      create: {
        user_id: userId,
        word_id: wordId,
      },
    });
  }

  async getNotebook(userId: string) {
    return prisma.vocabNotebook.findMany({
      where: { user_id: userId },
      include: { word: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async toggleMemorized(userId: string, wordId: string, isMemorized: boolean) {
    return prisma.vocabNotebook.update({
      where: {
        user_id_word_id: {
          user_id: userId,
          word_id: wordId,
        },
      },
      data: { is_memorized: isMemorized },
    });
  }
}

export const vocabService = new VocabService();
