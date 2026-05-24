'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { filterTeacherStudents, GRADE_OPTIONS, SECTION_OPTIONS, TEACHER_CLASS_ASSIGNMENTS } from '@/lib/teacherPortal';

export const TeacherAttendanceTab: React.FC = () => {
  const { students, saveAttendance } = useApp();
  const [grade, setGrade] = useState('Grade 9');
  const [section, setSection] = useState('A');
  const [sessionLabel, setSessionLabel] = useState<string>(TEACHER_CLASS_ASSIGNMENTS[0].period);
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});
  const [attendanceRemarks, setAttendanceRemarks] = useState<Record<string, string>>({});

  const roster = useMemo(() => filterTeacherStudents(students, grade, section), [students, grade, section]);

  const handleSave = () => {
    saveAttendance(
      roster.map((std) => ({
        studentId: std.id,
        status: attendanceStatuses[std.id] || 'Present',
        remarks: attendanceRemarks[std.id] || `Session: ${sessionLabel}`,
      }))
    );
  };

  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
        <Select label="Class grade" options={GRADE_OPTIONS.filter((g) => g.includes('9') || g.includes('10')).map((g) => ({ value: g, label: g }))} value={grade} onChange={(e) => setGrade(e.target.value)} />
        <Select label="Section" options={SECTION_OPTIONS.map((s) => ({ value: s, label: `Section ${s}` }))} value={section} onChange={(e) => setSection(e.target.value)} />
        <Select
          label="Teaching session"
          options={TEACHER_CLASS_ASSIGNMENTS.map((a) => ({ value: a.period, label: `${a.period} (${a.grade} ${a.section})` }))}
          value={sessionLabel}
          onChange={(e) => setSessionLabel(e.target.value)}
        />
      </div>

      <TablePanel title="Session roll call" description="Record attendance during your active teaching period">
        <table className="eskooly-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>ID</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((std) => (
              <tr key={std.id} className="hover:bg-muted/20">
                <td className="p-3 font-semibold text-foreground">{std.name}</td>
                <td className="p-3 font-mono text-xxs">{std.studentId}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {(['Present', 'Absent', 'Late'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setAttendanceStatuses({ ...attendanceStatuses, [std.id]: st })}
                        className={`px-2 py-1 rounded text-[10px] font-bold border cursor-pointer ${
                          (attendanceStatuses[std.id] || 'Present') === st
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card border-border text-muted-foreground'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <input
                    className="w-full h-9 px-2 border border-border rounded-md text-xs"
                    placeholder="Optional note"
                    value={attendanceRemarks[std.id] || ''}
                    onChange={(e) => setAttendanceRemarks({ ...attendanceRemarks, [std.id]: e.target.value })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>

      <div className="flex justify-end">
        <Button variant="organic" className="text-xs h-10 border-none" onClick={handleSave}>
          Save session attendance
        </Button>
      </div>
    </div>
  );
};
