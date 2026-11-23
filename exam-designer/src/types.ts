export type QuestionType =
  | 'answer'
  | 'fill'
  | 'complete'
  | 'truefalse'
  | 'match'
  | 'translate'
  | 'passage'
  | 'grammar'
  | 'open'
  | 'mcq';

export type Dir = 'rtl' | 'ltr';
export type Align = 'start' | 'center' | 'end';

export interface ImageData {
  src: string; // data URL
  width: number; // percent of content width
  align: Align;
}

export interface Item {
  id: string;
  text: string;
  answer: string; // model answer (teacher copy / answer key)
  options: string[]; // MCQ
  correct: number | null; // MCQ
  tf: boolean | null; // true/false answer
}

export interface Pair {
  id: string;
  left: string; // empty => distractor in column B
  right: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  instructions: string;
  marks: number | null;
  dir: 'inherit' | Dir;
  passage: string;
  image: ImageData | null;
  items: Item[];
  pairs: Pair[];
  seed: number; // match column shuffle
  answerLines: number;
  optionCount: number;
  optionCols: 0 | 1 | 2 | 4; // 0 = auto
  numbering: 'letters' | 'numbers' | 'none';
  modelAnswer: string; // for open questions
}

export type ExamTypeKey =
  | ''
  | 'month1'
  | 'month2'
  | 'midyear'
  | 'final'
  | 'daily'
  | 'trial'
  | 'other';

export interface ExamInfo {
  authority: string; // ministry / directorate (optional extra line)
  school: string;
  subject: string;
  grade: string;
  teacher: string;
  examType: ExamTypeKey;
  examTypeOther: string;
  year: string;
  date: string;
  duration: string;
  totalMarks: number | null;
  generalInstructions: string;
}

export type HeaderField =
  | 'authority'
  | 'school'
  | 'subject'
  | 'grade'
  | 'teacher'
  | 'examType'
  | 'year'
  | 'date'
  | 'duration'
  | 'totalMarks'
  | 'logo';

export interface HeaderSettings {
  layout: 'classic' | 'centered' | 'boxed';
  show: Record<HeaderField, boolean>;
  logo: string | null;
  logoHeight: number; // mm
  logoPosition: Align;
  titleAlign: Align;
  border: 'line' | 'double' | 'none';
  studentName: boolean;
  studentSection: boolean;
  scoreBox: boolean;
}

export interface ClosingSettings {
  enabled: boolean;
  text: string;
  position: 'after' | 'bottom';
  align: Align;
  size: number; // pt
  signature: boolean;
}

export type PaperLang = 'ar' | 'en' | 'mixed';
export type CopiesMode = 'single' | 'double' | 'auto';

export interface DesignSettings {
  pageSize: 'A4' | 'Letter' | 'A5';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; bottom: number; right: number; left: number };
  arFont: string;
  latinFont: string;
  fontSize: number; // pt
  headingSize: number; // pt
  lineHeight: number;
  colorMode: 'bw' | 'gray' | 'accent';
  accent: string;
  headingColor: string;
  dividerColor: string;
  lang: PaperLang;
  copies: CopiesMode;
  cutLine: boolean;
  qDividers: boolean;
  showMarksStudent: boolean;
  pageNumbers: boolean;
  qNumberStyle: 'words' | 'short' | 'number';
  optionLabels: 'auto' | 'latin' | 'arabic';
  digits: 'western' | 'eastern';
  fitOnePage: boolean; // shrink the font so the exam prints on one page
}

export interface Exam {
  id: string;
  name: string; // optional label in the exam list
  createdAt: number;
  updatedAt: number;
  info: ExamInfo;
  header: HeaderSettings;
  questions: Question[];
  closing: ClosingSettings;
  design: DesignSettings;
}

export type Variant = 'student' | 'teacher' | 'key';
