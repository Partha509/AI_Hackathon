export const SEMESTERS = [
  "1.1",
  "1.2",
  "2.1",
  "2.2",
  "3.1",
  "3.2",
  "4.1",
  "4.2",
] as const;

export type Semester = (typeof SEMESTERS)[number];

export function isSemester(value: string): value is Semester {
  return (SEMESTERS as readonly string[]).includes(value);
}

/**
 * Derives the semester from a course code using the first two digits of its
 * numeric part. E.g. "CSE 3201" → "3.2", "CSE 321" → "3.2", "CSE 311" → "3.1".
 */
export function parseSemesterFromCode(code: string): Semester | null {
  const digits = (code.match(/\d/g) ?? []).join("");
  if (digits.length < 2) return null;
  const candidate = `${digits[0]}.${digits[1]}`;
  return isSemester(candidate) ? candidate : null;
}

/** Next semester in the 1.1 → 4.2 sequence, or null if already at the end. */
export function nextSemester(current: Semester): Semester | null {
  const i = SEMESTERS.indexOf(current);
  return i >= 0 && i < SEMESTERS.length - 1 ? SEMESTERS[i + 1] : null;
}

export function semesterLabel(s: Semester): string {
  const [year, term] = s.split(".");
  const years = ["1st", "2nd", "3rd", "4th"];
  const terms = ["1st", "2nd"];
  return `${years[Number(year) - 1]} Year, ${terms[Number(term) - 1]} Semester`;
}
