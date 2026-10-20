const fs = require('fs');
const path = require('path');

// Extract accurate data for Part 2 from analyze_p2
// Mappings based on docx review:
const correctedP2 = [
  {
    id: "p2_1",
    topicNumber: 1,
    title: "Nhóm người trong phòng họp",
    imageUrl: "/uploads/speaking/part2/image15.png",
    questions: [
      "Describe the picture.",
      "Tell me about a time when you did some work.",
      "Why is it important for people to enjoy their work?"
    ]
  },
  {
    id: "p2_2",
    topicNumber: 2,
    title: "Hai vợ chồng ở phòng khách",
    imageUrl: "/uploads/speaking/part2/image22.png",
    questions: [
      "Describe the picture.",
      "The last time you read the news",
      "Do you think that technological advancements and the Internet make people distant?"
    ]
  },
  {
    id: "p2_3",
    topicNumber: 3,
    title: "Cô gái đi siêu thị",
    imageUrl: "/uploads/speaking/part2/image18.png",
    questions: [
      "Describe the picture.",
      "The last time you went to a small shop?",
      "Why is shopping on the internet so popular?"
    ]
  },
  {
    id: "p2_4",
    topicNumber: 4,
    title: "Gia đình trong phòng bếp",
    imageUrl: "/uploads/speaking/part2/image9.png",
    questions: [
      "Describe the picture.",
      "Why do people enjoy eating together?",
      "Young people are too busy to cook for their families?"
    ]
  },
  {
    id: "p2_5",
    topicNumber: 5,
    title: "Nhóm người trên xe khách",
    imageUrl: "/uploads/speaking/part2/image10.png",
    questions: [
      "Describe the picture.",
      "Tell me about the last time you traveled with a group.",
      "What are the benefits of traveling with a group?"
    ]
  },
  {
    id: "p2_6",
    topicNumber: 6,
    title: "Hai mẹ con đang cưỡi ngựa",
    imageUrl: "/uploads/speaking/part2/image16.png",
    questions: [
      "Describe the picture.",
      "Tell me about an animal that you like",
      "How important are animals in our lives?"
    ]
  },
  {
    id: "p2_7",
    topicNumber: 7,
    title: "Gia đình trên ô tô",
    imageUrl: "/uploads/speaking/part2/image23.png",
    questions: [
      "Describe the picture.",
      "The last time you went somewhere in a car?",
      "Is it important for people to learn to drive? Why?"
    ]
  },
  {
    id: "p2_8",
    topicNumber: 8,
    title: "Nhóm bạn ở nhà hàng",
    imageUrl: "/uploads/speaking/part2/image11.png",
    questions: [
      "Describe the picture.",
      "How difficult is it for young people to learn to cook these days?",
      "When was the last time you went out to eat?"
    ]
  },
  {
    id: "p2_9",
    topicNumber: 9,
    title: "Hai vợ chồng đang dọn nhà",
    imageUrl: "/uploads/speaking/part2/image12.png",
    questions: [
      "Describe the picture.",
      "Tell me the time you did housework.",
      "Why do people like to decorate their houses?"
    ]
  },
  {
    id: "p2_10",
    topicNumber: 10,
    title: "Gia đình chơi ở công viên",
    imageUrl: "/uploads/speaking/part2/image7.png",
    questions: [
      "Describe the picture.",
      "Tell me about a game you played when you were a child.",
      "How have the children’s games changed in the last 50 years?"
    ]
  },
  {
    id: "p2_11",
    topicNumber: 11,
    title: "Nhóm người leo núi",
    imageUrl: "/uploads/speaking/part2/image2.png",
    questions: [
      "Describe the picture.",
      "Do you like to climb mountains?",
      "Do you think outdoor activities are important?"
    ]
  },
  {
    id: "p2_12",
    topicNumber: 12,
    title: "Hai bố con ăn sáng",
    imageUrl: "/uploads/speaking/part2/image24.png",
    questions: [
      "Describe the picture.",
      "What do you usually eat for breakfast?",
      "Is it important to eat a good breakfast? Why?"
    ]
  },
  {
    id: "p2_13",
    topicNumber: 13,
    title: "Người phụ nữ trên xe bus",
    imageUrl: "/uploads/speaking/part2/image6.png",
    questions: [
      "Describe the picture.",
      "Tell me about a time when you used public transport?",
      "People should use public transport more. Do you agree? Why, or why not?"
    ]
  },
  {
    id: "p2_14",
    topicNumber: 14,
    title: "Người đàn ông đọc báo",
    imageUrl: "/uploads/speaking/part2/image19.png",
    questions: [
      "Describe the picture.",
      "How do most people in your country learn about world news?",
      "How has the reporting of news changed in the last fifty years?"
    ]
  },
  {
    id: "p2_15",
    topicNumber: 15,
    title: "Người qua đường đông đúc",
    imageUrl: "/uploads/speaking/part2/image13.png",
    questions: [
      "Describe the picture.",
      "A time when you were in a crowded place.",
      "Why don't people like crowded places?"
    ]
  },
  {
    id: "p2_16",
    topicNumber: 16,
    title: "Người thuyết trình trước cuộc họp",
    imageUrl: "/uploads/speaking/part2/image4.png",
    questions: [
      "Describe the picture.",
      "Tell us about the time you give a presentation. How did you feel?",
      "Why are people scared of public speaking?"
    ]
  },
  {
    id: "p2_17",
    topicNumber: 17,
    title: "Hai vợ chồng treo tranh",
    imageUrl: "/uploads/speaking/part2/image3.png",
    questions: [
      "Describe the picture.",
      "Tell me about a time you decorated your house.",
      "In modern life, people pay more attention to home decoration than in the past. Do you agree?"
    ]
  },
  {
    id: "p2_18",
    topicNumber: 18,
    title: "Hai bố con chơi với nhau",
    imageUrl: "/uploads/speaking/part2/image14.png",
    questions: [
      "Describe the picture.",
      "Tell me the last time you did an outdoor activity.",
      "Why should people do outdoor activities?"
    ]
  },
  {
    id: "p2_19",
    topicNumber: 19,
    title: "Nhóm người ở rạp chiếu phim",
    imageUrl: "/uploads/speaking/part2/image1.png",
    questions: [
      "Describe the picture.",
      "Tell me a time you laughed a lot.",
      "Do you think people from different countries laugh at different things?"
    ]
  },
  {
    id: "p2_20",
    topicNumber: 20,
    title: "Cô giáo đang dạy học",
    imageUrl: "/uploads/speaking/part2/image17.png",
    questions: [
      "Describe the picture.",
      "What kind of games did you play when you were a child?",
      "Why do children spend time playing?"
    ]
  },
  {
    id: "p2_21",
    topicNumber: 21,
    title: "Nhóm người ở nhà hàng",
    imageUrl: "/uploads/speaking/part2/image8.png",
    questions: [
      "Describe the picture.",
      "Tell me the last time you went to a restaurant with your friends.",
      "Why do people enjoy eating out with their friends?"
    ]
  },
  {
    id: "p2_22",
    topicNumber: 22,
    title: "Gia đình đang sử dụng máy tính",
    imageUrl: "/uploads/speaking/part2/image21.png",
    questions: [
      "Describe the picture.",
      "Tell me the last time you used a computer?",
      "Should children use computers?"
    ]
  },
  {
    id: "p2_23",
    topicNumber: 23,
    title: "Nhóm trẻ nấu ăn trong bếp",
    imageUrl: "/uploads/speaking/part2/image5.png",
    questions: [
      "Describe the picture.",
      "How do people learn to cook in your culture?",
      "Why is it important for people to learn how to cook for themselves?"
    ]
  },
  {
    id: "p2_24",
    topicNumber: 24,
    title: "Cô gái ngồi trên thuyền ngắm cảnh",
    imageUrl: "/uploads/speaking/part2/image20.png",
    questions: [
      "Describe the picture.",
      "Tell us the last time you went to the sea?",
      "Why do some people dislike going to the sea?"
    ]
  },
  {
    id: "p2_25",
    topicNumber: 25,
    title: "Người đàn ông đang đứng đợi tàu",
    imageUrl: "/uploads/speaking/part2/image25.png",
    questions: [
      "Describe the picture.",
      "Tell me about the last time you used public transport.",
      "How can we increase the number of people using public transport?"
    ]
  }
];

// Read existing bank to keep vocab
const currentP2File = path.resolve(__dirname, '../../frontend/src/data/speaking-part2-bank.ts');
const currentP2Content = fs.readFileSync(currentP2File, 'utf8');
const p2Start = currentP2Content.indexOf('= [') + 2;
const p2JsonStr = currentP2Content.substring(p2Start, currentP2Content.lastIndexOf(']') + 1);
const currentP2Data = JSON.parse(p2JsonStr);

const mergedP2 = correctedP2.map((corr, idx) => {
  const existing = currentP2Data[idx];
  return {
    ...corr,
    vocab: existing && existing.vocab ? existing.vocab : []
  };
});

// Write back to speaking-part2-bank.ts
const tsOutput = `// Speaking Part 2 Authentic Question & Picture Bank
// Extracted and normalized from SPEAKING/Tranh trọng điểm part 2.docx

export interface SpeakingVocabItem {
  en: string;
  vi: string;
}

export interface SpeakingPart2Topic {
  id: string;
  topicNumber: number;
  title: string;
  imageUrl: string;
  vocab: SpeakingVocabItem[];
  questions: string[];
}

export const SPEAKING_PART2_BANK: SpeakingPart2Topic[] = ${JSON.stringify(mergedP2, null, 2)};
`;

fs.writeFileSync(currentP2File, tsOutput, 'utf8');
fs.writeFileSync(path.resolve(__dirname, '../../frontend/src/data/speaking-part2-bank.json'), JSON.stringify(mergedP2, null, 2), 'utf8');
console.log('Successfully updated speaking-part2-bank.ts & speaking-part2-bank.json with 25 normalized topics!');
