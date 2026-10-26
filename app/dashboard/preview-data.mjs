export const plans = {
  classes: { name: 'Classes', duration: '1 month', credits: null, interactive: false },
  interactive: { name: 'Interactive', duration: '3 months', credits: '100 credits / day', interactive: true },
  'all-access': { name: 'All Access', duration: '6 months', credits: '2,000 credits / week', interactive: true },
};

export function getPreviewPlan(value) {
  return Object.hasOwn(plans, value) ? plans[value] : plans.interactive;
}

export function getDashboardPlanName(value) {
  return typeof value === 'string' && Object.hasOwn(plans, value)
    ? plans[value].name
    : 'Your learning plan';
}

export const lessons = [
  { id: 'constitution', number: '01', title: 'Introduction to the Constitution', subject: 'Indian Polity', duration: '18 min',
    summary: 'Start with the document that sets out how India is governed.',
    points: ['The Constitution defines the structure and powers of government.', 'It protects fundamental rights and sets out guiding principles for the state.', 'The Preamble expresses the values and goals of the Constitution.'],
    question: 'Which part introduces the Constitution’s values and goals?', answer: 'The Preamble.' },
  { id: 'numbers', number: '02', title: 'Build your number sense', subject: 'Quantitative Aptitude', duration: '24 min',
    summary: 'Turn a long calculation into a short, clear series of steps.',
    points: ['Check divisibility before beginning a long calculation.', 'Use factors and multiples to simplify fractions.', 'Estimate the answer to catch calculation mistakes.'],
    question: 'What is the highest common factor of 12 and 18?', answer: '6. It is the largest number that divides both 12 and 18.' },
  { id: 'reasoning', number: '03', title: 'Spot the pattern', subject: 'General Intelligence', duration: '16 min',
    summary: 'Learn to explain a pattern before choosing the next term.',
    points: ['Compare the difference between consecutive terms.', 'Check whether the differences follow a pattern of their own.', 'Test your rule against every term provided.'],
    question: 'What follows 2, 4, 8, 16?', answer: '32. Each term is twice the previous term.' },
];
