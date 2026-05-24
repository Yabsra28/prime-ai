'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ContentCard } from '@/components/dashboard/ContentCard';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MetricProgressRow } from '@/components/ui/metric-progress-row';
import { delay } from '@/lib/ai';

export default function StudentPortalPage() {
  const { students, addNotification } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Let's retrieve Selam Abebe as our active student
  const activeStudent = students.find(s => s.id === 'std-1') || students[0];

  // Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: 'ሰላም! I am your AI Study Buddy. How can I help you study Biology, Mathematics, or Science today?' }
  ]);
  const [sendingChat, setSendingChat] = useState(false);

  // Mock Quiz State
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const quizQuestions = [
    {
      id: 1,
      subject: 'Biology',
      question: 'Which of the following organelles is responsible for synthesizing chemical energy in the form of ATP?',
      options: ['Cell Nucleus', 'Cell Wall', 'Mitochondria', 'Ribosomes'],
      answer: 'Mitochondria'
    },
    {
      id: 2,
      subject: 'Mathematics',
      question: 'Solve for the roots of the quadratic equation x^2 - 5x + 6 = 0.',
      options: ['x=1, x=6', 'x=2, x=3', 'x=-2, x=-3', 'x=0, x=5'],
      answer: 'x=2, x=3'
    },
    {
      id: 3,
      subject: 'Chemistry',
      question: 'What type of chemical bonding occurs through the direct sharing of electron pairs between non-metallic atoms?',
      options: ['Ionic Bonding', 'Covalent Bonding', 'Metallic Bonding', 'Hydrogen Bonding'],
      answer: 'Covalent Bonding'
    }
  ];

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatHistory((prev) => [...prev, { role: 'user', text: userMessage }]);
    setChatInput('');
    setSendingChat(true);

    try {
      await delay(800); // Simulated delay
      let aiResponse = "I'm not fully sure about that topic. Could you ask me about Biology cell structures, Fractions, or quadratic factoring?";
      
      const cleanInput = userMessage.toLowerCase();
      if (cleanInput.includes('mitochondr') || cleanInput.includes('cell') || cleanInput.includes('biology')) {
        aiResponse = "Excellent question! In Grade 9 Biology, we learn that the Mitochondrion is the 'powerhouse of the cell' because it synthesizes ATP through cellular respiration. Remember: plant cells have both mitochondria and chloroplasts, whereas animal cells only have mitochondria!";
      } else if (cleanInput.includes('root') || cleanInput.includes('quadratic') || cleanInput.includes('factor')) {
        aiResponse = "To solve a quadratic equation ax^2 + bx + c = 0, you can factor it or use the quadratic formula: x = [-b ± √(b^2 - 4ac)] / 2a. The discriminant (b^2 - 4ac) determines if the roots are real or imaginary!";
      } else if (cleanInput.includes('fraction') || cleanInput.includes('math')) {
        aiResponse = "When adding fractions, always find the Least Common Denominator (LCD). For example, to add 1/2 and 1/3, the LCD is 6, so it becomes 3/6 + 2/6 = 5/6!";
      } else if (cleanInput.includes('ሰላም') || cleanInput.includes('hello')) {
        aiResponse = "ሰላም! I am ready to review your secondary curriculum. Ask me to explain a concept or quiz you on today's biology notes!";
      }

      setChatHistory((prev) => [...prev, { role: 'assistant', text: aiResponse }]);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingChat(false);
    }
  };

  const handleSelectAnswer = (option: string) => {
    setSelectedAnswer(option);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === quizQuestions[currentQuestionIndex].answer) {
      setScore(score + 1);
    }

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
      addNotification('AI Quiz Completed', `You scored ${score + (selectedAnswer === quizQuestions[currentQuestionIndex].answer ? 1 : 0)} out of 3! Keep studying.`, 'success');
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizFinished(false);
    setQuizStarted(true);
  };

  const homeworkList = [
    { id: 'hw-1', subject: 'Biology', task: 'Write 200 words on Mitochondria cellular functions.', due: 'Tomorrow', status: 'Pending' },
    { id: 'hw-2', subject: 'Mathematics', task: 'Factor equations 1-10 on page 84.', due: 'In 2 days', status: 'Completed' },
    { id: 'hw-3', subject: 'English', task: 'Read chapter 4 grammar worksheets.', due: 'Next Monday', status: 'Pending' },
  ];

  const disseminatedResources = [
    { id: 'res-1', name: 'Grade 9 Biology Textbook (Ethiopian MOE)', format: 'PDF', size: '14.2 MB' },
    { id: 'res-2', name: 'Grade 9 Mathematics Syllabus Guide', format: 'PDF', size: '5.8 MB' },
    { id: 'res-3', name: 'Continuous Chemistry Assessment Lab Sheet', format: 'DOCX', size: '2.1 MB' },
  ];

  const SYLLABUS_TARGET_PCT = 70;

  const syllabusGrades = [
    { id: 'bio', subject: 'Biology', topic: 'Genetics/Cells', score: 95, letter: 'A+' },
    { id: 'math', subject: 'Mathematics', topic: 'Algebraic Formulas', score: 88, letter: 'A' },
    { id: 'chem', subject: 'Chemistry', topic: 'Hybrid energy overlap', score: 72, letter: 'B' },
  ] as const;

  const syllabusBarClass = (score: number) => {
    if (score >= 90) return 'bg-primary';
    if (score >= 80) return 'bg-primary/75';
    if (score >= SYLLABUS_TARGET_PCT) return 'bg-primary/55';
    return 'bg-primary/40';
  };

  const syllabusStatusLabel = (score: number) => {
    if (score >= 90) return 'Exceeds target';
    if (score >= SYLLABUS_TARGET_PCT) return 'Meets target';
    return 'Below target';
  };

  const classSchedule = [
    { time: '08:30 - 09:15', monday: 'Grade 9 Math (Abebe K.)', tuesday: 'Grade 9 English (Tigist A.)', wednesday: 'Grade 9 Math (Abebe K.)', thursday: 'Grade 9 English (Tigist A.)', friday: 'Grade 9 Math (Abebe K.)' },
    { time: '09:15 - 10:00', monday: 'Grade 9 Biology (Martha F.)', tuesday: 'Grade 9 Chemistry (Ato Demis)', wednesday: 'Grade 9 Biology (Martha F.)', thursday: 'Grade 9 Chemistry (Ato Demis)', friday: 'Study Hall' },
    { time: '10:00 - 10:30', monday: 'Recess', tuesday: 'Recess', wednesday: 'Recess', thursday: 'Recess', friday: 'Recess' },
    { time: '10:30 - 11:15', monday: 'Grade 9 Chemistry (Ato Demis)', tuesday: 'Grade 9 Math (Abebe K.)', wednesday: 'Grade 9 Chemistry (Ato Demis)', thursday: 'Grade 9 Math (Abebe K.)', friday: 'Assembly' },
  ];

  const tabTitles: Record<string, { title: string; subtitle?: string }> = {
    dashboard: { title: 'My Performance', subtitle: 'Grades, attendance, and homework at a glance.' },
    'study-assistant': { title: 'AI Study Assistant', subtitle: 'Ask questions and practice with quizzes.' },
    resources: { title: 'Books & Resources', subtitle: 'Digital textbooks and study materials.' },
    timetable: { title: 'Class Timetable', subtitle: 'Your weekly class schedule.' },
  };
  const meta = tabTitles[activeTab] ?? tabTitles.dashboard;

  return (
    <DashboardShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={meta.title}
      subtitle={meta.subtitle}
      eyebrow="Student Portal"
      actions={
        <span className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20">
          {activeStudent.name} · {activeStudent.grade} {activeStudent.section}
        </span>
      }
    >
          {activeTab === 'dashboard' && (
            <div className="space-y-6 text-left">
              <KpiGrid>
                <KpiWidget label="Cumulative GPA" value={activeStudent.gpa.toFixed(2)} hint="Excellent standing" tone="default" icon={<span>★</span>} />
                <KpiWidget label="Attendance" value={`${activeStudent.attendanceRate}%`} hint="20 present days" tone="emphasis" icon={<span>✓</span>} />
                <KpiWidget label="Tasks Done" value="12/15" hint="Assessments" tone="default" icon={<span>📋</span>} />
                <KpiWidget label="Class Average" value="2.98" hint="Section A" tone="emphasis" icon={<span>📊</span>} />
              </KpiGrid>

              {/* Progress and Homework details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <ContentCard
                  title="My Syllabus Grades Completion"
                  description={`Estimated score averages compared with school target level criteria (${SYLLABUS_TARGET_PCT}% minimum).`}
                >
                  <div className="space-y-5">
                    {syllabusGrades.map((row) => {
                      const meetsTarget = row.score >= SYLLABUS_TARGET_PCT;
                      return (
                        <MetricProgressRow
                          key={row.id}
                          label={
                            <>
                              {row.subject}{' '}
                              <span className="font-normal text-muted-foreground">({row.topic})</span>
                            </>
                          }
                          headerExtra={
                            <Badge variant={meetsTarget ? 'success' : 'warning'} size="sm">
                              {syllabusStatusLabel(row.score)}
                            </Badge>
                          }
                          value={row.score}
                          valueDisplay={
                            <>
                              {row.score}% <span className="text-muted-foreground font-semibold mx-0.5">•</span>{' '}
                              {row.letter}
                            </>
                          }
                          barClassName={syllabusBarClass(row.score)}
                          targetPercent={SYLLABUS_TARGET_PCT}
                        />
                      );
                    })}
                  </div>
                </ContentCard>

                {/* Homework Task checklist */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Pending Class Homework Checklist</CardTitle>
                    <CardDescription>Assignments due for submission in your active term blocks.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 space-y-3">
                    {homeworkList.map((hw) => (
                      <div key={hw.id} className="flex justify-between items-center p-3 bg-muted/40 border border-border/40 rounded-lg">
                        <div>
                          <span className="text-xs font-bold text-foreground">{hw.task}</span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{hw.subject} • Due: {hw.due}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          hw.status === 'Completed' 
                            ? 'bg-primary/10 text-primary border border-primary/20' 
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {hw.status}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: AI STUDY ASSISTANT                            */}
          {/* ==================================================== */}
          {activeTab === 'study-assistant' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in text-left">
              
              {/* AI Tutor Chatbot */}
              <Card className="flex flex-col h-[500px]">
                <CardHeader className="shrink-0 border-b border-border/40">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <span>🤖</span> AI Study Buddy Chatbot
                  </CardTitle>
                  <CardDescription>Ask academic queries about Biology cellular processes, math equations, or fractions.</CardDescription>
                </CardHeader>
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 leading-normal text-xxs font-medium">
                  {chatHistory.map((ch, idx) => (
                    <div 
                      key={idx} 
                      className={`flex ${ch.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs p-3 rounded-lg border ${
                        ch.role === 'user'
                          ? 'bg-primary border-primary/20 text-primary-foreground font-semibold rounded-br-none'
                          : 'bg-card border-border/80 text-foreground rounded-bl-none'
                      }`}>
                        <p>{ch.text}</p>
                      </div>
                    </div>
                  ))}
                  {sendingChat && (
                    <div className="flex justify-start">
                      <div className="max-w-xs p-3 rounded-lg border bg-card border-border/80 text-muted-foreground italic rounded-bl-none flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce delay-75" />
                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce delay-150" />
                      </div>
                    </div>
                  )}
                </div>
                <form onSubmit={handleSendChat} className="p-3 border-t border-border/40 shrink-0 bg-muted/20 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type 'Explain cell mitochondria' or ask math questions..."
                    className="flex-1 h-10 px-3 bg-card border border-border rounded-md text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <Button 
                    type="submit" 
                    variant="organic" 
                    className="h-10 text-xs shrink-0 border-none cursor-pointer"
                  >
                    Send
                  </Button>
                </form>
              </Card>

              {/* AI Syllabus Mock Quiz */}
              <Card className="flex flex-col h-[500px]">
                <CardHeader className="shrink-0 border-b border-border/40">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <span>📝</span> AI Curated Study Quiz
                  </CardTitle>
                  <CardDescription>Test your retention of core chapters. Receive dynamic recommendations based on score.</CardDescription>
                </CardHeader>
                <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center items-center">
                  {!quizStarted ? (
                    <div className="text-center space-y-4 max-w-sm">
                      <span className="text-3xl">🚀</span>
                      <h4 className="text-xs font-bold text-foreground">Continuous Assessment Challenge</h4>
                      <p className="text-xxs text-muted-foreground leading-normal font-medium">This AI mock quiz covers Grade 9 Biology organelles, equations factoring, and chemical covalent bonds.</p>
                      <Button onClick={() => setQuizStarted(true)} className="text-xs h-10 border-none font-semibold cursor-pointer">
                        Start 3-Question Challenge
                      </Button>
                    </div>
                  ) : quizFinished ? (
                    <div className="text-center space-y-4 max-w-sm">
                      <span className="text-3xl">{score >= 2 ? '🎉' : '📚'}</span>
                      <h4 className="text-xs font-bold text-foreground">Challenge Finished!</h4>
                      <p className="text-xs font-bold text-primary font-mono">Your Score: {score} / 3 Correct</p>
                      
                      <div className="p-3.5 bg-muted/40 border border-border/40 rounded-lg text-xxs font-medium leading-normal">
                        <span className="font-bold text-foreground block mb-1">AI Recommendation:</span>
                        {score === 3 
                          ? 'Perfect retention! You are fully synced for national levels. Suggest requesting enrichment material.'
                          : 'Good attempt. Ensure you review the chemistry covalent covalent notes and math projector roots chapters.'}
                      </div>

                      <Button onClick={resetQuiz} className="text-xs h-10 border-none bg-primary text-white font-semibold cursor-pointer">
                        Retake Challenge
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full text-left space-y-5 text-xxs font-medium">
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="font-bold text-primary">Subject: {quizQuestions[currentQuestionIndex].subject}</span>
                        <span className="text-muted-foreground font-bold font-mono">Question {currentQuestionIndex + 1} of 3</span>
                      </div>

                      <h4 className="font-bold text-foreground text-xs leading-normal">
                        {quizQuestions[currentQuestionIndex].question}
                      </h4>

                      <div className="space-y-2">
                        {quizQuestions[currentQuestionIndex].options.map((opt) => {
                          const isSelected = selectedAnswer === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => handleSelectAnswer(opt)}
                              className={`w-full text-left p-3.5 rounded-lg border text-xxs font-bold transition-all duration-200 cursor-pointer ${
                                isSelected
                                  ? 'bg-primary/10 border-primary text-foreground'
                                  : 'bg-card border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex justify-end pt-2 border-t border-border/40">
                        <Button
                          onClick={handleNextQuestion}
                          disabled={!selectedAnswer}
                          className="text-xs h-10 border-none cursor-pointer"
                        >
                          {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: BOOKS & RESOURCES                             */}
          {/* ==================================================== */}
          {activeTab === 'resources' && (
            <div className="space-y-6 animate-fade-in text-left">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Government Disseminated Textbook Assets</CardTitle>
                  <CardDescription>Syllabus books and guidelines broadcast by curriculum directors ready for download.</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {disseminatedResources.map((res) => (
                      <div key={res.id} className="p-4 bg-muted/40 border border-border/40 rounded-xl space-y-3">
                        <span className="text-2xl">📚</span>
                        <div>
                          <h4 className="text-xs font-bold text-foreground line-clamp-1">{res.name}</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Format: {res.format} • Size: {res.size}</p>
                        </div>
                        <Button 
                          onClick={() => addNotification('Asset Downloaded', `Download started for "${res.name}".`, 'info')}
                          className="w-full text-xxs h-8 bg-card border border-border hover:bg-muted font-semibold cursor-pointer"
                        >
                          ⬇️ Download PDF
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: CLASS TIMETABLE                               */}
          {/* ==================================================== */}
          {activeTab === 'timetable' && (
            <div className="space-y-6 animate-fade-in text-left">
              <TablePanel
                title="Weekly Lecture Period Scheduler"
                description="Synced conflict-free schedule grid for Grade 9 Section A class."
              >
                    <table className="eskooly-table">
                      <thead>
                        <tr>
                          <th className="p-3 text-muted-foreground font-semibold">Time Block</th>
                          <th className="p-3 text-muted-foreground font-semibold">Monday</th>
                          <th className="p-3 text-muted-foreground font-semibold">Tuesday</th>
                          <th className="p-3 text-muted-foreground font-semibold">Wednesday</th>
                          <th className="p-3 text-muted-foreground font-semibold">Thursday</th>
                          <th className="p-3 text-muted-foreground font-semibold">Friday</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-foreground font-semibold">
                        {classSchedule.map((row, i) => (
                          <tr key={i} className="hover:bg-muted/20">
                            <td className="p-3 font-bold font-mono text-primary bg-muted/10">{row.time}</td>
                            <td className="p-3">{row.monday}</td>
                            <td className="p-3">{row.tuesday}</td>
                            <td className="p-3">{row.wednesday}</td>
                            <td className="p-3">{row.thursday}</td>
                            <td className="p-3">{row.friday}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
              </TablePanel>
            </div>
          )}

    </DashboardShell>
  );
}
