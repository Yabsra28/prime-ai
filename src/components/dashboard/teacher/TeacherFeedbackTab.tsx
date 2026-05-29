'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { DEMO_TEACHER_ID, filterTeacherStudents } from '@/lib/teacherPortal';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export const TeacherFeedbackTab: React.FC = () => {
  const { teacherFeedbacks, students, addStudentFeedback } = useApp();
  const roster = useMemo(() => filterTeacherStudents(students), [students]);

  const received = teacherFeedbacks.filter((f) => f.teacherId === DEMO_TEACHER_ID && f.direction === 'to_teacher');
  const given = teacherFeedbacks.filter((f) => f.teacherId === DEMO_TEACHER_ID && f.direction === 'from_teacher');

  const [studentId, setStudentId] = useState(roster[0]?.id ?? '');
  const [subject, setSubject] = useState('');
  const [comment, setComment] = useState('');

  const handleGiveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    const student = roster.find((s) => s.id === studentId);
    if (!student || !comment.trim()) return;
    addStudentFeedback({
      studentId: student.id,
      studentName: student.name,
      subject: subject || 'General feedback',
      comment,
    });
    setSubject('');
    setComment('');
  };

  return (
    <div className="space-y-6 text-left">
      <TablePanel title="Feedback received" description="Comments from department head and school leadership">
        <table className="eskooly-table">
          <thead>
            <tr>
              <th>From</th>
              <th>Subject</th>
              <th>Comment</th>
              <th>Rating</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {received.map((f) => (
              <tr key={f.id}>
                <td className="p-3 font-semibold">{f.authorName}</td>
                <td className="p-3">{f.subject}</td>
                <td className="p-3 text-xxs max-w-md">{f.comment}</td>
                <td className="p-3">{f.rating ? `${f.rating}/5` : '—'}</td>
                <td className="p-3 text-muted-foreground">{f.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>

      <CardForm
        title="Give feedback to a student"
        roster={roster}
        studentId={studentId}
        setStudentId={setStudentId}
        subject={subject}
        setSubject={setSubject}
        comment={comment}
        setComment={setComment}
        onSubmit={handleGiveFeedback}
      />

      <TablePanel title="Feedback you provided" description="Recorded comments for students">
        <table className="eskooly-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Subject</th>
              <th>Comment</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {given.map((f) => (
              <tr key={f.id}>
                <td className="p-3 font-semibold">{f.studentName}</td>
                <td className="p-3">{f.subject}</td>
                <td className="p-3 text-xxs">{f.comment}</td>
                <td className="p-3 text-muted-foreground">{f.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>
    </div>
  );
};

function CardForm({
  title,
  roster,
  studentId,
  setStudentId,
  subject,
  setSubject,
  comment,
  setComment,
  onSubmit,
}: {
  title: string;
  roster: { id: string; name: string }[];
  studentId: string;
  setStudentId: (id: string) => void;
  subject: string;
  setSubject: (s: string) => void;
  comment: string;
  setComment: (s: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="p-4 rounded-xl border border-border/60 bg-card space-y-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <Select
        label="Student"
        options={roster.map((s) => ({ value: s.id, label: s.name }))}
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
      />
      <input className={inputClass} placeholder="Feedback subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <textarea className={`${inputClass} h-24`} required placeholder="Your feedback..." value={comment} onChange={(e) => setComment(e.target.value)} />
      <Button type="submit" variant="organic" size="sm" className="border-none">
        Save student feedback
      </Button>
    </form>
  );
}
