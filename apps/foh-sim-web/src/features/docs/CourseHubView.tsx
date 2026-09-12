import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  PlayCircle,
  ArrowRight,
  Layers,
  Plus,
  Clock,
  Sparkles
} from 'lucide-react';
import type { Course, Chapter, Lesson, MemberLessonProgress } from '../../services/docsService';

interface CourseHubViewProps {
  course: Course;
  chapters: Chapter[];
  lessons: Lesson[];
  memberProgress: Record<string, MemberLessonProgress>;
  isAdmin: boolean;
  onSelectLesson: (lessonId: string) => void;
  onAddChapter: () => void;
}

export const CourseHubView: React.FC<CourseHubViewProps> = ({
  course,
  chapters,
  lessons,
  memberProgress,
  isAdmin,
  onSelectLesson,
  onAddChapter
}) => {
  // Course-specific chapters and lessons
  const courseChapters = chapters
    .filter((ch) => ch.courseId === course.id)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const courseChapterIds = new Set(courseChapters.map((ch) => ch.id));
  const courseLessons = lessons.filter((l) => courseChapterIds.has(l.chapterId));

  const totalLessons = courseLessons.length;
  const completedLessons = courseLessons.filter((l) => memberProgress[l.id]?.isCompleted).length;
  const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Find the lesson where the member left off (most recently viewed)
  let lastViewedLesson: { lesson: Lesson; chapter: Chapter; record: MemberLessonProgress } | null = null;
  let latestTimestamp = 0;

  for (const lesson of courseLessons) {
    const record = memberProgress[lesson.id];
    if (record?.lastViewedAt) {
      const time = new Date(record.lastViewedAt).getTime();
      if (time > latestTimestamp) {
        latestTimestamp = time;
        const chapter = courseChapters.find((ch) => ch.id === lesson.chapterId);
        if (chapter) {
          lastViewedLesson = { lesson, chapter, record };
        }
      }
    }
  }

  // If no last viewed, fallback to first uncompleted lesson
  const firstLesson = courseLessons[0] || null;
  const firstChapter = firstLesson ? courseChapters.find((ch) => ch.id === firstLesson.chapterId) : null;

  const formatTimeAgo = (isoDate: string) => {
    try {
      const diffMs = Date.now() - new Date(isoDate).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-black p-6 sm:p-8 max-w-5xl mx-auto space-y-8 select-none">
      {/* Course Banner */}
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
              <BookOpen className="w-3.5 h-3.5 text-zinc-200" />
              <span>TRAINING COURSE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              {course.title}
            </h1>
            {course.description ? (
              <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
                {course.description}
              </p>
            ) : (
              <p className="text-xs text-zinc-500 italic">
                Official audio ministry handbook and engineering curriculum.
              </p>
            )}
          </div>

          {/* Overall Progress Stat Ring / Badge */}
          <div className="shrink-0 bg-black/60 border border-white/[0.08] rounded-xl p-4 min-w-[180px] flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Course Progress
            </span>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {completionPercentage}%
            </div>
            <span className="text-[11px] text-zinc-400 mt-0.5">
              {completedLessons} of {totalLessons} lessons completed
            </span>
            {/* Minimal Bar */}
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* "Resume Where You Left Off" Tracker Hero */}
      {totalLessons > 0 && (
        <div className="bg-[#0D0D0D] border border-white/10 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-300">
                  {lastViewedLesson ? 'Resume where you left off' : 'Start your training'}
                </span>
                {lastViewedLesson && (
                  <span className="text-[11px] font-mono text-zinc-500 flex items-center space-x-1">
                    <Clock className="w-3 h-3 ml-1" />
                    <span>Viewed {formatTimeAgo(lastViewedLesson.record.lastViewedAt)}</span>
                  </span>
                )}
              </div>

              <div className="text-base sm:text-lg font-semibold text-white">
                {lastViewedLesson
                  ? lastViewedLesson.lesson.title
                  : firstLesson?.title || 'Begin Course'}
              </div>

              <div className="text-xs text-zinc-400">
                Chapter:{' '}
                <span className="text-zinc-300 font-medium">
                  {lastViewedLesson
                    ? lastViewedLesson.chapter.title
                    : firstChapter?.title || 'Overview'}
                </span>
              </div>
            </div>

            {/* Launch CTA Button */}
            <button
              onClick={() => {
                if (lastViewedLesson) {
                  onSelectLesson(lastViewedLesson.lesson.id);
                } else if (firstLesson) {
                  onSelectLesson(firstLesson.id);
                }
              }}
              className="px-5 py-2.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors flex items-center justify-center space-x-2 shrink-0 shadow-md"
            >
              <PlayCircle className="w-4 h-4 text-black" />
              <span>{lastViewedLesson ? 'Continue Lesson' : 'Start First Lesson'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Chapters & Lessons Outline */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div>
            <h2 className="text-base font-semibold text-white">Course Curriculum</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Follow sequentially or jump directly to specific topics
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={onAddChapter}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 hover:border-white/30 text-xs font-medium text-white transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Chapter</span>
            </button>
          )}
        </div>

        {courseChapters.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-dashed border-white/10 p-6">
            <Layers className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-400 font-medium">No chapters created in this course yet.</p>
            {isAdmin ? (
              <p className="text-[11px] text-zinc-500 mt-1">
                Click &ldquo;Add Chapter&rdquo; above to structure your modules.
              </p>
            ) : (
              <p className="text-[11px] text-zinc-500 mt-1">
                Content is being assembled by ministry leaders.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {courseChapters.map((ch, idx) => {
              const chLessons = courseLessons
                .filter((l) => l.chapterId === ch.id)
                .sort((a, b) => a.orderIndex - b.orderIndex);

              const chCompleted = chLessons.filter((l) => memberProgress[l.id]?.isCompleted).length;

              return (
                <div
                  key={ch.id}
                  className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl overflow-hidden"
                >
                  {/* Chapter Header */}
                  <div className="px-5 py-3.5 bg-zinc-950/60 border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 uppercase font-semibold">
                        Chapter {idx + 1}
                      </span>
                      <h3 className="text-sm font-semibold text-zinc-100">{ch.title}</h3>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500">
                      {chCompleted} / {chLessons.length} done
                    </span>
                  </div>

                  {/* Lessons List */}
                  {chLessons.length === 0 ? (
                    <div className="px-5 py-4 text-xs text-zinc-500 italic">
                      No lessons in this chapter yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      {chLessons.map((lesson, lIdx) => {
                        const progress = memberProgress[lesson.id];
                        const isDone = progress?.isCompleted;

                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => onSelectLesson(lesson.id)}
                            className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors group"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="shrink-0 mt-0.5">
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Circle className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-medium text-zinc-200 group-hover:text-white transition-colors block truncate">
                                  {idx + 1}.{lIdx + 1} {lesson.title}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              {progress?.lastViewedAt && (
                                <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                                  Viewed {formatTimeAgo(progress.lastViewedAt)}
                                </span>
                              )}
                              <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
