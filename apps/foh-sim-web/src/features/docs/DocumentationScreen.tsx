import React, { useState, useEffect, useMemo } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { CourseHubView } from './CourseHubView';
import { MarkdownRenderer } from './MarkdownRenderer';
import { RichMarkdownEditor } from './RichMarkdownEditor';
import { CourseModal } from './modals/CourseModal';
import { ChapterModal } from './modals/ChapterModal';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  ArrowLeft,
  ArrowRight,
  Check,
  LayoutDashboard,
  Layers,
  FileText,
  Loader2,
  Menu,
  X
} from 'lucide-react';
import type { Course, Chapter, Lesson } from '../../services/docsService';

export const DocumentationScreen: React.FC = () => {
  const {
    courses,
    chapters,
    lessons,
    activeCourseId,
    activeChapterId,
    activeLessonId,
    memberProgress,
    docsLoading,
    fetchDocs,
    setActiveCourseId,
    setActiveChapterId,
    setActiveLessonId,
    createCourse,
    updateCourse,
    deleteCourse,
    createChapter,
    updateChapter,
    deleteChapter,
    createLesson,
    updateLesson,
    deleteLesson,
    markLessonViewed,
    toggleLessonCompletion,
    userRole
  } = useSimulationStore();

  const isAdmin = userRole === 'admin';

  // Navigation & UI States
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [courseSwitcherOpen, setCourseSwitcherOpen] = useState(false);

  // Modals state
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  // Initial fetch
  useEffect(() => {
    fetchDocs().catch(console.warn);
  }, [fetchDocs]);

  // Active course
  const activeCourse = useMemo(() => {
    return courses.find((c) => c.id === activeCourseId) || courses[0] || null;
  }, [courses, activeCourseId]);

  // Current course chapters and lessons
  const currentChapters = useMemo(() => {
    if (!activeCourse) return [];
    return chapters
      .filter((ch) => ch.courseId === activeCourse.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [chapters, activeCourse]);

  const currentChapterIds = useMemo(() => new Set(currentChapters.map((c) => c.id)), [currentChapters]);

  const currentLessons = useMemo(() => {
    return lessons
      .filter((l) => currentChapterIds.has(l.chapterId))
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [lessons, currentChapterIds]);

  // Active lesson
  const activeLesson = useMemo(() => {
    if (!activeLessonId) return null;
    return currentLessons.find((l) => l.id === activeLessonId) || null;
  }, [currentLessons, activeLessonId]);

  // Active lesson's chapter
  const activeLessonChapter = useMemo(() => {
    if (!activeLesson) return null;
    return currentChapters.find((ch) => ch.id === activeLesson.chapterId) || null;
  }, [activeLesson, currentChapters]);

  // Automated View Tracker: Record view when an active lesson is selected
  useEffect(() => {
    if (activeLesson && activeCourse) {
      markLessonViewed(activeCourse.id, activeLesson.id).catch(console.warn);
    }
  }, [activeLesson?.id, activeCourse?.id, markLessonViewed]);

  // Sequenced navigation: Previous and Next lessons
  const { prevLesson, nextLesson } = useMemo(() => {
    if (!activeLesson) return { prevLesson: null, nextLesson: null };
    const currentIndex = currentLessons.findIndex((l) => l.id === activeLesson.id);
    return {
      prevLesson: currentIndex > 0 ? currentLessons[currentIndex - 1] : null,
      nextLesson: currentIndex < currentLessons.length - 1 ? currentLessons[currentIndex + 1] : null
    };
  }, [activeLesson, currentLessons]);

  const toggleChapterCollapse = (chapterId: string) => {
    setCollapsedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const handleCreateNewLesson = async (chapterId: string) => {
    const chapterLessons = lessons.filter((l) => l.chapterId === chapterId);
    const newLessonTitle = `Lesson ${chapterLessons.length + 1}`;
    try {
      const created = await createLesson({
        chapterId,
        title: newLessonTitle,
        content: `# ${newLessonTitle}\n\nAdd training content here.\n`
      });
      setActiveLessonId(created.id);
      setIsEditingLesson(true);
    } catch (err: any) {
      console.warn('Failed to create lesson:', err);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course and all its chapters and lessons?')) {
      await deleteCourse(courseId);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (window.confirm('Delete this chapter and all its lessons?')) {
      await deleteChapter(chapterId);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (window.confirm('Delete this lesson?')) {
      await deleteLesson(lessonId);
    }
  };

  // Loading State
  if (docsLoading && courses.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black text-zinc-400 space-y-2 select-none">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500">
          Loading Documentation
        </span>
      </div>
    );
  }

  // Global Empty State: No Courses in System (Do not seed)
  if (courses.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black p-6 select-none text-center">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 mb-4 shadow-xl">
          <BookOpen className="w-6 h-6 text-zinc-300" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Audio Documentation and Guides</h1>
        <p className="text-xs text-zinc-400 max-w-md mt-2 leading-relaxed">
          {isAdmin
            ? 'No courses exist in the system yet. As an administrator, you can create training courses, chapters, and lessons for your team.'
            : 'No training modules have been published yet. Content will appear here as your church audio lead creates them.'}
        </p>

        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setEditingCourse(null);
              setCourseModalOpen(true);
            }}
            className="mt-6 px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Course</span>
          </button>
        )}

        <CourseModal
          isOpen={courseModalOpen}
          onClose={() => setCourseModalOpen(false)}
          course={editingCourse}
          onSave={async (data) => {
            await createCourse(data);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex bg-black overflow-hidden select-none">
      {/* Mobile Sidebar Toggle Header (small viewports) */}
      <div className="md:hidden fixed top-11 left-14 right-0 h-10 bg-[#0A0A0A] border-b border-white/[0.08] px-4 flex items-center justify-between z-30">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="flex items-center space-x-2 text-xs text-zinc-300 hover:text-white"
        >
          {isMobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span className="font-medium truncate max-w-[200px]">
            {activeCourse ? activeCourse.title : 'Curriculum'}
          </span>
        </button>
        {activeLesson && (
          <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[120px]">
            {activeLesson.title}
          </span>
        )}
      </div>

      {/* Docs Sub-Sidebar: Courses, Chapters, & Lessons Tree */}
      <aside
        className={`w-72 bg-[#080808] border-r border-white/[0.08] flex flex-col shrink-0 z-20 transition-transform duration-200 ${
          isMobileSidebarOpen
            ? 'fixed inset-y-0 left-14 top-11 translate-x-0'
            : 'hidden md:flex'
        }`}
      >
        {/* Course Switcher Header */}
        <div className="p-3 border-b border-white/[0.08] relative">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCourseSwitcherOpen(!courseSwitcherOpen)}
              className="flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-900 border border-white/[0.08] text-left transition-colors min-w-0"
            >
              <div className="min-w-0 pr-2">
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block">
                  Active Course
                </span>
                <span className="text-xs font-semibold text-white truncate block">
                  {activeCourse?.title}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setEditingCourse(null);
                  setCourseModalOpen(true);
                }}
                title="Create New Course"
                className="p-1.5 ml-1.5 rounded-lg bg-zinc-900/80 border border-white/[0.08] hover:border-white/20 text-zinc-400 hover:text-white transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Course Switcher Dropdown */}
          {courseSwitcherOpen && (
            <div className="absolute top-full left-3 right-3 mt-1.5 bg-[#0C0C0C] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
              <div className="max-h-60 overflow-y-auto divide-y divide-white/[0.04]">
                {courses.map((c) => (
                  <div
                    key={c.id}
                    className={`px-3 py-2 flex items-center justify-between hover:bg-white/[0.04] transition-colors ${
                      c.id === activeCourse?.id ? 'bg-white/[0.06]' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCourseId(c.id);
                        setCourseSwitcherOpen(false);
                      }}
                      className="flex-1 text-left min-w-0 pr-2"
                    >
                      <span className="text-xs font-medium text-white block truncate">{c.title}</span>
                      {c.description && (
                        <span className="text-[10px] text-zinc-500 block truncate">{c.description}</span>
                      )}
                    </button>
                    {isAdmin && (
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCourse(c);
                            setCourseModalOpen(true);
                            setCourseSwitcherOpen(false);
                          }}
                          className="p-1 text-zinc-500 hover:text-white"
                          title="Edit course"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {courses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(c.id)}
                            className="p-1 text-zinc-500 hover:text-red-400"
                            title="Delete course"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Course Overview Quick Jump */}
          <button
            type="button"
            onClick={() => {
              setActiveLessonId(null);
              setIsEditingLesson(false);
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full mt-2 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors border ${
              activeLessonId === null
                ? 'bg-white/10 text-white border-white/10'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border-transparent'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-zinc-400" />
            <span>Course Hub and Progress</span>
          </button>
        </div>

        {/* Chapters & Lessons Tree Navigation */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {currentChapters.map((chapter) => {
            const isCollapsed = Boolean(collapsedChapters[chapter.id]);
            const chapterLessons = currentLessons.filter((l) => l.chapterId === chapter.id);

            return (
              <div key={chapter.id} className="space-y-0.5">
                {/* Chapter Row */}
                <div className="group flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/[0.04] text-xs transition-colors">
                  <button
                    type="button"
                    onClick={() => toggleChapterCollapse(chapter.id)}
                    className="flex items-center space-x-1.5 flex-1 text-left min-w-0"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    )}
                    <span className="font-semibold text-zinc-300 group-hover:text-white truncate">
                      {chapter.title}
                    </span>
                  </button>

                  {isAdmin && (
                    <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleCreateNewLesson(chapter.id)}
                        title="Add lesson to this chapter"
                        className="p-1 text-zinc-500 hover:text-white rounded"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingChapter(chapter);
                          setChapterModalOpen(true);
                        }}
                        title="Edit chapter"
                        className="p-1 text-zinc-500 hover:text-white rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteChapter(chapter.id)}
                        title="Delete chapter"
                        className="p-1 text-zinc-500 hover:text-red-400 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Lessons in Chapter */}
                {!isCollapsed && (
                  <div className="pl-4 space-y-0.5">
                    {chapterLessons.map((lesson) => {
                      const isActive = activeLessonId === lesson.id;
                      const progress = memberProgress[lesson.id];
                      const isDone = progress?.isCompleted;

                      return (
                        <div
                          key={lesson.id}
                          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                            isActive
                              ? 'bg-white text-black font-semibold shadow-sm'
                              : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveLessonId(lesson.id);
                              setIsEditingLesson(false);
                              setIsMobileSidebarOpen(false);
                            }}
                            className="flex items-center space-x-2 flex-1 text-left min-w-0"
                          >
                            <div className="shrink-0 mt-0.5">
                              {isDone ? (
                                <CheckCircle2
                                  className={`w-3.5 h-3.5 ${
                                    isActive ? 'text-black' : 'text-emerald-400'
                                  }`}
                                />
                              ) : (
                                <Circle
                                  className={`w-3.5 h-3.5 ${
                                    isActive ? 'text-zinc-700' : 'text-zinc-600'
                                  }`}
                                />
                              )}
                            </div>
                            <span className="truncate">{lesson.title}</span>
                          </button>

                          {isAdmin && (
                            <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveLessonId(lesson.id);
                                  setIsEditingLesson(true);
                                  setIsMobileSidebarOpen(false);
                                }}
                                title="Edit lesson content"
                                className={`p-1 rounded ${
                                  isActive ? 'text-zinc-700 hover:text-black' : 'text-zinc-500 hover:text-white'
                                }`}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(lesson.id)}
                                title="Delete lesson"
                                className={`p-1 rounded ${
                                  isActive ? 'text-zinc-700 hover:text-red-600' : 'text-zinc-500 hover:text-red-400'
                                }`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {chapterLessons.length === 0 && (
                      <div className="px-2.5 py-1 text-[11px] text-zinc-600 italic">
                        No lessons yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {currentChapters.length === 0 && (
            <div className="p-4 text-center text-zinc-500 text-xs font-mono">
              No chapters yet.
            </div>
          )}
        </div>

        {/* Sidebar Footer: Add Chapter for Admin */}
        {isAdmin && (
          <div className="p-3 border-t border-white/[0.08] shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditingChapter(null);
                setChapterModalOpen(true);
              }}
              className="w-full py-1.5 px-3 rounded-lg border border-white/10 hover:border-white/20 bg-zinc-950 text-xs font-medium text-zinc-300 hover:text-white transition-colors flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Chapter</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden flex flex-col bg-black">
        {/* State A: Admin is editing the active lesson */}
        {isEditingLesson && activeLesson && isAdmin ? (
          <RichMarkdownEditor
            lesson={activeLesson}
            onSave={async (updates) => {
              await updateLesson(activeLesson.id, updates);
              setIsEditingLesson(false);
            }}
            onCancel={() => setIsEditingLesson(false)}
          />
        ) : activeLesson ? (
          /* State B: Member/Admin reading active lesson */
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Lesson Reading Header */}
            <header className="h-12 bg-[#0A0A0A] border-b border-white/[0.08] px-6 flex items-center justify-between shrink-0">
              {/* Breadcrumbs */}
              <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400 min-w-0">
                <span className="truncate hidden sm:inline">{activeCourse?.title}</span>
                <span className="text-zinc-600 hidden sm:inline">/</span>
                <span className="truncate text-zinc-300 font-medium">
                  {activeLessonChapter?.title}
                </span>
                <span className="text-zinc-600">/</span>
                <span className="truncate text-white font-semibold">{activeLesson.title}</span>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center space-x-3 shrink-0">
                {/* Completion Status Tag */}
                {memberProgress[activeLesson.id]?.isCompleted ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-semibold">
                    <Check className="w-3 h-3" />
                    <span>COMPLETED</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-white/10 text-[10px] font-mono text-zinc-400">
                    <span>IN PROGRESS</span>
                  </span>
                )}

                {/* Admin Edit Trigger */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsEditingLesson(true)}
                    className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors flex items-center space-x-1.5"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Lesson</span>
                  </button>
                )}
              </div>
            </header>

            {/* Lesson Body Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
              <div className="max-w-3xl mx-auto space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                    {activeLesson.title}
                  </h1>
                  <p className="text-xs font-mono text-zinc-500">
                    Chapter: {activeLessonChapter?.title}
                  </p>
                </div>

                <div className="border-t border-white/[0.08] pt-6">
                  <MarkdownRenderer content={activeLesson.content} />
                </div>

                {/* Bottom Completion & Navigation Strip */}
                <div className="border-t border-white/[0.08] pt-8 mt-12 pb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Mark as Complete Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!activeCourse) return;
                      const currentStatus = Boolean(memberProgress[activeLesson.id]?.isCompleted);
                      toggleLessonCompletion(activeCourse.id, activeLesson.id, !currentStatus);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-2 border shadow-sm ${
                      memberProgress[activeLesson.id]?.isCompleted
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-950/60'
                        : 'bg-white text-black border-white hover:bg-zinc-200'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {memberProgress[activeLesson.id]?.isCompleted
                        ? 'Marked as Completed'
                        : 'Mark Lesson Complete'}
                    </span>
                  </button>

                  {/* Previous / Next Lesson Buttons */}
                  <div className="flex items-center space-x-3">
                    {prevLesson && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveLessonId(prevLesson.id);
                          setIsEditingLesson(false);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/20 text-xs font-medium text-zinc-300 hover:text-white transition-colors flex items-center space-x-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[120px] sm:max-w-[180px]">
                          {prevLesson.title}
                        </span>
                      </button>
                    )}

                    {nextLesson && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveLessonId(nextLesson.id);
                          setIsEditingLesson(false);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/20 text-xs font-medium text-zinc-300 hover:text-white transition-colors flex items-center space-x-1.5"
                      >
                        <span className="truncate max-w-[120px] sm:max-w-[180px]">
                          {nextLesson.title}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeCourse ? (
          /* State C: No lesson selected, render Course Hub & Progress View */
          <CourseHubView
            course={activeCourse}
            chapters={chapters}
            lessons={lessons}
            memberProgress={memberProgress}
            isAdmin={isAdmin}
            onSelectLesson={(lessonId) => {
              setActiveLessonId(lessonId);
              setIsEditingLesson(false);
            }}
            onAddChapter={() => {
              setEditingChapter(null);
              setChapterModalOpen(true);
            }}
          />
        ) : null}
      </main>

      {/* Admin Modals */}
      {isAdmin && (
        <>
          <CourseModal
            isOpen={courseModalOpen}
            onClose={() => setCourseModalOpen(false)}
            course={editingCourse}
            onSave={async (data) => {
              if (editingCourse) {
                await updateCourse(editingCourse.id, data);
              } else {
                await createCourse(data);
              }
            }}
          />

          {activeCourse && (
            <ChapterModal
              isOpen={chapterModalOpen}
              onClose={() => setChapterModalOpen(false)}
              chapter={editingChapter}
              courseId={activeCourse.id}
              onSave={async (data) => {
                if (editingChapter) {
                  await updateChapter(editingChapter.id, data);
                } else {
                  await createChapter(data);
                }
              }}
            />
          )}
        </>
      )}
    </div>
  );
};
