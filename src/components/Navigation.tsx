import { Link, useLocation } from "wouter";
import { Calculator, Grid3X3, TrendingUp, ListChecks, Download, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadProjectsExport, importProjectsFromJSON } from "@/lib/projectStore";
import { useToast } from "@/hooks/use-toast";

const LINKS = [
  { label: "Create Project", href: "/", icon: Calculator },
  { label: "Projects", href: "/projects", icon: ListChecks },
  { label: "Effort / Impact", href: "/effort-impact", icon: Grid3X3 },
  { label: "Portfolio Forecast", href: "/portfolio-forecast", icon: TrendingUp },
];

export function Navigation() {
  const [location] = useLocation();
  const { toast } = useToast();

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const result = importProjectsFromJSON(text);
        if (result.imported > 0) {
          toast({
            title: "Import complete",
            description: `Imported ${result.imported} of ${result.total} project(s).`,
          });
        } else {
          toast({
            title: "Import failed",
            description: result.errors[0] ?? "No valid projects found in that file.",
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex h-16 items-center gap-1 overflow-x-auto">
          {LINKS.map(({ label, href, icon: Icon }) => {
            const isActive = location === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 whitespace-nowrap"
              data-testid="button-import"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={downloadProjectsExport}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 whitespace-nowrap"
              data-testid="button-export"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
