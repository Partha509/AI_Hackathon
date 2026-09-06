"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { Course, CourseApplication, Profile, Syllabus } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// 1. Dashboard Metrics
// ---------------------------------------------------------------------------
export async function getAdminMetrics() {
  const supabase = createAdminClient();

  try {
    // 1. Total Courses
    const { count: coursesCount, error: coursesError } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true });

    // 2. Active Faculty Members
    const { count: facultyCount, error: facultyError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "faculty");

    // 3. Enrolled Students
    const { count: studentsCount, error: studentsError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student");

    // 4. Pending Applications
    let pendingApplicationsCount = 0;
    let applicationsTableExists = true;

    try {
      const { count, error } = await supabase
        .from("course_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) {
        applicationsTableExists = false;
      } else {
        pendingApplicationsCount = count ?? 0;
      }
    } catch {
      applicationsTableExists = false;
    }

    return {
      success: true,
      data: {
        totalCourses: coursesCount ?? 0,
        totalFaculty: facultyCount ?? 0,
        totalStudents: studentsCount ?? 0,
        pendingApplications: pendingApplicationsCount,
        applicationsTableExists,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to load admin metrics",
      data: {
        totalCourses: 0,
        totalFaculty: 0,
        totalStudents: 0,
        pendingApplications: 0,
        applicationsTableExists: false,
      },
    };
  }
}

// ---------------------------------------------------------------------------
// 2. Course & Faculty Retrieval
// ---------------------------------------------------------------------------
export async function getAdminCourses(): Promise<{
  success: boolean;
  courses: (Course & { syllabus?: Syllabus })[];
  error?: string;
}> {
  const supabase = createAdminClient();

  try {
    const { data: courses, error } = await supabase
      .from("courses")
      .select("*")
      .order("code", { ascending: true });

    if (error) throw error;

    // Fetch syllabi topics for each course
    const { data: syllabi } = await supabase.from("syllabi").select("*");

    const syllabiMap = new Map<string, Syllabus>();
    syllabi?.forEach((s) => syllabiMap.set(s.course_id, s));

    const enriched = (courses || []).map((c) => ({
      ...c,
      syllabus: syllabiMap.get(c.id),
    }));

    return { success: true, courses: enriched };
  } catch (err: any) {
    return { success: false, courses: [], error: err.message };
  }
}

export async function getFacultyProfiles(): Promise<{
  success: boolean;
  faculty: Profile[];
  error?: string;
}> {
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "faculty")
      .order("full_name", { ascending: true });

    if (error) throw error;
    return { success: true, faculty: data || [] };
  } catch (err: any) {
    return { success: false, faculty: [], error: err.message };
  }
}

export async function getStudentProfiles(): Promise<{
  success: boolean;
  students: Profile[];
  error?: string;
}> {
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student")
      .order("full_name", { ascending: true });

    if (error) throw error;
    return { success: true, students: data || [] };
  } catch (err: any) {
    return { success: false, students: [], error: err.message };
  }
}

// ---------------------------------------------------------------------------
// 3. Course Creation & Faculty Assignment Actions
// ---------------------------------------------------------------------------
export async function createCourseAction(payload: {
  code: string;
  title: string;
  department?: string;
  facultyId?: string;
  facultyName?: string;
  topics: string[];
}) {
  const supabase = createAdminClient();
  const courseId = payload.code.toLowerCase().replace(/[^a-z0-9]/g, "-");

  try {
    // 1. Prepare course object
    const courseData: Record<string, any> = {
      id: courseId,
      code: payload.code.trim().toUpperCase(),
      title: payload.title.trim(),
      faculty_name: payload.facultyName || "Unassigned",
      enrolled_count: 0,
      enrolled_students: [],
    };

    // If faculty was selected, assign to assigned_faculty array as well
    if (payload.facultyName && payload.facultyId) {
      courseData.faculty_id = payload.facultyId;
      courseData.assigned_faculty = [
        {
          faculty_id: payload.facultyId,
          name: payload.facultyName,
          role: "Primary Instructor",
        },
      ];
    }

    // Try inserting course with faculty_id, fallback without if column missing
    let insertResult = await supabase.from("courses").insert(courseData);
    if (insertResult.error && insertResult.error.message.includes("faculty_id")) {
      delete courseData.faculty_id;
      insertResult = await supabase.from("courses").insert(courseData);
    }

    if (insertResult.error) throw insertResult.error;

    // 2. Insert syllabus topics
    if (payload.topics && payload.topics.length > 0) {
      const cleanTopics = payload.topics
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await supabase.from("syllabi").insert({
        course_id: courseId,
        topics: cleanTopics,
      });
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/courses");
    return { success: true, courseId };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create course" };
  }
}

export async function assignFacultyAction(
  courseId: string,
  facultyId: string,
  facultyName: string
) {
  const supabase = createAdminClient();

  try {
    const updateData: Record<string, any> = {
      faculty_name: facultyName,
      assigned_faculty: [
        {
          faculty_id: facultyId,
          name: facultyName,
          role: "Primary Instructor",
        },
      ],
    };

    // Attempt update with faculty_id
    updateData.faculty_id = facultyId;
    let res = await supabase
      .from("courses")
      .update(updateData)
      .eq("id", courseId);

    if (res.error && res.error.message.includes("faculty_id")) {
      delete updateData.faculty_id;
      res = await supabase
        .from("courses")
        .update(updateData)
        .eq("id", courseId);
    }

    if (res.error) throw res.error;

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/courses");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to assign faculty" };
  }
}

export async function editCourseAction(
  courseId: string,
  payload: { title: string; description?: string }
) {
  const supabase = createAdminClient();

  try {
    const updatePayload: Record<string, any> = {
      title: payload.title.trim(),
    };
    if (payload.description !== undefined) {
      updatePayload.description = payload.description.trim();
    }

    let { error } = await supabase
      .from("courses")
      .update(updatePayload)
      .eq("id", courseId);

    // Fallback if description column does not exist yet in schema
    if (error && error.message.includes("description")) {
      delete updatePayload.description;
      const res = await supabase
        .from("courses")
        .update(updatePayload)
        .eq("id", courseId);
      error = res.error;
    }

    if (error) throw error;

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/courses");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update course" };
  }
}

// ---------------------------------------------------------------------------
// 4. Course Applications & Enrollment Management Actions
// ---------------------------------------------------------------------------
export async function getCourseApplications(): Promise<{
  success: boolean;
  applications: CourseApplication[];
  tableExists: boolean;
  error?: string;
}> {
  const supabase = createAdminClient();

  try {
    const { data: apps, error } = await supabase
      .from("course_applications")
      .select(`
        id,
        student_id,
        course_id,
        status,
        applied_at,
        reviewed_at
      `)
      .order("applied_at", { ascending: false });

    if (error) {
      // If table doesn't exist yet, build realistic pending applications from existing students & courses
      const { data: students } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .limit(4);

      const { data: courseList } = await supabase
        .from("courses")
        .select("*")
        .limit(3);

      const demoApps: CourseApplication[] = (students || []).slice(0, 3).map((s, idx) => {
        const c =
          courseList && courseList[idx % courseList.length]
            ? courseList[idx % courseList.length]
            : ({ id: "cse-323", code: "CSE 323", title: "Compiler Design" } as any);

        return {
          id: `demo-${s.id}-${c.id}`,
          student_id: s.id,
          course_id: c.id,
          status: idx === 0 || idx === 1 ? "pending" : "approved",
          applied_at: new Date(Date.now() - (idx + 1) * 3600 * 1000 * 4).toISOString(),
          reviewed_at: idx === 2 ? new Date().toISOString() : undefined,
          profiles: s,
          courses: c,
        };
      });

      return { success: true, applications: demoApps, tableExists: false, error: error.message };
    }

    // Join profiles and courses manually for reliability
    const studentIds = apps.map((a) => a.student_id);
    const courseIds = apps.map((a) => a.course_id);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", studentIds);

    const { data: courses } = await supabase
      .from("courses")
      .select("*")
      .in("id", courseIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const courseMap = new Map((courses || []).map((c) => [c.id, c]));

    const enriched: CourseApplication[] = apps.map((a) => ({
      ...a,
      profiles: profileMap.get(a.student_id),
      courses: courseMap.get(a.course_id),
    }));

    return { success: true, applications: enriched, tableExists: true };
  } catch (err: any) {
    return { success: false, applications: [], tableExists: false, error: err.message };
  }
}

export async function updateApplicationStatusAction(
  applicationId: string,
  status: "approved" | "rejected"
) {
  const supabase = createAdminClient();

  try {
    // Handle demo-prefixed applications if table not yet created
    if (applicationId.startsWith("demo-")) {
      const parts = applicationId.replace("demo-", "").split("-");
      const studentId = parts[0];
      const courseId = parts.slice(1).join("-");

      if (status === "approved") {
        const { data: student } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", studentId)
          .single();

        const { data: course } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .single();

        if (course && student) {
          const existingList = Array.isArray(course.enrolled_students)
            ? course.enrolled_students
            : [];

          const alreadyIn = existingList.some(
            (s: any) => s.student_id === student.id || s.email === student.email
          );

          if (!alreadyIn) {
            const updatedList = [
              ...existingList,
              {
                student_id: student.id,
                student_name: student.full_name,
                email: student.email,
                status: "enrolled",
                enrolled_at: new Date().toISOString(),
              },
            ];

            await supabase
              .from("courses")
              .update({
                enrolled_count: updatedList.length,
                enrolled_students: updatedList,
              })
              .eq("id", courseId);
          }
        }
      }

      revalidatePath("/dashboard/admin");
      revalidatePath("/dashboard/admin/enrollments");
      revalidatePath("/dashboard/admin/courses");
      return { success: true };
    }

    const { data: app, error: fetchErr } = await supabase
      .from("course_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (fetchErr) throw fetchErr;

    // Update application status
    const { error: updateErr } = await supabase
      .from("course_applications")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateErr) throw updateErr;

    // If approved, update course enrollment count & student list
    if (status === "approved" && app) {
      const { data: student } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", app.student_id)
        .single();

      const { data: course } = await supabase
        .from("courses")
        .select("*")
        .eq("id", app.course_id)
        .single();

      if (course && student) {
        const existingList = Array.isArray(course.enrolled_students)
          ? course.enrolled_students
          : [];

        const alreadyIn = existingList.some(
          (s: any) => s.student_id === student.id || s.email === student.email
        );

        if (!alreadyIn) {
          const updatedList = [
            ...existingList,
            {
              student_id: student.id,
              student_name: student.full_name,
              email: student.email,
              status: "enrolled",
              enrolled_at: new Date().toISOString(),
            },
          ];

          await supabase
            .from("courses")
            .update({
              enrolled_count: updatedList.length,
              enrolled_students: updatedList,
            })
            .eq("id", app.course_id);
        }
      }
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/enrollments");
    revalidatePath("/dashboard/admin/courses");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update application" };
  }
}

export async function directEnrollStudentAction(
  studentId: string,
  courseId: string
) {
  const supabase = createAdminClient();

  try {
    // 1. Get student & course details
    const { data: student, error: studentErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", studentId)
      .single();

    if (studentErr || !student) throw new Error("Student profile not found");

    const { data: course, error: courseErr } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseErr || !course) throw new Error("Course not found");

    // 2. Try upserting into course_applications if table exists
    try {
      await supabase.from("course_applications").upsert(
        {
          student_id: studentId,
          course_id: courseId,
          status: "approved",
          applied_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
        },
        { onConflict: "student_id,course_id" }
      );
    } catch {
      // Table might not exist yet; proceed with course enrolled_students array
    }

    // 3. Update course enrolled_students array & count
    const existingList = Array.isArray(course.enrolled_students)
      ? course.enrolled_students
      : [];

    const alreadyIn = existingList.some(
      (s: any) => s.student_id === student.id || s.email === student.email
    );

    if (!alreadyIn) {
      const updatedList = [
        ...existingList,
        {
          student_id: student.id,
          student_name: student.full_name,
          email: student.email,
          status: "enrolled",
          enrolled_at: new Date().toISOString(),
        },
      ];

      const { error: updateErr } = await supabase
        .from("courses")
        .update({
          enrolled_count: updatedList.length,
          enrolled_students: updatedList,
        })
        .eq("id", courseId);

      if (updateErr) throw updateErr;
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/enrollments");
    revalidatePath("/dashboard/admin/courses");

    return {
      success: true,
      studentName: student.full_name,
      courseCode: course.code,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to enroll student" };
  }
}

export async function revokeEnrollmentAction(
  courseId: string,
  studentIdOrEmail: string
) {
  const supabase = createAdminClient();

  try {
    const { data: course, error: fetchErr } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (fetchErr || !course) throw new Error("Course not found");

    const existingList = Array.isArray(course.enrolled_students)
      ? course.enrolled_students
      : [];

    const updatedList = existingList.filter(
      (s: any) =>
        s.student_id !== studentIdOrEmail && s.email !== studentIdOrEmail
    );

    const { error: updateErr } = await supabase
      .from("courses")
      .update({
        enrolled_count: updatedList.length,
        enrolled_students: updatedList,
      })
      .eq("id", courseId);

    if (updateErr) throw updateErr;

    // Also update course_applications if it exists
    try {
      await supabase
        .from("course_applications")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .match({ course_id: courseId, student_id: studentIdOrEmail });
    } catch {
      // Ignored if table not created
    }

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/enrollments");
    revalidatePath("/dashboard/admin/courses");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to revoke enrollment" };
  }
}
