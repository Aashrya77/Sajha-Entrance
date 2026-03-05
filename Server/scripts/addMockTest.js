import mongoose from "mongoose";
import dotenv from "dotenv";
import MockTestModel from "../models/MockTest.js";

dotenv.config();

const sampleTest = {
  title: "IOE MOCK TEST - I",
  description: "Practice mock test for Institute of Engineering entrance examination. Test your knowledge across Physics, Chemistry, Mathematics, and English.",
  admissionTest: "Institute of Engineering",
  course: "Bachelor in Computer Engineering, Bachelor in Civil Engineering, Bachelor in Electronics And Communication Engineering, Bachelor in Electrical Engineering, Bachelor in Architecture Engineering",
  duration: 60,
  isActive: true,
  questions: [
    {
      questionText: "A body of mass 5 kg is thrown vertically upward with a velocity of 10 m/s. What is the maximum height reached?",
      options: [
        { text: "5 m" },
        { text: "10 m" },
        { text: "15 m" },
        { text: "20 m" },
      ],
      correctOption: 0,
      explanation: "Using v² = u² - 2gh, at max height v=0, so h = u²/2g = 100/20 = 5m",
      marks: 2,
      negativeMarks: 0.5,
    },
    {
      questionText: "The SI unit of electric current is:",
      options: [
        { text: "Volt" },
        { text: "Ohm" },
        { text: "Ampere" },
        { text: "Watt" },
      ],
      correctOption: 2,
      explanation: "Ampere (A) is the SI unit of electric current.",
      marks: 1,
      negativeMarks: 0,
    },
    {
      questionText: "What is the derivative of sin(x)?",
      options: [
        { text: "-cos(x)" },
        { text: "cos(x)" },
        { text: "tan(x)" },
        { text: "-sin(x)" },
      ],
      correctOption: 1,
      explanation: "The derivative of sin(x) with respect to x is cos(x).",
      marks: 1,
      negativeMarks: 0,
    },
    {
      questionText: "Which of the following is the chemical formula for water?",
      options: [
        { text: "CO2" },
        { text: "H2O" },
        { text: "NaCl" },
        { text: "O2" },
      ],
      correctOption: 1,
      explanation: "Water has the chemical formula H2O (two hydrogen atoms and one oxygen atom).",
      marks: 1,
      negativeMarks: 0,
    },
    {
      questionText: "In a right triangle, if one angle is 90° and another is 30°, what is the third angle?",
      options: [
        { text: "30°" },
        { text: "45°" },
        { text: "60°" },
        { text: "90°" },
      ],
      correctOption: 2,
      explanation: "Sum of angles in a triangle = 180°. So third angle = 180 - 90 - 30 = 60°.",
      marks: 1,
      negativeMarks: 0,
    },
    {
      questionText: "What is the value of acceleration due to gravity on the surface of the Earth?",
      options: [
        { text: "8.9 m/s²" },
        { text: "9.8 m/s²" },
        { text: "10.8 m/s²" },
        { text: "11.2 m/s²" },
      ],
      correctOption: 1,
      explanation: "The standard value of acceleration due to gravity on Earth's surface is approximately 9.8 m/s².",
      marks: 1,
      negativeMarks: 0,
    },
    {
      questionText: "Which element has the atomic number 6?",
      options: [
        { text: "Nitrogen" },
        { text: "Oxygen" },
        { text: "Carbon" },
        { text: "Boron" },
      ],
      correctOption: 2,
      explanation: "Carbon has atomic number 6.",
      marks: 1,
      negativeMarks: 0,
    },
    {
      questionText: "What is the integral of 2x dx?",
      options: [
        { text: "x + C" },
        { text: "x² + C" },
        { text: "2x² + C" },
        { text: "x³ + C" },
      ],
      correctOption: 1,
      explanation: "∫2x dx = 2(x²/2) + C = x² + C",
      marks: 2,
      negativeMarks: 0.5,
    },
    {
      questionText: "Ohm's law states that:",
      options: [
        { text: "V = IR" },
        { text: "V = I/R" },
        { text: "V = R/I" },
        { text: "I = VR" },
      ],
      correctOption: 0,
      explanation: "Ohm's law states V = IR, where V is voltage, I is current, and R is resistance.",
      marks: 1,
      negativeMarks: 0,
    },
    {
      questionText: "The passive voice of 'She writes a letter' is:",
      options: [
        { text: "A letter is written by her." },
        { text: "A letter was written by her." },
        { text: "A letter has been written by her." },
        { text: "A letter will be written by her." },
      ],
      correctOption: 0,
      explanation: "Present simple active → Present simple passive: 'is + past participle'.",
      marks: 1,
      negativeMarks: 0,
    },
  ],
};

const sampleTest2 = {
  title: "CMAT MOCK TEST - I",
  description: "Practice mock test for Common Management Admission Test. Covers quantitative aptitude, verbal ability, logical reasoning, and general knowledge.",
  admissionTest: "Common Management Admission Test (CMAT)",
  course: "Bachelor of Business Administration (BBA), Bachelor of Business Studies (BBS), Bachelor of Hotel Management (BHM)",
  duration: 45,
  isActive: true,
  questions: [
    {
      questionText: "If the cost price of an article is Rs. 200 and it is sold at Rs. 250, what is the profit percentage?",
      options: [
        { text: "20%" },
        { text: "25%" },
        { text: "30%" },
        { text: "50%" },
      ],
      correctOption: 1,
      explanation: "Profit = 250 - 200 = 50. Profit% = (50/200) × 100 = 25%.",
      marks: 2,
      negativeMarks: 0,
    },
    {
      questionText: "Choose the correct synonym of 'Abundant':",
      options: [
        { text: "Scarce" },
        { text: "Plentiful" },
        { text: "Limited" },
        { text: "Rare" },
      ],
      correctOption: 1,
      explanation: "Abundant means plentiful or existing in large quantities.",
      marks: 1,
      negativeMarks: 0,
    },
    {
      questionText: "If A can do a work in 10 days and B can do it in 15 days, in how many days can they do it together?",
      options: [
        { text: "5 days" },
        { text: "6 days" },
        { text: "7 days" },
        { text: "8 days" },
      ],
      correctOption: 1,
      explanation: "Combined rate = 1/10 + 1/15 = 5/30 = 1/6. So they can do it in 6 days.",
      marks: 2,
      negativeMarks: 0,
    },
    {
      questionText: "What is the capital of Australia?",
      options: [
        { text: "Sydney" },
        { text: "Melbourne" },
        { text: "Canberra" },
        { text: "Perth" },
      ],
      correctOption: 2,
      explanation: "Canberra is the capital of Australia.",
      marks: 1,
      negativeMarks: 0,
    },
    {
      questionText: "Find the next number in the series: 2, 6, 12, 20, ?",
      options: [
        { text: "28" },
        { text: "30" },
        { text: "32" },
        { text: "36" },
      ],
      correctOption: 1,
      explanation: "Differences: 4, 6, 8, 10. So next = 20 + 10 = 30.",
      marks: 1,
      negativeMarks: 0,
    },
  ],
};

const addMockTests = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const result = await MockTestModel.insertMany([sampleTest, sampleTest2]);
    console.log(`✅ Added ${result.length} mock tests`);
    result.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.title} - ${t.questions.length} questions, ${t.totalMarks} marks`);
    });

    await mongoose.connection.close();
    console.log("✅ Done");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

addMockTests();
