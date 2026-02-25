import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AuthGuard from './components/layout/AuthGuard';
import ToastContainer from './components/ui/Toast';
import ExecutiveSummaryPage from './pages/ExecutiveSummaryPage';
import PerformancePage from './pages/PerformancePage';
import PeersPage from './pages/PeersPage';
import DriversPage from './pages/DriversPage';
import MacroPage from './pages/MacroPage';
import DataHealthPage from './pages/DataHealthPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-bg text-gray-200">
      <ToastContainer />
      <Header />
      <main className="max-w-[1600px] mx-auto px-4 py-6">
        <AuthGuard>
          <Routes>
            <Route index element={<ExecutiveSummaryPage />} />
            <Route path="performance" element={<PerformancePage />} />
            <Route path="peers" element={<PeersPage />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="macro" element={<MacroPage />} />
            <Route path="data-health" element={<DataHealthPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Routes>
        </AuthGuard>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="/*" element={<DashboardLayout />} />
    </Routes>
  );
}
