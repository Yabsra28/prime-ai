/** Bole Community School — STEM department head scope */

export const DEPT_SCHOOL_ID = 'sch-1';

export const STEM_SUBJECTS = [
  'Mathematics',
  'Biology',
  'Chemistry',
  'Physics',
  'General Science',
] as const;

export const STEM_DEPT_IDS = ['dept-stem', 'dept-math', 'dept-chem', 'dept-phy', 'dept-bio'] as const;

export function isStemSubject(subject: string): boolean {
  return STEM_SUBJECTS.some(
    (s) => subject === s || subject.toLowerCase().includes(s.toLowerCase()),
  );
}

export function isStemTeacher<T extends { schoolId: string; subjects: string[] }>(teacher: T): boolean {
  return teacher.schoolId === DEPT_SCHOOL_ID && teacher.subjects.some((sub) => isStemSubject(sub));
}

export function filterStemBySubject<T extends { subject: string }>(items: T[]): T[] {
  return items.filter((item) => isStemSubject(item.subject));
}

export type StemSubjectStatus = 'Critical' | 'Warning' | 'Stable';

/** Green-theme progress fill by performance tier (target 70%) */
export function stemPerformanceBarClass(
  average: number,
  status: StemSubjectStatus,
): string {
  if (status === 'Critical' || average < 60) return 'bg-primary/35';
  if (status === 'Warning' || average < 70) return 'bg-primary/60';
  return 'bg-primary';
}

export function stemStatusLabel(status: StemSubjectStatus): string {
  switch (status) {
    case 'Critical':
      return 'Below target';
    case 'Warning':
      return 'Watch';
    default:
      return 'On track';
  }
}
