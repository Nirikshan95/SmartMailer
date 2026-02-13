import React, { useRef } from 'react';
import { useDashboard } from './DashboardContext';
import { FileText, Upload, Save } from 'lucide-react';

const Templates = () => {
    const { emailContent, setEmailContent, setStatus } = useDashboard();
    const templateFileRef = useRef(null);

    const handleEmailTemplate = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setEmailContent(event.target.result);
                setStatus('✅ Email template loaded');
            };
            reader.readAsText(file);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Templates</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => templateFileRef.current?.click()}
                        className="btn btn-outline"
                    >
                        <Upload size={18} /> Load HTML
                    </button>
                    <input type="file" ref={templateFileRef} accept=".html" onChange={handleEmailTemplate} style={{ display: 'none' }} />
                </div>
            </div>

            <div className="card" style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Email Editor</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Supports HTML</span>
                </div>

                <textarea
                    className="textarea"
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="<html><body>Hello {Name}, ...</body></html>"
                    style={{
                        flex: 1,
                        fontFamily: 'monospace',
                        resize: 'none',
                        marginBottom: '16px'
                    }}
                />

                <div style={{ padding: '16px', backgroundColor: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Available Variables:</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['{Name}', '{Company}', '{Email}'].map(variable => (
                            <code key={variable} style={{ padding: '4px 8px', backgroundColor: 'white', color: 'var(--primary-color)', borderRadius: '4px', fontSize: '12px', border: '1px solid var(--border-color)' }}>
                                {variable}
                            </code>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Templates;
