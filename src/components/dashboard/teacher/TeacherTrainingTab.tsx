'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { MetricProgressRow } from '@/components/ui/metric-progress-row';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { getDemoTeacher, TRAINING_TYPE_FILTERS } from '@/lib/teacherPortal';

export const TeacherTrainingTab: React.FC = () => {
  const { trainings, trainingMaterials, teachers } = useApp();
  const teacher = getDemoTeacher(teachers);
  const [typeFilter, setTypeFilter] = useState<string>('All');

  const filteredMaterials = useMemo(() => {
    if (typeFilter === 'All') return trainingMaterials;
    return trainingMaterials.filter((m) => m.trainingType === typeFilter || m.category === typeFilter);
  }, [trainingMaterials, typeFilter]);

  return (
    <div className="space-y-6 text-left">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <MetricProgressRow
            label="Your MOE training progress"
            value={teacher.trainingProgress}
            valueDisplay={`${teacher.trainingProgress}% complete`}
            barClassName="bg-primary"
          />
          <p className="text-xxs text-muted-foreground mt-2">Certification: {teacher.certification}</p>
        </CardContent>
      </Card>

      <div className="max-w-xs">
        <Select
          label="Filter by training type"
          options={TRAINING_TYPE_FILTERS.map((t) => ({ value: t, label: t }))}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold text-foreground uppercase tracking-wide">Training materials</p>
        {filteredMaterials.map((m) => (
          <div key={m.id} className="p-4 rounded-xl border border-border/40 bg-muted/30 flex justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-foreground">{m.title}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {m.trainingType ?? m.category} · Uploaded {m.uploadedAt}
              </p>
            </div>
            <Badge variant="neutral" size="sm">
              {m.category}
            </Badge>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold text-foreground uppercase tracking-wide">MOE course catalog</p>
        {trainings.map((tr) => (
          <div key={tr.id} className="p-4 rounded-xl border border-border/40 bg-card flex justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">{tr.title}</p>
              <p className="text-xxs text-muted-foreground">
                {tr.instructor} · {tr.duration} · Starts {tr.startDate}
              </p>
            </div>
            <div className="text-right">
              <Badge variant={tr.status === 'Active' ? 'success' : 'warning'} size="sm">
                {tr.status}
              </Badge>
              <p className="text-xxs font-mono mt-2">
                {tr.completedCount}/{tr.totalCount} teachers
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
