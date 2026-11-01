/**
 * Dữ liệu chuẩn cho tính năng Key và Mẹo Thi Aptis - Listening (Part 1 - 4)
 * Dữ liệu thực 100% trích xuất từ tài liệu [Cải Thiện Web TA.docx] & Google Docs.
 * Tuyệt đối không phỏng đoán, không fallback bịa đặt.
 */

export interface Part1Question {
  id: string;
  number: number;
  question: string;
  answer: string;
  isNew?: boolean;
}

export interface Part1Category {
  id: string;
  num: string;
  label: string;
  isNew?: boolean;
}

export interface Part2Row {
  targetAnswer: string;
  targetAnswerVn: string;
  audioScript: string;
  keywords: string[];
}

export interface Part2Topic {
  id: string;
  topicNumber: number;
  title: string;
  cloverCount: number;
  isPendingDoc?: boolean;
  rows: Part2Row[];
}

export interface Part3Item {
  stt: number;
  topic: string;
  code: string;
  femaleFirst: ("W" | "B" | "M")[];
  maleFirst: ("M" | "B" | "W")[];
  story: string;
}

export interface Part4Topic {
  id: string;
  title: string;
  cloverCount: number;
  question1: string;
  answer1: string;
  question2: string;
  answer2: string;
  quickTip: string;
}

export const LISTENING_PART1_CATEGORIES: Part1Category[] = [
  {
    "id": "time",
    "num": "01",
    "label": "Thời gian",
    "isNew": false
  },
  {
    "id": "day_date",
    "num": "02",
    "label": "Thứ / Ngày",
    "isNew": false
  },
  {
    "id": "price",
    "num": "03",
    "label": "Giá tiền",
    "isNew": false
  },
  {
    "id": "transport",
    "num": "04",
    "label": "Phương tiện",
    "isNew": false
  },
  {
    "id": "location",
    "num": "05",
    "label": "Địa điểm / Phương hướng",
    "isNew": false
  },
  {
    "id": "people_job",
    "num": "06",
    "label": "Người / Nghề nghiệp",
    "isNew": false
  },
  {
    "id": "quantity_number",
    "num": "07",
    "label": "Số lượng / Con số",
    "isNew": false
  },
  {
    "id": "objects",
    "num": "08",
    "label": "Đồ vật",
    "isNew": false
  },
  {
    "id": "actions",
    "num": "09",
    "label": "Hành động / Hoạt động",
    "isNew": true
  }
];

export const LISTENING_PART1_DATA: Record<string, Part1Question[]> = {
  "time": [
    {
      "id": "p1-q01",
      "number": 1,
      "question": "When did they decide to meet?",
      "answer": "9am on Sunday",
      "isNew": false
    },
    {
      "id": "p1-q02",
      "number": 2,
      "question": "When do the students play football?",
      "answer": "Wednesday afternoon",
      "isNew": false
    },
    {
      "id": "p1-q03",
      "number": 3,
      "question": "A woman is discussing a work meeting with a colleague. What time will the meeting begin?",
      "answer": "10.15",
      "isNew": false
    },
    {
      "id": "p1-q04",
      "number": 4,
      "question": "What time will they meet for lunch?",
      "answer": "1:30",
      "isNew": true
    },
    {
      "id": "p1-q05",
      "number": 5,
      "question": "What time will they meet?",
      "answer": "5:30",
      "isNew": true
    },
    {
      "id": "p1-q06",
      "number": 6,
      "question": "What time will the speaker set the alarm for?",
      "answer": "7:00",
      "isNew": true
    },
    {
      "id": "p1-q07",
      "number": 7,
      "question": "Two people are talking about meeting for dinner. What time does Ahmed meet Rose?",
      "answer": "quarter to eight",
      "isNew": false
    },
    {
      "id": "4fad8156-bb83-4620-8835-a2686efb570d",
      "number": 8,
      "question": "How much are the eggs?",
      "answer": "1.50 pounds",
      "isNew": true
    },
    {
      "id": "77eb0890-70a0-4dbf-ba8c-3935c6c136a2",
      "number": 9,
      "question": "A woman is calling her husband. What time is lunch ready?",
      "answer": "2pm",
      "isNew": false
    },
    {
      "id": "505e0685-12aa-453f-ba20-fdfa21cbb3e8",
      "number": 10,
      "question": "Listen to the announcement. When does the train leave the station?",
      "answer": "9:15",
      "isNew": true
    },
    {
      "id": "a05a5c07-2c48-4318-9f70-00f6192bbd32",
      "number": 11,
      "question": "A man is calling his colleague about a meeting with clients. When will the meeting start?",
      "answer": "at 10.15",
      "isNew": false
    },
    {
      "id": "d436d261-7892-4a69-a68b-58a03982ddde",
      "number": 12,
      "question": "Jane is calling her friend Martha. What time are they going to meet?",
      "answer": "5.30",
      "isNew": true
    }
  ],
  "day_date": [
    {
      "id": "5fe971c6-ff22-4cb8-8ba9-ec4399714fba",
      "number": 1,
      "question": "Two colleagues talk about meeting. When do they want to meet?",
      "answer": "Tuesday",
      "isNew": false
    },
    {
      "id": "4eed26b8-0bae-45fe-be7a-f4b6955bde5e",
      "number": 2,
      "question": "When is the assignment due?",
      "answer": "on Saturday",
      "isNew": false
    },
    {
      "id": "2a847c06-1b35-482f-a81f-ae31710ba9d6",
      "number": 3,
      "question": "Julie is asking her professor about the assignment. When is the work due?",
      "answer": "On Saturday morning",
      "isNew": false
    },
    {
      "id": "f1175e2b-12b8-4e90-8963-206d45c4ad74",
      "number": 4,
      "question": "Doctor's office is calling to change the appointment. When is the new appointment?",
      "answer": "On Thursday 13th",
      "isNew": true
    },
    {
      "id": "9770df9b-fdf7-4cba-86fa-9d3b9a20736d",
      "number": 5,
      "question": "Doctor’s office is calling about a change in the appointment. When is the new appointment?",
      "answer": "Thursday 13th",
      "isNew": false
    },
    {
      "id": "96a5f2f9-513b-4c70-9586-88e820d2a28f",
      "number": 6,
      "question": "A man is calling his teacher to meet for the assignment. When is the meeting?",
      "answer": "On Thursday morning",
      "isNew": true
    },
    {
      "id": "70a9d182-d823-4785-b11c-e4f13c1060bd",
      "number": 7,
      "question": "Listen to the speaker talking about their weekly schedule. When is the meeting scheduled?",
      "answer": "Wednesday afternoon",
      "isNew": false
    },
    {
      "id": "91b76f45-c62c-46a3-b26c-42403c45fe47",
      "number": 8,
      "question": "When did they decide to meet?",
      "answer": "9am on Sunday",
      "isNew": true
    },
    {
      "id": "72245b00-dfd1-4582-86c3-2887084193ff",
      "number": 9,
      "question": "Adam is calling his friend. When will he need the computer?",
      "answer": "Friday",
      "isNew": false
    },
    {
      "id": "40a071ac-fd4b-464d-9614-52d7e024b532",
      "number": 10,
      "question": "Two college students are talking. When does the football match usually take place?",
      "answer": "On Wednesday afternoon",
      "isNew": true
    },
    {
      "id": "e726ce6b-a3a3-4248-be56-ea8dc21665dd",
      "number": 11,
      "question": "Two friends are arranging to meet. When will they meet?",
      "answer": "On Friday",
      "isNew": false
    },
    {
      "id": "44f77e67-84df-44b0-b1ee-19915753df6f",
      "number": 12,
      "question": "A man is asking his colleague about a meeting. When does the meeting take place?",
      "answer": "Tuesday",
      "isNew": true
    },
    {
      "id": "d7d213c7-ddf8-4264-b3b4-a3b8d7a75497",
      "number": 13,
      "question": "A student is talking to her teacher. When is the assignment due?",
      "answer": "Saturday",
      "isNew": false
    },
    {
      "id": "1eed800f-b4ad-451d-bbfb-4d5e9c93e84b",
      "number": 14,
      "question": "When do they meet each other?",
      "answer": "On Thursday morning",
      "isNew": true
    },
    {
      "id": "734f8c7c-36db-43a0-b32e-d79eb20a0958",
      "number": 15,
      "question": "When will Anna meet her friend? / A man is calling his friend, Maria. When will he see her?",
      "answer": "9am on Sunday",
      "isNew": false
    }
  ],
  "price": [
    {
      "id": "c056a51a-18e2-44f0-9211-8824adfe5bc9",
      "number": 1,
      "question": "Max is calling his friend. How much can Max pay for the computer?",
      "answer": "250 pounds",
      "isNew": false
    },
    {
      "id": "8c216663-6692-4562-8461-688801bc605d",
      "number": 2,
      "question": "Listen to a woman asking about a flight. How much does the flight in the morning cost?",
      "answer": "350 pounds",
      "isNew": false
    },
    {
      "id": "792e4d17-703c-4849-b696-c48141f548e7",
      "number": 3,
      "question": "How much can Max pay for the computer?",
      "answer": "250 pounds",
      "isNew": false
    },
    {
      "id": "0f117f08-52f8-45e6-9838-06f408cf0087",
      "number": 4,
      "question": "The woman is discussing her new exercise routine. How much time does she spend cycling?",
      "answer": "35 minutes",
      "isNew": true
    },
    {
      "id": "b34e751c-f915-48f2-a678-f4966edf8e96",
      "number": 5,
      "question": "How much does a bus card cost?",
      "answer": "$20",
      "isNew": false
    },
    {
      "id": "4de3f9be-26e9-4f2e-9045-bfcb7e3e1f21",
      "number": 6,
      "question": "How much money is left in the kitchen?",
      "answer": "10 pounds",
      "isNew": true
    },
    {
      "id": "68786786-c0a9-4774-849b-cef58ef64815",
      "number": 7,
      "question": "The woman is walking into a local store. How much are the cleaning products?",
      "answer": "One pound fifty",
      "isNew": false
    },
    {
      "id": "68752970-2472-4c9f-8a92-1c4193d0caec",
      "number": 8,
      "question": "How much does the book cost?",
      "answer": "£11",
      "isNew": true
    },
    {
      "id": "c2e8bd02-26de-4f95-9cea-455601a197ff",
      "number": 9,
      "question": "Laila is calling her mum. How much is the bus ticket?",
      "answer": "Two pounds fifty",
      "isNew": false
    },
    {
      "id": "e88a3f6a-a69d-470f-91ad-7a722d1e7740",
      "number": 10,
      "question": "A man is talking about his new job. How much is the bus fare?",
      "answer": "$20",
      "isNew": true
    },
    {
      "id": "19b235af-0585-4ac2-b794-3fccc727d8b8",
      "number": 11,
      "question": "Listen to a friend talking about selling her music player. How much did she sell it for?",
      "answer": "50 dollars",
      "isNew": false
    },
    {
      "id": "81581455-3e46-492b-87c0-019f56145321",
      "number": 12,
      "question": "A saleswoman is talking to her customer. How much is the cheapest computer in the shop?",
      "answer": "£135",
      "isNew": true
    },
    {
      "id": "9953a9c0-bb53-4d42-8c30-04d3270b577b",
      "number": 13,
      "question": "A person calls a friend about his new car. What is the price of the small car?",
      "answer": "3,250 pounds",
      "isNew": false
    }
  ],
  "transport": [
    {
      "id": "490bbf83-13b1-4e72-9db9-d3834015d4d5",
      "number": 1,
      "question": "Listen to a woman explaining why she was late. What is the main reason she gets late?",
      "answer": "Missed the train",
      "isNew": false
    },
    {
      "id": "4e983bcc-c3e8-4ace-8200-9dc355365d0d",
      "number": 2,
      "question": "Listen to a man talking about his journey to work. How does the man usually go to work?",
      "answer": "By car",
      "isNew": false
    },
    {
      "id": "e4d3ea1f-c8b4-4fdb-a23c-938dc0020ed7",
      "number": 3,
      "question": "Listen to a woman explaining why he was late. What is the main reason he gets late?",
      "answer": "Missed the train",
      "isNew": false
    },
    {
      "id": "b83c0e83-41a0-437a-8ac1-45b085f800d4",
      "number": 4,
      "question": "A teacher and a student are talking about transportation. How does the teacher go to school?",
      "answer": "He walks",
      "isNew": true
    },
    {
      "id": "cfa0d6a9-40c1-4554-9e0e-19663ff10931",
      "number": 5,
      "question": "How does he travel?",
      "answer": "By train",
      "isNew": false
    },
    {
      "id": "2e59c390-ef2c-4d0f-9516-63c26569b920",
      "number": 6,
      "question": "How is traveling similar to reading a book?",
      "answer": "Both help people discover new worlds and grow as a person.",
      "isNew": true
    },
    {
      "id": "6ad5980d-9653-4de6-88d5-b03d8bc1cee5",
      "number": 7,
      "question": "What is the new health center next to?",
      "answer": "A train station",
      "isNew": false
    },
    {
      "id": "c5714f99-253c-482f-8007-2d99a14625a0",
      "number": 8,
      "question": "A man is talking about how he goes to work. Why does he prefer traveling by train?",
      "answer": "Practical",
      "isNew": true
    },
    {
      "id": "df066211-9418-4d6a-91a5-b30f9cf11268",
      "number": 9,
      "question": "A woman is talking about her plan for the holiday. What will she do during the holiday?",
      "answer": "Go for a walk",
      "isNew": false
    },
    {
      "id": "738a5c38-9dc1-4f7b-a03c-a0ac9cdfe6c9",
      "number": 10,
      "question": "A man is talking about his holiday. How is he going to travel to the city?",
      "answer": "By bus",
      "isNew": true
    },
    {
      "id": "53a8e4d6-40bc-4b3e-be43-7c19216e3138",
      "number": 11,
      "question": "Lily is talking about her daily routine. What does she do in the evening?",
      "answer": "Goes for a walk",
      "isNew": false
    },
    {
      "id": "10df74da-e6cb-439d-81fe-1005ce515228",
      "number": 12,
      "question": "A man is talking about his family's weekends. What does the family do most weekends?",
      "answer": "They go for a walk",
      "isNew": true
    },
    {
      "id": "e526b664-7de3-47e1-85ae-96d9fd8b7e7c",
      "number": 13,
      "question": "Greg is talking about a working day in his life. How does he go to work?",
      "answer": "By bus",
      "isNew": false
    },
    {
      "id": "a017d28f-b575-4c6c-8f32-95865ef83e20",
      "number": 14,
      "question": "How does she usually get to work?",
      "answer": "By bicycle",
      "isNew": true
    },
    {
      "id": "21d2c776-623c-4ed9-a2f3-3095237e0ba9",
      "number": 15,
      "question": "A woman is talking about her family’s weekend. What does the family do most weekends?",
      "answer": "Go for a walk",
      "isNew": false
    }
  ],
  "location": [
    {
      "id": "fe143bfa-4766-4731-a173-c854307e9092",
      "number": 1,
      "question": "Listen to a girl calling the cafe. Where did she ask the coffee shop to look for her lost item?",
      "answer": "In the corner",
      "isNew": false
    },
    {
      "id": "7274f2e5-7b0a-4dbf-adf5-4fc08894651c",
      "number": 2,
      "question": "Where do they go when they travel to India?",
      "answer": "Go to the park",
      "isNew": false
    },
    {
      "id": "4ed729ad-3116-45db-ab10-60ad3a3fe6b2",
      "number": 3,
      "question": "Where did they meet?",
      "answer": "The front entrance",
      "isNew": false
    },
    {
      "id": "2a69b24b-820e-4842-b721-25f742dafce7",
      "number": 4,
      "question": "A teacher is talking to her students. Where are the students now?",
      "answer": "In a townhouse",
      "isNew": true
    },
    {
      "id": "bd2cf3a5-dcad-4879-9e3c-c943d3e6266a",
      "number": 5,
      "question": "Where does he want to go tomorrow?",
      "answer": "The town hall",
      "isNew": false
    },
    {
      "id": "cc457ee8-0bd0-45fd-bd01-be4bbda3d0dd",
      "number": 6,
      "question": "A man is calling his wife. Where do the couple meet?",
      "answer": "Outside a shop",
      "isNew": true
    },
    {
      "id": "afd85c22-e0aa-4041-9a22-958a70ea626e",
      "number": 7,
      "question": "A man is calling his wife. Where will they meet?",
      "answer": "Outside the shop",
      "isNew": false
    },
    {
      "id": "89d58f3c-1a87-42e2-b68c-b3f1f419bbfe",
      "number": 8,
      "question": "A student is talking about housing. Where does he live now?",
      "answer": "In a town hall",
      "isNew": true
    },
    {
      "id": "e4a5008d-4d02-4a53-b80a-cdea6c2a181b",
      "number": 9,
      "question": "Listen to a tour guide. Where is the office located?",
      "answer": "Opposite the hotel",
      "isNew": false
    },
    {
      "id": "eb672cc0-4f2d-4371-847b-6dcda98c7798",
      "number": 10,
      "question": "Listen to the woman talking about her holiday plans. Where is she going next?",
      "answer": "The south",
      "isNew": true
    },
    {
      "id": "2751bc2f-2465-4fa0-aff2-edad15564ca3",
      "number": 11,
      "question": "Listening to a woman's announcement. Where will they wait for the bus?",
      "answer": "By the hotel's main entrance",
      "isNew": false
    },
    {
      "id": "8c878c91-727c-4d03-8ab2-bf7cc2151d80",
      "number": 12,
      "question": "A man is talking about his job. Where is he working now?",
      "answer": "In a bank",
      "isNew": true
    },
    {
      "id": "95948164-ad17-45bd-82fd-a3ac17686a08",
      "number": 13,
      "question": "The man is talking about his key. Where did he find the key?",
      "answer": "In the front door",
      "isNew": false
    },
    {
      "id": "b714a139-d8aa-4aa3-846c-96cf763981d0",
      "number": 14,
      "question": "In which room will the director's presentation happen?",
      "answer": "The meeting room",
      "isNew": true
    },
    {
      "id": "73769c38-5a6b-4afa-918f-0fca4f514dc9",
      "number": 15,
      "question": "On which floor is the French class?",
      "answer": "Second",
      "isNew": false
    }
  ],
  "people_job": [
    {
      "id": "6618b6ea-6d5e-45f8-9bdd-f64ccd62a4f3",
      "number": 1,
      "question": "What did she advice for people who lack motivation at work?",
      "answer": "Request a transfer",
      "isNew": false
    },
    {
      "id": "16a3710a-1dcd-445d-b060-7e40ddbe3ae2",
      "number": 2,
      "question": "Listen to the conversation. Who is she taking a photo of?",
      "answer": "The girl's team",
      "isNew": false
    },
    {
      "id": "ac59ff1d-5a1d-40db-8d72-6ebb7f20489e",
      "number": 3,
      "question": "Listen to a writer talking about her job. What is her first job?",
      "answer": "Teacher",
      "isNew": false
    },
    {
      "id": "8bf257d0-3f7c-47cc-908b-956d102ddce2",
      "number": 4,
      "question": "Tom is calling his mom. Who is visiting Tom this weekend?",
      "answer": "His sister and her children",
      "isNew": true
    },
    {
      "id": "65754416-7e04-43a2-9e2f-298f5219804f",
      "number": 5,
      "question": "Home education can benefit children whose circumstances make a fixed school timetable difficult",
      "answer": "Both",
      "isNew": false
    },
    {
      "id": "f67430fe-5be7-439f-bf07-8a78df2cb164",
      "number": 6,
      "question": "A woman is asking a colleague about some work. Why can't the man finish the work today?",
      "answer": "He doesn't have a colleague to work with.",
      "isNew": true
    },
    {
      "id": "beb7910b-f993-4827-90af-7442aafd5e78",
      "number": 7,
      "question": "A father is talking to his son's teacher. What does the teacher offer to do?",
      "answer": "Help find a private teacher",
      "isNew": false
    },
    {
      "id": "7469d39f-599b-411c-aa2d-2d17d1922697",
      "number": 8,
      "question": "John is telling his friend about his teachers. Who is his favourite teacher?",
      "answer": "Miss Brown",
      "isNew": true
    },
    {
      "id": "a4eb4c11-f831-48e2-bff0-c4a90acbfb5e",
      "number": 9,
      "question": "How are the two of them connected?",
      "answer": "Best friend",
      "isNew": false
    },
    {
      "id": "4d1983ff-a700-4fbc-ac70-be265833fa60",
      "number": 10,
      "question": "Who does she live with? / A woman is talking about her vacation. What is the relationship between Lisa and the speaker?",
      "answer": "Best friends",
      "isNew": true
    }
  ],
  "quantity_number": [
    {
      "id": "5f47e574-4b32-461e-a5c3-1bf9f3d93b17",
      "number": 1,
      "question": "A receptionist is checking the client list of a clinic. How many American clients are there?",
      "answer": "One",
      "isNew": false
    },
    {
      "id": "141e3c3a-c9f0-4887-8918-7829d54c2298",
      "number": 2,
      "question": "How many people live in the town?",
      "answer": "10,000",
      "isNew": false
    },
    {
      "id": "bda6b589-e40c-44b3-b8e7-683276a587cf",
      "number": 3,
      "question": "A tour guide is introducing a tourist destination. How many people live in the town?",
      "answer": "10,000",
      "isNew": false
    },
    {
      "id": "ca71e50e-44c1-45ae-921e-858c34060d97",
      "number": 4,
      "question": "A woman is talking about her babysitter. How old is the babysitter?",
      "answer": "21",
      "isNew": true
    },
    {
      "id": "c406434e-6f14-44eb-96e9-eee882d4d3d5",
      "number": 5,
      "question": "How many weeks did they spend in India?",
      "answer": "Two weeks",
      "isNew": false
    },
    {
      "id": "948d30ed-05dd-4139-ab29-7b1e14dc360a",
      "number": 6,
      "question": "A man is reading the news about a housing development plan. How many new houses are going to be built?",
      "answer": "2000",
      "isNew": true
    },
    {
      "id": "1b52880d-af1a-46ad-9c11-c03c7b9d0f58",
      "number": 7,
      "question": "How many pages of the assignment?",
      "answer": "4",
      "isNew": false
    },
    {
      "id": "a724746c-ffe3-48ee-a506-bf28d26b5af2",
      "number": 8,
      "question": "Listen to the director talking about sales of his company. How many copies of Freeze Frame magazine were sold?",
      "answer": "Over 300,000 copies",
      "isNew": true
    },
    {
      "id": "e8aa38ae-cdbf-4254-92bf-f5108baa3890",
      "number": 9,
      "question": "A woman is discussing with her team. How many chairs does she need?",
      "answer": "20",
      "isNew": false
    },
    {
      "id": "f341a7e4-861c-4fcc-8e2e-271f12d67cfe",
      "number": 10,
      "question": "A man calls the teleshop. What is the teleshop number?",
      "answer": "201030",
      "isNew": true
    },
    {
      "id": "f3675620-60ce-49e9-ae31-29e5cdc63cfa",
      "number": 11,
      "question": "Stephanie is calling about a childcare job. How old is Stephanie?",
      "answer": "21",
      "isNew": false
    },
    {
      "id": "5ae6959f-f3e6-4cfd-9924-7e9235cfe5c2",
      "number": 12,
      "question": "A man is talking about moving house. How many bedrooms does the new house have?",
      "answer": "Four",
      "isNew": true
    },
    {
      "id": "1c7ad6bc-49ea-4872-bc81-d9d0bcf80e90",
      "number": 13,
      "question": "Stephanie is looking for a job taking care of children. How old is she?",
      "answer": "21",
      "isNew": false
    },
    {
      "id": "283cda23-5fec-49eb-b224-8e96e296ea96",
      "number": 14,
      "question": "What is the phone number of the store? (0080...) / A man calls the teleshop. What is the teleshop number?",
      "answer": "201030",
      "isNew": true
    },
    {
      "id": "728a8642-0e83-42ca-ace0-7148b9a01668",
      "number": 15,
      "question": "Roughly how many issues of the magazine come out each summer?",
      "answer": "Just over 300,000 copies",
      "isNew": false
    }
  ],
  "objects": [
    {
      "id": "d76a659a-6fdd-48cc-8ecc-a6c832f6ffa2",
      "number": 1,
      "question": "Listen to a person talking about a picnic. What did the speaker bring?",
      "answer": "Fruit",
      "isNew": false
    },
    {
      "id": "a0b79235-5250-430a-8539-fb3696033c0e",
      "number": 2,
      "question": "What color top is he going to buy?",
      "answer": "Black",
      "isNew": false
    },
    {
      "id": "b93b036b-3e20-427d-bf32-7a534e78f074",
      "number": 3,
      "question": "Pierre and Emma are talking together about the picnic on the weekend. What will they bring to the picnic?",
      "answer": "Food",
      "isNew": false
    },
    {
      "id": "d355d0c8-7e42-4431-8470-3a57c5b88d2d",
      "number": 4,
      "question": "A man is talking to the shopping assistant. What color top does he buy?",
      "answer": "Black",
      "isNew": true
    },
    {
      "id": "f4d7f7af-ea17-4216-b68a-b64c6f7051a3",
      "number": 5,
      "question": "Listen to a student talking about his study. What course is the student going to take this year?",
      "answer": "Computer",
      "isNew": false
    },
    {
      "id": "b31c8d7e-8f8d-4048-b9a5-98667708a1c6",
      "number": 6,
      "question": "Listen to a woman talking about what she has just bought. What is Dress she wears like?",
      "answer": "long and red",
      "isNew": true
    },
    {
      "id": "0da06bff-45ff-4532-8b69-63291a38a651",
      "number": 7,
      "question": "A man is talking to a shop assistant. What does the man buy in the shop?",
      "answer": "Candles",
      "isNew": false
    },
    {
      "id": "3d5757b9-aa04-407c-a4d3-1bc1894b516e",
      "number": 8,
      "question": "What will they bring to the picnic?",
      "answer": "Food",
      "isNew": true
    },
    {
      "id": "d8529dd0-dc7b-4988-9fc8-21e183f21498",
      "number": 9,
      "question": "Jack is phoning his mom. What does Jack need to buy for his sister?",
      "answer": "Chocolates",
      "isNew": false
    },
    {
      "id": "10f5e363-668c-4b61-8966-7147ffaf7a58",
      "number": 10,
      "question": "A man wants to buy a new house. What is his biggest problem?",
      "answer": "Persuading his family",
      "isNew": true
    },
    {
      "id": "9589a4e3-3722-4468-9975-36f5e043406d",
      "number": 11,
      "question": "A man is talking to a shopping assistant. What color top is he going to buy?",
      "answer": "Black",
      "isNew": false
    },
    {
      "id": "af10faa9-ab68-4c4e-b0ed-449190aa9d9e",
      "number": 12,
      "question": "What bus number should the girl take?",
      "answer": "eight",
      "isNew": true
    },
    {
      "id": "e0f739ff-4ebf-4e86-850d-1a0c6d152b6c",
      "number": 13,
      "question": "Jose is calling his friend about tomorrow. What will Luis and Emma bring?",
      "answer": "Food",
      "isNew": false
    },
    {
      "id": "9ece0907-eb0a-4432-ad5e-6efdbc3c6077",
      "number": 14,
      "question": "The daughter is calling her father. What did she buy?",
      "answer": "A dress",
      "isNew": true
    },
    {
      "id": "0fcec3c3-f30b-4adf-a334-902aa9aabb24",
      "number": 15,
      "question": "A man is buying shoes. What colour shoes did he choose?",
      "answer": "Blue",
      "isNew": false
    }
  ],
  "actions": [
    {
      "id": "c2ab0cb4-5331-45a6-a1b0-d503df7149b4",
      "number": 1,
      "question": "Speaker A",
      "answer": "Shopping online",
      "isNew": false
    },
    {
      "id": "5d30e76f-7cf3-43f0-a18f-bc73c98a0544",
      "number": 2,
      "question": "Speaker B",
      "answer": "Using less water",
      "isNew": false
    },
    {
      "id": "7242bd2b-1072-494e-bae8-f32d9088a43d",
      "number": 3,
      "question": "Speaker C",
      "answer": "Using less electricity",
      "isNew": false
    },
    {
      "id": "486d8a4d-d882-41c0-bb7c-431d9c842b93",
      "number": 4,
      "question": "Speaker D",
      "answer": "Not driving to work",
      "isNew": true
    },
    {
      "id": "06f40a9d-7bf8-472c-b819-7a8f5ab44fbd",
      "number": 5,
      "question": "What does the speaker say about the way of writing?",
      "answer": "It is exciting to read",
      "isNew": false
    },
    {
      "id": "bb1bd0f9-24e3-4d5e-b792-04ec382e6c52",
      "number": 6,
      "question": "Listen to a voice message. How does Evan feel?",
      "answer": "Sick",
      "isNew": true
    },
    {
      "id": "331d22a8-670f-4353-a466-42da68add173",
      "number": 7,
      "question": "A man is talking about his jobs. What does the man want to do next?",
      "answer": "Become a writer",
      "isNew": false
    },
    {
      "id": "863bfb49-39a2-4a2b-bc7d-2793d65a80e5",
      "number": 8,
      "question": "What will she do?",
      "answer": "Go for a drive",
      "isNew": true
    },
    {
      "id": "ab8b6cd9-2444-4efb-ae0a-75be271e22bb",
      "number": 9,
      "question": "A woman is talking about her old manager. Why did she like George?",
      "answer": "He taught her a lot",
      "isNew": false
    },
    {
      "id": "885da166-0d00-4b3b-b38d-30ee0822f0c2",
      "number": 10,
      "question": "A woman is talking about her job. How is being an artist different from other jobs?",
      "answer": "She works at irregular times",
      "isNew": true
    },
    {
      "id": "1ddee567-ef2a-4741-be92-13942f6a1147",
      "number": 11,
      "question": "What is the way to exercise? / What is she going to do? / What does she do on her holidays?",
      "answer": "Walking",
      "isNew": false
    },
    {
      "id": "a43e2271-5766-45b6-a563-9d310b7a5b3a",
      "number": 12,
      "question": "What country will they study next semester?",
      "answer": "France",
      "isNew": true
    },
    {
      "id": "1db489dd-d4af-4e21-a4e1-fb0a06feb973",
      "number": 13,
      "question": "What does he advise young people to do to save money?",
      "answer": "Cook for yourself",
      "isNew": false
    },
    {
      "id": "bb0fc6ef-e258-443a-ab43-c8b79e3a3b01",
      "number": 14,
      "question": "A woman is chatting with a friend about her afternoon plans. What is she going to do this afternoon?",
      "answer": "Go on a city tour",
      "isNew": true
    },
    {
      "id": "afb18d01-0d97-4a0c-ad2e-d253f280f6ae",
      "number": 15,
      "question": "Aman is ordering a drink. What does he want?",
      "answer": "Iced tea",
      "isNew": false
    }
  ]
};

export const LISTENING_PART2_TOPICS: Part2Topic[] = [
  {
    "id": "p2-t03",
    "topicNumber": 3,
    "title": "Doing exercises (Version 1) (2026)",
    "cloverCount": 3,
    "isPendingDoc": true,
    "rows": []
  },
  {
    "id": "p2-t04",
    "topicNumber": 4,
    "title": "Doing exercises (Version 2) (2026)",
    "cloverCount": 3,
    "isPendingDoc": true,
    "rows": []
  },
  {
    "id": "p2-t10",
    "topicNumber": 10,
    "title": "Online shopping (Version 1) (2026)",
    "cloverCount": 3,
    "isPendingDoc": true,
    "rows": []
  },
  {
    "id": "p2-t17",
    "topicNumber": 17,
    "title": "Protecting the environment (Version 1) (2026)",
    "cloverCount": 3,
    "isPendingDoc": false,
    "rows": [
      {
        "targetAnswer": "Does not use commercial cleaning products",
        "targetAnswerVn": "Không sử dụng các chất tẩy rửa thương mại",
        "audioScript": "I don't use commercial cleaning products anymore. I make my own natural scrubs and sprays from vinegar and baking soda. It is actually much cheaper and better for the family.",
        "keywords": [
          "natural products (sản phẩm tự nhiên)",
          "not purchasing chemical cleaning solutions (không mua chất tẩy rửa hóa học)",
          "stopped buying commercial cleaning products"
        ]
      },
      {
        "targetAnswer": "Give away used items",
        "targetAnswerVn": "Tặng / quyên góp đồ đã qua sử dụng",
        "audioScript": "When I have old clothes, books, or household items that I don't need, I never throw them away. Instead, I give away used items to charity or friends who might use them.",
        "keywords": [
          "donate to charity organizations (quyên góp cho các tổ chức từ thiện)",
          "give away my old items (tặng đồ cũ của tôi)",
          "makes me feel happier (cảm thấy vui vẻ hơn)"
        ]
      },
      {
        "targetAnswer": "Buy environmentally friendly products",
        "targetAnswerVn": "Mua sản phẩm thân thiện với môi trường",
        "audioScript": "My family try to buy environmentally friendly products. Even if they are slightly more expensive, we make sure they have eco-labels, are biodegradable, or made from recycled materials.",
        "keywords": [
          "buying eco-friendly products (mua sản phẩm thân thiện với môi trường)",
          "protecting the Earth (bảo vệ trái đất)",
          "made from recycled materials (làm từ vật liệu tái chế)"
        ]
      },
      {
        "targetAnswer": "Reuse containers for storing food",
        "targetAnswerVn": "Tái sử dụng hộp/túi đựng thức ăn",
        "audioScript": "Instead of buying new plastic containers, I just wash and reuse containers for storing food. Glass jars from sauce and takeaway plastic boxes are perfect for leftover meals.",
        "keywords": [
          "reuse them to store food (tái sử dụng chúng để trữ thức ăn)",
          "wasting food containers (lãng phí hộp đựng)",
          "glass jars, bottles (lọ thủy tinh, chai lọ)"
        ]
      }
    ]
  },
  {
    "id": "p2-t18",
    "topicNumber": 18,
    "title": "Protecting the environment (Version 2) (2026)",
    "cloverCount": 3,
    "isPendingDoc": true,
    "rows": []
  },
  {
    "id": "p2-t19",
    "topicNumber": 19,
    "title": "Reading books (Version 1) (2026)",
    "cloverCount": 3,
    "isPendingDoc": true,
    "rows": []
  },
  {
    "id": "p2-t27",
    "topicNumber": 27,
    "title": "Studying (Version 1) (2026)",
    "cloverCount": 3,
    "isPendingDoc": true,
    "rows": []
  },
  {
    "id": "p2-t20",
    "topicNumber": 20,
    "title": "Transportation to work (Version 1) (2026)",
    "cloverCount": 3,
    "isPendingDoc": true,
    "rows": []
  }
];

export const LISTENING_PART3_RULES = [
  {
    badge: "50%",
    title: "MẸO CHẮC ĂN 50% ĐIỂM",
    desc: "Topic có 2 dạng: là (B)oth, chỉ săn học tập âm. Đáp án Bắt thường bị nhầm, chỉ đảo vị trí giữa M và W.",
    color: "amber"
  },
  {
    badge: "M - W",
    title: "QUY ƯỚC KÝ HIỆU & MÃ CODE",
    desc: "M = 1 (Man / Đàn ông) • W = 2 (Woman / Phụ nữ) • B = 0 (Both / Cả hai)",
    color: "blue"
  },
  {
    badge: "12s",
    title: "THỜI ĐIỂM VÀNG BẮT TAI",
    desc: "Bỏ qua 12 giây nháy hướng dẫn đầu. Từ giây thứ 13 mới bắt đầu tính đáp án, dùng để xác định hàm hay không được.",
    color: "rose"
  }
];

export const LISTENING_PART3_DATA: Part3Item[] = [
  {
    "stt": 1,
    "topic": "Singers and music",
    "code": "2010",
    "femaleFirst": [
      "W",
      "B",
      "M",
      "B"
    ],
    "maleFirst": [
      "M",
      "B",
      "W",
      "B"
    ],
    "story": "Đàn ông (M) thích ca (B) âm nhạc và ca sĩ. Phụ nữ (W) cùng thích cả (B) âm nhạc và ca sĩ."
  },
  {
    "stt": 2,
    "topic": "Local Cultural Center",
    "code": "2011",
    "femaleFirst": [
      "M",
      "B",
      "W",
      "M"
    ],
    "maleFirst": [
      "W",
      "B",
      "M",
      "M"
    ],
    "story": "Mẹ (M) bảo (B) Win (W) tìm em gái (W) ở trung tâm cộng đồng."
  },
  {
    "stt": 3,
    "topic": "Local Cultural Differences",
    "code": "2011",
    "femaleFirst": [
      "M",
      "B",
      "M",
      "M"
    ],
    "maleFirst": [
      "W",
      "B",
      "W",
      "W"
    ],
    "story": "Phụ nữ (W) và cả hai (B) đều khác biệt nhưng đàn ông (M) nhiều hơn."
  },
  {
    "stt": 4,
    "topic": "Urban farming",
    "code": "1020",
    "femaleFirst": [
      "M",
      "B",
      "W",
      "B"
    ],
    "maleFirst": [
      "W",
      "B",
      "M",
      "B"
    ],
    "story": "Phụ nữ (W) nói cả (B) đàn ông (M) và phụ nữ đều (B) phải làm ruộng."
  },
  {
    "stt": 5,
    "topic": "The arts",
    "code": "2101",
    "femaleFirst": [
      "W",
      "M",
      "B",
      "M"
    ],
    "maleFirst": [
      "M",
      "W",
      "B",
      "W"
    ],
    "story": "Chàng trai (M) và cô gái (W) cùng nhau (B) nhảy múa, nhưng cô gái (W) nói đi khi tuổi đời còn rất trẻ."
  },
  {
    "stt": 6,
    "topic": "Politics",
    "code": "0210",
    "femaleFirst": [
      "B",
      "W",
      "M",
      "B"
    ],
    "maleFirst": [
      "B",
      "M",
      "W",
      "B"
    ],
    "story": "Bố (B) Win (W) muốn (M) bán (B) bản vẽ thiết kế nhà."
  },
  {
    "stt": 7,
    "topic": "Community Design",
    "code": "0120",
    "femaleFirst": [
      "B",
      "M",
      "W",
      "B"
    ],
    "maleFirst": [
      "B",
      "W",
      "M",
      "B"
    ],
    "story": "Bố (B) Win (W) muốn (M) bán (B) bản vẽ thiết kế nhà."
  },
  {
    "stt": 8,
    "topic": "Community Design - Version 2",
    "code": "0010",
    "femaleFirst": [
      "B",
      "B",
      "M",
      "B"
    ],
    "maleFirst": [
      "B",
      "B",
      "W",
      "B"
    ],
    "story": "Bản thiết kế cộng đồng của bố (B) và con gái (W) bị bão (B)."
  },
  {
    "stt": 9,
    "topic": "University and Technology",
    "code": "0121",
    "femaleFirst": [
      "B",
      "M",
      "M",
      "W"
    ],
    "maleFirst": [
      "B",
      "W",
      "W",
      "M"
    ],
    "story": "Bố (M) đưa con gái (W) đi học, nhưng đến trường thì người yêu (M) đưa con gái (M) đi chơi."
  },
  {
    "stt": 10,
    "topic": "IT & Tech",
    "code": "2110",
    "femaleFirst": [
      "W",
      "M",
      "M",
      "B"
    ],
    "maleFirst": [
      "M",
      "W",
      "W",
      "B"
    ],
    "story": "Đàn ông (M) đến phụ nữ (W) kém công nghệ, nhưng phụ nữ (W) nghĩ cả 2 (B) đều giỏi."
  },
  {
    "stt": 11,
    "topic": "Beauty",
    "code": "1202",
    "femaleFirst": [
      "W",
      "M",
      "B",
      "M"
    ],
    "maleFirst": [
      "M",
      "W",
      "B",
      "W"
    ],
    "story": "Chàng trai (M) đưa cô gái (W) đi làm đẹp, cuối cùng cả hai (B) bị bà chủ tiệm (W) lừa bán."
  },
  {
    "stt": 12,
    "topic": "Changes in the workplace",
    "code": "1201",
    "femaleFirst": [
      "M",
      "W",
      "B",
      "M"
    ],
    "maleFirst": [
      "W",
      "M",
      "B",
      "W"
    ],
    "story": "Người đàn ông (M) trách người phụ nữ (W) lười làm việc, cả hai (B) sống nghèo khó."
  },
  {
    "stt": 13,
    "topic": "Actors",
    "code": "1200",
    "femaleFirst": [
      "M",
      "W",
      "B",
      "B"
    ],
    "maleFirst": [
      "W",
      "M",
      "B",
      "B"
    ],
    "story": "Mẹ Win Bữa Bộn (M/WBB)."
  },
  {
    "stt": 14,
    "topic": "The Internet",
    "code": "0200",
    "femaleFirst": [
      "B",
      "W",
      "B",
      "B"
    ],
    "maleFirst": [
      "B",
      "W",
      "B",
      "B"
    ],
    "story": "Bố Win Bữa Bộn (B/WBB)."
  },
  {
    "stt": 15,
    "topic": "Homeschooling",
    "code": "1220",
    "femaleFirst": [
      "W",
      "W",
      "W",
      "B"
    ],
    "maleFirst": [
      "M",
      "W",
      "M",
      "B"
    ],
    "story": "Đàn ông (M) đi làm để hai phụ nữ (W, W) ở nhà dạy học, kết quả cả hai (B) đều hài lòng."
  },
  {
    "stt": 16,
    "topic": "Environmental volunteer",
    "code": "0212",
    "femaleFirst": [
      "B",
      "W",
      "M",
      "W"
    ],
    "maleFirst": [
      "B",
      "M",
      "W",
      "M"
    ],
    "story": "Cả (both) phụ nữ (W) đàn ông (M) đều đăng ký tình nguyện nhưng phụ nữ (W) đông hơn."
  },
  {
    "stt": 17,
    "topic": "Children & young people with teeth",
    "code": "0021",
    "femaleFirst": [
      "B",
      "B",
      "W",
      "M"
    ],
    "maleFirst": [
      "B",
      "B",
      "M",
      "W"
    ],
    "story": "Cả hai (B) đều (B) thích công nghệ nhưng phụ nữ (W) mê hơn đàn ông (M)."
  }
];

export const LISTENING_PART4_DATA: Part4Topic[] = [
  {
    "id": "p4-topic-01",
    "title": "Advertising and sponsoring (2026)",
    "cloverCount": 2,
    "question1": "What does the expert say about the negative side of advertising?",
    "answer1": "Series are damaged by overexposure.",
    "question2": "In what way can advertising affect sports?",
    "answer2": "They can generate negative publicity for the sport",
    "quickTip": "Quảng cáo và tài trợ có thể bị tổn hại ( damaged ) do các dư luận tiêu cực ( negative publicity )"
  },
  {
    "id": "p4-topic-04",
    "title": "Advertising and sponsoring ver 2 (2026)",
    "cloverCount": 2,
    "question1": "What is the importance of advertising?",
    "answer1": "It can help reach new customers",
    "question2": "Why shouldn't we sponsor sports tournaments?",
    "answer2": "They can generate negative publicity for the sport",
    "quickTip": "Quảng cáo và tài trợ có thể tìm được khách hàng mới ( new customers ) nhưng cũng có thể nhận tiêu cực từ dư luận ( negative publicity )"
  },
  {
    "id": "p4-topic-07",
    "title": "Advertising and sponsoring ver 3 (2026)",
    "cloverCount": 2,
    "question1": "What does the expert say about advertising?",
    "answer1": "It can help reach new customers",
    "question2": "In what way can advertising affect sports?",
    "answer2": "They are not always good for sports fans",
    "quickTip": "Quảng cáo và tài trợ có thể tìm được khách hàng mới ( new customers ) nhưng cũng không tốt cho fans ( not always good fans)"
  },
  {
    "id": "p4-topic-18",
    "title": "Biography (2026)",
    "cloverCount": 3,
    "question1": "What is the strength of the book?",
    "answer1": "It has a good description of a specific period of time.",
    "question2": "What do the critics say about the book?",
    "answer2": "It is an unconventional biography.",
    "quickTip": "Cuốn sách tiểu sử nói về một khoảng thời gian cụ thể ( specific period of time ) và sự khác thường của tiểu sử ( unconventional biography )"
  },
  {
    "id": "p4-topic-21",
    "title": "A book about a life of a scientist (2026)",
    "cloverCount": 3,
    "question1": "Why is the book so popular?",
    "answer1": "It uses simple language to describe complex ideas",
    "question2": "What do people criticize about the book?",
    "answer2": "It is similar to the previous book about the scientist",
    "quickTip": "Một cuốn sách khoa học, sử dụng ngôn ngữ đơn giản ( use simple language ) giống với những quyển sách trước đây. ( similar to the previous book)"
  },
  {
    "id": "p4-topic-24",
    "title": "A book about a life of a scientist ver 2 (2026)",
    "cloverCount": 3,
    "question1": "What does the speaker say about the way of writing?",
    "answer1": "It is exciting to read",
    "question2": "What does the speaker say about the overall content of the book?",
    "answer2": "It has been written for a general audience",
    "quickTip": "Một cuốn sách khoa học, rất thú vị để đọc ( exciting to read ) đối với độc giả phổ thông ( general audience )"
  },
  {
    "id": "p4-topic-28",
    "title": "A break from studying (2026)",
    "cloverCount": 3,
    "question1": "Why hasn't he gone to college?",
    "answer1": "He wasn't ready to start higher education",
    "question2": "Why did he decide to travel for 2 years?",
    "answer2": "To gain life experience.",
    "quickTip": "Anh ấy thôi học bởi vì chưa sẵn sàng học lên cao hơn ( higher education ) để trải nghiệm thêm trong cuộc sống ( life experience )"
  },
  {
    "id": "p4-topic-31",
    "title": "Criticism of the new novel",
    "cloverCount": 4,
    "question1": "What attracts readers to this novel?",
    "answer1": "The characters were interesting",
    "question2": "What is the speaker's opinion about this novel?",
    "answer2": "It will establish the author's popularity",
    "quickTip": "Một cuốn tiểu thuyết có các nhân vật thú vị ( characters interesting ) được viết bởi một tác giả nổi tiếng ( author’s popularity )"
  },
  {
    "id": "p4-topic-34",
    "title": "Criticism of the new novel ver 2",
    "cloverCount": 4,
    "question1": "What does the reviewer say about the characters in the novel?",
    "answer1": "They feel realistic and emotionally engaging.",
    "question2": "What does the reviewer suggest about the impact of the novel?",
    "answer2": "It will establish the author's popularity.",
    "quickTip": "Một cuốn tiểu thuyết tạo cảm giác chân thực về mặt cảm xúc ( realistic and emotionally ) được viết bởi một tác giả nổi tiếng ( author’s popularity )"
  },
  {
    "id": "p4-topic-35",
    "title": "Criticism of the new novel ver 3",
    "cloverCount": 4,
    "question1": "What do some readers criticize about the book?",
    "answer1": "It is very similar to the author's other books",
    "question2": "How did the writer finish his book",
    "answer2": "The plot was very strong",
    "quickTip": "Một cuốn tiểu thuyết giống những quyển sách khác ( similar to the author’s books ) nhưng có cốt truyện chặt chẽ ( plot strong )"
  },
  {
    "id": "p4-topic-38",
    "title": "Criticism of the new novel ver 4",
    "cloverCount": 4,
    "question1": "Why do some readers struggle to connect with the characters in the novel?",
    "answer1": "They are difficult to relate to.",
    "question2": "What criticism do readers have about the storyline?",
    "answer2": "It lacks originality.",
    "quickTip": "Một cuốn tiểu thuyết có nhân vật khó tạo sự đồng cảm ( difficult to relate ) và thiếu tính độc đáo ( lacks originality )"
  },
  {
    "id": "p4-topic-41",
    "title": "Exhibition by Greek artist Jame Panos (2026)",
    "cloverCount": 2,
    "question1": "How did many art critics describe Jame Panos' paintings?",
    "answer1": "They would be characterized by sadness.",
    "question2": "What did the exhibition seem like to visitors?",
    "answer2": "A window into the past.",
    "quickTip": "Một triển lãm tranh trưng bày các bức tranh về nỗi buồn ( sadness ) trong quá khứ ( into the pass)"
  },
  {
    "id": "p4-topic-42",
    "title": "Exhibition by Greek artist Jame Panos ver 2 (2026)",
    "cloverCount": 2,
    "question1": "What do the guide and critics say about Panos's early paintings?",
    "answer1": "They would be similar to those of another artist.",
    "question2": "What did the exhibition seem like to visitors?",
    "answer2": "A window into the past.",
    "quickTip": "Một triển lãm tranh giống với các nghệ sĩ khác ( similar another artists) trong quá khứ ( into the pass)"
  },
  {
    "id": "p4-topic-45",
    "title": "Famous writers",
    "cloverCount": 3,
    "question1": "What do these two famous writers have in common?",
    "answer1": "They both make references to each other in their work",
    "question2": "What is special about their works?",
    "answer2": "The meaning of their work is not always easily identified",
    "quickTip": "Những nhà văn, luôn đề cập đến nhau trong công việc ( references each other in work ) và không dễ nhận biết ý nghĩ của họ ( not easily identified )"
  },
  {
    "id": "p4-topic-50",
    "title": "Famous writers ver 2",
    "cloverCount": 3,
    "question1": "What was the lecturer's opinion about both author’s past work?",
    "answer1": "They have both been overlooked by academics",
    "question2": "What did the lecturer say about both authors?",
    "answer2": "The meaning of their work is not always easily identified",
    "quickTip": "Những nhà văn, có thể bị giới học thuật bỏ quên ( overlooked by academics ) và không dễ nhận biết ý nghĩ của họ ( not easily identified )"
  },
  {
    "id": "p4-topic-53",
    "title": "The importance of sleep",
    "cloverCount": 3,
    "question1": "What is the way to have a good sleep according to the speaker?",
    "answer1": "Blocking out noise and light is key",
    "question2": "What is the speaker's view on insomnia in general?",
    "answer2": "People can't always recognize the symptoms of tiredness",
    "quickTip": "Để ngủ ngon mọi người cần hạn chế tiếng ồn và ánh sáng ( noise and light ) giúp giảm triệu chứng của sự mệt mỏi ( symptoms of tiredness )"
  },
  {
    "id": "p4-topic-56",
    "title": "The importance of sleep ver 2",
    "cloverCount": 3,
    "question1": "What is the most important thing to help you sleep well?",
    "answer1": "Blocking out noise and light is key",
    "question2": "According to the expert, what is the public attitude towards sleeping?",
    "answer2": "The media overemphasize the subject",
    "quickTip": "Để ngủ ngon mọi người cần hạn chế tiếng ồn và ánh sáng ( noise and light ) giúp chú trọng hơn vào giấc ngủ ( overemphasize the subject )"
  },
  {
    "id": "p4-topic-59",
    "title": "Industry of Making Music (2026)",
    "cloverCount": 3,
    "question1": "What is the key to a long career in music?",
    "answer1": "Believing in her musical instincts.",
    "question2": "What is the speaker's opinion about the current music industry?",
    "answer2": "Performers find it hard to get started.",
    "quickTip": "Để thành ca sĩ cần tin tưởng vào âm nhạc của mình ( believe musical instincts ) mặc dù bắt đầu sẽ khó khăn ( hard to get started )"
  },
  {
    "id": "p4-topic-64",
    "title": "Life after university",
    "cloverCount": 4,
    "question1": "What should students do when choosing a career?",
    "answer1": "Be flexible and open minded",
    "question2": "What should students pay attention to when applying for jobs these days?",
    "answer2": "They are becoming more competitive",
    "quickTip": "Sinh viên khi chọn nghề nghiệp cần linh hoạt (flexible) trong thị trường cạnh tranh (competitive)"
  }
];
