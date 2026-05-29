'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { MetricProgressRow } from '@/components/ui/metric-progress-row';
import { Badge } from '@/components/ui/badge';
import { TablePanel } from '@/components/dashboard/TablePanel';
import {
  filterTeacherAssessments,
  filterTeacherLessonPlans,
  filterTeacherStudents,
  avgAttendanceForStudents,
  avgGpaForStudents,
  TEACHER_CLASS_ASSIGNMENTS,
} from '@/lib/teacherPortal';

export const TeacherDashboard: React.FC = () => {
  const { students, lessonPlans, assessments, attendance } = useApp();

  const roster = useMemo(() => filterTeacherStudents(students), [students]);
  const plans = useMemo(() => filterTeacherLessonPlans(lessonPlans), [lessonPlans]);
  const asms = useMemo(() => filterTeacherAssessments(assessments), [assessments]);

  const atRisk = roster.filter((s) => s.attendanceRate < 90 || s.gpa < 2.5);
  const avgGpa = avgGpaForStudents(roster);
  const avgAtt = avgAttendanceForStudents(roster);

  const gradeBands = useMemo(() => {
    const g9 = roster.filter((s) => s.grade === 'Grade 9');
    const g10 = roster.filter((s) => s.grade === 'Grade 10');
    return [
      { label: 'Grade 9', students: g9, avg: avgGpaForStudents(g9) },
      { label: 'Grade 10', students: g10, avg: avgGpaForStudents(g10) },
    ];
  }, [roster]);

  return (
    <div className="space-y-6 text-left">
      <KpiGrid>
        <KpiWidget label="Students in my sections" value={roster.length} hint="Grades 9–10" tone="default" icon={<span>👥</span>} />
        <KpiWidget label="Section average GPA" value={avgGpa.toFixed(2)} hint="All classes" tone="emphasis" icon={<span>📈</span>} />
        <KpiWidget label="Average attendance" value={`${avgAtt}%`} hint="Target: 90%" tone="default" icon={<span>✓</span>} />
        <KpiWidget label="At-risk students" value={atRisk.length} hint="GPA or attendance alert" tone="emphasis" icon={<span>⚠</span>} />
      </KpiGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContentCard title="Student status snapshot" description="Enrollment health across your teaching load">
          <div className="space-y-3">
            {roster.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/40">
                <div>
                  <p className="text-xs font-semibold text-foreground">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {s.grade} · Section {s.section}
                  </p>
                </div>
                <Badge variant={s.status === 'Active' ? 'success' : 'warning'} size="sm">
                  {s.status}
                </Badge>
              </div>
            ))}
          </div>
        </ContentCard>

        <ContentCard title="Academic performance by grade" description="Cumulative GPA vs 3.0 benchmark">
          <div className="space-y-4">
            {gradeBands.map((band) => (
              <MetricProgressRow
                key={band.label}
                label={band.label}
                value={Math.min(100, (band.avg / 4) * 100)}
                valueDisplay={`${band.avg.toFixed(2)} GPA · ${band.students.length} students`}
                barClassName="bg-primary"
                targetPercent={75}
              />
            ))}
          </div>
        </ContentCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContentCard title="Today's teaching blocks" description="Classes you teach this week">
          <div className="space-y-3">
            {TEACHER_CLASS_ASSIGNMENTS.map((a) => (
              <div key={a.id} className="p-3 rounded-lg bg-muted/40 border border-border/40">
                <p className="text-xs font-bold text-foreground">
                  {a.period} · {a.grade} Section {a.section}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {a.subject} · {a.room} · {a.days}
                </p>
              </div>
            ))}
          </div>
        </ContentCard>

        <ContentCard title="Student alert watchlist" description="Students needing academic or attendance follow-up">
          {atRisk.length === 0 ? (
            <p className="text-xs text-muted-foreground">No critical alerts in your sections.</p>
          ) : (
            <div className="space-y-2">
              {atRisk.map((s) => (
                <div key={s.id} className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-xxs">
                  <p className="font-bold text-foreground">{s.name}</p>
                  <p className="text-muted-foreground mt-1">
                    GPA {s.gpa.toFixed(2)} · Attendance {s.attendanceRate}%
                    {s.attendanceRate < 90 ? ' — contact parent recommended' : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ContentCard>
      </div>

      <TablePanel title="Student reports summary" description="Quick academic report for your roster">
        <table className="eskooly-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Grade / Section</th>
              <th>GPA</th>
              <th>Attendance</th>
              <th>Pending assessments</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((s) => (
              <tr key={s.id} className="hover:bg-muted/20">
                <td className="p-3 font-semibold text-foreground">{s.name}</td>
                <td className="p-3">
                  {s.grade} · {s.section}
                </td>
                <td className="p-3 font-mono font-bold">{s.gpa.toFixed(2)}</td>
                <td className="p-3">{s.attendanceRate}%</td>
                <td className="p-3 text-muted-foreground">
                  {asms.filter((a) => a.grade === s.grade).length} dept review
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xxs">
        <div className="p-4 rounded-lg border border-border/60 bg-card">
          <p className="font-bold text-foreground">Lesson plans</p>
          <p className="text-2xl font-bold text-primary mt-1">{plans.length}</p>
          <p className="text-muted-foreground mt-1">
            {plans.filter((p) => p.status.includes('Pending')).length} awaiting dept head
          </p>
        </div>
        <div className="p-4 rounded-lg border border-border/60 bg-card">
          <p className="font-bold text-foreground">Assessments filed</p>
          <p className="text-2xl font-bold text-primary mt-1">{asms.length}</p>
          <p className="text-muted-foreground mt-1">
            {asms.filter((a) => a.status === 'Pending Dept Head').length} pending approval
          </p>
        </div>
        <div className="p-4 rounded-lg border border-border/60 bg-card">
          <p className="font-bold text-foreground">Attendance logs</p>
          <p className="text-2xl font-bold text-primary mt-1">{attendance.length}</p>
          <p className="text-muted-foreground mt-1">Synced to parent portals</p>
        </div>
      </div>
    </div>
  );
};
