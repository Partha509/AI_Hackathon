import "server-only";
import type Groq from "groq-sdk";
import {
  createCourse,
  createInvitedUser,
  enrollStudent,
  findUsers,
  listCoursesDetailed,
} from "@/lib/db/admin";
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
];

type Args = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : undefined);

/** Executes a tool call and returns a JSON-serializable result. */
export async function executeTool(name: string, args: Args): Promise<unknown> {
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

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
