import type { Subject, Chapter, Question, WrongQuestion, StudyPlanTask, Note, ExamRecord, UserProfile, DailyStat, HeatmapData, RadarData } from '@/types';

export const mockSubjects: Subject[] = [
  { id: 's1', name: '民法', icon: 'Scale', color: '#3B82F6', totalQuestions: 1500, completedQuestions: 823, accuracyRate: 0.72 },
  { id: 's2', name: '刑法', icon: 'ShieldAlert', color: '#EF4444', totalQuestions: 1200, completedQuestions: 658, accuracyRate: 0.68 },
  { id: 's3', name: '行政法', icon: 'Building2', color: '#F59E0B', totalQuestions: 800, completedQuestions: 412, accuracyRate: 0.65 },
  { id: 's4', name: '民事诉讼法', icon: 'Gavel', color: '#8B5CF6', totalQuestions: 600, completedQuestions: 345, accuracyRate: 0.71 },
  { id: 's5', name: '刑事诉讼法', icon: 'FileText', color: '#EC4899', totalQuestions: 600, completedQuestions: 289, accuracyRate: 0.63 },
  { id: 's6', name: '商法', icon: 'Briefcase', color: '#10B981', totalQuestions: 500, completedQuestions: 234, accuracyRate: 0.69 },
  { id: 's7', name: '经济法', icon: 'Landmark', color: '#06B6D4', totalQuestions: 400, completedQuestions: 156, accuracyRate: 0.58 },
  { id: 's8', name: '理论法', icon: 'BookOpen', color: '#84CC16', totalQuestions: 500, completedQuestions: 312, accuracyRate: 0.75 },
];

const generateChapters = (subjectId: string, subjectName: string): Chapter[] => {
  const chapters: Chapter[] = [];
  const chapterNames = [
    '第一章 总论',
    '第二章 基本原则',
    '第三章 基本制度',
    '第四章 具体规定',
    '第五章 特殊程序',
    '第六章 救济程序',
  ];
  
  chapterNames.forEach((name, index) => {
    chapters.push({
      id: `${subjectId}-c${index + 1}`,
      subjectId,
      name: `${subjectName}${name.replace('第一章', '').replace('第二章', '').replace('第三章', '').replace('第四章', '').replace('第五章', '').replace('第六章', '')}`,
      totalQuestions: Math.floor(Math.random() * 200) + 50,
      completedCount: Math.floor(Math.random() * 150) + 20,
      masteryRate: Math.random() * 0.5 + 0.3,
    });
  });
  
  return chapters;
};

export const mockChapters: Chapter[] = [
  ...generateChapters('s1', '民法'),
  ...generateChapters('s2', '刑法'),
  ...generateChapters('s3', '行政法'),
  ...generateChapters('s4', '民诉'),
  ...generateChapters('s5', '刑诉'),
  ...generateChapters('s6', '商法'),
  ...generateChapters('s7', '经济法'),
  ...generateChapters('s8', '理论法'),
];

const generateQuestion = (index: number, subjectId: string, chapterId: string): Question => {
  const types: Array<'single' | 'multiple' | 'subjective'> = ['single', 'single', 'single', 'multiple', 'subjective'];
  const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'medium', 'medium', 'hard'];
  const type = types[index % 5];
  const difficulty = difficulties[index % 5];
  
  const questionContents = [
    '根据《民法典》的规定，关于民事法律行为的效力，下列哪一选项是正确的？',
    '甲公司与乙公司签订买卖合同，约定甲公司向乙公司供应货物。关于合同履行，下列说法正确的是？',
    '王某将其房屋出租给李某，租赁期间王某欲将房屋出售给张某。关于承租人李某的权利，下列说法正确的是？',
    '关于抵押权的设立和实现，下列哪些选项是正确的？',
    '根据《刑法》规定，关于正当防卫的成立条件，下列说法正确的是？',
    '关于共同犯罪的认定，下列哪些选项是错误的？',
    '行政机关作出行政处罚决定前，应当告知当事人哪些事项？',
    '关于行政诉讼的受案范围，下列哪些案件不属于行政诉讼受案范围？',
    '根据《民事诉讼法》规定，关于管辖异议，下列说法正确的是？',
    '关于证据的证明力，下列哪些选项是正确的？',
    '根据《刑事诉讼法》规定，关于取保候审的适用条件，下列说法正确的是？',
    '关于审查起诉程序，下列哪些选项是正确的？',
    '关于公司股东的权利义务，下列说法正确的是？',
    '关于票据的背书转让，下列哪些选项是正确的？',
    '根据《劳动合同法》规定，关于试用期，下列说法正确的是？',
    '关于反不正当竞争行为的认定，下列哪些选项是正确的？',
  ];
  
  const options = [
    { label: 'A', text: '限制民事行为能力人实施的纯获利益的民事法律行为有效' },
    { label: 'B', text: '基于重大误解实施的民事法律行为无效' },
    { label: 'C', text: '一方以欺诈手段，使对方在违背真实意思的情况下实施的民事法律行为无效' },
    { label: 'D', text: '违反法律、行政法规的强制性规定的民事法律行为一律无效' },
  ];
  
  const analysisContents = [
    '本题考查民事法律行为的效力。根据《民法典》第145条规定，限制民事行为能力人实施的纯获利益的民事法律行为或者与其年龄、智力、精神健康状况相适应的民事法律行为有效。因此A选项正确。',
    '本题考查合同履行的相关规定。根据《民法典》第509条规定，当事人应当按照约定全面履行自己的义务。当事人应当遵循诚信原则，根据合同的性质、目的和交易习惯履行通知、协助、保密等义务。',
    '本题考查承租人的优先购买权。根据《民法典》第726条规定，出租人出卖租赁房屋的，应当在出卖之前的合理期限内通知承租人，承租人享有以同等条件优先购买的权利。',
  ];
  
  const lawReferences = [
    '《民法典》第143条、第144条、第145条、第146条、第147条、第148条、第153条',
    '《民法典》第509条、第510条、第511条',
    '《民法典》第725条、第726条、第727条、第728条',
    '《民法典》第394条、第395条、第396条、第410条、第413条',
  ];
  
  const knowledgePoints = [
    ['民事法律行为效力', '无效民事法律行为', '可撤销民事法律行为'],
    ['合同履行', '诚实信用原则', '附随义务'],
    ['租赁合同', '承租人权利', '优先购买权'],
    ['抵押权', '担保物权', '物权变动'],
    ['正当防卫', '违法阻却事由', '刑法总论'],
  ];
  
  const correctAnswers = ['A', 'B', 'C', 'ABC', 'D', 'BD', 'A', 'ABCD', 'B', 'ACD', 'C', 'ABCD', 'A', 'BCD', 'D', 'ABC'];
  
  return {
    id: `q${subjectId}-${chapterId}-${index + 1}`,
    subjectId,
    chapterId,
    type,
    difficulty,
    content: questionContents[index % questionContents.length],
    options: type !== 'subjective' ? options : undefined,
    correctAnswer: correctAnswers[index % correctAnswers.length],
    analysis: analysisContents[index % analysisContents.length],
    lawReference: lawReferences[index % lawReferences.length],
    isFavorite: Math.random() > 0.8,
    exerciseCount: Math.floor(Math.random() * 50) + 5,
    correctCount: Math.floor(Math.random() * 40) + 3,
    knowledgePoints: knowledgePoints[index % knowledgePoints.length],
  };
};

export const mockQuestions: Question[] = [];

mockSubjects.forEach((subject) => {
  const subjectChapters = mockChapters.filter((c) => c.subjectId === subject.id);
  subjectChapters.forEach((chapter) => {
    for (let i = 0; i < 8; i++) {
      mockQuestions.push(generateQuestion(i, subject.id, chapter.id));
    }
  });
});

export const mockUserProfile: UserProfile = {
  name: '法考考生',
  studyDays: 128,
  currentStreak: 15,
  totalQuestions: 3229,
  correctCount: 2215,
  accuracyRate: 0.686,
};

export const mockWrongQuestions: WrongQuestion[] = [
  {
    id: 'w1',
    questionId: mockQuestions[0].id,
    wrongAnswer: 'B',
    reasonType: 'concept',
    reviewCount: 2,
    correctInReview: 1,
    wrongAt: new Date(Date.now() - 86400000 * 3),
    nextReviewAt: new Date(Date.now() + 86400000 * 1),
    mastered: false,
  },
  {
    id: 'w2',
    questionId: mockQuestions[5].id,
    wrongAnswer: 'AC',
    reasonType: 'law',
    reviewCount: 1,
    correctInReview: 0,
    wrongAt: new Date(Date.now() - 86400000 * 2),
    nextReviewAt: new Date(Date.now() + 86400000 * 2),
    mastered: false,
  },
  {
    id: 'w3',
    questionId: mockQuestions[10].id,
    wrongAnswer: 'A',
    reasonType: 'careless',
    reviewCount: 3,
    correctInReview: 2,
    wrongAt: new Date(Date.now() - 86400000 * 5),
    nextReviewAt: new Date(Date.now() - 86400000 * 1),
    mastered: false,
  },
  {
    id: 'w4',
    questionId: mockQuestions[15].id,
    wrongAnswer: 'AB',
    reasonType: 'review',
    reviewCount: 0,
    correctInReview: 0,
    wrongAt: new Date(Date.now() - 86400000 * 1),
    nextReviewAt: new Date(Date.now()),
    mastered: false,
  },
  {
    id: 'w5',
    questionId: mockQuestions[20]?.id || mockQuestions[0].id,
    wrongAnswer: 'D',
    reasonType: 'concept',
    reviewCount: 1,
    correctInReview: 1,
    wrongAt: new Date(Date.now() - 86400000 * 7),
    nextReviewAt: new Date(Date.now() + 86400000 * 4),
    mastered: false,
  },
];

const today = new Date().toISOString().split('T')[0];

export const mockStudyTasks: StudyPlanTask[] = [
  {
    id: 't1',
    title: '民法物权部分练习',
    type: 'practice',
    targetCount: 50,
    completedCount: 32,
    relatedSubject: 's1',
    date: today,
    completed: false,
    createdAt: new Date(),
  },
  {
    id: 't2',
    title: '复习刑法总论错题',
    type: 'review',
    targetCount: 20,
    completedCount: 20,
    relatedSubject: 's2',
    date: today,
    completed: true,
    createdAt: new Date(),
  },
  {
    id: 't3',
    title: '整理行政法笔记',
    type: 'note',
    targetCount: 5,
    completedCount: 2,
    relatedSubject: 's3',
    date: today,
    completed: false,
    createdAt: new Date(),
  },
  {
    id: 't4',
    title: '民诉法专项训练',
    type: 'practice',
    targetCount: 30,
    completedCount: 0,
    relatedSubject: 's4',
    date: today,
    completed: false,
    createdAt: new Date(),
  },
];

export const mockNotes: Note[] = [
  {
    id: 'n1',
    title: '民事法律行为效力总结',
    content: '# 民事法律行为效力\n\n## 有效要件\n1. 行为人具有相应的民事行为能力\n2. 意思表示真实\n3. 不违反法律、行政法规的强制性规定\n4. 不违背公序良俗\n\n## 无效情形\n- 无民事行为能力人实施的民事法律行为\n- 行为人与相对人以虚假的意思表示实施的民事法律行为\n- 违反法律、行政法规的强制性规定的民事法律行为\n- 违背公序良俗的民事法律行为\n- 行为人与相对人恶意串通，损害他人合法权益的民事法律行为\n\n## 可撤销情形\n- 基于重大误解实施的民事法律行为\n- 一方以欺诈手段，使对方在违背真实意思的情况下实施的民事法律行为\n- 第三人实施欺诈行为，使一方在违背真实意思的情况下实施的民事法律行为\n- 一方或者第三人以胁迫手段，使对方在违背真实意思的情况下实施的民事法律行为\n- 一方利用对方处于危困状态、缺乏判断能力等情形，致使民事法律行为成立时显失公平的',
    tags: ['民法', '民事法律行为', '效力'],
    questionId: mockQuestions[0].id,
    createdAt: new Date(Date.now() - 86400000 * 5),
    updatedAt: new Date(Date.now() - 86400000 * 3),
  },
  {
    id: 'n2',
    title: '刑法正当防卫要点',
    content: '# 正当防卫\n\n## 成立条件\n1. **起因条件**：存在现实的不法侵害\n2. **时间条件**：不法侵害正在进行\n3. **对象条件**：针对不法侵害人本人\n4. **主观条件**：防卫意图\n5. **限度条件**：没有明显超过必要限度造成重大损害\n\n## 特殊正当防卫\n- 对正在进行行凶、杀人、抢劫、强奸、绑架以及其他严重危及人身安全的暴力犯罪\n- 采取防卫行为，造成不法侵害人伤亡的，不属于防卫过当，不负刑事责任\n\n## 防卫过当\n- 正当防卫明显超过必要限度造成重大损害的，应当负刑事责任\n- 应当减轻或者免除处罚',
    tags: ['刑法', '正当防卫', '违法阻却事由'],
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: 'n3',
    title: '行政复议与行政诉讼的区别',
    content: '# 行政复议 vs 行政诉讼\n\n| 比较项目 | 行政复议 | 行政诉讼 |\n|---------|---------|---------|\n| 性质 | 行政行为 | 司法行为 |\n| 审查机关 | 上级行政机关 | 人民法院 |\n| 审查范围 | 合法性+合理性 | 原则上仅审查合法性 |\n| 审理方式 | 书面审查为主 | 开庭审理 |\n| 审级制度 | 一级复议 | 两审终审 |\n| 是否收费 | 不收费 | 收费 |\n\n## 衔接关系\n- 可选择：先复议后诉讼，或直接诉讼\n- 复议前置：必须先复议，对复议不服才能诉讼\n  - 自然资源权属争议\n  - 纳税争议\n  - 经营者集中',
    tags: ['行政法', '行政复议', '行政诉讼'],
    createdAt: new Date(Date.now() - 86400000 * 1),
    updatedAt: new Date(Date.now() - 86400000 * 1),
  },
];

export const mockExamRecords: ExamRecord[] = [
  {
    id: 'e1',
    name: '2024年法考客观题模拟卷（一）',
    type: 'objective',
    totalQuestions: 100,
    correctCount: 72,
    totalScore: 150,
    userScore: 108,
    timeSpent: 10800,
    ranking: 1234,
    totalParticipants: 8562,
    questionIds: mockQuestions.slice(0, 100).map((q) => q.id),
    answers: {},
    createdAt: new Date(Date.now() - 86400000 * 14),
  },
  {
    id: 'e2',
    name: '2024年法考客观题模拟卷（二）',
    type: 'objective',
    totalQuestions: 100,
    correctCount: 68,
    totalScore: 150,
    userScore: 102,
    timeSpent: 11200,
    ranking: 2156,
    totalParticipants: 7823,
    questionIds: mockQuestions.slice(100, 200).map((q) => q.id),
    answers: {},
    createdAt: new Date(Date.now() - 86400000 * 7),
  },
  {
    id: 'e3',
    name: '2024年法考客观题模拟卷（三）',
    type: 'objective',
    totalQuestions: 100,
    correctCount: 78,
    totalScore: 150,
    userScore: 117,
    timeSpent: 9800,
    ranking: 856,
    totalParticipants: 9125,
    questionIds: mockQuestions.slice(200, 300).map((q) => q.id),
    answers: {},
    createdAt: new Date(Date.now() - 86400000 * 1),
  },
];

const generateDailyStats = (): DailyStat[] => {
  const stats: DailyStat[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const questionCount = Math.floor(Math.random() * 80) + 20;
    const correctCount = Math.floor(questionCount * (Math.random() * 0.3 + 0.55));
    
    stats.push({
      date: date.toISOString().split('T')[0],
      questionCount,
      correctCount,
      accuracyRate: correctCount / questionCount,
      studyTime: Math.floor(Math.random() * 180) + 30,
    });
  }
  return stats;
};

export const mockDailyStats = generateDailyStats();

export const mockHeatmapData: HeatmapData[] = mockChapters.map((chapter) => ({
  subjectId: chapter.subjectId,
  chapterId: chapter.id,
  chapterName: chapter.name,
  masteryRate: chapter.masteryRate,
  questionCount: chapter.totalQuestions,
}));

export const mockRadarData: RadarData[] = mockSubjects.map((subject) => ({
  subject: subject.name,
  subjectId: subject.id,
  score: Math.round(subject.accuracyRate * 100),
  fullMark: 100,
}));

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
