'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { TeacherGradebook } from '@/components/dashboard/teacher/TeacherGradebook';
import {
  DEMO_TEACHER_ID,
  GRADE_OPTIONS,
  SECTION_OPTIONS,
  filterTeacherStudents,
  gradesForStudent,
  filterTeacherGradeEntries,
  weightedTermAverage,
} from '@/lib/teacherPortal';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

type SubTab = 'roster' | 'gradebook' | 'parents';

export const TeacherStudentsTab: React.FC = () => {
  const { students, sendParentMessage, parentMessages, studentGradeEntries } = useApp();

  const [subTab, setSubTab] = useState<SubTab>('roster');

  useEffect(() => {
    const goGradebook = () => setSubTab('gradebook');
    window.addEventListener('open-teacher-grade-entry', goGradebook);
    return () => window.removeEventListener('open-teacher-grade-entry', goGradebook);
  }, []);
  const [grade, setGrade] = useState('Grade 9');
  const [section, setSection] = useState('A');
  const [messageStudentId, setMessageStudentId] = useState<string | null>(null);
  const [parentMsg, setParentMsg] = useState('');

  const roster = useMemo(() => filterTeacherStudents(students, grade, section), [students, grade, section]);
  const myMessages = parentMessages.filter((m) => m.teacherId === DEMO_TEACHER_ID);
  const allGradeEntries = filterTeacherGradeEntries(studentGradeEntries);

  const selectedStudent = roster.find((s) => s.id === messageStudentId);

  const handleSendParent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !parentMsg.trim()) return;
    sendParentMessage({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      parentName: selectedStudent.parentName,
      message: parentMsg,
    });
    setParentMsg('');
    setMessageStudentId(null);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border/40 w-fit">
        {(
          [
            { id: 'roster' as const, label: 'Class roster' },
            { id: 'gradebook' as const, label: 'Gradebook' },
            { id: 'parents' as const, label: 'Parent messages' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`px-4 py-2 text-xxs font-bold rounded-md transition-all cursor-pointer ${
              subTab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'gradebook' ? (
        <TeacherGradebook />
      ) : (
        <>
          {(subTab === 'roster' || subTab === 'parents') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
              <Select
                label="Class grade"
                options={GRADE_OPTIONS.filter((g) => g.includes('9') || g.includes('10')).map((g) => ({
                  value: g,
                  label: g,
                }))}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              />
              <Select
                label="Section"
                options={SECTION_OPTIONS.map((s) => ({ value: s, label: `Section ${s}` }))}
                value={section}
                onChange={(e) => setSection(e.target.value)}
              />
            </div>
          )}

          {subTab === 'roster' && (
            <TablePanel
              title="My students"
              description="Roster with term averages from quiz, test, project, mid & final exam entries"
            >
              <table className="eskooly-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>ID</th>
                    <th>Term avg</th>
                    <th>GPA (synced)</th>
                    <th>Attendance</th>
                    <th>Grade entries</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">
                        No students in this section.
                      </td>
                    </tr>
                  ) : (
                    roster.map((std) => {
                      const entries = gradesForStudent(allGradeEntries, std.id);
                      const termAvg = weightedTermAverage(entries);
                      return (
                        <tr key={std.id} className="hover:bg-muted/20">
                          <td className="p-3">
                            <p className="font-semibold text-foreground">{std.name}</p>
                            <p className="text-[10px] text-muted-foreground">{std.parentName}</p>
                          </td>
                          <td className="p-3 font-mono text-xxs">{std.studentId}</td>
                          <td className="p-3">
                            <Badge variant={termAvg != null && termAvg >= 70 ? 'success' : 'warning'} size="sm">
                              {termAvg != null ? `${termAvg}%` : '—'}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono font-bold">{std.gpa.toFixed(2)}</td>
                          <td className="p-3">{std.attendanceRate}%</td>
                          <td className="p-3 text-xxs">{entries.length} recorded</td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[10px] h-7"
                              onClick={() => setMessageStudentId(std.id)}
                            >
                              Message parent
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </TablePanel>
          )}

          {subTab === 'parents' && (
            <TablePanel title="Parent communication log" description="Messages sent to guardians">
              <table className="eskooly-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Parent</th>
                    <th>Message</th>
                    <th>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {myMessages.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-muted-foreground">
                        No messages sent yet.
                      </td>
                    </tr>
                  ) : (
                    myMessages.map((m) => (
                      <tr key={m.id}>
                        <td className="p-3 font-semibold">{m.studentName}</td>
                        <td className="p-3">{m.parentName}</td>
                        <td className="p-3 text-xxs max-w-md">{m.message}</td>
                        <td className="p-3 text-muted-foreground">{m.sentAt}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TablePanel>
          )}
        </>
      )}

      <Dialog
        isOpen={!!messageStudentId}
        onClose={() => setMessageStudentId(null)}
        title={`Message parent — ${selectedStudent?.name ?? ''}`}
        size="md"
      >
        <form onSubmit={handleSendParent} className="space-y-4 pt-2">
          <p className="text-xxs text-muted-foreground">
            To: {selectedStudent?.parentName} ({selectedStudent?.parentPhone})
          </p>
          <textarea
            className={`${inputClass} h-28`}
            required
            value={parentMsg}
            onChange={(e) => setParentMsg(e.target.value)}
            placeholder="Write about grades, quizzes, projects, mid/final exams, or attendance..."
          />
          <DialogFooter className="pt-4 border-t border-border/40">
            <Button type="button" variant="outline" size="sm" onClick={() => setMessageStudentId(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="organic" size="sm" className="border-none">
              Send to parent portal
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
