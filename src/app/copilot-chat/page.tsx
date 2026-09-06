import { FacultyChat } from "@/components/chat/FacultyChat";

export const metadata = {
  title: "Faculty Co-Pilot | FacultyOS",
  description: "AI assistant for faculty, connected to the live academic database.",
};

export default function CopilotChatPage() {
  return <FacultyChat />;
}
