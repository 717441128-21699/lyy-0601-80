import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Tag,
  FileText,
  Edit3,
  Trash2,
  Save,
  X,
  Link,
  BookOpen,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useNoteStore } from '@/store/useNoteStore';
import { useQuestionBankStore } from '@/store/useQuestionBankStore';
import { usePracticeStore } from '@/store/usePracticeStore';
import { Note, QUESTION_TYPE_MAP } from '@/types';
import { cn } from '@/lib/utils';
import Empty from '@/components/Empty';

const TAG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
  'bg-yellow-100 text-yellow-700',
  'bg-red-100 text-red-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
];

const getTagColor = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
};

const formatDate = (date: Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const formatDateTime = (date: Date) => {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getContentSummary = (content: string, maxLength = 100) => {
  const plainText = content.replace(/#/g, '').replace(/\n/g, ' ').trim();
  return plainText.length > maxLength ? plainText.slice(0, maxLength) + '...' : plainText;
};

type SortType = 'createdAt' | 'updatedAt';

export default function NotesPage() {
  const navigate = useNavigate();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    tags,
    selectedTag,
    searchKeyword,
    setSelectedTag,
    setSearchKeyword,
    addNote,
    updateNote,
    deleteNote,
    addTag,
    getFilteredNotes,
  } = useNoteStore();

  const { questions } = useQuestionBankStore();
  const { startSession } = usePracticeStore();

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [sortType, setSortType] = useState<SortType>('updatedAt');
  const [sortDesc, setSortDesc] = useState(true);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveTip, setShowSaveTip] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const filteredNotes = getFilteredNotes();
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    const dateA = new Date(a[sortType]).getTime();
    const dateB = new Date(b[sortType]).getTime();
    return sortDesc ? dateB - dateA : dateA - dateB;
  });

  const selectedNote = sortedNotes.find((n) => n.id === selectedNoteId) || null;

  const relatedQuestions = selectedNote?.questionId
    ? questions.filter((q) => q.id === selectedNote.questionId)
    : [];

  useEffect(() => {
    if (selectedNote && !isCreating) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setEditTags([...selectedNote.tags]);
      setIsEditing(false);
    }
  }, [selectedNoteId, selectedNote, isCreating]);

  useEffect(() => {
    if (isCreating && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isCreating]);

  useEffect(() => {
    if (isEditing) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave();
      }, 3000);
    }
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [editTitle, editContent, editTags, isEditing]);

  const handleCreateNote = () => {
    setSelectedNoteId(null);
    setEditTitle('');
    setEditContent('');
    setEditTags([]);
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleSelectNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setIsCreating(false);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editTitle.trim()) {
      return;
    }

    if (isCreating) {
      addNote({
        title: editTitle.trim(),
        content: editContent,
        tags: editTags,
      });
      setIsCreating(false);
    } else if (selectedNoteId) {
      updateNote(selectedNoteId, {
        title: editTitle.trim(),
        content: editContent,
        tags: editTags,
      });
    }

    setIsEditing(false);
    setShowSaveTip(true);
    setTimeout(() => setShowSaveTip(false), 2000);

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
  };

  const handleDelete = () => {
    if (selectedNoteId) {
      deleteNote(selectedNoteId);
      setSelectedNoteId(null);
      setShowDeleteConfirm(false);
      setEditTitle('');
      setEditContent('');
      setEditTags([]);
    }
  };

  const handleAddTag = () => {
    const tag = newTagInput.trim();
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
      addTag(tag);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setEditTags(editTags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleStartPractice = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (question) {
      startSession([question], 'random', 'single');
      navigate('/practice');
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value);
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditTitle(e.target.value);
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const getRelatedQuestionCount = (note: Note) => {
    return note.questionId ? 1 : 0;
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 stagger-animation">
      <div className="w-1/4 flex flex-col gap-4 min-w-0">
        <div className="card p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索笔记标题和内容..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleCreateNote}
            className="w-full btn-primary justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新建笔记
          </button>
        </div>

        <div className="card p-4 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-primary-500" />
            <h3 className="font-serif font-semibold text-slate-900">标签</h3>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedTag(null)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-all',
                !selectedTag
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'hover:bg-slate-50 text-slate-600'
              )}
            >
              <span>全部标签</span>
              <span className="text-xs text-slate-400">{filteredNotes.length}</span>
            </button>
            {tags.map((tag) => {
              const tagCount = filteredNotes.filter((n) => n.tags.includes(tag)).length;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-all',
                    selectedTag === tag
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'hover:bg-slate-50 text-slate-600'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', getTagColor(tag).split(' ')[0].replace('100', '500'))} />
                    <span>{tag}</span>
                  </div>
                  <span className="text-xs text-slate-400">{tagCount}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-[35%] flex flex-col gap-4 min-w-0">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" />
              <span className="font-serif font-semibold text-slate-900">
                笔记列表
              </span>
              <span className="text-sm text-slate-500">
                共 {sortedNotes.length} 条
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSortType('createdAt')}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs transition-all',
                  sortType === 'createdAt'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-slate-500 hover:bg-slate-100'
                )}
              >
                <Calendar className="w-3 h-3" />
                创建时间
                {sortType === 'createdAt' && (
                  sortDesc ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => setSortType('updatedAt')}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs transition-all',
                  sortType === 'updatedAt'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-slate-500 hover:bg-slate-100'
                )}
              >
                <Clock className="w-3 h-3" />
                更新时间
                {sortType === 'updatedAt' && (
                  sortDesc ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => setSortDesc(!sortDesc)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500"
              >
                {sortDesc ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {sortedNotes.length === 0 ? (
            <Empty
              icon={FileText}
              title="暂无笔记"
              description={searchKeyword || selectedTag ? '没有符合条件的笔记' : '点击左侧"新建笔记"按钮开始创建'}
              className="h-full"
            />
          ) : (
            sortedNotes.map((note, index) => (
              <div
                key={note.id}
                onClick={() => handleSelectNote(note.id)}
                className={cn(
                  'card p-4 cursor-pointer transition-all hover:shadow-card-hover',
                  selectedNoteId === note.id && 'ring-2 ring-primary-500 border-primary-200',
                  isCreating && selectedNoteId === null && index === 0 ? 'ring-2 ring-primary-500 border-primary-200' : ''
                )}
                style={{ animationDelay: `${index * 20}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="font-medium text-slate-900 line-clamp-1 flex-1">
                    {note.title}
                  </h4>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                  {getContentSummary(note.content)}
                </p>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {note.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className={cn('badge text-xs', getTagColor(tag))}
                    >
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="badge bg-slate-100 text-slate-500 text-xs">
                      +{note.tags.length - 3}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Link className="w-3 h-3" />
                      {getRelatedQuestionCount(note)} 题
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="w-2/5 flex flex-col gap-4 min-w-0">
        {(selectedNote || isCreating) ? (
          <>
            <div className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isEditing && (
                    <span className="badge bg-accent-100 text-accent-700 text-xs flex items-center gap-1">
                      <Edit3 className="w-3 h-3" />
                      正在编辑
                    </span>
                  )}
                  {showSaveTip && (
                    <span className="badge bg-success-100 text-success-700 text-xs flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      已保存
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && !isCreating && (
                    <button
                      onClick={handleEdit}
                      className="btn-secondary gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      编辑
                    </button>
                  )}
                  {(isEditing || isCreating) && (
                    <button
                      onClick={handleSave}
                      disabled={!editTitle.trim()}
                      className="btn-primary gap-2"
                    >
                      <Save className="w-4 h-4" />
                      保存
                    </button>
                  )}
                  {!isCreating && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="btn-danger gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  )}
                </div>
              </div>

              <input
                ref={titleInputRef}
                type="text"
                value={editTitle}
                onChange={handleTitleChange}
                placeholder="输入笔记标题..."
                className={cn(
                  'w-full text-xl font-serif font-semibold text-slate-900 border-0 bg-transparent focus:outline-none focus:ring-0 mb-4',
                  !isEditing && !isCreating && 'cursor-default'
                )}
                readOnly={!isEditing && !isCreating}
              />

              <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  创建于 {selectedNote ? formatDateTime(selectedNote.createdAt) : '新建笔记'}
                </span>
                {selectedNote && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    更新于 {formatDateTime(selectedNote.updatedAt)}
                  </span>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-primary-500" />
                  <span className="text-sm font-medium text-slate-700">标签</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {editTags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        'badge text-xs flex items-center gap-1',
                        getTagColor(tag)
                      )}
                    >
                      {tag}
                      {(isEditing || isCreating) && (
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:bg-black/10 rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {(isEditing || isCreating) && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="输入标签后按回车添加..."
                      className="flex-1 input py-1.5 text-sm"
                    />
                    <button
                      onClick={handleAddTag}
                      disabled={!newTagInput.trim()}
                      className="btn-secondary px-3 py-1.5 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {relatedQuestions.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Link className="w-4 h-4 text-primary-500" />
                    <span className="text-sm font-medium text-slate-700">关联题目</span>
                  </div>
                  <div className="space-y-2">
                    {relatedQuestions.map((question) => (
                      <div
                        key={question.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn('badge text-xs', QUESTION_TYPE_MAP[question.type].color)}>
                                {QUESTION_TYPE_MAP[question.type].label}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">
                              {question.content}
                            </p>
                          </div>
                          <button
                            onClick={() => handleStartPractice(question.id)}
                            className="btn-primary px-3 py-1.5 text-xs flex-shrink-0"
                          >
                            <BookOpen className="w-3 h-3" />
                            去刷题
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="card p-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-primary-500" />
                <span className="text-sm font-medium text-slate-700">笔记内容</span>
              </div>
              <textarea
                value={editContent}
                onChange={handleContentChange}
                placeholder="开始记录你的笔记..."
                className={cn(
                  'flex-1 w-full resize-none bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono leading-relaxed',
                  !isEditing && !isCreating && 'cursor-default bg-white'
                )}
                readOnly={!isEditing && !isCreating}
              />
            </div>
          </>
        ) : (
          <Empty
            icon={FileText}
            title="选择或创建笔记"
            description="从左侧列表选择一篇笔记查看详情，或点击新建笔记开始记录"
            className="h-full flex items-center justify-center"
          />
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-error-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-error-500" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-slate-900">
                  确认删除
                </h3>
                <p className="text-sm text-slate-500">
                  删除后无法恢复，请谨慎操作
                </p>
              </div>
            </div>
            <p className="text-slate-600 mb-6">
              确定要删除笔记 <span className="font-medium text-slate-900">"{selectedNote?.title}"</span> 吗？
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger"
              >
                <Trash2 className="w-4 h-4" />
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
