import React, { useState, useEffect } from 'react';
import { X, BookOpen, Loader2 } from 'lucide-react';
import type { Course } from '../../../services/docsService';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: Course | null;
  onSave: (data: { title: string; description?: string }) => Promise<void>;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  course,
  onSave
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setDescription(course.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
    setError(null);
  }, [course, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Course title is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-200">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 id="course-modal-title" className="text-sm font-semibold text-white">
                {course ? 'Edit Course' : 'Create New Course'}
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Organize chapters and lessons for volunteer training
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-300">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="course-title" className="block text-xs font-medium text-zinc-300 mb-1.5">
              Course Title <span className="text-red-400">*</span>
            </label>
            <input
              id="course-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. SQ-5 Front of House Engineering"
              className="w-full px-3 py-2 text-xs bg-zinc-950 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:border-white/30 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="course-desc" className="block text-xs font-medium text-zinc-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              id="course-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of learning objectives and topics covered"
              className="w-full px-3 py-2 text-xs bg-zinc-950 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:border-white/30 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center space-x-1.5"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{course ? 'Save Changes' : 'Create Course'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
