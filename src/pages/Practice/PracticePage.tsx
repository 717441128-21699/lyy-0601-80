import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock, Star, StarOff, FileText, CheckCircle, XCircle, AlertCircle, BookOpen } from 'lucide-react';
import { usePracticeStore } from '@/store/usePracticeStore';
import { useWrongQuestionStore } from '@/store/useWrongQuestionStore';
import { useNoteStore } from '@/store/useNoteStore';
import { useQuestionBankStore } from '@/store/useQuestionBankStore';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { REASON_TYPES, DIFFICULTY_MAP, QUESTION_TYPE_MAP, ReasonType } from '@/types';

export default function PracticePage() {
  const navigate = useNavigate();
  const {
    isActive,
    currentQuestionIndex,
    questions,
    answers,
    showAnalysis,
    submitAnswer,
    nextQuestion,
    prevQuestion,
    toggleAnalysis,
    finishSession,
    resetSession,
    mode,
  } = usePracticeStore();

  const { addWrongQuestion } = useWrongQuestionStore();
  const { getNotesByQuestion } = useNoteStore();
  const { toggleFavorite, getFilteredQuestions } = useQuestionBankStore();
  const { addDailyStat } = useAnalysisStore();

  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<ReasonType | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [questionTime, setQuestionTime] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  const notes = currentQuestion ? getNotesByQuestion(currentQuestion.id) : [];

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setElapsedTime((t) => t + 1);
      setQuestionTime((t) => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive]);

  useEffect(() => {
    setSelectedAnswer(answers[currentQuestion?.id || ''] || '');
    setSelectedReason(null);
    setQuestionTime(0);
  }, [currentQuestionIndex, currentQuestion?.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (label: string) => {
    if (showAnalysis) return;
    if (currentQuestion?.type === 'multiple') {
      const current = selectedAnswer.split('').filter(Boolean);
      if (current.includes(label)) {
        setSelectedAnswer(current.filter((l) => l !== label).join(''));
      } else {
        setSelectedAnswer([...current, label].sort().join(''));
      }
    } else {
      setSelectedAnswer(label);
    }
  };

  const handleSubmit = () => {
    if (!currentQuestion || !selectedAnswer) return;
    submitAnswer(currentQuestion.id, selectedAnswer);
    
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    if (!isCorrect) {
      addWrongQuestion(currentQuestion.id, selectedAnswer, selectedReason || 'concept');
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      nextQuestion();
    } else {
      const result = finishSession();
      if (result) {
        addDailyStat(result.totalQuestions, result.correctCount, Math.floor(result.totalTime / 60));
      }
      setShowResult(true);
    }
  };

  const handleFinishPractice = () => {
    resetSession();
    navigate('/');
  };

  const handleStartQuickPractice = () => {
    const filteredQs = getFilteredQuestions();
    if (filteredQs.length === 0) {
      navigate('/question-bank');
      return;
    }
    const shuffled = [...filteredQs].sort(() => Math.random() - 0.5).slice(0, 20);
    usePracticeStore.getState().startSession(shuffled, 'random', 'single');
  };

  const getOptionClass = (label: string) => {
    if (!showAnalysis) {
      if (currentQuestion?.type === 'multiple') {
        return selectedAnswer.includes(label) ? 'option-card-selected' : 'option-card';
      }
      return selectedAnswer === label ? 'option-card-selected' : 'option-card';
    }

    const isCorrect = currentQuestion?.correctAnswer.includes(label);
    const isSelected = selectedAnswer.includes(label);

    if (isCorrect) return 'option-card-correct';
    if (isSelected && !isCorrect) return 'option-card-wrong';
    return 'option-card opacity-50';
  };

  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const correctCount = Object.entries(answers).filter(
    ([id, ans]) => questions.find((q) => q.id === id)?.correctAnswer === ans
  ).length;

  if (!isActive && !showResult) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center stagger-animation">
        <div className="card p-12 text-center max-w-md">
          <BookOpen className="w-20 h-20 text-primary-500 mx-auto mb-6" />
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-2">开始练习</h2>
          <p className="text-slate-500 mb-8">选择科目和章节，开始新一轮的题目练习</p>
          <div className="space-y-3">
            <button onClick={() => navigate('/question-bank')} className="w-full btn-primary">
              去题库选题
            </button>
            <button onClick={handleStartQuickPractice} className="w-full btn-secondary">
              随机练习20题
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResult) {
    const result = Object.entries(answers).reduce(
      (acc, [id, ans]) => {
        const q = questions.find((q) => q.id === id);
        if (q?.correctAnswer === ans) {
          acc.correct++;
        } else {
          acc.wrong++;
        }
        return acc;
      },
      { correct: 0, wrong: 0 }
    );

    const accuracy = questions.length > 0 ? (result.correct / questions.length) * 100 : 0;

    return (
      <div className="max-w-2xl mx-auto stagger-animation">
        <div className="card p-8 text-center">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#E2E8F0" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={accuracy >= 60 ? '#10B981' : '#F43F5E'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - accuracy / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-serif font-bold text-slate-900">{Math.round(accuracy)}%</span>
              <span className="text-xs text-slate-500">正确率</span>
            </div>
          </div>

          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-2">
            {accuracy >= 80 ? '太棒了！' : accuracy >= 60 ? '做得不错！' : '继续加油！'}
          </h2>
          <p className="text-slate-500 mb-8">本次练习已完成</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-500">总题数</p>
              <p className="text-2xl font-bold text-slate-900">{questions.length}</p>
            </div>
            <div className="p-4 bg-success-50 rounded-lg">
              <p className="text-sm text-success-600">正确</p>
              <p className="text-2xl font-bold text-success-600">{result.correct}</p>
            </div>
            <div className="p-4 bg-error-50 rounded-lg">
              <p className="text-sm text-error-600">错误</p>
              <p className="text-2xl font-bold text-error-600">{result.wrong}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-slate-500 mb-8">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              用时 {formatTime(elapsedTime)}
            </span>
            <span>平均每题 {Math.round(elapsedTime / questions.length)} 秒</span>
          </div>

          <div className="flex gap-3">
            <button onClick={handleFinishPractice} className="flex-1 btn-secondary">
              返回首页
            </button>
            <button
              onClick={() => {
                setShowResult(false);
                handleStartQuickPractice();
              }}
              className="flex-1 btn-primary"
            >
              再来一组
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto stagger-animation">
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600">
              第 {currentQuestionIndex + 1} / {questions.length} 题
            </span>
            <span className={`badge ${QUESTION_TYPE_MAP[currentQuestion?.type || 'single'].color}`}>
              {QUESTION_TYPE_MAP[currentQuestion?.type || 'single'].label}
            </span>
            {currentQuestion && (
              <span className={`badge ${DIFFICULTY_MAP[currentQuestion.difficulty].color}`}>
                {DIFFICULTY_MAP[currentQuestion.difficulty].label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              {formatTime(elapsedTime)}
            </span>
            <span className="text-sm text-slate-500">
              本用时: {formatTime(questionTime)}
            </span>
            <span className="text-sm text-success-600 font-medium">
              正确 {correctCount}/{currentQuestionIndex + (showAnalysis ? 1 : 0)}
            </span>
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill bg-gradient-primary" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="card p-8">
        {currentQuestion && (
          <>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {currentQuestion.knowledgePoints.map((kp) => (
                    <span key={kp} className="badge-slate">
                      {kp}
                    </span>
                  ))}
                </div>
                <h3 className="font-serif text-xl text-slate-900 leading-relaxed">
                  {currentQuestion.content}
                </h3>
              </div>
              <button
                onClick={() => toggleFavorite(currentQuestion.id)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
              >
                {currentQuestion.isFavorite ? (
                  <Star className="w-5 h-5 text-accent-500 fill-accent-500" />
                ) : (
                  <StarOff className="w-5 h-5 text-slate-300" />
                )}
              </button>
            </div>

            {currentQuestion.type !== 'subjective' ? (
              <div className="space-y-3 mb-6">
                {currentQuestion.options?.map((option) => (
                  <div
                    key={option.label}
                    onClick={() => handleSelectOption(option.label)}
                    className={getOptionClass(option.label)}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                          showAnalysis
                            ? option.label === currentQuestion.correctAnswer
                              ? 'bg-success-500 text-white'
                              : selectedAnswer.includes(option.label) &&
                                !currentQuestion.correctAnswer.includes(option.label)
                              ? 'bg-error-500 text-white'
                              : 'bg-slate-200 text-slate-600'
                            : selectedAnswer.includes(option.label)
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {showAnalysis ? (
                          option.label === currentQuestion.correctAnswer ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : selectedAnswer.includes(option.label) ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            option.label
                          )
                        ) : (
                          option.label
                        )}
                      </span>
                      <span className="flex-1 pt-1">{option.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-6">
                <textarea
                  value={selectedAnswer}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  placeholder="请输入你的答案..."
                  className="input min-h-32 resize-y"
                />
              </div>
            )}

            {!showAnalysis ? (
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={!selectedAnswer}
                  className="btn-primary px-8"
                >
                  提交答案
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedAnswer !== currentQuestion.correctAnswer && (
                  <div className="p-4 bg-error-50 border border-error-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-error-700 mb-2">选择错误原因</p>
                        <div className="flex flex-wrap gap-2">
                          {REASON_TYPES.map((reason) => (
                            <button
                              key={reason.value}
                              onClick={() => setSelectedReason(reason.value)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                selectedReason === reason.value
                                  ? 'bg-error-500 text-white'
                                  : 'bg-white border border-error-300 text-error-700 hover:bg-error-100'
                              }`}
                            >
                              {reason.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <p className="font-medium text-primary-700 mb-2">正确答案</p>
                  <p className="text-lg font-semibold text-primary-800">
                    {currentQuestion.correctAnswer}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="font-medium text-slate-700 mb-2">答案解析</p>
                  <p className="text-slate-600 leading-relaxed">{currentQuestion.analysis}</p>
                </div>

                <div className="p-4 bg-accent-50 border border-accent-200 rounded-lg">
                  <p className="font-medium text-accent-700 mb-2">关联法条</p>
                  <p className="text-accent-600">{currentQuestion.lawReference}</p>
                </div>

                {notes.length > 0 && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-purple-500" />
                      <p className="font-medium text-purple-700">相关笔记 ({notes.length})</p>
                    </div>
                    {notes.slice(0, 2).map((note) => (
                      <div key={note.id} className="p-3 bg-white rounded-lg border border-purple-100 mt-2">
                        <p className="font-medium text-slate-800 text-sm">{note.title}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-4">
                  {currentQuestionIndex > 0 && (
                    <button onClick={prevQuestion} className="btn-secondary">
                      <ChevronLeft className="w-4 h-4" />
                      上一题
                    </button>
                  )}
                  <button onClick={handleNext} className="btn-primary">
                    {currentQuestionIndex < questions.length - 1 ? (
                      <>
                        下一题
                        <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      '完成练习'
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
