import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import MealLogPage from "./pages/MealLogPage";
import StoolLogPage from "./pages/StoolLogPage";
import ContextLogPage from "./pages/ContextLogPage";
import SymptomLogPage from "./pages/SymptomLogPage";
import HistoryPage from "./pages/HistoryPage";
import HypothesesPage from "./pages/HypothesesPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/log/meal" element={<MealLogPage />} />
        <Route path="/log/stool" element={<StoolLogPage />} />
        <Route path="/log/context" element={<ContextLogPage />} />
        <Route path="/log/symptoms" element={<SymptomLogPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/hypotheses" element={<HypothesesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
