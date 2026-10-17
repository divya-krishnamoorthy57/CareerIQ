export interface InterviewQuestion {
  id: number;
  question: string;
  category: string;
}

export interface InterviewAnswer {
  question_id: number;
  answer: string;
}