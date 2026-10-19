import { ReadTestSet } from '../types';

export const LOCAL_READING_BANK: ReadTestSet[] = [
  {
    id: 'local_read_1',
    title: 'Living in the Digital Age',
    parts: [
      {
        partNumber: 1,
        instruction: 'Read the text and choose the best answer.',
        passage: 'Social media has revolutionized communication in the 21st century. While it connects people across the globe, it also poses challenges regarding privacy and mental health.',
        questions: [
          {
            id: 'rq1',
            number: 1,
            text: 'What has social media revolutionized according to the text?',
            options: ['A Education', 'B Communication', 'C Transportation', 'D Healthcare'],
            type: 'MCQ'
          },
          {
            id: 'rq2',
            number: 2,
            text: 'What is one of the challenges mentioned?',
            options: ['A Cost', 'B Speed', 'C Privacy', 'D Language'],
            type: 'MCQ'
          }
        ]
      }
    ],
    answers: {
      'rq1': 'B',
      'rq2': 'C'
    }
  },
  {
    id: 'local_read_2',
    title: 'Traditional Malaysian Cuisine',
    parts: [
      {
        partNumber: 1,
        instruction: 'Read the text and choose the best answer.',
        passage: 'Nasi Lemak is considered the national dish of Malaysia. It consists of fragrant rice cooked in coconut milk and pandan leaf, served with sambal, anchovies, and peanuts.',
        questions: [
          {
            id: 'rq1_2',
            number: 1,
            text: 'What is the main ingredient of Nasi Lemak?',
            options: ['A Noodles', 'B Bread', 'C Rice', 'D Potatoes'],
            type: 'MCQ'
          },
          {
            id: 'rq2_2',
            number: 2,
            text: 'Which leaf is used for fragrance in Nasi Lemak?',
            options: ['A Banana leaf', 'B Curry leaf', 'C Pandan leaf', 'D Lime leaf'],
            type: 'MCQ'
          }
        ]
      }
    ],
    answers: {
      'rq1_2': 'C',
      'rq2_2': 'C'
    }
  }
];
