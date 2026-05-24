'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { ContentCard } from '@/components/dashboard/ContentCard';
import {
  CURRENT_TERM,
  DEMO_TEACHER_ID,
  GRADE_ENTRY_TYPES,
  GRADE_OPTIONS,
  SECTION_OPTIONS,
  entryPercent,
  filterTeacherGradeEntries,
  filterTeacherStudents,
  gradesForStudent,
  weightedTermAverage,
} from '@/lib/teacherPortal';
import type { StudentGradeEntry, StudentGradeEntryType } from '@/lib/mockData';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export const TeacherGradebook: React.FC = () => {
  const { students, studentGradeEntries, assessments, upsertStudentGradeEntry, deleteStudentGradeEntry } =
    useApp();

  const [classGrade, setClassGrade] = useState('Grade 9');
  const [classSection, setClassSection] = useState('A');
  const [filterType, setFilterType] = useState<string>('All');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();

  const [entryType, setEntryType] = useState<StudentGradeEntryType>('Quiz');
  const [title, setTitle] = useState('');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('100');
  const [weight, setWeight] = useState('10');
  const [remarks, setRemarks] = useState('');
  const [linkedAssessment, setLinkedAssessment] = useState('');

  const roster = useMemo(
    () => filterTeacherStudents(students, classGrade, classSection),
    [students, classGrade, classSection]
  );

  const myEntries = useMemo(() => {
    let list = filterTeacherGradeEntries(studentGradeEntries).filter(
      (e) => e.gradeLevel === classGrade && e.section === classSection
    );
    if (filterType !== 'All') list = list.filter((e) => e.entryType === filterType);
    return list;
  }, [studentGradeEntries, classGrade, classSection, filterType]);

  const myAssessments = useMemo(
    () => assessments.filter((a) => a.teacherId === DEMO_TEACHER_ID && a.grade === classGrade),
    [assessments, classGrade]
  );

  const openAdd = (studentId: string, presetType?: StudentGradeEntryType) => {
    setSelectedStudentId(studentId);
    setEditingId(undefined);
    setEntryType(presetType ?? 'Quiz');
    setTitle('');
    setScore('');
    setMaxScore('100');
    setWeight(presetType === 'Final Exam' ? '30' : presetType === 'Mid Exam' ? '25' : '10');
    setRemarks('');
    setLinkedAssessment('');
    setIsFormOpen(true);
  };

  const openEdit = (entry: StudentGradeEntry) => {
    setSelectedStudentId(entry.studentId);
    setEditingId(entry.id);
    setEntryType(entry.entryType);
    setTitle(entry.title);
    setScore(String(entry.score));
    setMaxScore(String(entry.maxScore));
    setWeight(String(entry.weight));
    setRemarks(entry.remarks ?? '');
    setLinkedAssessment(entry.assessmentId ?? '');
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !title) return;
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return;

    upsertStudentGradeEntry({
      id: editingId,
      studentId: selectedStudentId,
      subject: 'Biology',
      gradeLevel: student.grade,
      section: student.section,
      entryType,
      title,
      assessmentId: linkedAssessment || undefined,
      score: parseFloat(score) || 0,
      maxScore: parseFloat(maxScore) || 100,
      weight: parseFloat(weight) || 0,
      term: CURRENT_TERM,
      remarks: remarks || undefined,
    });
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
        <Select
          label="Class grade"
          options={GRADE_OPTIONS.filter((g) => g.includes('9') || g.includes('10')).map((g) => ({
            value: g,
            label: g,
          }))}
          value={classGrade}
          onChange={(e) => setClassGrade(e.target.value)}
        />
        <Select
          label="Section"
          options={SECTION_OPTIONS.map((s) => ({ value: s, label: `Section ${s}` }))}
          value={classSection}
          onChange={(e) => setClassSection(e.target.value)}
        />
        <Select
          label="Filter by type"
          options={['All', ...GRADE_ENTRY_TYPES].map((t) => ({ value: t, label: t }))}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {GRADE_ENTRY_TYPES.map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            variant="outline"
            className="text-[10px] h-8"
            onClick={() => roster[0] && openAdd(roster[0].id, t)}
            disabled={roster.length === 0}
          >
            + {t}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {roster.map((std) => {
          const entries = gradesForStudent(
            filterTeacherGradeEntries(studentGradeEntries),
            std.id
          );
          const termAvg = weightedTermAverage(entries);
          return (
            <ContentCard key={std.id} title={std.name} description={`${std.studentId} · GPA ${std.gpa.toFixed(2)}`}>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xxs text-muted-foreground">Term average</span>
                  <Badge variant={termAvg != null && termAvg >= 70 ? 'success' : 'warning'} size="sm">
                    {termAvg != null ? `${termAvg}%` : '—'}
                  </Badge>
                </div>
                {entries.length === 0 ? (
                  <p className="text-xxs text-muted-foreground">No scores recorded yet.</p>
                ) : (
                  entries.slice(0, 4).map((e) => (
                    <div key={e.id} className="flex justify-between text-xxs border-b border-border/30 pb-1">
                      <span>
                        <span className="font-semibold text-foreground">{e.entryType}</span> · {e.title}
                      </span>
                      <span className="font-mono">
                        {e.score}/{e.maxScore} ({entryPercent(e)}%)
                      </span>
                    </div>
                  ))
                )}
                {entries.length > 4 && (
                  <p className="text-[10px] text-muted-foreground">+{entries.length - 4} more entries</p>
                )}
                <Button size="sm" variant="outline" className="w-full text-xxs h-8 mt-2" onClick={() => openAdd(std.id)}>
                  Add / edit grades
                </Button>
              </div>
            </ContentCard>
          );
        })}
      </div>

      <TablePanel title="All grade entries" description="Quiz, test, project, midterm, final, and practical results">
        <table className="eskooly-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Type</th>
              <th>Title</th>
              <th>Score</th>
              <th>%</th>
              <th>Weight</th>
              <th>Term</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {myEntries.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  No grade entries for this class. Use the quick-add buttons above.
                </td>
              </tr>
            ) : (
              myEntries.map((e) => {
                const std = students.find((s) => s.id === e.studentId);
                return (
                  <tr key={e.id} className="hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground">{std?.name ?? e.studentId}</td>
                    <td className="p-3">
                      <Badge variant="neutral" size="sm">
                        {e.entryType}
                      </Badge>
                    </td>
                    <td className="p-3 text-xxs">{e.title}</td>
                    <td className="p-3 font-mono">
                      {e.score}/{e.maxScore}
                    </td>
                    <td className="p-3 font-bold">{entryPercent(e)}%</td>
                    <td className="p-3">{e.weight}%</td>
                    <td className="p-3 text-muted-foreground text-xxs">{e.term}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => openEdit(e)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-[10px] h-7"
                          onClick={() => deleteStudentGradeEntry(e.id)}
                        >
                          Del
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TablePanel>

      <Dialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit grade entry' : 'Record grade'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <p className="text-xxs text-muted-foreground">
            Student: {students.find((s) => s.id === selectedStudentId)?.name}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Assessment type"
              options={GRADE_ENTRY_TYPES.map((t) => ({ value: t, label: t }))}
              value={entryType}
              onChange={(e) => setEntryType(e.target.value as StudentGradeEntryType)}
            />
            <Select
              label="Link to assessment (optional)"
              options={[
                { value: '', label: 'None' },
                ...myAssessments.map((a) => ({ value: a.id, label: `${a.type}: ${a.title}` })),
              ]}
              value={linkedAssessment}
              onChange={(e) => setLinkedAssessment(e.target.value)}
            />
          </div>
          <input className={inputClass} required placeholder="Title (e.g. Unit 3 Quiz)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Score</label>
              <input type="number" className={inputClass} value={score} onChange={(e) => setScore(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Max</label>
              <input type="number" className={inputClass} value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Weight %</label>
              <input type="number" className={inputClass} value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
          </div>
          <input className={inputClass} placeholder="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          <p className="text-[10px] text-muted-foreground">
            Saving recalculates cumulative GPA from weighted term scores and syncs to student & parent portals.
          </p>
          <DialogFooter className="pt-4 border-t border-border/40">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="organic" size="sm" className="border-none">
              Save grade
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
