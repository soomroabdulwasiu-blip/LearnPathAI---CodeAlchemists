import { TopicId, TopicMeta } from '../types';

export const TOPICS: TopicMeta[] = [
  {
    id: 'variables',
    title: 'Variables and Data Types',
    titleUrdu: 'متغیرات اور ڈیٹا کی اقسام',
    description: 'Identifiers, integers, floats, booleans, strings, type casting, dynamic typing.',
    descriptionUrdu: 'شناخت کنندگان، اعداد، بولین، سٹرنگز اور ٹائپ کاسٹنگ۔',
    hue: '#FFB92E', // Amber
    iconName: 'Variable',
    standardEstMinutes: 45,
    prerequisites: [],
  },
  {
    id: 'operators',
    title: 'Operators and Expressions',
    titleUrdu: 'آپریٹرز اور ایکسپریشنز',
    description: 'Arithmetic, comparison, logical (and/or/not), assignment, precedence.',
    descriptionUrdu: 'حسابی، موازنہ، اور منطقی آپریٹرز اور برتری کے اصول۔',
    hue: '#29B6F6', // Sky
    iconName: 'Divide',
    standardEstMinutes: 40,
    prerequisites: ['variables'],
  },
  {
    id: 'conditionals',
    title: 'Conditional Statements',
    titleUrdu: 'مشروط بیانات (Conditionals)',
    description: 'if, elif, else, nested logic, boolean decision trees, guard clauses.',
    descriptionUrdu: 'if، elif، else، اور منطقی فیصلہ سازی۔',
    hue: '#FF6B57', // Coral
    iconName: 'GitFork',
    standardEstMinutes: 50,
    prerequisites: ['operators'],
  },
  {
    id: 'loops',
    title: 'Loops and Iteration',
    titleUrdu: 'لوپس اور تکرار (Loops)',
    description: 'for loops, while loops, range(), break, continue, and loop conditions.',
    descriptionUrdu: 'for اور while لوپس، رینج فنکشن، اور لوپ کے اصول۔',
    hue: '#8A5CF6', // Grape
    iconName: 'Repeat',
    standardEstMinutes: 60,
    prerequisites: ['conditionals'],
  },
  {
    id: 'strings',
    title: 'Strings and Formatting',
    titleUrdu: 'سٹرنگز اور فارمیٹنگ',
    description: 'String methods, slicing, f-strings, indexing, immutability, manipulation.',
    descriptionUrdu: 'سٹرنگ میتھوڈز، سلائسنگ، f-strings، اور انڈیکسنگ۔',
    hue: '#EC4899', // Rose
    iconName: 'AlignLeft',
    standardEstMinutes: 45,
    prerequisites: ['operators'],
  },
  {
    id: 'lists',
    title: 'Lists and Tuples',
    titleUrdu: 'لسٹس اور ٹپلز (Lists & Tuples)',
    description: 'Sequences, indexing, slicing, mutability vs immutability, list operations.',
    descriptionUrdu: 'سیکوئنسز، تبدیل پذیری، سلائسنگ، اور لسٹ آپریشنز۔',
    hue: '#12C99B', // Mint
    iconName: 'ListOrdered',
    standardEstMinutes: 55,
    prerequisites: ['loops'],
  },
  {
    id: 'dictionaries',
    title: 'Dictionaries and Sets',
    titleUrdu: 'ڈکشنریز اور سیٹس',
    description: 'Key-value mapping, dict methods (.get, .keys, .values), unique keys, sets.',
    descriptionUrdu: 'کی-ویلیو جوڑے، ڈکشنری میتھڈز، اور منفرد سیٹس۔',
    hue: '#2D5BFF', // Primary Blue
    iconName: 'BookOpen',
    standardEstMinutes: 60,
    prerequisites: ['lists'],
  },
  {
    id: 'functions',
    title: 'Functions and Scope',
    titleUrdu: 'فنکشنز اور اسکوپ',
    description: 'def statements, parameters, return values, default arguments, and LEGB scope.',
    descriptionUrdu: 'def بیانات، پیرامیٹرز، واپسی کی قدریں، اور متغیر اسکوپ۔',
    hue: '#6366F1', // Indigo
    iconName: 'Cpu',
    standardEstMinutes: 65,
    prerequisites: ['loops'],
  },
  {
    id: 'exceptions',
    title: 'Exception Handling',
    titleUrdu: 'خرابیوں کا انتظام (Exceptions)',
    description: 'try, except, finally, raise, built-in exception types, resilient error recovery.',
    descriptionUrdu: 'try، except، اور ایرر ہینڈلنگ کے اصول۔',
    hue: '#F97316', // Orange
    iconName: 'AlertTriangle',
    standardEstMinutes: 50,
    prerequisites: ['functions', 'conditionals'],
  },
  {
    id: 'oop',
    title: 'Object-Oriented Programming (OOP)',
    titleUrdu: 'آبجیکٹ اورینٹڈ پروگرامنگ',
    description: 'Classes, objects, __init__, methods, inheritance, encapsulation, polymorphism.',
    descriptionUrdu: 'کلاسز، آبجیکٹس، کنسٹرکٹرز، اور وراثت۔',
    hue: '#06B6D4', // Cyan
    iconName: 'Boxes',
    standardEstMinutes: 80,
    prerequisites: ['functions', 'dictionaries'],
  },
];

export const TOPIC_MAP = TOPICS.reduce<Record<TopicId, TopicMeta>>((acc, t) => {
  acc[t.id] = t;
  return acc;
}, {} as Record<TopicId, TopicMeta>);

export const MASTERY_THRESHOLDS = {
  NOVICE: 35,
  DEVELOPING: 60,
  COMPETENT: 85,
} as const;

export function getMasteryLevel(score: number): {
  key: 'novice' | 'developing' | 'competent' | 'mastered';
  label: string;
  labelUrdu: string;
  color: string;
  badgeBg: string;
} {
  if (score < MASTERY_THRESHOLDS.NOVICE) {
    return {
      key: 'novice',
      label: 'Needs Attention',
      labelUrdu: 'توجہ طلب',
      color: '#FF6B57',
      badgeBg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    };
  }
  if (score < MASTERY_THRESHOLDS.DEVELOPING) {
    return {
      key: 'developing',
      label: 'Needs Practice',
      labelUrdu: 'مشق درکار ہے',
      color: '#FFB92E',
      badgeBg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    };
  }
  if (score < MASTERY_THRESHOLDS.COMPETENT) {
    return {
      key: 'competent',
      label: 'Developing',
      labelUrdu: 'ترقی پذیر',
      color: '#29B6F6',
      badgeBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    };
  }
  return {
    key: 'mastered',
    label: 'Mastered',
    labelUrdu: 'ماہر',
    color: '#12C99B',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  };
}
