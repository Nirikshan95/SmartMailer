import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './components/dashboard/DashboardLayout';
import Overview from './components/dashboard/Overview';
import Prospects from './components/dashboard/Prospects';
import Templates from './components/dashboard/Templates';
import Campaigns from './components/dashboard/Campaigns';
import Analytics from './components/dashboard/Analytics';
import Settings from './components/dashboard/Settings';
import QueueManagement from './components/dashboard/QueueManagement';
import Scheduling from './components/dashboard/Scheduling';
import Throttling from './components/dashboard/Throttling';
import AIWriting from './components/dashboard/AIWriting';
import Unsubscribe from './components/dashboard/Unsubscribe';
import Personalization from './components/dashboard/Personalization';
import Attachments from './components/dashboard/Attachments';
import Security from './components/dashboard/Security';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<Overview />} />
                    <Route path="prospects" element={<Prospects />} />
                    <Route path="templates" element={<Templates />} />
                    <Route path="campaigns" element={<Campaigns />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="queue" element={<QueueManagement />} />
                    <Route path="scheduling" element={<Scheduling />} />
                    <Route path="throttling" element={<Throttling />} />
                    <Route path="ai-writing" element={<AIWriting />} />
                    <Route path="unsubscribe" element={<Unsubscribe />} />
                    <Route path="personalization" element={<Personalization />} />
                    <Route path="attachments" element={<Attachments />} />
                    <Route path="security" element={<Security />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
                {/* Redirect old /app route to dashboard */}
                <Route path="/app" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Router>
    );
};

export default App;
