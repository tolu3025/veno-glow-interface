
import { useState, useEffect } from 'react';

interface QuizQuestion {
  id: string;
  text?: string;
  question?: string;
  options: string[];
  correctOption?: number;
  answer?: number;
  explanation?: string;
}

interface UserAnswer {
  selectedOption: number | null;
  isCorrect: boolean;
}

export const useQuizExplanations = (questions: QuizQuestion[], userAnswers: (number | null)[]) => {
  const [explanations, setExplanations] = useState<UserAnswer[]>([]);

  useEffect(() => {
    const formattedAnswers = userAnswers.map((selectedOption, index) => {
      const question = questions[index];
      const correctAnswer = question?.answer !== undefined ? question.answer : question?.correctOption || 0;
      
      return {
        selectedOption,
        isCorrect: selectedOption === correctAnswer
      };
    });

    setExplanations(formattedAnswers);
  }, [questions, userAnswers]);

  const getQuestionExplanation = (questionIndex: number) => {
    const question = questions[questionIndex];
    if (!question) return null;

    const questionText = question.text || question.question || '';
    const questionOptions = Array.isArray(question.options) ? question.options : [];
    const correctAnswer = question.correctOption !== undefined ? question.correctOption : 
                         question.answer !== undefined ? question.answer : 0;
    const explanation = question.explanation || '';

    return {
      questionText,
      questionOptions,
      correctAnswer,
      explanation,
      userAnswer: explanations[questionIndex]
    };
  };

  return {
    explanations,
    getQuestionExplanation
  };
};
