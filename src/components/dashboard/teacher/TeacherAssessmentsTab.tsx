'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { filterTeacherAssessments, GRADE_OPTIONS } from '@/lib/teacherPortal';
import type { Assessment } from '@/lib/mockData';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export const TeacherAssessmentsTab: React.FC = () => {
  const { assessments, createAssessment } = useApp();
  const myAssessments = filterTeacherAssessments(assessments);

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Assessment['type']>('Quiz');
  const [subject, setSubject] = useState('Biology');
  const [grade, setGrade] = useState('Grade 9');
  const [difficulty, setDifficulty] = useState<Assessment['difficulty']>('Medium');
  const [uploadMode, setUploadMode] = useState<'create' | 'upload'>('create');

  useEffect(() => {
    const open = () => {
      setUploadMode('create');
      setIsOpen(true);
    };
    window.addEventListener('open-teacher-assessment', open);
    return () => window.removeEventListener('open-teacher-assessment', open);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    createAssessment({
      title,
      type,
      subject,
      grade,
      difficulty,
      questions:
        uploadMode === 'upload'
          ? [{ id: 1, question: 'Uploaded assessment file — see attachment in school records.', type: 'File', answer: 'N/A' }]
          : [
              { id: 1, question: 'Sample question 1', type: 'MCQ', options: ['A', 'B', 'C', 'D'], answer: 'A' },
              { id: 2, question: 'Sample question 2', type: 'Short Answer', answer: 'Open response' },
            ],
    });
    setTitle('');
    setIsOpen(false);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-end gap-2">
        <Button variant="organic" size="sm" className="text-xs h-9 border-none" onClick={() => { setUploadMode('create'); setIsOpen(true); }}>
          + Create assessment
        </Button>
        <Button variant="outline" size="sm" className="text-xs h-9" onClick={() => { setUploadMode('upload'); setIsOpen(true); }}>
          Upload test file
        </Button>
      </div>

      <TablePanel title="My assessments" description="Quizzes, tests, and exams — submitted to department head for approval">
        <table className="eskooly-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Grade / Subject</th>
              <th>Difficulty</th>
              <th>Questions</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {myAssessments.map((a) => (
              <tr key={a.id} className="hover:bg-muted/20">
                <td className="p-3 font-semibold text-foreground">{a.title}</td>
                <td className="p-3">{a.type}</td>
                <td className="p-3">
                  {a.grade} · {a.subject}
                </td>
                <td className="p-3">{a.difficulty}</td>
                <td className="p-3">{a.questions.length}</td>
                <td className="p-3">
                  <Badge variant={a.status === 'Approved' ? 'success' : a.status === 'Rejected' ? 'danger' : 'warning'} size="sm">
                    {a.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={uploadMode === 'upload' ? 'Upload assessment' : 'Create assessment'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <input className={inputClass} required placeholder="Assessment title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Select
              label="Type"
              options={['Quiz', 'Mid Exam', 'Final Exam', 'Assignment', 'Practical'].map((t) => ({ value: t, label: t }))}
              value={type}
              onChange={(e) => setType(e.target.value as Assessment['type'])}
            />
            <Select label="Grade" options={GRADE_OPTIONS.map((g) => ({ value: g, label: g }))} value={grade} onChange={(e) => setGrade(e.target.value)} />
            <Select label="Subject" options={[{ value: 'Biology', label: 'Biology' }]} value={subject} onChange={(e) => setSubject(e.target.value)} />
            <Select label="Difficulty" options={['Easy', 'Medium', 'Hard'].map((d) => ({ value: d, label: d }))} value={difficulty} onChange={(e) => setDifficulty(e.target.value as Assessment['difficulty'])} />
          </div>
          {uploadMode === 'upload' && (
            <input type="file" className="text-xs" onChange={() => {}} />
          )}
          <DialogFooter className="pt-4 border-t border-border/40">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="organic" size="sm" className="border-none">
              Submit for dept head approval
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
