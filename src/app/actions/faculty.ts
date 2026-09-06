"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { isCourseForFaculty, currentSemester } from "@/lib/faculty-data";
import { revalidatePath } from "next/cache";
import type { Course, Exam } from "@/lib/supabase/types";

export interface NewQuestionInput {
  text: string;
  topic?: string;
  blooms?: string;
  marks?: number;
}

/**
 * Adds one or more manually-authored questions to a faculty member's course.
 * Questions are stored in exam_questions under a per-course "Question Bank" exam
 * for the current semester, so they appear on the faculty Questions page.
 */
export async function addFacultyQuestionsAction(
  courseId: string,
  questions: NewQuestionInput[]
) {
  try {
    const profile = await getCurrentProfile();
    if (!profile || (profile.role !== "faculty" && profile.role !== "admin")) {
      return { success: false, error: "Faculty access required." };
    }

    const cleaned = (questions || [])
      .map((q) => ({
        text: (q.text || "").trim(),
        topic: (q.topic || "").trim() || "General",
        blooms: (q.blooms || "").trim() || "Apply",
        marks: Number.isFinite(q.marks) ? Number(q.marks) : 10,
      }))
      .filter((q) => q.text.length > 0);

    if (cleaned.length === 0) {
      return { success: false, error: "Enter at least one question." };
    }

    const admin = createAdminClient();

    // Verify the faculty member owns this course.
    const { data: courses } = await admin.from("courses").select("*");
    const mine = ((courses as Course[]) ?? []).filter((c) =>
      isCourseForFaculty(c, profile)
    );
    const course = mine.find((c) => c.id === courseId);
    if (!course) {
      return { success: false, error: "You can only add questions to your own courses." };
    }

    // Match the "current semester" the Questions page derives from the faculty's exams.
    const myCourseIds = new Set(mine.map((c) => c.id));
    const { data: exams } = await admin.from("exams").select("*");
    const myExams = ((exams as Exam[]) ?? []).filter((e) => myCourseIds.has(e.course_id));
    const semester = currentSemester(myExams);

    // Find or create the course's exam for the current semester.
    let examId: string;
    const { data: existingExam } = await admin
      .from("exams")
      .select("id")
      .eq("course_id", courseId)
      .eq("semester", semester)
      .limit(1)
      .maybeSingle();

    if (existingExam?.id) {
      examId = existingExam.id;
    } else {
      const { data: createdExam, error: examErr } = await admin
        .from("exams")
        .insert({ course_id: courseId, semester, exam_type: "Question Bank", total_marks: 100 })
        .select("id")
        .single();
      if (examErr || !createdExam) {
        return { success: false, error: examErr?.message || "Could not create an exam." };
      }
      examId = createdExam.id;
    }

    // Continue numbering after the last existing question in this exam.
    const { data: last } = await admin
      .from("exam_questions")
      .select("question_number")
      .eq("exam_id", examId)
      .order("question_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    const start = last?.question_number ?? 0;

    const rows = cleaned.map((q, i) => ({
      exam_id: examId,
      question_number: start + 1 + i,
      question_text: q.text,
      topic_tag: q.topic,
      target_blooms: q.blooms,
      marks: q.marks,
    }));

    const { error: insertErr } = await admin.from("exam_questions").insert(rows);
    if (insertErr) {
      return { success: false, error: insertErr.message };
    }

    revalidatePath("/dashboard/faculty/questions");

    return { success: true, count: rows.length, semester, courseCode: course.code };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add questions." };
  }
}
