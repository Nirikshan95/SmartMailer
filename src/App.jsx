import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import EmailAutomationTool from '../email_automation_tool';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/app" element={<EmailAutomationTool />} />
            </Routes>
        </Router>
    );
};

export default App;
