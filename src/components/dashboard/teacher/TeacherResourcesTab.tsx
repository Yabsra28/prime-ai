"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { TablePanel } from "@/components/dashboard/TablePanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { DEMO_TEACHER_ID, GRADE_OPTIONS } from "@/lib/teacherPortal";
import type { TeacherResource } from "@/lib/mockData";

const inputClass =
  "w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

const RESOURCE_TYPES: TeacherResource["type"][] = [
  "Worksheet",
  "Slide Deck",
  "Lab Guide",
  "Reference PDF",
  "Video Link",
];

export const TeacherResourcesTab: React.FC = () => {
  const { teacherResources, addTeacherResource } = useApp();
  const myResources = teacherResources.filter(
    (r) => r.teacherId === DEMO_TEACHER_ID,
  );

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TeacherResource["type"]>("Worksheet");
  const [resGrade, setResGrade] = useState("Grade 9");
  const [subject, setSubject] = useState("Biology");
  const [url, setUrl] = useState("");

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener("open-teacher-resource", open);
    return () => window.removeEventListener("open-teacher-resource", open);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;
    addTeacherResource({ title, type, grade: resGrade, subject, url });
    setTitle("");
    setUrl("");
    setIsOpen(false);
  };

  return (
    <div className="space-y-6 text-left">
      <TablePanel
        title="Classroom resources"
        description="Upload and disseminate materials to your students"
      >
        <table className="eskooly-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Grade / Subject</th>
              <th>Downloads</th>
              <th>Published</th>
            </tr>
          </thead>
          <tbody>
            {myResources.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-muted-foreground"
                >
                  No resources uploaded yet.
                </td>
              </tr>
            ) : (
              myResources.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="p-3 font-semibold text-foreground">
                    {r.title}
                  </td>
                  <td className="p-3">
                    <Badge variant="primary" size="sm">
                      {r.type}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {r.grade} · {r.subject}
                  </td>
                  <td className="p-3 font-mono">{r.downloads}</td>
                  <td className="p-3 text-muted-foreground">{r.createdAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TablePanel>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Upload & disseminate resource"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <input
            className={inputClass}
            required
            placeholder="Resource title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Select
            label="Type"
            options={RESOURCE_TYPES.map((t) => ({ value: t, label: t }))}
            value={type}
            onChange={(e) => setType(e.target.value as TeacherResource["type"])}
          />
          <Select
            label="Grade"
            options={GRADE_OPTIONS.map((g) => ({ value: g, label: g }))}
            value={resGrade}
            onChange={(e) => setResGrade(e.target.value)}
          />
          <input
            className={inputClass}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
          />
          <input
            className={inputClass}
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="File URL or link"
          />
          <DialogFooter className="pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="organic"
              size="sm"
              className="border-none"
            >
              Publish to students
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
