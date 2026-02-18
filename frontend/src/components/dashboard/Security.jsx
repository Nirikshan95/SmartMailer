import React, { useState, useEffect } from 'react';
import { Lock, Shield, Key, FileText, Database } from 'lucide-react';

const Security = () => {
    const [securityConfig, setSecurityConfig] = useState({});
    const [complianceInfo, setComplianceInfo] = useState({});

    useEffect(() => {
        loadSecurityConfig();
        loadComplianceInfo();
    }, []);

    const loadSecurityConfig = async () => {
        try {
            const response = await fetch('/api/security/config');
            const data = await response.json();
            setSecurityConfig(data.config);
        } catch (error) {
            console.error('Error loading config:', error);
        }
    };

    const loadComplianceInfo = async () => {
        try {
            const response = await fetch('/api/security/compliance');
            const data = await response.json();
            setComplianceInfo(data);
        } catch (error) {
            console.error('Error loading compliance:', error);
        }
    };

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <h1>Privacy and Security</h1>
                <p>Local data storage, minimal permissions, and encryption</p>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Data Storage</h2>
                </div>
                <div className="card-body">
                    <div className="security-item">
                        <Database className="security-icon" />
                        <div>
                            <strong>Local Data Only:</strong>
                            <span className={`status-badge ${complianceInfo.localDataOnly ? 'success' : 'warning'}`}>
                                {complianceInfo.localDataOnly ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>
                    <div className="security-item">
                        <Lock className="security-icon" />
                        <div>
                            <strong>Encryption Enabled:</strong>
                            <span className={`status-badge ${complianceInfo.encryptionEnabled ? 'success' : 'warning'}`}>
                                {complianceInfo.encryptionEnabled ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>
                    {complianceInfo.encryptionAlgorithm && (
                        <div className="security-item">
                            <Key className="security-icon" />
                            <div>
                                <strong>Algorithm:</strong>
                                <span className="security-value">{complianceInfo.encryptionAlgorithm}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Permissions</h2>
                </div>
                <div className="card-body">
                    {complianceInfo.minimalPermissions && complianceInfo.minimalPermissions.map((perm, index) => (
                        <div key={index} className="permission-item">
                            <Shield className="permission-icon" />
                            <strong>{perm.key}:</strong> {perm.description}
                        </div>
                    ))}
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Compliance</h2>
                </div>
                <div className="card-body">
                    {complianceInfo.complianceStandards && (
                        <div className="compliance-badges">
                            {complianceInfo.complianceStandards.map((standard, index) => (
                                <span key={index} className="badge badge-success">{standard}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>Features</h2>
                </div>
                <div className="card-body">
                    <ul className="feature-list">
                        <li>✓ Local data storage (no remote servers)</li>
                        <li>✓ Minimal permissions required</li>
                        <li>✓ Transparent data handling policies</li>
                        <li>✓ Encryption for stored data</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Security;
