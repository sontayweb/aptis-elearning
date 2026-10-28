export interface Part1Gap {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
}

export interface Part2Story {
  id: string;
  title: string;
  fixedSentence?: string | null;
  sentences: { id: string; text: string }[];
  correctOrder: string[];
}

export interface Part3Review {
  person: string;
  name: string;
  review: string;
}

export interface Part3Question {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
}

export interface Part4Paragraph {
  id: string;
  paragraphNumber: number;
  text: string;
  correctHeading: string;
}

export interface ReadingExamData {
  id: string;
  title: string;
  durationMinutes: number;
  part1: {
    instructions: string;
    exampleText: { prefix: string; word: string; suffix: string };
    gaps: Part1Gap[];
  };
  part2: {
    instructions: string;
    stories: Part2Story[];
  };
  part3: {
    title: string;
    instructions: string;
    reviews: Part3Review[];
    questions: Part3Question[];
  };
  part4: {
    title: string;
    instructions: string;
    allHeadings: string[];
    paragraphs: Part4Paragraph[];
  };
}

export const DEFAULT_READING_TEST: ReadingExamData = {
  id: "reading-01",
  title: "Đề 01 — Full Reading Chuẩn 4 Parts",
  durationMinutes: 35,
  part1: {
    instructions: "Choose the word that fits in the gap. The first one is done for you.",
    exampleText: {
      prefix: "I",
      word: "live",
      suffix: "in a flat.",
    },
    gaps: [
      {
        id: "p1-q1",
        prompt: "I [gap] it with my friend.",
        options: ["share", "keep", "send"],
        correctAnswer: "share",
      },
      {
        id: "p1-q2",
        prompt: "We are in the same [gap].",
        options: ["class", "room", "team"],
        correctAnswer: "class",
      },
      {
        id: "p1-q3",
        prompt: "We [gap] to work.",
        options: ["walk", "smile", "ride"],
        correctAnswer: "walk",
      },
      {
        id: "p1-q4",
        prompt: "We like to [gap] dinner.",
        options: ["cook", "make", "eat"],
        correctAnswer: "cook",
      },
    ],
  },
  part2: {
    instructions: "The sentences below make a complete text. Put them in the correct order.",
    stories: [
      {
        id: "p2-s1",
        title: "Delivery instructions",
        fixedSentence: "You should arrive at the main office by 6.30am and collect your keys",
        sentences: [
          { id: "s3", text: "You must follow the route on the map to deliver packages" },
          { id: "s2", text: "In the office, you can also collect a map of your route" },
          { id: "s5", text: "You must return your keys to the office manager after you get back" },
          { id: "s4", text: "When you have completed all deliveries, return to your office" },
        ],
        correctOrder: ["s2", "s3", "s4", "s5"],
      },
      {
        id: "p2-s2",
        title: "Tom Harper",
        fixedSentence: "When he was young, he began writing short stories for a magazine",
        sentences: [
          { id: "th-4", text: "the characters he imagined were one of the most famous in the world" },
          { id: "th-2", text: "he soon wrote regularly for the magazine, but he was not satisfied" },
          { id: "th-5", text: "this popularity made Tom Harper rich and successful." },
          { id: "th-3", text: "he almost left the magazine, but then he decided to create some unusual new characters" },
        ],
        correctOrder: ["th-2", "th-3", "th-4", "th-5"],
      },
    ],
  },
  part3: {
    title: "Opinions on a new restaurant",
    instructions: "Four people write reviews of a new restaurant in their town on a website. Read the texts and then answer the questions below.",
    reviews: [
      {
        person: "Person A",
        name: "Person A",
        review: "I'm not sure if I will return to this restaurant. I think the staff was arguing when I got there, because the atmosphere here was not very comfortable. As for the food, I think there's nothing to write about. I ordered fish and chips, it wasn't bad, but it wasn't good either. But many people say that the food here is fabulous. So, I think I'm an exception.",
      },
      {
        person: "Person B",
        name: "Person B",
        review: "This is a very famous restaurant that I saw in the newspaper. Sadly, I arrived later than the rest of the party, so I didn't get to order dinner. However, I ordered orange juice and mango juice and they were both delicious. What about the surroundings? Lively music along with fashionable and appropriate decor makes me feel very comfortable.",
      },
      {
        person: "Person C",
        name: "Person C",
        review: "I don't understand why this restaurant is so famous. When I arrived and saw a menu with lots of different dishes, I saw this as a bad sign. Furthermore, the menu with traditional dishes contrasting with the modern decoration style made me feel very confused and strange. The waiters here were also not friendly. This was one of my worst experiences eating at a restaurant.",
      },
      {
        person: "Person D",
        name: "Person D",
        review: "This is my first time coming to this restaurant. The food is very cheap but the quality is excellent. I was very surprised with the starter because its menu is very diverse. But there is one thing that I want the restaurant to improve. The restaurant band played live music but it was very far away, so the sound was very low and it didn't make the meal atmosphere lively. Next time turn the music louder, please!",
      },
    ],
    questions: [
      { id: "p3-q1", prompt: "Who enjoyed the atmosphere?", options: ["Person A", "Person B", "Person C", "Person D"], correctAnswer: "Person B" },
      { id: "p3-q2", prompt: "Who thought the music was too quiet?", options: ["Person A", "Person B", "Person C", "Person D"], correctAnswer: "Person D" },
      { id: "p3-q3", prompt: "Who didn't eat anything at the restaurant?", options: ["Person A", "Person B", "Person C", "Person D"], correctAnswer: "Person B" },
      { id: "p3-q4", prompt: "Who will definitely not return to the restaurant?", options: ["Person A", "Person B", "Person C", "Person D"], correctAnswer: "Person C" },
      { id: "p3-q5", prompt: "Who thought their bad experience was probably unusual?", options: ["Person A", "Person B", "Person C", "Person D"], correctAnswer: "Person A" },
      { id: "p3-q6", prompt: "Who was impressed by the range of appetizers?", options: ["Person A", "Person B", "Person C", "Person D"], correctAnswer: "Person D" },
      { id: "p3-q7", prompt: "Who thought the food was of average quality?", options: ["Person A", "Person B", "Person C", "Person D"], correctAnswer: "Person A" },
    ],
  },
  part4: {
    title: "Children and Exercises",
    instructions: "Read the passage quickly. Choose a heading for each numbered paragraph from the drop-down box.",
    allHeadings: [
      "Technology is not the only cause of inactivity",
      "The physical and mental perils of sedentary life",
      "Schools leading the fitness transformation",
      "Parental encouragement makes a vital difference",
      "Redesigning community and recreational spaces",
      "The long-term economic burden of health issues",
      "Small daily habits for lifelong wellbeing",
    ],
    paragraphs: [
      {
        id: "p4-p1",
        paragraphNumber: 1,
        text: "Recent research into childhood health reveals that children around the world are spending significantly less time being physically active than previous generations. While computer games and smartphones are frequently cited as the main culprits, experts emphasize that modern lifestyle changes, parental safety concerns, and reduced outdoor free play are equally responsible.",
        correctHeading: "Technology is not the only cause of inactivity",
      },
      {
        id: "p4-p2",
        paragraphNumber: 2,
        text: "The lack of regular exercise has immediate and far-reaching consequences on young bodies and minds. Pediatricians report rising rates of early cardiovascular risk factors and poor bone density, alongside increased anxiety and reduced concentration spans during school hours.",
        correctHeading: "The physical and mental perils of sedentary life",
      },
      {
        id: "p4-p3",
        paragraphNumber: 3,
        text: "Educational institutions are beginning to recognize their critical role in reversing this trend. Several pioneering schools have introduced active learning desks, short physical exercise breaks between lessons, and daily physical education that focuses on personal enjoyment rather than intense competition.",
        correctHeading: "Schools leading the fitness transformation",
      },
      {
        id: "p4-p4",
        paragraphNumber: 4,
        text: "Beyond the classroom, family habits play a pivotal role. When parents participate in outdoor weekend activities, cycle to local markets, or simply walk together after dinner, children naturally adopt positive attitudes toward staying active.",
        correctHeading: "Parental encouragement makes a vital difference",
      },
      {
        id: "p4-p5",
        paragraphNumber: 5,
        text: "Urban planners are also being called upon to create safer environments for active youth. Installing protected cycling corridors, well-lit neighborhood parks, and community sports zones allows teenagers to engage in spontaneous sports safely.",
        correctHeading: "Redesigning community and recreational spaces",
      },
      {
        id: "p4-p6",
        paragraphNumber: 6,
        text: "If these sedentary trends continue unchecked, public healthcare systems will face staggering costs treating lifestyle-related chronic conditions in future adults. Economists project that preventative physical education programs could save billions annually.",
        correctHeading: "The long-term economic burden of health issues",
      },
      {
        id: "p4-p7",
        paragraphNumber: 7,
        text: "Ultimately, experts suggest that building a healthier generation does not require extreme athletic training. Simple changes such as walking up the stairs, participating in household chores, and taking brief active breaks can cultivate durable habits for lifelong wellbeing.",
        correctHeading: "Small daily habits for lifelong wellbeing",
      },
    ],
  },
};
