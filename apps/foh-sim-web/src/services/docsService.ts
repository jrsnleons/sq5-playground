import { supabase, isSupabaseConfigured } from './supabase';
import { localCache } from './localCache';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Chapter {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Lesson {
  id: string;
  chapterId: string;
  title: string;
  content: string; // Markdown formatted content
  orderIndex: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MemberLessonProgress {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  isCompleted: boolean;
  lastViewedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LastViewedLessonInfo {
  courseId: string;
  chapterId: string;
  lessonId: string;
  lessonTitle: string;
  chapterTitle: string;
  courseTitle: string;
  lastViewedAt: string;
}

export const docsService = {
  // ==========================================
  // Courses Operations
  // ==========================================
  async fetchCourses(): Promise<Course[]> {
    if (!isSupabaseConfigured() || !supabase || !navigator.onLine) {
      return localCache.getCourses();
    }

    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Supabase fetch courses error, falling back to local cache:', error.message);
        return localCache.getCourses();
      }

      const courses: Course[] = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        orderIndex: row.order_index ?? 0,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      localCache.saveCourses(courses);
      return courses;
    } catch (err) {
      console.warn('Network error fetching courses, using local cache:', err);
      return localCache.getCourses();
    }
  },

  async createCourse(course: { title: string; description?: string; orderIndex?: number; createdBy?: string }): Promise<Course> {
    const newCourse: Course = {
      id: crypto.randomUUID ? crypto.randomUUID() : `course-${Date.now()}`,
      title: course.title.trim(),
      description: course.description?.trim() || null,
      orderIndex: course.orderIndex ?? 0,
      createdBy: course.createdBy || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!isSupabaseConfigured() || !supabase || !navigator.onLine) {
      localCache.upsertCourse(newCourse);
      return newCourse;
    }

    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: newCourse.title,
        description: newCourse.description,
        order_index: newCourse.orderIndex,
        created_by: newCourse.createdBy
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase create course error:', error.message);
      localCache.upsertCourse(newCourse);
      return newCourse;
    }

    const created: Course = {
      id: data.id,
      title: data.title,
      description: data.description,
      orderIndex: data.order_index,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    localCache.upsertCourse(created);
    return created;
  },

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
    if (updates.orderIndex !== undefined) payload.order_index = updates.orderIndex;

    if (!isSupabaseConfigured() || !supabase || !navigator.onLine) {
      const existing = localCache.getCourses().find((c) => c.id === id);
      const updated = { ...(existing || {}), ...updates, id, updatedAt: payload.updated_at } as Course;
      localCache.upsertCourse(updated);
      return updated;
    }

    const { data, error } = await supabase
      .from('courses')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update course: ${error.message}`);
    }

    const updated: Course = {
      id: data.id,
      title: data.title,
      description: data.description,
      orderIndex: data.order_index,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    localCache.upsertCourse(updated);
    return updated;
  },

  async deleteCourse(id: string): Promise<void> {
    localCache.deleteCourse(id);

    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) {
        throw new Error(`Failed to delete course: ${error.message}`);
      }
    }
  },

  // ==========================================
  // Chapters Operations
  // ==========================================
  async fetchChapters(courseId?: string): Promise<Chapter[]> {
    if (!isSupabaseConfigured() || !supabase || !navigator.onLine) {
      return localCache.getChapters(courseId);
    }

    try {
      let query = supabase
        .from('chapters')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Supabase fetch chapters error, using local cache:', error.message);
        return localCache.getChapters(courseId);
      }

      const chapters: Chapter[] = (data || []).map((row: any) => ({
        id: row.id,
        courseId: row.course_id,
        title: row.title,
        description: row.description,
        orderIndex: row.order_index ?? 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      localCache.saveChapters(chapters);
      return chapters;
    } catch (err) {
      console.warn('Network error fetching chapters, using local cache:', err);
      return localCache.getChapters(courseId);
    }
  },

  async createChapter(chapter: { courseId: string; title: string; description?: string; orderIndex?: number }): Promise<Chapter> {
    const newChapter: Chapter = {
      id: crypto.randomUUID ? crypto.randomUUID() : `chapter-${Date.now()}`,
      courseId: chapter.courseId,
      title: chapter.title.trim(),
      description: chapter.description?.trim() || null,
      orderIndex: chapter.orderIndex ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!isSupabaseConfigured() || !supabase || !navigator.onLine) {
      localCache.upsertChapter(newChapter);
      return newChapter;
    }

    const { data, error } = await supabase
      .from('chapters')
      .insert({
        course_id: newChapter.courseId,
        title: newChapter.title,
        description: newChapter.description,
        order_index: newChapter.orderIndex
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase create chapter error:', error.message);
      localCache.upsertChapter(newChapter);
      return newChapter;
    }

    const created: Chapter = {
      id: data.id,
      courseId: data.course_id,
      title: data.title,
      description: data.description,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    localCache.upsertChapter(created);
    return created;
  },

  async updateChapter(id: string, updates: Partial<Chapter>): Promise<Chapter> {
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
    if (updates.orderIndex !== undefined) payload.order_index = updates.orderIndex;

    if (!isSupabaseConfigured() || !supabase || !navigator.onLine) {
      const existing = localCache.getChapters().find((c) => c.id === id);
      const updated = { ...(existing || {}), ...updates, id, updatedAt: payload.updated_at } as Chapter;
      localCache.upsertChapter(updated);
      return updated;
    }

    const { data, error } = await supabase
      .from('chapters')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update chapter: ${error.message}`);
    }

    const updated: Chapter = {
      id: data.id,
      courseId: data.course_id,
      title: data.title,
      description: data.description,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    localCache.upsertChapter(updated);
    return updated;
  },

  async deleteChapter(id: string): Promise<void> {
    localCache.deleteChapter(id);

    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      const { error } = await supabase.from('chapters').delete().eq('id', id);
      if (error) {
        throw new Error(`Failed to delete chapter: ${error.message}`);
      }
    }
  },

  // ==========================================
  // Lessons Operations
  // ==========================================
  async fetchLessons(chapterId?: string): Promise<Lesson[]> {
    if (!isSupabaseConfigured() || !supabase || !navigator.onLine) {
      return localCache.getLessons(chapterId);
    }

    try {
      let query = supabase
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });

      if (chapterId) {
        query = query.eq('chapter_id', chapterId);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Supabase fetch lessons error, using local cache:', error.message);
        return localCache.getLessons(chapterId);
      }

      const lessons: Lesson[] = (data || []).map((row: any) => ({
        id: row.id,
        chapterId: row.chapter_id,
        title: row.title,
        content: row.content || '',
        orderIndex: row.order_index ?? 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      localCache.saveLessons(lessons);
      return lessons;
    } catch (err) {
      console.warn('Network error fetching lessons, using local cache:', err);
      return localCache.getLessons(chapterId);
    }
  },

  async createLesson(lesson: { chapterId: string; title: string; content?: string; orderIndex?: number }): Promise<Lesson> {
    const newLesson: Lesson = {
      id: crypto.randomUUID ? crypto.randomUUID() : `lesson-${Date.now()}`,
      chapterId: lesson.chapterId,
      title: lesson.title.trim(),
      content: lesson.content || '',
      orderIndex: lesson.orderIndex ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!isSupabaseConfigured() || !supabase || !navigator.onLine) {
      localCache.upsertLesson(newLesson);
      return newLesson;
    }

    const { data, error } = await supabase
      .from('lessons')
      .insert({
        chapter_id: newLesson.chapterId,
        title: newLesson.title,
        content: newLesson.content,
        order_index: newLesson.orderIndex
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase create lesson error:', error.message);
      localCache.upsertLesson(newLesson);
      return newLesson;
    }

    const created: Lesson = {
      id: data.id,
      chapterId: data.chapter_id,
      title: data.title,
      content: data.content || '',
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    localCache.upsertLesson(created);
    return created;
  },

  async updateLesson(id: string, updates: Partial<Lesson>): Promise<Lesson> {
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.orderIndex !== undefined) payload.order_index = updates.orderIndex;

    if (!isSupabaseConfigured() || !supabase || !navigator.onLine) {
      const existing = localCache.getLessons().find((l) => l.id === id);
      const updated = { ...(existing || {}), ...updates, id, updatedAt: payload.updated_at } as Lesson;
      localCache.upsertLesson(updated);
      return updated;
    }

    const { data, error } = await supabase
      .from('lessons')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update lesson: ${error.message}`);
    }

    const updated: Lesson = {
      id: data.id,
      chapterId: data.chapter_id,
      title: data.title,
      content: data.content || '',
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    localCache.upsertLesson(updated);
    return updated;
  },

  async deleteLesson(id: string): Promise<void> {
    localCache.deleteLesson(id);

    if (isSupabaseConfigured() && supabase && navigator.onLine) {
      const { error } = await supabase.from('lessons').delete().eq('id', id);
      if (error) {
        throw new Error(`Failed to delete lesson: ${error.message}`);
      }
    }
  },

  // ==========================================
  // Member Learning Progress & View Tracker
  // ==========================================
  async fetchUserProgress(userId: string, courseId?: string): Promise<MemberLessonProgress[]> {
    if (!isSupabaseConfigured() || !supabase || !navigator.onLine) {
      return localCache.getMemberProgress(userId, courseId);
    }

    try {
      let query = supabase
        .from('member_lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .order('last_viewed_at', { ascending: false });

      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Supabase fetch user progress error, using local cache:', error.message);
        return localCache.getMemberProgress(userId, courseId);
      }

      const progressList: MemberLessonProgress[] = (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        courseId: row.course_id,
        lessonId: row.lesson_id,
        isCompleted: Boolean(row.is_completed),
        lastViewedAt: row.last_viewed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      localCache.saveMemberProgress(userId, progressList);
      return progressList;
    } catch (err) {
      console.warn('Network error fetching progress, using local cache:', err);
      return localCache.getMemberProgress(userId, courseId);
    }
  },

  async recordLessonView(userId: string, courseId: string, lessonId: string): Promise<MemberLessonProgress> {
    const now = new Date().toISOString();

    if (!isSupabaseConfigured() || !supabase || !navigator.onLine) {
      return localCache.recordLessonView(userId, courseId, lessonId);
    }

    try {
      const { data, error } = await supabase
        .from('member_lesson_progress')
        .upsert(
          {
            user_id: userId,
            course_id: courseId,
            lesson_id: lessonId,
            last_viewed_at: now
          },
          {
            onConflict: 'user_id,lesson_id'
          }
        )
        .select()
        .single();

      if (error) {
        console.warn('Supabase record lesson view error:', error.message);
        return localCache.recordLessonView(userId, courseId, lessonId);
      }

      const updated: MemberLessonProgress = {
        id: data.id,
        userId: data.user_id,
        courseId: data.course_id,
        lessonId: data.lesson_id,
        isCompleted: Boolean(data.is_completed),
        lastViewedAt: data.last_viewed_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      localCache.upsertMemberProgressRecord(userId, updated);
      return updated;
    } catch (err) {
      console.warn('Error upserting view tracking:', err);
      return localCache.recordLessonView(userId, courseId, lessonId);
    }
  },

  async toggleLessonCompletion(userId: string, courseId: string, lessonId: string, isCompleted: boolean): Promise<MemberLessonProgress> {
    const now = new Date().toISOString();

    if (!isSupabaseConfigured() || !supabase || !navigator.onLine) {
      return localCache.setLessonCompletion(userId, courseId, lessonId, isCompleted);
    }

    try {
      const { data, error } = await supabase
        .from('member_lesson_progress')
        .upsert(
          {
            user_id: userId,
            course_id: courseId,
            lesson_id: lessonId,
            is_completed: isCompleted,
            last_viewed_at: now
          },
          {
            onConflict: 'user_id,lesson_id'
          }
        )
        .select()
        .single();

      if (error) {
        console.warn('Supabase toggle lesson completion error:', error.message);
        return localCache.setLessonCompletion(userId, courseId, lessonId, isCompleted);
      }

      const updated: MemberLessonProgress = {
        id: data.id,
        userId: data.user_id,
        courseId: data.course_id,
        lessonId: data.lesson_id,
        isCompleted: Boolean(data.is_completed),
        lastViewedAt: data.last_viewed_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      localCache.upsertMemberProgressRecord(userId, updated);
      return updated;
    } catch (err) {
      console.warn('Error toggling completion in Supabase:', err);
      return localCache.setLessonCompletion(userId, courseId, lessonId, isCompleted);
    }
  }
};
