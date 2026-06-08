import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import DashboardPage from "@/pages/Dashboard/DashboardPage";
import QuestionBankPage from "@/pages/QuestionBank/QuestionBankPage";
import PracticePage from "@/pages/Practice/PracticePage";
import WrongQuestionsPage from "@/pages/WrongQuestions/WrongQuestionsPage";
import PlanPage from "@/pages/Plan/PlanPage";
import NotesPage from "@/pages/Notes/NotesPage";
import ExamPage from "@/pages/Exam/ExamPage";
import AnalysisPage from "@/pages/Analysis/AnalysisPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/question-bank" element={<QuestionBankPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/wrong-questions" element={<WrongQuestionsPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/exam" element={<ExamPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
