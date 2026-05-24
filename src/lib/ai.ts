import { LessonPlan, Assessment, Student } from './mockData';

// Simulated latency helper
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface AILessonPlanResult {
  title: string;
  objectives: string[];
  activities: { session: number; activity: string; duration: string }[];
  assessments: string[];
  homework: string;
}

export interface AITeachingNotesResult {
  title: string;
  language: string;
  introduction: string;
  explanations: { subtitle: string; content: string; examples: string[] }[];
  visualAids: string[];
  exercises: string[];
}

export interface AIStudentAnalysisResult {
  academicRisk: 'Low' | 'Moderate' | 'High';
  weakSubjectAreas: string[];
  strengthAreas: string[];
  actionItems: string[];
  homeReviewGuide: string;
}

export interface AIQuestion {
  question: string;
  type: string;
  options?: string[];
  answer: string;
}

// ----------------------------------------------------
// AI Simulation Engines
// ----------------------------------------------------

export const generateLessonPlanAI = async (
  grade: string,
  subject: string,
  topic: string,
  sessions: number
): Promise<AILessonPlanResult> => {
  await delay(1500); // Simulate network and AI token generation

  // Dynamic template based on subject
  if (subject.toLowerCase().includes('math')) {
    return {
      title: `AI Generated: ${grade} Mathematics – ${topic || 'Algebraic Equations'}`,
      objectives: [
        `Understand the fundamental properties of ${topic || 'algebraic equations'}.`,
        `Successfully solve multi-step problems with 90% accuracy.`,
        `Apply mathematical models to physical real-world scenarios.`,
      ],
      activities: Array.from({ length: sessions }).map((_, idx) => ({
        session: idx + 1,
        activity: idx === 0 
          ? `Concept introduction & vocabulary review of ${topic || 'variables'}.`
          : idx === sessions - 1 
          ? `Interactive class quiz and collaborative peer grading session.`
          : `Step-by-step problem-solving board exercises and team solving blocks.`,
        duration: '45 mins',
      })),
      assessments: [
        `Continuous check-in quiz (Session 2)`,
        `Group whiteboard presentation of active formulas`,
        `Take-home workbook completion tracking`,
      ],
      homework: `Complete the review practice set B on page 142. Solve all odd-numbered problems for parent review.`,
    };
  }

  // Biology template
  return {
    title: `AI Generated: ${grade} Biology – ${topic || 'Photosynthesis and Ecosystems'}`,
    objectives: [
      `Detail the key metabolic inputs and outputs of ${topic || 'cellular biology'}.`,
      `Construct accurate structural diagrams labeling cell boundaries.`,
      `Examine environmental dependencies affecting biochemical rates.`,
    ],
    activities: Array.from({ length: sessions }).map((_, idx) => ({
      session: idx + 1,
      activity: idx === 0
        ? `Interactive slide presentation detailing organelles and chemical receptors.`
        : idx === sessions - 1
        ? `Laboratory write-up examination, microscope cleaning and summary reports.`
        : `Guided review drawing structures and labeling transport proteins in pairs.`,
      duration: '45 mins',
    })),
    assessments: [
      `Formative diagram quiz`,
      `Ecosystem peer-to-peer modeling challenge score`,
      `Laboratory performance evaluation checklist`,
    ],
    homework: `Draft a 250-word synthesis connecting cell respiration outputs directly to photosynthesis inputs.`,
  };
};

export const generateTeachingNotesAI = async (
  grade: string,
  subject: string,
  topic: string,
  language: string
): Promise<AITeachingNotesResult> => {
  await delay(1200);

  const isAmharic = language === 'Amharic';
  const isAfaanOromo = language === 'Afaan Oromo';
  const isTigrinya = language === 'Tigrinya';

  if (isAmharic) {
    return {
      title: `የማስተማሪያ ማስታወሻ: ${grade} ${subject} - ${topic || 'ክፍልፋዮች (Fractions)'}`,
      language: 'Amharic',
      introduction: `ይህ የማስተማሪያ ማስታወሻ የተዘጋጀው ለኢትዮጵያ የትምህርት ሥርዓት ሥርዓተ-ትምህርት መሠረት በማድረግ ነው። ተማሪዎች የ${topic || 'ክፍልፋዮች'}ን መሠረታዊ ጽንሰ-ሀሳብ በቀላሉ እንዲረዱ ይረዳል።`,
      explanations: [
        {
          subtitle: 'ክፍልፋይ ምንድን ነው?',
          content: 'ክፍልፋይ የአንድ ሙሉ ነገር የተወሰነ እኩል ክፍልን የሚገልጽ የቁጥር ዓይነት ነው። ክፍልፋይ ሁለት ዋና ክፍሎች አሉት፡ ላዕላይ (Numerator) እና ታህታይ (Denominator)።',
          examples: [
            '1/2 ማለት አንድን ዳቦ ለሁለት እኩል ሰንጥቆ አንዱን ክፍል መውሰድ ማለት ነው።',
            '3/4 ማለት አንድን ብርቱካን በአራት እኩል ከፍሎ ሦስቱን ክፍሎች መውሰድ ማለት ነው።',
          ],
        },
        {
          subtitle: 'ክፍልፋዮችን መደመር እና መቀነስ',
          content: 'ታህታያቸው (Denominator) ተመሳሳይ የሆኑ ክፍልፋዮችን ለመደመር ላዕላያቸውን ብቻ መደመር እና ተመሳሳይ ታህታዩን ማስቀመጥ ይበቃል።',
          examples: [
            '1/5 + 2/5 = (1+2)/5 = 3/5',
            '4/7 - 2/7 = (4-2)/7 = 2/7',
          ],
        },
      ],
      visualAids: [
        'የክብ ኬክ ምስልን ለአራት ከፍሎ አንዱን ክፍል በቀለም በመቀባት 1/4 ማሳየት።',
        'የመስመር ቁጥር (Number Line) በመጠቀም ከ0 እስከ 1 ያለውን ርቀት በእኩል በመከፋፈል ክፍልፋዩን ማመልከት።',
      ],
      exercises: [
        'የሚከተሉትን ክፍልፋዮች ደምሩ፡ 2/9 + 4/9 = ?',
        'አንድን ሙሉ ኬክ ለ 8 ተማሪዎች እኩል ብናከፋፍል እያንዳንዱ ተማሪ ምን ያህል ክፍል ይደርሰዋል?',
        'ቀጣዩን ክፍልፋይ አቃልሉ፡ 4/8 = ?',
      ],
    };
  }

  // Multilingual templates structure
  const langPrefix = isAfaanOromo ? '[Afaan Oromo] ' : isTigrinya ? '[Tigrinya] ' : '';
  const welcomeText = isAfaanOromo 
    ? `Qabiyyee barumsaa kana kan qophaa'e sirna barnoota Itoophiyaa irratti hunda'uun barattoota ${grade}tiif.`
    : isTigrinya
    ? `እዚ ትምህርታዊ ፅሑፍ ብመሰረት ስርዓተ ትምህርቲ ኢትዮጵያ ተዳልዩ ዘሎ ኮይኑ ተምሃሮ ብቀሊሉ ክርድእዎ ይሕግዝ።`
    : `This teaching guide is fully aligned with the Ethiopian MOE Curriculum guidelines for ${grade}. It simplifies core parameters for class presentation.`;

  return {
    title: `${langPrefix}Teaching Notes: ${grade} ${subject} – ${topic || 'Fractions & Ratios'}`,
    language: language || 'English',
    introduction: welcomeText,
    explanations: [
      {
        subtitle: 'Core Concept Definition',
        content: `Understanding ${topic || 'the ratio structure'} is fundamental in everyday measurements and scientific ratios. It describes parts of a larger unified system.`,
        examples: [
          'Example 1: A shared classroom supply split equally between students representing sub-fractions.',
          'Example 2: Cooking calculations using simple proportion metrics.',
        ],
      },
      {
        subtitle: 'Practical Class Calculations',
        content: 'Apply basic algebraic arithmetic or cell metabolic balances to solve theoretical text problems.',
        examples: [
          '3/4 representing three out of four total segments.',
          'Scaling factors: doubling the values maintains ratio equivalence.',
        ],
      },
    ],
    visualAids: [
      'Circular pie chart models splitting parameters into colored sectors.',
      'Symmetric rectangular bar divisions for clear parts-to-whole estimation.',
    ],
    exercises: [
      `Solve basic practice worksheets: Identify the larger ratio between 3/5 and 4/7.`,
      `Explain in your own words why fractional systems represent division parameters.`,
    ],
  };
};

export const generateAssessmentAI = async (
  grade: string,
  subject: string,
  difficulty: string,
  type: string
): Promise<AIQuestion[]> => {
  await delay(1500);

  const mockQuestions: Record<string, AIQuestion[]> = {
    biology: [
      { question: 'Which structures are found in plant cells but absent in animal cells?', type: 'MCQ', options: ['Cell Wall & Chloroplasts', 'Nucleus & Ribosomes', 'Cell Membrane & Cytoplasm', 'Mitochondria & Vacuole'], answer: 'Cell Wall & Chloroplasts' },
      { question: 'Active transport requires chemical energy in the form of ATP to move molecules against concentration gradients.', type: 'True/False', answer: 'True' },
      { question: 'Explain the ecological significance of decomposers in Ethiopian savannah systems.', type: 'Essay', answer: 'Decomposers recycle dead organic matter back into basic nutrients (nitrogen, phosphorus), maintaining soil viability for producers and sustaining herbivores.' },
    ],
    math: [
      { question: 'What is the sum of the roots of the quadratic equation x^2 - 5x + 6 = 0?', type: 'Short Answer', answer: '5' },
      { question: 'A quadratic equation always possesses at least one real solution.', type: 'True/False', answer: 'False' },
      { question: 'Solve for x: 2x - 7 = 3(x + 1)', type: 'MCQ', options: ['x=-10', 'x=4', 'x=-4', 'x=10'], answer: 'x=-10' },
    ],
  };

  const selectedKey = subject.toLowerCase().includes('biol') ? 'biology' : 'math';
  return mockQuestions[selectedKey];
};

export const analyzeStudentPerformanceAI = async (student: Student): Promise<AIStudentAnalysisResult> => {
  await delay(1000);

  const isLowPerf = student.gpa < 2.8 || student.attendanceRate < 90;
  
  if (isLowPerf) {
    return {
      academicRisk: 'High',
      weakSubjectAreas: ['Mathematics (Quadratic Roots)', 'Physics (Mechanics formulas)'],
      strengthAreas: ['English language communication', 'Biology diagrams accuracy'],
      actionItems: [
        'Mandatory attendance in Monday afternoon peer-tutor math blocks.',
        'Weekly teacher check-in during homeroom section evaluations.',
        'Daily review logs to be signed off by the parent.',
      ],
      homeReviewGuide: `Ato ${student.parentName}, your child requires strict revision on simple equations. Ensure they dedicate at least 30 minutes every evening to worksheets. Avoid distractions during homework blocks.`,
    };
  }

  return {
    academicRisk: 'Low',
    weakSubjectAreas: ['Advanced chemistry laboratory balancing'],
    strengthAreas: ['Mathematics and algebraic proofs', 'Biology practical identification', 'Syllabus coverage completion'],
    actionItems: [
      'Provide enrichment homework exercises in physics and STEM.',
      'Recommend enrollment as a peer-tutor for Grade 9 study sessions.',
      'Nominate for the school regional Science Olympiad representational group.',
    ],
    homeReviewGuide: `Excellent academic standing. W/ro/Ato ${student.parentName}, please continue fostering your child's natural affinity for Mathematics and Science by encouraging their participation in STEM group projects.`,
  };
};

export const generateAICalendarTimetable = async (): Promise<any> => {
  await delay(1200);
  
  // Simulates a conflict-free grid
  return {
    schedules: [
      { time: '08:30 - 09:15', monday: 'Grade 9 Math (Abebe K.)', tuesday: 'Grade 10 Math (Abebe K.)', wednesday: 'Grade 9 Math (Abebe K.)', thursday: 'Grade 10 Math (Abebe K.)', friday: 'Grade 11 Math (Abebe K.)' },
      { time: '09:15 - 10:00', monday: 'Grade 9 Biology (Martha F.)', tuesday: 'Grade 10 Biology (Martha F.)', wednesday: 'Grade 9 Biology (Martha F.)', thursday: 'Grade 10 Biology (Martha F.)', friday: 'Study Hall' },
      { time: '10:00 - 10:30', monday: 'Recess', tuesday: 'Recess', wednesday: 'Recess', thursday: 'Recess', friday: 'Recess' },
      { time: '10:30 - 11:15', monday: 'Grade 12 English (Tigist A.)', tuesday: 'Grade 9 English (Tigist A.)', wednesday: 'Grade 12 English (Tigist A.)', thursday: 'Grade 9 English (Tigist A.)', friday: 'Grade 12 English (Tigist A.)' },
      { time: '11:15 - 12:00', monday: 'Grade 11 Chemistry (Yohannes T.)', tuesday: 'Grade 12 Chemistry (Yohannes T.)', wednesday: 'Grade 11 Chemistry (Yohannes T.)', thursday: 'Grade 12 Chemistry (Yohannes T.)', friday: 'Assembly' },
    ],
    conflictsDetected: 0,
    optimizationsApplied: ['Distributed STEM double periods', 'Synced recess blocks for all teachers', 'Balanced daily teacher prep hours'],
  };
};
