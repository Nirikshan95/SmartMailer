import React, { useState, useEffect } from 'react';
import { Save, Check, AlertCircle, HardDrive, Key } from 'lucide-react';

const Settings = () => {
    const [licenseKey, setLicenseKey] = useState('');
    const [licenseStatus, setLicenseStatus] = useState(null);
    const [driveConnected, setDriveConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        checkDriveStatus();
        fetchLicenseStatus();

        // Check for success param from redirect
        const params = new URLSearchParams(window.location.search);
        if (params.get('drive') === 'connected') {
            setMessage({ type: 'success', text: 'Google Drive connected successfully!' });
            // Clean URL
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
        setMessage(null);
        try {
            const res = await fetch('http://localhost:3001/settings/license', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: licenseKey })
            });
            const data = await res.json();
            if (data.success) {
                setLicenseStatus(data.license);
                setMessage({ type: 'success', text: 'License key activated successfully!' });
                setLicenseKey('');
            } else {
                setMessage({ type: 'error', text: data.message || 'Invalid license key' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to validate license key' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-content">
            <div className="content-header">
                <h1 className="content-title">Settings</h1>
                <p className="content-subtitle">Manage your subscription and integrations</p>
            </div>

            {message && (
                <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1.5rem',
                    backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7',
                    color: message.type === 'error' ? '#991b1b' : '#166534',
                    border: `1px solid ${message.type === 'error' ? '#f87171' : '#86efac'}`
                }}>
                    {message.text}
                </div>
            )}

            <div className="settings-grid" style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

                {/* License Section */}
                <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div className="card-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <Key size={24} style={{ color: '#4f46e5', marginRight: '0.75rem' }} />
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>License & Plan</h3>
                    </div>

                    <div className="current-plan" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Current Plan</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>
                            {licenseStatus?.plan || 'Loading...'}
                        </div>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#4b5563' }}>
                            <div>Daily Limit: <strong>{licenseStatus?.limits?.maxPerDay || 0}</strong> emails</div>
                            <div>Hourly Limit: <strong>{licenseStatus?.limits?.maxPerHour || 0}</strong> emails</div>
                        </div>
                    </div>

                    <div className="license-input">
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                            Update License Key
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={licenseKey}
                                onChange={(e) => setLicenseKey(e.target.value)}
                                placeholder="Paste your license key here"
                                style={{
                                    flex: 1,
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid #d1d5db',
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={handleSaveLicense}
                                disabled={loading || !licenseKey}
                                style={{
                                    backgroundColor: '#4f46e5',
                                    color: 'white',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    cursor: loading || !licenseKey ? 'not-allowed' : 'pointer',
                                    opacity: loading || !licenseKey ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {loading ? 'Saving...' : <Save size={18} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Integrations Section */}
                <div className="card" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div className="card-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <HardDrive size={24} style={{ color: '#4f46e5', marginRight: '0.75rem' }} />
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Storage Integration</h3>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem' }}>
                        Connect your Google Drive to store large email lists and secure usage logs. This is required for full functionality.
                    </p>

                    <div className="integration-status" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#f3f4f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '1rem'
                            }}>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/d/da/Google_Drive_logo_%282020%29.svg" alt="Drive" style={{ width: '24px', height: '24px' }} />
                            </div>
                            <div>
                                <div style={{ fontWeight: '500', color: '#111827' }}>Google Drive</div>
                                <div style={{ fontSize: '0.875rem', color: driveConnected ? '#166534' : '#9ca3af' }}>
                                    {driveConnected ? 'Connected' : 'Not connected'}
                                </div>
                            </div>
                        </div>

                        {driveConnected ? (
                            <button disabled style={{
                                background: '#dcfce7',
                                color: '#166534',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                            }}>
                                <Check size={16} style={{ marginRight: '0.25rem' }} />
                                Active
                            </button>
                        ) : (
                            <button
                                onClick={handleConnectDrive}
                                style={{
                                    background: '#4f46e5',
                                    color: 'white',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}
                            >
                                Connect
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Settings;
