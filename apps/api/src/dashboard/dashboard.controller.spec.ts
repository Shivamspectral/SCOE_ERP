import { summarizeVerifiedMarks } from './dashboard.controller';

describe('dashboard verified-mark summary', () => {
  it('calculates percentages from each assessment maximum instead of averaging raw marks', () => {
    expect(summarizeVerifiedMarks([
      { student_id: 'student-1', marks_obtained: 15, max_marks: 30 },
      { student_id: 'student-2', marks_obtained: 30, max_marks: 60 },
    ])).toEqual({ averageScore: 50, lowScoreStudents: 0 });
  });

  it('counts each low-scoring student once across multiple assessments', () => {
    expect(summarizeVerifiedMarks([
      { student_id: 'student-1', marks_obtained: 10, max_marks: 50 },
      { student_id: 'student-1', marks_obtained: 20, max_marks: 100 },
      { student_id: 'student-2', marks_obtained: 35, max_marks: 100 },
    ])).toEqual({ averageScore: 25, lowScoreStudents: 2 });
  });

  it('ignores rows with missing marks or invalid maximums', () => {
    expect(summarizeVerifiedMarks([
      { student_id: 'student-1', marks_obtained: null, max_marks: 100 },
      { student_id: 'student-2', marks_obtained: 10, max_marks: 0 },
    ])).toEqual({ averageScore: null, lowScoreStudents: 0 });
  });
});
