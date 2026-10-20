const fs = require('fs');
const path = require('path');

const correctedP3 = [
  {
    id: "p3_1",
    topicNumber: 1,
    title: "Tranh vài người leo núi + tranh ở biển 0 người",
    imageUrl: "/uploads/speaking/part3/image5.png",
    questions: [
      "Tell me what you see in the two pictures.",
      "What's so attractive about these two places?",
      "How to protect natural beauty?"
    ]
  },
  {
    id: "p3_2",
    topicNumber: 2,
    title: "Sống cùng gia đình + sống một mình",
    imageUrl: "/uploads/speaking/part3/image6.png",
    questions: [
      "Tell me what you see in the two photographs.",
      "Do you prefer living alone or living with your family?",
      "Is it necessary for young people to live independently from their families?"
    ]
  },
  {
    id: "p3_3",
    topicNumber: 3,
    title: "Tranh 1 người nhìn máy bay + 1 người đứng đợi tàu",
    imageUrl: "/uploads/speaking/part3/image1.jpg",
    questions: [
      "Tell me what you see in the two pictures.",
      "Which means of transport do you prefer? Why?",
      "Why do people usually not choose to travel by plane?"
    ]
  },
  {
    id: "p3_4",
    topicNumber: 4,
    title: "Người thu hoạch táo + người tưới cây",
    imageUrl: "/uploads/speaking/part3/image2.png",
    questions: [
      "Tell me what you see in the two pictures.",
      "What are the attractions of the two pictures?",
      "What is the appeal of growing plants and doing gardening?"
    ]
  },
  {
    id: "p3_5",
    topicNumber: 5,
    title: "Đọc sách truyền thống + đọc sách online",
    imageUrl: "/uploads/speaking/part3/image3.png",
    questions: [
      "Tell me what you see from the two pictures.",
      "Do you prefer reading printed books or e-books?",
      "Does technology affect the way we read books?"
    ]
  },
  {
    id: "p3_6",
    topicNumber: 6,
    title: "Mua sắm trong siêu thị + mua sắm trong chợ",
    imageUrl: "/uploads/speaking/part3/image14.png",
    questions: [
      "Tell me what you see in the two pictures.",
      "Benefits of markets and supermarkets?",
      "Why do many people not like shopping?"
    ]
  },
  {
    id: "p3_7",
    topicNumber: 7,
    title: "Cô gái nghe nhạc trên sofa + ban nhạc đang chơi nhạc",
    imageUrl: "/uploads/speaking/part3/image9.png",
    questions: [
      "Compare 2 pictures.",
      "Which would you prefer to be in?",
      "What are the benefits of listening to music?"
    ]
  },
  {
    id: "p3_8",
    topicNumber: 8,
    title: "Ăn đồ ăn nhanh + nấu ăn healthy",
    imageUrl: "/uploads/speaking/part3/image11.png",
    questions: [
      "Tell me what you see in the two pictures.",
      "Which kind of food in those pictures is healthier?",
      "What are the benefits of them?"
    ]
  },
  {
    id: "p3_9",
    topicNumber: 9,
    title: "Cặp đôi dưới tuyết + hai cô gái tắm nắng",
    imageUrl: "/uploads/speaking/part3/image13.png",
    questions: [
      "Tell me what you see in the two pictures.",
      "Between the two locations, where do you prefer to go? Why?",
      "Do you think the weather affects people’s emotions on trips?"
    ]
  },
  {
    id: "p3_10",
    topicNumber: 10,
    title: "Người đàn ông tập gym + hai người đi leo núi",
    imageUrl: "/uploads/speaking/part3/image12.png",
    questions: [
      "Please describe the 2 pictures.",
      "What the difference of these two exercises?",
      "How important is it to do daily exercises?"
    ]
  },
  {
    id: "p3_11",
    topicNumber: 11,
    title: "Bóng rổ xe lăn + quần vợt (Thể thao chuyên nghiệp & nghiệp dư)",
    imageUrl: "/uploads/speaking/part3/image15.png",
    questions: [
      "Tell me what you see in the two pictures.",
      "What are the benefits of indoor and outdoor sports?",
      "Playing a game is to win. What do you think ?"
    ]
  },
  {
    id: "p3_12",
    topicNumber: 12,
    title: "Cặp tranh so sánh các hoạt động",
    imageUrl: "/uploads/speaking/part3/image10.png",
    questions: [
      "Tell me what you see in the two pictures."
    ]
  }
];

const currentP3File = path.resolve(__dirname, '../../frontend/src/data/speaking-part3-bank.ts');
const currentP3Content = fs.readFileSync(currentP3File, 'utf8');
const p3Start = currentP3Content.indexOf('= [') + 2;
const p3JsonStr = currentP3Content.substring(p3Start, currentP3Content.lastIndexOf(']') + 1);
const currentP3Data = JSON.parse(p3JsonStr);

const mergedP3 = correctedP3.map((corr, idx) => {
  const existing = currentP3Data[idx];
  return {
    ...corr,
    vocab: existing && existing.vocab ? existing.vocab : []
  };
});

const tsOutput = `// Speaking Part 3 Authentic Picture Comparison Bank
// Extracted and normalized from SPEAKING/Tranh trọng điểm part 3.docx

export interface SpeakingPart3Topic {
  id: string;
  topicNumber: number;
  title: string;
  imageUrl: string;
  vocab: { en: string; vi: string }[];
  questions: string[];
}

export const SPEAKING_PART3_BANK: SpeakingPart3Topic[] = ${JSON.stringify(mergedP3, null, 2)};
`;

fs.writeFileSync(currentP3File, tsOutput, 'utf8');
console.log('Successfully updated speaking-part3-bank.ts!');
