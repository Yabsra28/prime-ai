'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { LinearProgress } from '@/components/ui/progress';

type AcademicGradeRow = {
  grade: string;
  studentsCount: number;
  avgGpa: number;
  avgAttendance: number;
};

type DepartmentPerfRow = {
  id: string;
  name: string;
  headName: string;
  avgScore: number;
  passRate: number;
};

type ClassPerfRow = {
  id: string;
  name: string;
  grade: string;
  section: string;
  teacher: string;
  avgGpa: number;
  attendance: number;
};

export const PerformanceReports: React.FC = () => {
  const { students, departments, classes } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'academic' | 'department' | 'class'>('academic');

  // Academic Sub-Tab Data: Grade Level stats
  const academicGradeData = React.useMemo(() => {
    const grades = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    return grades.map(grade => {
      const gradeStudents = students.filter(s => s.grade === grade);
      const totalStudents = gradeStudents.length;
      const avgGpa = totalStudents > 0 
        ? parseFloat((gradeStudents.reduce((acc, s) => acc + s.gpa, 0) / totalStudents).toFixed(2))
        : 0;
      const avgAttendance = totalStudents > 0
        ? Math.round(gradeStudents.reduce((acc, s) => acc + s.attendanceRate, 0) / totalStudents)
        : 0;
      
      return {
        grade,
        studentsCount: totalStudents,
        avgGpa,
        avgAttendance,
      };
    });
  }, [students]);

  const academicColumns: DataTableColumn<AcademicGradeRow>[] = [
    { key: 'grade', header: 'Grade Level', sortable: true },
    { key: 'studentsCount', header: 'Active Students', sortable: true },
    { 
      key: 'avgGpa', 
      header: 'Average GPA', 
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-xs text-foreground">{row.avgGpa}</span>
          <div className="w-16">
            <LinearProgress value={(row.avgGpa / 4.0) * 100} size="sm" color={row.avgGpa >= 3.0 ? 'primary' : row.avgGpa >= 2.0 ? 'accent' : 'destructive'} />
          </div>
        </div>
      )
    },
    {
      key: 'avgAttendance',
      header: 'Attendance Rate',
      sortable: true,
      render: (row) => (
        <Badge variant={row.avgAttendance >= 90 ? 'success' : row.avgAttendance >= 80 ? 'info' : 'warning'} size="sm" className="font-medium">
          {row.avgAttendance}%
        </Badge>
      )
    }
  ];

  // Department Sub-Tab Data
  const departmentPerformanceData = React.useMemo(() => {
    return departments.map(dept => {
      // Mocked average scores for demonstration (departments have subjects)
      const mockScores: Record<string, { score: number; rate: number }> = {
        'dept-math': { score: 76, rate: 94 },
        'dept-chem': { score: 72, rate: 91 },
        'dept-stem': { score: 81, rate: 95 },
        'dept-eng': { score: 79, rate: 93 },
      };
      
      const stats = mockScores[dept.id] ?? { score: 75, rate: 92 };

      return {
        id: dept.id,
        name: dept.name,
        headName: dept.headName,
        avgScore: stats.score,
        passRate: stats.rate,
      };
    });
  }, [departments]);

  const departmentColumns: DataTableColumn<DepartmentPerfRow>[] = [
    { key: 'name', header: 'Department Name', sortable: true },
    { key: 'headName', header: 'Department Head', sortable: true },
    { 
      key: 'avgScore', 
      header: 'Average Subject Score', 
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-xs text-foreground">{row.avgScore}%</span>
          <div className="w-16">
            <LinearProgress value={row.avgScore} size="sm" color={row.avgScore >= 80 ? 'success' : row.avgScore >= 70 ? 'primary' : 'warning'} />
          </div>
        </div>
      )
    },
    {
      key: 'passRate',
      header: 'Curriculum Pass Rate',
      sortable: true,
      render: (row) => (
        <Badge variant={row.passRate >= 90 ? 'success' : 'info'} size="sm">
          {row.passRate}% Pass
        </Badge>
      )
    }
  ];

  // Class Section Sub-Tab Data
  const classPerformanceData = React.useMemo(() => {
    return classes.map(cls => {
      // Mock average GPA and attendance for class sections
      const mockScores: Record<string, { gpa: number; att: number }> = {
        'cls-1': { gpa: 3.12, att: 94 },
        'cls-2': { gpa: 2.89, att: 91 },
        'cls-3': { gpa: 3.41, att: 96 },
        'cls-4': { gpa: 3.01, att: 92 },
      };
      
      const stats = mockScores[cls.id] ?? { gpa: 3.00, att: 93 };

      return {
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        section: cls.section,
        teacher: cls.homeroomTeacher,
        avgGpa: stats.gpa,
        attendance: stats.att,
      };
    });
  }, [classes]);

  const classColumns: DataTableColumn<ClassPerfRow>[] = [
    { 
      key: 'name', 
      header: 'Classroom Section', 
      sortable: true,
      render: (row) => (
        <span className="font-bold text-foreground">{row.grade} - {row.section}</span>
      )
    },
    { key: 'teacher', header: 'Homeroom Advisor', sortable: true },
    { 
      key: 'avgGpa', 
      header: 'Classroom GPA Average', 
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-xs text-foreground">{row.avgGpa} / 4.0</span>
      )
    },
    {
      key: 'attendance',
      header: 'Class Attendance Average',
      sortable: true,
      render: (row) => (
        <Badge variant={row.attendance >= 95 ? 'success' : row.attendance >= 90 ? 'info' : 'warning'} size="sm">
          {row.attendance}% Att.
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex justify-end">
        <div className="flex bg-muted/60 p-0.5 rounded-lg border border-border/40 shrink-0">
          <button
            onClick={() => setActiveSubTab('academic')}
            className={`px-3 py-1.5 text-xxs font-bold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'academic' 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Academic Grades
          </button>
          <button
            onClick={() => setActiveSubTab('department')}
            className={`px-3 py-1.5 text-xxs font-bold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'department' 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Departmental
          </button>
          <button
            onClick={() => setActiveSubTab('class')}
            className={`px-3 py-1.5 text-xxs font-bold rounded-md transition-all cursor-pointer ${
              activeSubTab === 'class' 
                ? 'bg-card text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Class Sections
          </button>
        </div>
      </div>

      <TablePanel
        title={
          activeSubTab === 'academic'
            ? 'Academic Performance by Grade Level'
            : activeSubTab === 'department'
              ? 'Department Curriculum Analytics'
              : 'Classroom Section GPAs & Attendance'
        }
        description={
          activeSubTab === 'academic'
            ? 'Summarized KPIs across core secondary grades'
            : activeSubTab === 'department'
              ? 'Comparative pass rates and subject average scores'
              : 'Granular performance overview for homerooms'
        }
      >
          {activeSubTab === 'academic' && (
            <DataTable
              columns={academicColumns}
              data={academicGradeData}
              pageSize={5}
            />
          )}
          {activeSubTab === 'department' && (
            <DataTable
              columns={departmentColumns}
              data={departmentPerformanceData}
              searchable
              searchKeys={['name', 'headName']}
              pageSize={5}
            />
          )}
          {activeSubTab === 'class' && (
            <DataTable
              columns={classColumns}
              data={classPerformanceData}
              searchable
              searchKeys={['teacher', 'name']}
              pageSize={5}
            />
          )}
      </TablePanel>

    </div>
  );
};
