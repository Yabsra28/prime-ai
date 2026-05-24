'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { generateTeachingNotesAI, type AITeachingNotesResult } from '@/lib/ai';
import {
  DEMO_TEACHER_ID,
  GRADE_OPTIONS,
  filterTeacherLessonPlans,
  notesForLessonPlan,
} from '@/lib/teacherPortal';
import type { LessonPlan, TeachingNote } from '@/lib/mockData';

const inputClass =
  'w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

function statusBadge(status: TeachingNote['status']) {
  if (status === 'Approved') return 'success' as const;
  if (status === 'Rejected') return 'danger' as const;
  if (status === 'Draft') return 'neutral' as const;
  return 'warning' as const;
}

export const TeacherTeachingNotes: React.FC = () => {
  const {
    lessonPlans,
    teachingNotes,
    createLessonPlan,
    createTeachingNote,
    updateTeachingNote,
    submitTeachingNoteForApproval,
    addNotification,
  } = useApp();

  const teacherPlans = filterTeacherLessonPlans(lessonPlans);
  const myNotes = teachingNotes.filter((n) => n.teacherId === DEMO_TEACHER_ID);
  const unlinkedNotes = myNotes.filter((n) => !n.lessonPlanId);

  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(teacherPlans[0]?.id ?? null);

  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [planGrade, setPlanGrade] = useState('Grade 9');
  const [planSubject, setPlanSubject] = useState('Biology');
  const [planSessions, setPlanSessions] = useState(4);
  const [planObjectives, setPlanObjectives] = useState('');
  const [planHomework, setPlanHomework] = useState('');

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [viewNote, setViewNote] = useState<TeachingNote | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [linkedPlanId, setLinkedPlanId] = useState('');
  const [notesGrade, setNotesGrade] = useState('Grade 9');
  const [notesSubject, setNotesSubject] = useState('Biology');
  const [notesTopic, setNotesTopic] = useState('');
  const [notesLanguage, setNotesLanguage] = useState('English');
  const [noteTitle, setNoteTitle] = useState('');
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [aiNotesResult, setAiNotesResult] = useState<AITeachingNotesResult | null>(null);

  const activePlan = teacherPlans.find((p) => p.id === linkedPlanId);

  useEffect(() => {
    const openPlan = () => setIsPlanOpen(true);
    const openNote = (e: Event) => {
      const detail = (e as CustomEvent<{ lessonPlanId?: string }>).detail;
      openCreateNote(detail?.lessonPlanId ?? teacherPlans[0]?.id ?? '');
    };
    window.addEventListener('open-teacher-lesson-plan', openPlan);
    window.addEventListener('open-teacher-create-note', openNote as EventListener);
    return () => {
      window.removeEventListener('open-teacher-lesson-plan', openPlan);
      window.removeEventListener('open-teacher-create-note', openNote as EventListener);
    };
  }, [teacherPlans]);

  const openCreateNote = (planId: string) => {
    const plan = teacherPlans.find((p) => p.id === planId);
    setEditingNoteId(null);
    setLinkedPlanId(planId);
    setNotesGrade(plan?.grade ?? 'Grade 9');
    setNotesSubject(plan?.subject ?? 'Biology');
    setNotesTopic('');
    setNotesLanguage('English');
    setNoteTitle('');
    setAiNotesResult(null);
    setNoteModalOpen(true);
    if (planId) setExpandedPlanId(planId);
  };

  const openEditNote = (note: TeachingNote) => {
    setEditingNoteId(note.id);
    setLinkedPlanId(note.lessonPlanId ?? '');
    setNotesGrade(note.grade);
    setNotesSubject(note.subject);
    setNotesTopic(note.topic);
    setNotesLanguage(note.language);
    setNoteTitle(note.title);
    if (note.contentBody) {
      try {
        setAiNotesResult(JSON.parse(note.contentBody));
      } catch {
        setAiNotesResult(null);
      }
    } else {
      setAiNotesResult(null);
    }
    setNoteModalOpen(true);
  };

  const handleGenerateNotes = async () => {
    setGeneratingNotes(true);
    try {
      const result = await generateTeachingNotesAI(notesGrade, notesSubject, notesTopic, notesLanguage);
      setAiNotesResult(result);
      if (!noteTitle) setNoteTitle(result.title);
    } finally {
      setGeneratingNotes(false);
    }
  };

  const buildNotePayload = () => ({
    lessonPlanId: linkedPlanId || undefined,
    title: noteTitle || aiNotesResult?.title || `${notesTopic || 'Lesson'} Notes`,
    grade: notesGrade,
    subject: notesSubject,
    topic: notesTopic || noteTitle,
    language: notesLanguage,
    contentSummary: aiNotesResult?.introduction.slice(0, 280) ?? noteTitle,
    contentBody: aiNotesResult ? JSON.stringify(aiNotesResult) : undefined,
  });

  const handleSaveDraft = () => {
    const payload = buildNotePayload();
    if (editingNoteId) {
      updateTeachingNote(editingNoteId, payload);
      addNotification('Draft saved', 'Teaching note updated.', 'success');
    } else {
      createTeachingNote(payload);
      addNotification('Draft created', 'Teaching note saved as draft.', 'success');
    }
    setNoteModalOpen(false);
  };

  const handleSubmitForApproval = () => {
    const payload = buildNotePayload();
    if (editingNoteId) {
      updateTeachingNote(editingNoteId, payload);
      submitTeachingNoteForApproval(editingNoteId);
    } else {
      const id = createTeachingNote(payload);
      submitTeachingNoteForApproval(id);
    }
    setNoteModalOpen(false);
    setAiNotesResult(null);
  };

  const handleSubmitLessonPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle || !planObjectives) return;
    createLessonPlan({
      title: planTitle,
      grade: planGrade,
      subject: planSubject,
      sessions: planSessions,
      objectives: planObjectives.split('\n').filter(Boolean),
      activities: Array.from({ length: planSessions }).map((_, i) => ({
        session: i + 1,
        activity: `Session ${i + 1} activity`,
        duration: '45 mins',
      })),
      assessments: ['Formative quiz', 'Participation log'],
      homework: planHomework || 'Review workbook exercises.',
    });
    setIsPlanOpen(false);
    setPlanTitle('');
    setPlanObjectives('');
    setPlanHomework('');
  };

  const parsedViewContent = useMemo(() => {
    if (!viewNote?.contentBody) return null;
    try {
      return JSON.parse(viewNote.contentBody) as AITeachingNotesResult;
    } catch {
      return null;
    }
  }, [viewNote]);

  const renderNoteRow = (note: TeachingNote) => (
    <div
      key={note.id}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-card border border-border/50"
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground">{note.title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {note.topic} · {note.language} · Updated {note.updatedAt ?? note.createdAt}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={statusBadge(note.status)} size="sm">
          {note.status}
        </Badge>
        <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => setViewNote(note)}>
          View
        </Button>
        <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => openEditNote(note)}>
          Edit
        </Button>
        {note.status === 'Draft' && (
          <Button
            size="sm"
            variant="organic"
            className="text-[10px] h-7 border-none"
            onClick={() => submitTeachingNoteForApproval(note.id)}
          >
            Submit
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="outline" className="text-xs h-9" onClick={() => setIsPlanOpen(true)}>
          + Create lesson plan
        </Button>
        <Button size="sm" variant="organic" className="text-xs h-9 border-none" onClick={() => openCreateNote('')}>
          + New teaching note
        </Button>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-bold text-foreground uppercase tracking-wide">Teaching notes by lesson plan</p>
        {teacherPlans.length === 0 ? (
          <p className="text-sm text-muted-foreground">Create a lesson plan first, then attach teaching notes to it.</p>
        ) : (
          teacherPlans.map((plan) => {
            const planNotes = notesForLessonPlan(myNotes, plan.id);
            const isOpen = expandedPlanId === plan.id;
            return (
              <Card key={plan.id} className="border-border/60 overflow-hidden">
                <button
                  type="button"
                  className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedPlanId(isOpen ? null : plan.id)}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">{plan.title}</p>
                      <p className="text-xxs text-muted-foreground mt-1">
                        {plan.grade} · {plan.subject} · {plan.sessions} sessions ·{' '}
                        <Badge variant={plan.status === 'Approved' ? 'success' : 'warning'} size="sm" className="ml-1">
                          {plan.status}
                        </Badge>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-bold text-primary">{planNotes.length}</span>
                      <p className="text-[10px] text-muted-foreground">notes</p>
                    </div>
                  </div>
                </button>
                {isOpen && (
                  <CardContent className="pt-0 pb-4 space-y-3 border-t border-border/40">
                    <div className="flex justify-end">
                      <Button size="sm" variant="organic" className="text-xxs h-8 border-none" onClick={() => openCreateNote(plan.id)}>
                        + Add note for this plan
                      </Button>
                    </div>
                    {planNotes.length === 0 ? (
                      <p className="text-xxs text-muted-foreground p-3 bg-muted/30 rounded-lg">
                        No teaching notes yet for this lesson plan.
                      </p>
                    ) : (
                      <div className="space-y-2">{planNotes.map(renderNoteRow)}</div>
                    )}
                    <PlanSummary plan={plan} />
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {unlinkedNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Notes without lesson plan</CardTitle>
            <CardDescription>Standalone teaching materials not linked to a syllabus plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">{unlinkedNotes.map(renderNoteRow)}</CardContent>
        </Card>
      )}

      <Dialog isOpen={noteModalOpen} onClose={() => setNoteModalOpen(false)} title={editingNoteId ? 'Edit teaching note' : 'Create teaching note'} size="xl">
        <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto">
          <Select
            label="Link to lesson plan"
            options={[
              { value: '', label: 'No lesson plan (standalone)' },
              ...teacherPlans.map((p) => ({ value: p.id, label: `${p.title} (${p.grade})` })),
            ]}
            value={linkedPlanId}
            onChange={(e) => {
              setLinkedPlanId(e.target.value);
              const p = teacherPlans.find((x) => x.id === e.target.value);
              if (p) {
                setNotesGrade(p.grade);
                setNotesSubject(p.subject);
              }
            }}
          />
          {activePlan && (
            <p className="text-xxs text-primary bg-primary/5 p-2 rounded-md border border-primary/20">
              Linked plan: {activePlan.title} — objectives include {activePlan.objectives[0]}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Note title</label>
              <input className={inputClass} value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="e.g. Session 2 handout" />
            </div>
            <Select label="Grade" options={GRADE_OPTIONS.map((g) => ({ value: g, label: g }))} value={notesGrade} onChange={(e) => setNotesGrade(e.target.value)} />
            <Select label="Subject" options={[{ value: 'Biology', label: 'Biology' }, { value: 'General Science', label: 'General Science' }]} value={notesSubject} onChange={(e) => setNotesSubject(e.target.value)} />
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Topic</label>
              <input className={inputClass} value={notesTopic} onChange={(e) => setNotesTopic(e.target.value)} placeholder="Lesson topic" />
            </div>
            <Select label="Language" options={[{ value: 'English', label: 'English' }, { value: 'Amharic', label: 'Amharic' }, { value: 'Afaan Oromo', label: 'Afaan Oromo' }]} value={notesLanguage} onChange={(e) => setNotesLanguage(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="organic" onClick={handleGenerateNotes} loading={generatingNotes} className="text-xs h-10 border-none">
              Generate with AI
            </Button>
          </div>
          {aiNotesResult && (
            <div className="border border-border/60 bg-muted/20 p-4 rounded-xl space-y-3 text-xxs border-l-4 border-l-primary max-h-48 overflow-y-auto">
              <p className="font-bold text-foreground">{aiNotesResult.title}</p>
              <p className="text-muted-foreground">{aiNotesResult.introduction}</p>
              {aiNotesResult.explanations.slice(0, 2).map((exp, i) => (
                <p key={i}>
                  <span className="font-semibold text-foreground">{exp.subtitle}:</span> {exp.content.slice(0, 120)}…
                </p>
              ))}
            </div>
          )}
          <DialogFooter className="pt-4 border-t border-border/40 flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleSaveDraft}>
              Save draft
            </Button>
            <Button type="button" variant="organic" size="sm" className="border-none" onClick={handleSubmitForApproval}>
              Submit for dept approval
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      <Dialog isOpen={!!viewNote} onClose={() => setViewNote(null)} title={viewNote?.title ?? 'Teaching note'} size="xl">
        {viewNote && (
          <div className="space-y-4 pt-2 text-xxs max-h-[70vh] overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusBadge(viewNote.status)} size="sm">
                {viewNote.status}
              </Badge>
              <span className="text-muted-foreground">
                {viewNote.grade} · {viewNote.subject} · {viewNote.language}
              </span>
            </div>
            {viewNote.deptComments && (
              <p className="p-2 bg-primary/5 border border-primary/20 rounded-md text-primary">{viewNote.deptComments}</p>
            )}
            {parsedViewContent ? (
              <>
                <p>{parsedViewContent.introduction}</p>
                {parsedViewContent.explanations.map((exp, i) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-lg">
                    <p className="font-bold text-foreground">{exp.subtitle}</p>
                    <p className="mt-1">{exp.content}</p>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-muted-foreground">{viewNote.contentSummary}</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                Print
              </Button>
              <Button
                size="sm"
                variant="organic"
                className="border-none"
                onClick={() => {
                  setViewNote(null);
                  openEditNote(viewNote);
                }}
              >
                Edit note
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog isOpen={isPlanOpen} onClose={() => setIsPlanOpen(false)} title="Create lesson plan" size="lg">
        <form onSubmit={handleSubmitLessonPlan} className="space-y-4 pt-2">
          <input className={inputClass} required placeholder="Plan title" value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <Select options={GRADE_OPTIONS.filter((g) => g.includes('9') || g.includes('10')).map((g) => ({ value: g, label: g }))} value={planGrade} onChange={(e) => setPlanGrade(e.target.value)} />
            <Select options={[{ value: 'Biology', label: 'Biology' }]} value={planSubject} onChange={(e) => setPlanSubject(e.target.value)} />
            <Select options={['3', '4', '5', '6'].map((n) => ({ value: n, label: `${n} sessions` }))} value={String(planSessions)} onChange={(e) => setPlanSessions(Number(e.target.value))} />
          </div>
          <textarea className={`${inputClass} h-24`} required placeholder="Objectives (one per line)" value={planObjectives} onChange={(e) => setPlanObjectives(e.target.value)} />
          <textarea className={`${inputClass} h-16`} placeholder="Homework" value={planHomework} onChange={(e) => setPlanHomework(e.target.value)} />
          <DialogFooter className="pt-4 border-t border-border/40">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPlanOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="organic" size="sm" className="border-none">
              Submit for dept approval
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};

function PlanSummary({ plan }: { plan: LessonPlan }) {
  return (
    <details className="text-xxs text-muted-foreground bg-muted/20 p-3 rounded-lg">
      <summary className="font-semibold text-foreground cursor-pointer">Lesson plan details</summary>
      <ul className="mt-2 list-disc pl-4 space-y-1">
        {plan.objectives.map((o, i) => (
          <li key={i}>{o}</li>
        ))}
      </ul>
    </details>
  );
}
