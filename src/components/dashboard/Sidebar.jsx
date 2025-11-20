import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Send, BarChart2, LogOut } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true },
        { path: '/dashboard/prospects', icon: Users, label: 'Prospects' },
        { path: '/dashboard/templates', icon: FileText, label: 'Templates' },
        { path: '/dashboard/campaigns', icon: Send, label: 'Campaigns' },
        { path: '/dashboard/analytics', icon: BarChart2, label: 'Analytics' },
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2 className="sidebar-title">SmartMailer</h2>
            </div>

            <nav className="sidebar-nav">
                <ul className="sidebar-list">
                    {navItems.map((item) => (
                        <li key={item.path} className="sidebar-item">
                            <NavLink
                                to={item.path}
                                end={item.end}
                                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={20} style={{ marginRight: '12px' }} />
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <NavLink to="/" className="logout-link">
                    <LogOut size={20} style={{ marginRight: '12px' }} />
                    Logout
                </NavLink>
            </div>
        </div>
    );
};

export default Sidebar;
