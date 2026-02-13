import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, User, Moon, Sun, Plus, ChevronRight, Search } from 'lucide-react';
import { useDashboard } from './DashboardContext';

const TopBar = () => {
    const location = useLocation();
    const { toggleTheme, theme } = useDashboard();
    const [showUserMenu, setShowUserMenu] = React.useState(false);
    const pathnames = location.pathname.split('/').filter((x) => x);

    // Breadcrumb mapping
    const breadcrumbNameMap = {
        dashboard: 'Dashboard',
        prospects: 'Prospects',
        templates: 'Templates',
        campaigns: 'Campaigns',
        analytics: 'Analytics',
        settings: 'Settings'
    };

    return (
        <div className="top-bar">
            {/* Left: Breadcrumbs & Search */}
            <div className="top-bar-left" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div className="breadcrumbs">
                    <span className="breadcrumb-item">SmartMailer</span>
                    {pathnames.map((value, index) => {
                        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                        const isLast = index === pathnames.length - 1;
                        const name = breadcrumbNameMap[value] || value.charAt(0).toUpperCase() + value.slice(1);

                        return (
                            <React.Fragment key={to}>
                                <ChevronRight size={14} className="breadcrumb-separator" />
                                {isLast ? (
                                    <span className="breadcrumb-active">{name}</span>
                                ) : (
                                    <Link to={to} className="breadcrumb-link">{name}</Link>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="global-search">
                    <Search size={16} className="search-icon" />
                    <input type="text" placeholder="Search anything..." className="search-input" />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="top-bar-actions">
                <div className="system-status">
                    <span className="status-dot"></span>
                    <span className="status-text">System All Systems Operational</span>
                </div>

                <div className="divider-vertical"></div>

                <Link to="/dashboard/campaigns" className="btn btn-primary btn-sm">
                    <Plus size={16} /> <span className="btn-text">New Campaign</span>
                </Link>

                <div className="divider-vertical"></div>

                <button className="icon-btn" title="Toggle Theme" onClick={toggleTheme}>
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <button className="icon-btn" title="Notifications">
                    <div className="notification-badge-container">
                        <Bell size={20} />
                        <span className="notification-dot"></span>
                    </div>
                </button>

                <div className="user-menu-container" style={{ position: 'relative' }}>
                    <div className="user-menu" onClick={() => setShowUserMenu(!showUserMenu)}>
                        <div className="avatar">
                            <User size={20} />
                        </div>
                    </div>
                    {showUserMenu && (
                        <div className="dropdown-menu">
                            <div className="dropdown-header">
                                <p className="dropdown-name">Nirikshan</p>
                                <p className="dropdown-email">nirik@example.com</p>
                            </div>
                            <div className="dropdown-divider"></div>
                            <Link to="/dashboard/settings" className="dropdown-item">Settings</Link>
                            <Link to="/dashboard/settings" className="dropdown-item">Billing</Link>
                            <div className="dropdown-divider"></div>
                            <Link to="/" className="dropdown-item text-error">Logout</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TopBar;
