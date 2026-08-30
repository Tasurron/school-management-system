// A "teacher assignment" here means: teacher X is assigned to teach subject Y for class Z.
// (Not to be confused with a homework "Assignment" in assignment.ts.)
export interface TeacherAssignment {
  id: number;
  teacherId: number;
  teacherName: string;
  subjectId: number;
  subjectName: string;
  classId: number;
  className: string;
  classGrade: number;
  classSection: string;
  createdAt: string;
}

export interface TeacherAssignmentInput {
  teacherId: number;
  subjectId: number;
  classId: number;
}
