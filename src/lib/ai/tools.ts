import "server-only";
import type Groq from "groq-sdk";
import {
  createCourse,
  createInvitedUser,
  enrollStudent,
  findUsers,
  listCoursesDetailed,
} from "@/lib/db/admin";
import { addCourseQuestions, listCourseQuestions } from "@/lib/db/questions";
import {
  endCourse,
  getEvaluationSummary,
  listEvaluations,
  submitFinalMarks,
  type ActorContext,
} from "@/lib/db/lifecycle";
import { isSemester } from "@/lib/semester";

type ToolFn = Groq.Chat.Completions.ChatCompletionTool;

/** Tool/function declarations advertised to the model. */
export const CHAT_TOOLS: ToolFn[] = [
  {
    type: "function",
    function: {
      name: "list_courses",
      description: "List all courses with their code, title, instructor, and derived semester.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "find_users",
      description:
        "Search users (students/teachers/admins) by role and/or a free-text query matching name, email, or student ID.",
      parameters: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["student", "faculty", "admin"] },
          query: { type: "string", description: "Name, email, or student ID fragment." },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_course",
      description:
        "Create a course. The code must encode the semester in its first two digits (e.g. CSE 3201 → semester 3.2).",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string", description: "e.g. 'CSE 3201', 'EEE 3117'." },
          title: { type: "string" },
          faculty_name: { type: "string", description: "Instructor's name (optional)." },
        },
        required: ["code", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_user",
      description:
        "Create a student or teacher account and send an email invite link for them to set their password. Students REQUIRE student_id and current_semester.",
      parameters: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["student", "faculty"], description: "'faculty' = teacher." },
          full_name: { type: "string" },
          email: { type: "string" },
          department: { type: "string", description: "Defaults to CSE." },
          student_id: { type: "string", description: "Required for students; immutable ID." },
          current_semester: {
            type: "string",
            description: "Required for students; one of 1.1,1.2,2.1,2.2,3.1,3.2,4.1,4.2.",
          },
        },
        required: ["role", "full_name", "email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "enroll_student",
      description: "Enroll a student into a course by course code. Resolves the student by name, email, or ID.",
      parameters: {
        type: "object",
        properties: {
          student: { type: "string", description: "Student name, email, or student ID." },
          course_code: { type: "string", description: "e.g. 'CSE 3201'." },
          status: {
            type: "string",
            enum: ["pending", "approved", "rejected"],
            description: "Defaults to 'approved' when an admin/teacher enrolls directly.",
          },
        },
        required: ["student", "course_code"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_course_questions",
      description:
        "List a course's question bank — both previous-year (archived) questions and current ones. Use this to check for repetition before generating or saving new questions.",
      parameters: {
        type: "object",
        properties: {
          course_code: { type: "string", description: "e.g. 'CSE 3201'." },
        },
        required: ["course_code"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_course_questions",
      description:
        "Save one or more SHORT questions to a course's question bank. Call list_course_questions first to avoid duplicating existing/previous questions.",
      parameters: {
        type: "object",
        properties: {
          course_code: { type: "string", description: "e.g. 'CSE 3201'." },
          source: {
            type: "string",
            enum: ["manual", "ai", "source_material"],
            description: "'ai' when you generated them, 'source_material' when derived from provided text, else 'manual'.",
          },
          questions: {
            type: "array",
            description: "The short questions to save.",
            items: {
              type: "object",
              properties: {
                text: { type: "string" },
                topic: { type: "string" },
                marks: { type: "number", description: "Defaults to 5 (short question)." },
              },
              required: ["text"],
            },
          },
        },
        required: ["course_code", "questions"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_final_marks",
      description:
        "Submit/update final marks (0–100) for enrolled students in a course. Faculty may only do this for their own ACTIVE course.",
      parameters: {
        type: "object",
        properties: {
          course_code: { type: "string" },
          marks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                student: { type: "string", description: "Student name, email, or ID." },
                marks: { type: "number" },
                letter_grade: { type: "string" },
              },
              required: ["student", "marks"],
            },
          },
        },
        required: ["course_code", "marks"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "end_course",
      description:
        "End (deactivate) a course. Allowed only when ALL enrolled students have final marks AND all recheck requests are resolved. Once inactive, faculty lose access and students may submit anonymous evaluations.",
      parameters: {
        type: "object",
        properties: { course_code: { type: "string" } },
        required: ["course_code"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_evaluation_summary",
      description:
        "Get the AGGREGATE faculty-evaluation rating for a course (average + count only). Faculty see this for their own courses; never individual responses.",
      parameters: {
        type: "object",
        properties: { course_code: { type: "string" } },
        required: ["course_code"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_evaluations",
      description:
        "ADMIN ONLY: list individual faculty-evaluation records (rating, comment, and which student submitted) for a course.",
      parameters: {
        type: "object",
        properties: { course_code: { type: "string" } },
        required: ["course_code"],
      },
    },
  },
];

type Args = Record<string, unknown>;
export type ToolContext = { userId?: string | null; role?: string | null; fullName?: string | null };
const str = (v: unknown) => (typeof v === "string" ? v : undefined);

/** Executes a tool call and returns a JSON-serializable result. */
export async function executeTool(name: string, args: Args, ctx?: ToolContext): Promise<unknown> {
  switch (name) {
    case "list_courses":
      return { courses: await listCoursesDetailed() };

    case "find_users":
      return {
        users: await findUsers({
          role: str(args.role) as "student" | "faculty" | "admin" | undefined,
          query: str(args.query),
        }),
      };

    case "create_course": {
      const code = str(args.code);
      const title = str(args.title);
      if (!code || !title) return { error: "code and title are required." };
      return { created: await createCourse({ code, title, faculty_name: str(args.faculty_name) }) };
    }

    case "create_user": {
      const role = str(args.role);
      const full_name = str(args.full_name);
      const email = str(args.email);
      if (role !== "student" && role !== "faculty") {
        return { error: "role must be 'student' or 'faculty'." };
      }
      if (!full_name || !email) return { error: "full_name and email are required." };
      if (role === "student") {
        const student_id = str(args.student_id);
        const current_semester = str(args.current_semester);
        if (!student_id) return { error: "student_id is required for students. Ask the user." };
        if (!current_semester || !isSemester(current_semester)) {
          return { error: "A valid current_semester (e.g. 3.2) is required for students. Ask the user." };
        }
      }
      const result = await createInvitedUser({
        role,
        full_name,
        email,
        department: str(args.department) || "CSE",
        student_id: role === "student" ? str(args.student_id) : undefined,
        current_semester: role === "student" ? str(args.current_semester) : undefined,
      });
      return { created: result };
    }

    case "enroll_student": {
      const student = str(args.student);
      const course_code = str(args.course_code);
      if (!student || !course_code) return { error: "student and course_code are required." };
      const status = str(args.status) as "pending" | "approved" | "rejected" | undefined;
      return { enrolled: await enrollStudent({ student, course_code, status }) };
    }

    case "list_course_questions": {
      const course_code = str(args.course_code);
      if (!course_code) return { error: "course_code is required." };
      return await listCourseQuestions(course_code);
    }

    case "add_course_questions": {
      const course_code = str(args.course_code);
      const questions = Array.isArray(args.questions) ? args.questions : [];
      if (!course_code || questions.length === 0) {
        return { error: "course_code and a non-empty questions array are required." };
      }
      const parsed = questions
        .map((q) => {
          const item = q as Record<string, unknown>;
          return { text: str(item.text) ?? "", topic: str(item.topic), marks: typeof item.marks === "number" ? item.marks : undefined };
        })
        .filter((q) => q.text.trim());
      if (parsed.length === 0) return { error: "No valid question text provided." };
      const source = str(args.source) as "manual" | "ai" | "source_material" | undefined;
      return {
        saved: await addCourseQuestions({
          courseCode: course_code,
          questions: parsed,
          source: source ?? "ai",
          createdBy: ctx?.userId ?? null,
        }),
      };
    }

    case "submit_final_marks": {
      const course_code = str(args.course_code);
      const marksArr = Array.isArray(args.marks) ? args.marks : [];
      if (!course_code || marksArr.length === 0) {
        return { error: "course_code and a non-empty marks array are required." };
      }
      const marks = marksArr
        .map((m) => {
          const item = m as Record<string, unknown>;
          return {
            student: str(item.student) ?? "",
            marks: typeof item.marks === "number" ? item.marks : NaN,
            letter_grade: str(item.letter_grade),
          };
        })
        .filter((m) => m.student.trim() && !Number.isNaN(m.marks));
      if (marks.length === 0) return { error: "No valid {student, marks} entries provided." };
      return { result: await submitFinalMarks({ courseCode: course_code, marks, ctx: actor(ctx) }) };
    }

    case "end_course": {
      const course_code = str(args.course_code);
      if (!course_code) return { error: "course_code is required." };
      return { result: await endCourse({ courseCode: course_code, ctx: actor(ctx) }) };
    }

    case "get_evaluation_summary": {
      const course_code = str(args.course_code);
      if (!course_code) return { error: "course_code is required." };
      return { summary: await getEvaluationSummary({ courseCode: course_code, ctx: actor(ctx) }) };
    }

    case "list_evaluations": {
      const course_code = str(args.course_code);
      if (!course_code) return { error: "course_code is required." };
      return await listEvaluations({ courseCode: course_code, ctx: actor(ctx) });
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

function actor(ctx?: ToolContext): ActorContext {
  return { userId: ctx?.userId ?? null, role: ctx?.role ?? null, fullName: ctx?.fullName ?? null };
}
