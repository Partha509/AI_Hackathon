"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { validateCourseEligibility, parseCourseSemester } from "@/lib/semester-utils";
import type { Course, CourseApplication, Profile, Semester } from "@/lib/supabase/types";

/**
 * Fetches courses enriched with application status and semester eligibility for a student.
 */
export async function getStudentCoursesData(studentEmailOrId?: string) {
  const supabase = createAdminClient();

  try {
    // 1. Fetch courses
    const { data: courses, error: courseErr } = await supabase
      .from("courses")
      .select("*")
      .order("code", { ascending: true });

    if (courseErr) throw courseErr;

    // 2. Fetch student profile if provided
    let studentProfile: Profile | null = null;
    let studentApps: CourseApplication[] = [];

    if (studentEmailOrId) {
      const { data: student } = await supabase
        .from("profiles")
        .select("*")
        .or(`id.eq.${studentEmailOrId},email.eq.${studentEmailOrId}`)
        .single();

      if (student) {
        studentProfile = student as Profile;

        // Fetch applications for this student
        try {
          const { data: apps } = await supabase
            .from("course_applications")
            .select("*")
            .eq("student_id", student.id);

          studentApps = (apps || []) as CourseApplication[];
        } catch {
          // Table might be pending
        }
      }
    }

    // Default fallback student profile if not found or in test mode
    if (!studentProfile) {
      const { data: firstStudent } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .limit(1)
        .single();

      if (firstStudent) {
        studentProfile = firstStudent as Profile;
      } else {
        studentProfile = {
          id: "student-demo",
          email: "student@facultyos.edu",
          full_name: "Sabbir Ahmed",
          role: "student",
          department: "CSE",
          student_id_number: "21.01.04.099",
          current_semester: "3.2",
          created_at: new Date().toISOString(),
        };
      }
    }

    const appMap = new Map<string, CourseApplication>();
    studentApps.forEach((a) => appMap.set(a.course_id, a));

    // 3. Map courses with eligibility and status
    const studentSemester = studentProfile?.current_semester || "3.2";

    const enrichedCourses = (courses || []).map((c) => {
      const application = appMap.get(c.id);
      const isEnrolled = Array.isArray(c.enrolled_students)
        ? c.enrolled_students.some(
            (s: any) =>
              s.student_id === studentProfile?.id ||
              s.email === studentProfile?.email
          )
        : false;

      const eligibility = validateCourseEligibility(studentSemester, c.code);

      return {
        ...c,
        parsedSemester: parseCourseSemester(c.code),
        isEnrolled,
        hasApplied: Boolean(application) || isEnrolled,
        applicationStatus: isEnrolled
          ? "enrolled"
          : application?.status || null,
        isEligible: eligibility.eligible,
        requiredSemester: eligibility.requiredSemester,
        eligibilityReason: eligibility.message,
      };
    });

    return {
      success: true,
      student: studentProfile,
      courses: enrichedCourses,
    };
  } catch (err: any) {
    return {
      success: false,
      student: null,
      courses: [],
      error: err.message || "Failed to load student course catalog",
    };
  }
}

/**
 * Handles course application submission with strict semester validation.
 */
export async function applyForCourseAction(
  studentId: string,
  courseId: string
) {
  const supabase = createAdminClient();

  try {
    // 1. Fetch student
    const { data: student, error: studentErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", studentId)
      .single();

    if (studentErr || !student) throw new Error("Student profile not found.");

    // 2. Fetch course
    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseErr || !course) throw new Error("Course not found.");

    // 3. Strict Constraint Validation: Check semester match
    const studentSemester = student.current_semester || "3.2";
    const eligibility = validateCourseEligibility(studentSemester, course.code);

    if (!eligibility.eligible) {
      return {
        success: false,
        error: eligibility.message || `Course is in semester [${eligibility.requiredSemester}], but your current semester is [${studentSemester}].`,
      };
    }

    // 4. Check if student already enrolled in course
    if (Array.isArray(course.enrolled_students)) {
      const alreadyIn = course.enrolled_students.some(
        (s: any) => s.student_id === student.id || s.email === student.email
      );
      if (alreadyIn) {
        return {
          success: false,
          error: `You are already enrolled in ${course.code}.`,
        };
      }
    }

    // 5. Insert or upsert into course_applications
    const { error: appErr } = await supabase
      .from("course_applications")
      .upsert(
        {
          student_id: student.id,
          course_id: course.id,
          status: "pending",
          applied_at: new Date().toISOString(),
        },
        { onConflict: "student_id,course_id" }
      );

    if (appErr) throw appErr;

    revalidatePath("/dashboard/student/courses");
    revalidatePath("/dashboard/admin/enrollments");
    revalidatePath("/dashboard/admin");

    return {
      success: true,
      courseCode: course.code,
      courseTitle: course.title,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to submit course application",
    };
  }
}
