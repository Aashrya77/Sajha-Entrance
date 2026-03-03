import mongoose from "mongoose";
import dotenv from "dotenv";
import University from "../models/University.js";

dotenv.config();

const universities = [
  {
    universityName: "Tribhuvan University",
    universityAddress: "Kirtipur, Kathmandu",
    universityPhone: "01-4330433",
    universityEmail: "info@tribhuvan-university.edu.np",
    establishedYear: 1959,
    website: "https://tribhuvan-university.edu.np",
    type: "Public",
    overview: `<p>Tribhuvan University (TU) is the oldest and largest university in Nepal, established in 1959. It is a public university located in Kirtipur, Kathmandu. TU offers undergraduate, graduate and postgraduate programs in various disciplines including humanities, management, education, law, and science & technology.</p>
    <p>With over 60 constituent campuses and over 1,000 affiliated colleges across Nepal, TU serves hundreds of thousands of students annually. It is the backbone of higher education in Nepal.</p>`,
    admissionNotice: "Admissions open for Bachelor's and Master's programs. Apply now!",
    admissionGuidelines: `<h3>Admission Process</h3>
    <ul>
      <li>Fill out the online application form</li>
      <li>Submit required documents (transcripts, certificates, ID)</li>
      <li>Pay the application fee</li>
      <li>Appear for entrance examination (if applicable)</li>
      <li>Attend counseling session</li>
    </ul>`,
    scholarshipInfo: `<p>TU offers various scholarship programs for meritorious and financially disadvantaged students. Scholarships are available based on academic performance, need-based criteria, and special categories.</p>`,
    keyFeatures: [
      "Oldest and largest university in Nepal",
      "Over 60 constituent campuses nationwide",
      "1000+ affiliated colleges",
      "Wide range of academic programs",
      "Research and innovation centers",
      "International collaborations and exchange programs"
    ],
    chancellorName: "Prof. Dr. Dharma Kant Baskota",
    chancellorMessage: `<p>Welcome to Tribhuvan University, the premier institution of higher learning in Nepal. We are committed to providing quality education and fostering research excellence.</p>`,
  },
  {
    universityName: "Kathmandu University",
    universityAddress: "Dhulikhel, Kavre (Kathmandu Valley)",
    universityPhone: "011-490000",
    universityEmail: "info@ku.edu.np",
    establishedYear: 1991,
    website: "https://ku.edu.np",
    type: "Autonomous",
    overview: `<p>Kathmandu University (KU) is an autonomous, not-for-profit, self-funding public institution established in 1991. It is the third oldest university in Nepal located in Dhulikhel, Kavre, about 30 km east of Kathmandu.</p>
    <p>KU is known for its quality education, research-oriented approach, and modern infrastructure. It offers programs in engineering, science, management, arts, education, medical sciences, and law.</p>`,
    admissionNotice: "KU Entrance Examination (KUEE) registration is now open for all programs.",
    admissionGuidelines: `<h3>How to Apply</h3>
    <ul>
      <li>Register for KU Entrance Examination (KUEE)</li>
      <li>Prepare for the entrance test</li>
      <li>Take the KUEE on scheduled date</li>
      <li>Check results online</li>
      <li>Complete admission formalities</li>
    </ul>`,
    scholarshipInfo: `<p>Kathmandu University provides merit-based scholarships, need-based financial aid, and special scholarships for underprivileged students. Up to 10% of students receive full or partial scholarships.</p>`,
    keyFeatures: [
      "Research-oriented autonomous university",
      "Modern campus with state-of-the-art facilities",
      "Strong industry partnerships",
      "International faculty and collaborations",
      "Focus on innovation and entrepreneurship",
      "Quality assurance and accreditation"
    ],
    chancellorName: "Prof. Dr. Bhola Thapa",
    chancellorMessage: `<p>Kathmandu University is committed to excellence in teaching, research, and service. We strive to develop skilled professionals and responsible citizens.</p>`,
  },
  {
    universityName: "Pokhara University",
    universityAddress: "Pokhara Metropolitan City (Regional Office: Kathmandu)",
    universityPhone: "061-504004",
    universityEmail: "info@pu.edu.np",
    establishedYear: 1997,
    website: "https://pu.edu.np",
    type: "Public",
    overview: `<p>Pokhara University (PU) was established in 1997 as Nepal's fifth university. Though headquartered in Pokhara, it has affiliated colleges throughout Nepal including many in the Kathmandu Valley.</p>
    <p>PU focuses on quality education with an emphasis on practical skills and industry relevance. It offers programs in engineering, management, science, humanities, and health sciences.</p>`,
    admissionNotice: "Admission open for various undergraduate and graduate programs through affiliated colleges.",
    admissionGuidelines: `<h3>Admission Requirements</h3>
    <ul>
      <li>Complete +2 or equivalent for Bachelor's programs</li>
      <li>Bachelor's degree for Master's programs</li>
      <li>Pass entrance examination conducted by PU</li>
      <li>Meet program-specific requirements</li>
    </ul>`,
    scholarshipInfo: `<p>Pokhara University offers scholarships to deserving students based on merit and financial need. Special provisions exist for students from marginalized communities.</p>`,
    keyFeatures: [
      "Focus on practical and applied education",
      "Strong network of affiliated colleges",
      "Industry-oriented curriculum",
      "Affordable quality education",
      "Growing research initiatives",
      "Student exchange programs"
    ],
    chancellorName: "Prof. Dr. Prem Narayan Aryal",
    chancellorMessage: `<p>Pokhara University is dedicated to providing accessible, quality education that prepares students for successful careers and meaningful contributions to society.</p>`,
  },
  {
    universityName: "Purbanchal University",
    universityAddress: "Biratnagar (Affiliated Colleges in Kathmandu)",
    universityPhone: "021-525252",
    universityEmail: "info@purbanchal.edu.np",
    establishedYear: 1993,
    website: "https://purbanchal.edu.np",
    type: "Public",
    overview: `<p>Purbanchal University (PU) was established in 1993 to cater to the educational needs of eastern Nepal. It has since expanded with numerous affiliated colleges across the country, including several in Kathmandu.</p>
    <p>The university offers diverse programs in science, technology, management, humanities, and health sciences with a focus on regional development.</p>`,
    admissionNotice: "Admissions are processed through affiliated colleges. Contact your nearest PU-affiliated institution.",
    admissionGuidelines: `<h3>General Admission Process</h3>
    <ul>
      <li>Apply through affiliated colleges</li>
      <li>Submit academic transcripts and certificates</li>
      <li>Appear for entrance test if required</li>
      <li>Complete enrollment procedures at the college</li>
    </ul>`,
    scholarshipInfo: `<p>Scholarship opportunities are available through individual affiliated colleges and university-level programs for academically excellent and economically disadvantaged students.</p>`,
    keyFeatures: [
      "Wide network of affiliated colleges",
      "Diverse academic programs",
      "Focus on regional development",
      "Affordable education",
      "Growing infrastructure",
      "Community engagement programs"
    ],
    chancellorName: "Prof. Dr. Tulsi Prasad Gautam",
    chancellorMessage: `<p>Purbanchal University strives to provide quality education accessible to all, contributing to the socio-economic development of Nepal.</p>`,
  },
  {
    universityName: "Nepal Sanskrit University",
    universityAddress: "Beljhundi, Dang (Campus in Kathmandu)",
    universityPhone: "082-560112",
    universityEmail: "info@nsu.edu.np",
    establishedYear: 1986,
    website: "https://nsu.edu.np",
    type: "Public",
    overview: `<p>Nepal Sanskrit University (NSU) was established in 1986 with the objective of preserving and promoting Sanskrit language, literature, and Vedic studies. It also offers modern academic programs.</p>
    <p>NSU has constituent and affiliated campuses across Nepal, including in Kathmandu, offering programs in Sanskrit, Ayurveda, Jyotish (Astrology), and various other disciplines.</p>`,
    admissionNotice: "Admissions open for Sanskrit, Ayurveda, and other traditional and modern programs.",
    admissionGuidelines: `<h3>Admission Guidelines</h3>
    <ul>
      <li>Apply through NSU constituent or affiliated campuses</li>
      <li>Submit required academic documents</li>
      <li>Meet program-specific eligibility criteria</li>
      <li>Complete registration process</li>
    </ul>`,
    scholarshipInfo: `<p>NSU provides scholarships for students pursuing Sanskrit and traditional studies, as well as need-based financial assistance.</p>`,
    keyFeatures: [
      "Specialized in Sanskrit and Vedic studies",
      "Ayurveda and traditional medicine programs",
      "Preservation of cultural heritage",
      "Modern academic programs alongside traditional studies",
      "Research in ancient texts and manuscripts",
      "Unique educational offerings"
    ],
    chancellorName: "Prof. Dr. Gangaprasad Upreti",
    chancellorMessage: `<p>Nepal Sanskrit University is committed to preserving our rich cultural and linguistic heritage while embracing modern education.</p>`,
  },
  {
    universityName: "Agriculture and Forestry University",
    universityAddress: "Rampur, Chitwan (Affiliated Colleges in Kathmandu)",
    universityPhone: "056-592039",
    universityEmail: "info@afu.edu.np",
    establishedYear: 2010,
    website: "https://afu.edu.np",
    type: "Public",
    overview: `<p>Agriculture and Forestry University (AFU) was established in 2010 as Nepal's first specialized university in agriculture and forestry. It focuses on agricultural education, research, and extension.</p>
    <p>AFU offers undergraduate and graduate programs in agriculture, forestry, animal science, and related fields through its constituent and affiliated colleges.</p>`,
    admissionNotice: "Admissions open for B.Sc. Agriculture, B.Sc. Forestry, and postgraduate programs.",
    admissionGuidelines: `<h3>Admission Process</h3>
    <ul>
      <li>Apply online through AFU website</li>
      <li>Appear for AFU Entrance Examination</li>
      <li>Submit required documents after selection</li>
      <li>Complete admission formalities</li>
    </ul>`,
    scholarshipInfo: `<p>AFU offers merit-based scholarships and financial aid for students from rural and disadvantaged backgrounds to promote agricultural education.</p>`,
    keyFeatures: [
      "Specialized agricultural and forestry education",
      "Modern research facilities",
      "Practical field-based learning",
      "Focus on sustainable agriculture",
      "Extension and outreach programs",
      "International collaborations"
    ],
    chancellorName: "Prof. Dr. Punya Prasad Regmi",
    chancellorMessage: `<p>AFU is dedicated to advancing agricultural science and technology for food security and sustainable development in Nepal.</p>`,
  }
];

const addUniversities = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing universities (optional - remove this line if you want to keep existing data)
    // await University.deleteMany({});
    // console.log("🗑️  Cleared existing universities");

    // Insert universities
    const result = await University.insertMany(universities);
    console.log(`✅ Successfully added ${result.length} universities`);

    // Display added universities
    result.forEach((uni, index) => {
      console.log(`${index + 1}. ${uni.universityName} - ${uni.type} (Est. ${uni.establishedYear})`);
    });

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error adding universities:", error);
    process.exit(1);
  }
};

addUniversities();
