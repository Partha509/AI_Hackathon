import type { Semester } from "@/lib/supabase/types";

export const ALL_SEMESTERS: Semester[] = [
  "1.1",
  "1.2",
  "2.1",
  "2.2",
  "3.1",
  "3.2",
  "4.1",
  "4.2",
];

export const ALL_SEMESTERS_WITH_GRAD: Semester[] = [
  ...ALL_SEMESTERS,
  "Graduated",
];

/**
 * Parses course code to extract the academic semester.
 * Examples:
 *  - "CSE 3201" -> "3.2"
 *  - "CSE 321"  -> "3.2"
 *  - "CSE 1101" -> "1.1"
 *  - "MATH 2105"-> "2.1"
 *  - "CSE 4200" -> "4.2"
 */
export function parseCourseSemester(courseCode: string): Semester | null {
  if (!courseCode) return null;

  // Extract the first sequence of digits following any department letters or spaces
  const match = courseCode.match(/(\d)(\d)/);
  if (!match) return null;

  const year = match[1];
  const term = match[2];

  // Validate that year is between 1-4 and term is 1 or 2
  const validYears = ["1", "2", "3", "4"];
  const validTerms = ["1", "2"];

  if (validYears.includes(year) && validTerms.includes(term)) {
    return `${year}.${term}` as Semester;
  }

  return null;
}

/**
 * Calculates the subsequent semester for auto-promotion.
 * Sequence: 1.1 -> 1.2 -> 2.1 -> 2.2 -> 3.1 -> 3.2 -> 4.1 -> 4.2 -> Graduated
 */
export function getNextSemester(currentSemester: string | null | undefined): Semester {
  switch (currentSemester) {
    case "1.1":
      return "1.2";
    case "1.2":
      return "2.1";
    case "2.1":
      return "2.2";
    case "2.2":
      return "3.1";
    case "3.1":
      return "3.2";
    case "3.2":
      return "4.1";
    case "4.1":
      return "4.2";
    case "4.2":
    case "Graduated":
    default:
      return "Graduated";
  }
}

/**
 * Validates whether a student with a given current semester can apply for a course.
 */
export function validateCourseEligibility(
  studentSemester: string | null | undefined,
  courseCode: string
): {
  eligible: boolean;
  requiredSemester: Semester | null;
  message?: string;
} {
  const courseSemester = parseCourseSemester(courseCode);

  if (!courseSemester) {
    // If course does not encode a semester, allow application by default
    return {
      eligible: true,
      requiredSemester: null,
    };
  }

  const normalizedStudentSemester = studentSemester || "3.2";

  if (normalizedStudentSemester === courseSemester) {
    return {
      eligible: true,
      requiredSemester: courseSemester,
    };
  }

  return {
    eligible: false,
    requiredSemester: courseSemester,
    message: `You can only apply to courses in semester [${courseSemester}]. Your current semester is [${normalizedStudentSemester}].`,
  };
}
