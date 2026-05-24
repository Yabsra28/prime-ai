'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const inputClass =
  'w-full h-24 px-3 py-2 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export const TeacherCheckinsTab: React.FC = () => {
  const { teacherCheckInPrompts, respondToTeacherCheckIn } = useApp();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleSubmit = (id: string) => {
    const text = responses[id]?.trim();
    if (!text) return;
    respondToTeacherCheckIn(id, text);
    setActiveId(null);
    setResponses((prev) => ({ ...prev, [id]: '' }));
  };

  return (
    <div className="space-y-6 text-left">
      <TablePanel title="Wellness & feedback check-ins" description="Respond to surveys assigned to instructional staff">
        <table className="eskooly-table">
          <thead>
            <tr>
              <th>Survey</th>
              <th>Type</th>
              <th>Due date</th>
              <th>Your response</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {teacherCheckInPrompts.map((p) => (
              <tr key={p.id} className="hover:bg-muted/20">
                <td className="p-3 font-semibold text-foreground">{p.title}</td>
                <td className="p-3">
                  <Badge variant="primary" size="sm">
                    {p.type}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground">{p.dueDate}</td>
                <td className="p-3 text-xxs max-w-sm">
                  {p.teacherResponse ? (
                    <span className="text-foreground">{p.teacherResponse}</span>
                  ) : (
                    <span className="text-muted-foreground italic">Not submitted</span>
                  )}
                </td>
                <td className="p-3">
                  <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => setActiveId(p.id)}>
                    {p.teacherResponse ? 'Update' : 'Respond'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>

      {activeId && (
        <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3">
          <p className="text-xs font-semibold text-foreground">
            Response: {teacherCheckInPrompts.find((p) => p.id === activeId)?.title}
          </p>
          <textarea
            className={inputClass}
            value={responses[activeId] ?? teacherCheckInPrompts.find((p) => p.id === activeId)?.teacherResponse ?? ''}
            onChange={(e) => setResponses({ ...responses, [activeId]: e.target.value })}
            placeholder="Enter your reflective response..."
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setActiveId(null)}>
              Cancel
            </Button>
            <Button variant="organic" size="sm" className="border-none" onClick={() => handleSubmit(activeId)}>
              Submit response
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
