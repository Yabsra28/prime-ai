'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TEACHER_CLASS_ASSIGNMENTS } from '@/lib/teacherPortal';
import { filterTeacherStudents } from '@/lib/teacherPortal';

export const TeacherClassesTab: React.FC = () => {
  const { students } = useApp();

  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEACHER_CLASS_ASSIGNMENTS.map((a) => {
          const count = filterTeacherStudents(students, a.grade, a.section).length;
          return (
            <Card key={a.id} className="border-border/60">
              <CardHeader>
                <CardTitle className="text-sm font-bold">
                  {a.grade} — Section {a.section}
                </CardTitle>
                <CardDescription>{a.subject}</CardDescription>
              </CardHeader>
              <CardContent className="text-xxs space-y-2 text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">Room:</span> {a.room}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Period:</span> {a.period}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Schedule:</span> {a.days}
                </p>
                <p className="pt-2 border-t border-border/40">
                  <span className="text-lg font-bold text-primary">{count}</span> students enrolled
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
