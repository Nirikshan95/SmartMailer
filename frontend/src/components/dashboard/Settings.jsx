import React, { useState, useEffect } from 'react';
import { useDashboard } from './DashboardContext';
import { Save, Check, AlertCircle, HardDrive, Key, Mail, Server, Activity, Clock, Repeat, PenTool, Trash2, Download, Database } from 'lucide-react';

const Settings = () => {
    const { smtpConfig, setSmtpConfig, sendingConfig, setSendingConfig, campaigns, setCampaigns, setCompletedEmails, setEmailStats, showToast } = useDashboard();

    const [activeTab, setActiveTab] = useState('general'); // general, email, integrations, data
    const [licenseKey, setLicenseKey] = useState('');
    const [licenseStatus, setLicenseStatus] = useState(null);
    const [driveConnected, setDriveConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verifyingSmtp, setVerifyingSmtp] = useState(false);

    useEffect(() => {
        checkDriveStatus();
        fetchLicenseStatus();

        const params = new URLSearchParams(window.location.search);
        if (params.get('drive') === 'connected') {
            showToast('Google Drive connected successfully!', 'success');
            setActiveTab('integrations');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const checkDriveStatus = async () => {
        try {
            const res = await fetch('http://localhost:3001/auth/status');
            const data = await res.json();
            setDriveConnected(data.connected);
        } catch (error) {
            console.error('Failed to check drive status', error);
        }
    };

    const fetchLicenseStatus = async () => {
        try {
            const res = await fetch('http://localhost:3001/settings/license');
            const data = await res.json();
            setLicenseStatus(data);
        } catch (error) {
            console.error('Failed to fetch license status', error);
        }
    };

    const handleConnectDrive = () => {
        window.location.href = 'http://localhost:3001/auth/google';
    };

    const handleSaveLicense = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/settings/license', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: licenseKey })
            });
            const data = await res.json();
            if (data.success) {
                setLicenseStatus(data.license);
                showToast('License key activated successfully!', 'success');
                setLicenseKey('');
            } else {
                showToast(data.message || 'Invalid license key', 'error');
            }
        } catch (error) {
            showToast('Failed to validate license key', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleTestSmtp = async () => {
        setVerifyingSmtp(true);
        try {
            const res = await fetch('http://localhost:3001/verify-smtp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ smtpConfig })
            });
            const data = await res.json();
            if (data.success) {
                showToast('SMTP connection verified successfully!', 'success');
            } else {
                showToast(data.message || 'SMTP verification failed', 'error');
            }
        } catch (error) {
            showToast('Failed to verify SMTP settings', 'error');
        } finally {
            setVerifyingSmtp(false);
        }
    };

    const handleClearData = () => {
        if (window.confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
            setCampaigns([]);
            setCompletedEmails([]);
            setEmailStats({
                emailsToday: 0,
                emailsThisHour: 0,
                maxPerDay: 400,
                maxPerHour: 50,
                history: []
            });
            showToast('All local data cleared.', 'success');
        }
    };

    const handleExportData = () => {
        try {
            const dataStr = JSON.stringify({ campaigns, smtpConfig, sendingConfig }, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const exportFileDefaultName = 'data_export.json';
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            showToast('Data export started', 'success');
        } catch (e) {
            showToast('Failed to export data', 'error');
        }
    };

    const renderTabs = () => (
        <div className="card" style={{ padding: '0', overflow: 'hidden', height: 'fit-content' }}>
            <div className="sidebar-list">
                <button onClick={() => setActiveTab('general')} className={`sidebar-link ${activeTab === 'general' ? 'active' : ''}`} style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
                    <Activity size={18} style={{ marginRight: '12px' }} /> General
                </button>
                <button onClick={() => setActiveTab('email')} className={`sidebar-link ${activeTab === 'email' ? 'active' : ''}`} style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
                    <Mail size={18} style={{ marginRight: '12px' }} /> Email Configuration
                </button>
                <button onClick={() => setActiveTab('integrations')} className={`sidebar-link ${activeTab === 'integrations' ? 'active' : ''}`} style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
                    <HardDrive size={18} style={{ marginRight: '12px' }} /> Integrations
                </button>
                <button onClick={() => setActiveTab('data')} className={`sidebar-link ${activeTab === 'data' ? 'active' : ''}`} style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
                    <Database size={18} style={{ marginRight: '12px' }} /> Data Management
                </button>
            </div>
        </div>
    );

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Settings</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Manage your preferences and system configuration</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px' }}>
                {renderTabs()}

                <div style={{ minWidth: 0 }}>
                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div className="card">
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                                <Key size={24} style={{ color: 'var(--primary-color)', marginRight: '12px' }} />
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>License & Plan</h3>
                            </div>
                            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--surface-color)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Current Plan</div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                    {licenseStatus?.plan || 'Loading...'}
                                </div>
                                <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-primary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success-color)' }}></div>
                                        Daily Limit: <strong>{licenseStatus?.limits?.maxPerDay || 0}</strong> emails
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success-color)' }}></div>
                                        Hourly Limit: <strong>{licenseStatus?.limits?.maxPerHour || 0}</strong> emails
                                    </div>
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="label">Update License Key</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input type="text" className="input" value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} placeholder="Paste your license key here" />
                                    <button onClick={handleSaveLicense} disabled={loading || !licenseKey} className="btn btn-primary">{loading ? 'Saving...' : <Save size={18} />} Save</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Email Configuration Tab (Merged SMTP + Defaults) */}
                    {activeTab === 'email' && (
                        <>
                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                                    <Server size={24} style={{ color: 'var(--primary-color)', marginRight: '12px' }} />
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>SMTP Configuration</h3>
                                </div>
                                <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="input-group">
                                        <label className="label">SMTP Server</label>
                                        <input type="text" className="input" value={smtpConfig.server} onChange={(e) => setSmtpConfig({ ...smtpConfig, server: e.target.value })} placeholder="smtp.gmail.com" />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Port</label>
                                        <input type="text" className="input" value={smtpConfig.port} onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })} placeholder="587" />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Email Address</label>
                                        <input type="email" className="input" value={smtpConfig.email} onChange={(e) => setSmtpConfig({ ...smtpConfig, email: e.target.value })} placeholder="your@email.com" />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">App Password</label>
                                        <input type="password" className="input" value={smtpConfig.password} onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })} placeholder="••••••••••••••••" />
                                    </div>
                                </div>
                                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button onClick={handleTestSmtp} disabled={verifyingSmtp || !smtpConfig.email || !smtpConfig.password} className="btn btn-outline">{verifyingSmtp ? 'Verifying...' : 'Test Connection'}</button>
                                </div>
                            </div>

                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                                    <Clock size={24} style={{ color: 'var(--primary-color)', marginRight: '12px' }} />
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Sending Preferences</h3>
                                </div>
                                <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="input-group">
                                        <label className="label">Delay Between Emails (seconds)</label>
                                        <input type="number" min="0" className="input" value={sendingConfig.delay} onChange={(e) => setSendingConfig({ ...sendingConfig, delay: parseInt(e.target.value) || 0 })} />
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Recommended: 3-5 seconds to avoid spam blocks.</p>
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Max Retries for Failed Emails</label>
                                        <input type="number" min="0" max="5" className="input" value={sendingConfig.maxRetries} onChange={(e) => setSendingConfig({ ...sendingConfig, maxRetries: parseInt(e.target.value) || 0 })} />
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                                    <PenTool size={24} style={{ color: 'var(--primary-color)', marginRight: '12px' }} />
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Email Signature</h3>
                                </div>
                                <div className="input-group">
                                    <label className="label">Default Signature (HTML supported)</label>
                                    <textarea className="textarea" rows="4" value={sendingConfig.signature} onChange={(e) => setSendingConfig({ ...sendingConfig, signature: e.target.value })} placeholder="<br>--<br>Best Regards,<br>Your Name"></textarea>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Integrations Tab */}
                    {activeTab === 'integrations' && (
                        <div className="card">
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                                <HardDrive size={24} style={{ color: 'var(--primary-color)', marginRight: '12px' }} />
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Storage Integration</h3>
                            </div>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Connect your Google Drive to secure your email data and logs.</p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--surface-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', boxShadow: 'var(--shadow-sm)' }}>
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo_%282020%29.svg" alt="Drive" style={{ width: '28px', height: '28px' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Google Drive</div>
                                        <div style={{ fontSize: '13px', color: driveConnected ? 'var(--success-color)' : 'var(--text-secondary)' }}>{driveConnected ? 'Connected & Synced' : 'Not connected'}</div>
                                    </div>
                                </div>
                                {driveConnected ? (
                                    <button disabled className="btn btn-outline" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', borderColor: 'var(--success-color)' }}><Check size={16} /> Active</button>
                                ) : (
                                    <button onClick={handleConnectDrive} className="btn btn-primary">Connect</button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Data Management Tab */}
                    {activeTab === 'data' && (
                        <div className="card">
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                                <Database size={24} style={{ color: 'var(--primary-color)', marginRight: '12px' }} />
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Data Management</h3>
                            </div>

                            <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '16px' }}>
                                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Export Data</h4>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Download a copy of all your campaigns, settings, and logs.</p>
                                <button onClick={handleExportData} className="btn btn-outline"><Download size={18} /> Export JSON</button>
                            </div>

                            <div style={{ padding: '16px', border: '1px solid var(--error-color)', borderRadius: '12px', backgroundColor: '#fef2f2' }}>
                                <h4 style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--error-color)' }}>Danger Zone</h4>
                                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Permanently delete all local campaign data and history.</p>
                                <button onClick={handleClearData} className="btn btn-danger"><Trash2 size={18} /> Clear All Data</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
