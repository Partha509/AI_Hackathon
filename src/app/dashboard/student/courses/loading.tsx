import { DashboardPageSkeleton } from "@/components/skeletons/dashboard-skeletons";

export default function Loading() {
  return <DashboardPageSkeleton stats={3} variant="cards" />;
}
