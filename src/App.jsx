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
                    <Route path="settings" element={<Settings />} />
                </Route>
                {/* Redirect old /app route to dashboard */}
                <Route path="/app" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Router>
    );
};

export default App;
