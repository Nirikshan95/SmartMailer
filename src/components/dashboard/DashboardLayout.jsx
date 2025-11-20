import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { DashboardProvider } from './DashboardContext';
import './dashboard.css';

const DashboardLayout = () => {
    return (
        <DashboardProvider>
            <div className="dashboard-layout">
                <Sidebar />
                <main className="dashboard-main">
                    <Outlet />
                </main>
            </div>
        </DashboardProvider>
    );
};

export default DashboardLayout;
