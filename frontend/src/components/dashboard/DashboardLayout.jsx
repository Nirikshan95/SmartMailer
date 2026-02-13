import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { DashboardProvider, useDashboard } from './DashboardContext';
import Toast from '../common/Toast';
import './dashboard.css';

const DashboardContent = () => {
    const { toast, hideToast } = useDashboard();

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <TopBar />
                <div className="dashboard-content">
                    <Outlet />
                </div>
            </main>
            <Toast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onClose={hideToast}
            />
        </div>
    );
};

const DashboardLayout = () => {
    return (
        <DashboardProvider>
            <DashboardContent />
        </DashboardProvider>
    );
};

export default DashboardLayout;
