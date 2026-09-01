import { Badge } from "@/components/ui/badge";

/** Visual distinction between the seeded demo portfolio and a visitor's own projects. */
export function ProjectBadge({ isSample }: { isSample: boolean }) {
  return isSample ? (
    <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100">
      Sample Project
    </Badge>
  ) : (
    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Your Project</Badge>
  );
}
