"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  Users,
  UserCheck,
  Edit2,
  Plus,
  LayoutGrid,
  List,
  Layers,
  GraduationCap,
  Sparkles,
  FileText,
  Building2,
  FilterX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateCourseModal } from "@/components/admin/CreateCourseModal";
import { AssignFacultyModal } from "@/components/admin/AssignFacultyModal";
import { EditCourseModal } from "@/components/admin/EditCourseModal";
import type { Course, Profile, Syllabus } from "@/lib/supabase/types";

interface CourseCatalogManagerProps {
  initialCourses: (Course & { syllabus?: Syllabus })[];
  facultyList: Profile[];
}

export function CourseCatalogManager({
  initialCourses,
  facultyList,
}: CourseCatalogManagerProps) {
  const router = useRouter();
  const [courses, setCourses] = React.useState(initialCourses);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedDept, setSelectedDept] = React.useState<string>("all");
  const [viewMode, setViewMode] = React.useState<"table" | "grid">("table");

  // Sync state if props update from server revalidation
  React.useEffect(() => {
    setCourses(initialCourses);
  }, [initialCourses]);

  const handleRefresh = () => {
    router.refresh();
  };

  // Collect unique departments
  const departments = React.useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.department) set.add(c.department);
      else set.add("CSE");
    });
    return Array.from(set);
  }, [courses]);

  // Filtered courses
  const filteredCourses = React.useMemo(() => {
    return courses.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.faculty_name && c.faculty_name.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q));

      const courseDept = c.department || "CSE";
      const matchesDept = selectedDept === "all" || courseDept === selectedDept;

      return matchesSearch && matchesDept;
    });
  }, [courses, searchQuery, selectedDept]);

  return (
    <div className="space-y-6">
      {/* Control Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border/80 shadow-xs">
        {/* Search and Dept Filter */}
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, title, or assigned faculty..."
              className="pl-9 h-9.5 text-xs bg-background"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {/* Department Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Button
              variant={selectedDept === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDept("all")}
              className="h-8 text-xs px-3"
            >
              All ({courses.length})
            </Button>
            {departments.map((dept) => {
              const count = courses.filter(
                (c) => (c.department || "CSE") === dept
              ).length;
              return (
                <Button
                  key={dept}
                  variant={selectedDept === dept ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDept(dept)}
                  className="h-8 text-xs px-3"
                >
                  {dept} ({count})
                </Button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons & View Mode Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/40">
            <button
              onClick={() => setViewMode("table")}
              aria-label="Table View"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              aria-label="Grid View"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <CreateCourseModal
            facultyList={facultyList}
            onCourseCreated={handleRefresh}
          />
        </div>
      </div>

      {/* Populated / Empty State Handling */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            <FilterX className="h-6 w-6" />
          </div>
          <h3 className="font-heading text-lg font-bold text-foreground">
            No courses found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            {searchQuery || selectedDept !== "all"
              ? "No courses match your current search query or department filter."
              : "No courses have been established in the curriculum catalog yet."}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {(searchQuery || selectedDept !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDept("all");
                }}
              >
                Reset Filters
              </Button>
            )}
            <CreateCourseModal
              facultyList={facultyList}
              onCourseCreated={handleRefresh}
            />
          </div>
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
        <div className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[120px] font-semibold text-foreground">
                  Course Code
                </TableHead>
                <TableHead className="min-w-[220px] font-semibold text-foreground">
                  Course Title & Topics
                </TableHead>
                <TableHead className="w-[100px] font-semibold text-foreground">
                  Dept
                </TableHead>
                <TableHead className="min-w-[200px] font-semibold text-foreground">
                  Assigned Faculty Instructor
                </TableHead>
                <TableHead className="w-[110px] text-center font-semibold text-foreground">
                  Enrolled
                </TableHead>
                <TableHead className="w-[200px] text-right font-semibold text-foreground">
                  Admin Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => {
                const topics = course.syllabus?.topics || [];
                const isAssigned =
                  course.faculty_name &&
                  course.faculty_name !== "Unassigned";

                return (
                  <TableRow key={course.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono font-bold text-primary">
                      {course.code}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="font-semibold text-foreground block text-sm">
                          {course.title}
                        </span>
                        {course.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                            {course.description}
                          </p>
                        )}
                        {topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {topics.slice(0, 3).map((t, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-[10px] py-0 px-1.5 bg-muted/30 font-normal"
                              >
                                {t}
                              </Badge>
                            ))}
                            {topics.length > 3 && (
                              <Badge
                                variant="outline"
                                className="text-[10px] py-0 px-1.5 text-muted-foreground font-normal"
                              >
                                +{topics.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {course.department || "CSE"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isAssigned
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <GraduationCap className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span
                            className={`text-xs font-medium block ${
                              isAssigned
                                ? "text-foreground"
                                : "text-muted-foreground italic"
                            }`}
                          >
                            {course.faculty_name || "Unassigned"}
                          </span>
                          {isAssigned && (
                            <span className="text-[10px] text-muted-foreground block">
                              Primary Instructor
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-full bg-muted/50 border border-border/60">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="font-semibold text-foreground">
                          {course.enrolled_count || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <AssignFacultyModal
                          course={course}
                          facultyList={facultyList}
                          onAssigned={handleRefresh}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1 hover:border-primary/50"
                            >
                              <UserCheck className="h-3.5 w-3.5 text-primary" />
                              <span className="hidden sm:inline">
                                {isAssigned ? "Reassign" : "Assign"}
                              </span>
                            </Button>
                          }
                        />
                        <EditCourseModal
                          course={course}
                          onUpdated={handleRefresh}
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs gap-1"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Grid / Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => {
            const topics = course.syllabus?.topics || [];
            const isAssigned =
              course.faculty_name && course.faculty_name !== "Unassigned";

            return (
              <div
                key={course.id}
                className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 shadow-xs hover:border-primary/40 transition-all hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-base font-extrabold text-primary tracking-wide">
                      {course.code}
                    </span>
                    <Badge variant="outline" className="text-[11px] font-mono">
                      {course.department || "CSE"}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-heading font-bold text-foreground text-base leading-snug">
                      {course.title}
                    </h4>
                    {course.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                  </div>

                  {/* Faculty & Enrollment Row */}
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 text-primary" />
                        Instructor:
                      </span>
                      <span
                        className={`font-medium ${
                          isAssigned
                            ? "text-foreground"
                            : "text-muted-foreground italic"
                        }`}
                      >
                        {course.faculty_name || "Unassigned"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-accent" />
                        Students:
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {course.enrolled_count || 0} enrolled
                      </span>
                    </div>
                  </div>

                  {/* Topics Pills */}
                  {topics.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                        Syllabus Modules ({topics.length})
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {topics.slice(0, 3).map((t, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-[10px] py-0 px-1.5 font-normal"
                          >
                            {t}
                          </Badge>
                        ))}
                        {topics.length > 3 && (
                          <span className="text-[10px] text-muted-foreground self-center">
                            +{topics.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-end gap-2">
                  <AssignFacultyModal
                    course={course}
                    facultyList={facultyList}
                    onAssigned={handleRefresh}
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1 flex-1"
                      >
                        <UserCheck className="h-3.5 w-3.5 text-primary" />
                        <span>{isAssigned ? "Change Faculty" : "Assign"}</span>
                      </Button>
                    }
                  />
                  <EditCourseModal
                    course={course}
                    onUpdated={handleRefresh}
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs gap-1"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Button>
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
