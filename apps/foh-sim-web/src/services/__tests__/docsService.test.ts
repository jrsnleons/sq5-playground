import { describe, it, expect, beforeEach } from 'vitest';
import { safeStorage } from '../localCache';
import { docsService } from '../docsService';

describe('docsService and localCache', () => {
  beforeEach(() => {
    safeStorage.clear();
  });

  it('starts with empty courses (not seeded)', async () => {
    const courses = await docsService.fetchCourses();
    expect(courses).toEqual([]);
  });

  it('creates and updates a course in localCache when offline', async () => {
    const course = await docsService.createCourse({
      title: 'SQ-5 Live Audio Fundamentals',
      description: 'Introductory training course for church volunteers.'
    });

    expect(course.id).toBeDefined();
    expect(course.title).toBe('SQ-5 Live Audio Fundamentals');

    const courses = await docsService.fetchCourses();
    expect(courses.length).toBe(1);
    expect(courses[0].title).toBe('SQ-5 Live Audio Fundamentals');

    const updated = await docsService.updateCourse(course.id, {
      title: 'SQ-5 Live Audio Mastery'
    });
    expect(updated.title).toBe('SQ-5 Live Audio Mastery');
  });

  it('creates chapters and lessons under a course', async () => {
    const course = await docsService.createCourse({
      title: 'Patching Mastery'
    });

    const chapter = await docsService.createChapter({
      courseId: course.id,
      title: 'Chapter 1: Hardware I/O'
    });

    expect(chapter.id).toBeDefined();
    expect(chapter.courseId).toBe(course.id);

    const lesson = await docsService.createLesson({
      chapterId: chapter.id,
      title: '1.1 Gain Staging',
      content: 'Gain Staging tutorial: Set preamp gain until signal peaks around 0 dBu (-18 dBFS).'
    });

    expect(lesson.id).toBeDefined();
    expect(lesson.chapterId).toBe(chapter.id);
    expect(lesson.content).toContain('Gain Staging');

    const lessons = await docsService.fetchLessons(chapter.id);
    expect(lessons.length).toBe(1);
    expect(lessons[0].title).toBe('1.1 Gain Staging');
  });

  it('tracks member lesson viewing and completion status', async () => {
    const userId = 'member-test-123';
    const courseId = 'course-test-abc';
    const lessonId = 'lesson-test-xyz';

    // Record view
    const viewRecord = await docsService.recordLessonView(userId, courseId, lessonId);
    expect(viewRecord.userId).toBe(userId);
    expect(viewRecord.lessonId).toBe(lessonId);
    expect(viewRecord.isCompleted).toBe(false);
    expect(viewRecord.lastViewedAt).toBeDefined();

    // Toggle complete
    const completedRecord = await docsService.toggleLessonCompletion(userId, courseId, lessonId, true);
    expect(completedRecord.isCompleted).toBe(true);

    // Fetch progress
    const progressList = await docsService.fetchUserProgress(userId, courseId);
    expect(progressList.length).toBe(1);
    expect(progressList[0].isCompleted).toBe(true);
  });
});
