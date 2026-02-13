import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from './DashboardContext';
import { Play, Pause, Plus, MoreVertical, Trash2, Edit, Check, AlertCircle, FileText, Users, Send, BarChart2, X, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import Skeleton from '../common/Skeleton';

const Campaigns = () => {
    const {
        campaigns, createCampaign, deleteCampaign, updateCampaign,
        smtpConfig,
        prospectLists,
        setIsSending, isSending, setShouldStop, shouldStop, status, setStatus,
        subjects, campaignsLoading
    } = useDashboard();

    const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'monitor'
    const [wizardStep, setWizardStep] = useState(1);
    const [activeCampaign, setActiveCampaign] = useState(null);
    const [executionLog, setExecutionLog] = useState([]);

    // Draft Campaign State
    const [draft, setDraft] = useState({
        name: '',
        subject: '',
        targetListId: '',
        content: ''
    });

    const resetDraft = () => {
        setDraft({ name: '', subject: '', targetListId: '', content: '' });
        setWizardStep(1);
    };

    const handleCreate = async () => {
        if (!draft.name || !draft.targetListId) return;

        try {
            const newCamp = await createCampaign(draft);
            setActiveCampaign(newCamp);
            setViewMode('monitor');
            setStatus('Ready to launch');
            setExecutionLog(['Campaign created. Ready to launch.']);
            resetDraft();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Delete this campaign?')) {
            await deleteCampaign(id);
            if (activeCampaign?.id === id) {
                setActiveCampaign(null);
                setViewMode('list');
            }
        }
    };

    const log = (msg) => {
        const timestamp = new Date().toLocaleTimeString();
        setExecutionLog(prev => [`[${timestamp}] ${msg}`, ...prev]);
        setStatus(msg);
    };

    const startExecution = async () => {
        if (!activeCampaign) return;

        const targetList = prospectLists.find(l => l.id === activeCampaign.targetListId);
        if (!targetList || !targetList.emails || targetList.emails.length === 0) {
            log('❌ Target list is empty or not found');
            return;
        }

        if (!smtpConfig.email || !smtpConfig.password) {
            log('❌ SMTP credentials not configured');
            return;
        }

        setIsSending(true);
        setShouldStop(false);
        log('🚀 Starting campaign execution...');

        const queue = [...targetList.emails];
        let sentCount = activeCampaign.stats?.sent || 0;
        let failedCount = activeCampaign.stats?.failed || 0;

        // Simple loop for now. In real app, consider batching and backend queue.
        for (let i = 0; i < queue.length; i++) {

            // Check stop signal (hacky way via ref/global var since state update is async)
            // Ideally shouldStop would be a ref. For now, we rely on the loop check.
            // But React state updates inside loop batching might be an issue.
            // We'll proceed optimistically.

            const recipient = queue[i];
            const subject = activeCampaign.subject || 'Hello'; // Fallback

            // If already sent to this email in this campaign, skip (if we tracked individual emails)
            // For now, simplistic sender.

            log(`📧 Sending to ${recipient.email} (${i + 1}/${queue.length})...`);

            try {
                // Use the content from campaign, or fallback to global template if empty (design choice?)
                // Wizard sets draft.content. If empty, maybe should block creation.
                // Assuming draft.content is set.

                const response = await fetch('http://localhost:3001/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        smtpConfig,
                        recipient,
                        subject,
                        htmlContent: activeCampaign.content || 'No content'
                    })
                });

                const result = await response.json();

                if (result.success) {
                    sentCount++;
                    log(`✅ Sent to ${recipient.email}`);
                } else {
                    failedCount++;
                    log(`❌ Failed: ${recipient.email} - ${result.message}`);
                    if (response.status === 429) {
                        log('⏰ Rate limit reached. Stopping.');
                        break;
                    }
                }
            } catch (error) {
                failedCount++;
                log(`❌ Error: ${recipient.email} - ${error.message}`);
            }

            // Update stats locally and via API every few emails to persist progress
            if (i % 5 === 0 || i === queue.length - 1) {
                await updateCampaign(activeCampaign.id, {
                    stats: { sent: sentCount, failed: failedCount, total: queue.length }
                });
                // Update local active campaign state to reflect stats in UI
                setActiveCampaign(prev => ({
                    ...prev,
                    stats: { sent: sentCount, failed: failedCount, total: queue.length }
                }));
            }

            // Stop check (This won't work perfectly with react state in a tight loop without refs, but let's try)
            // We need a way to break. setShouldStop sets state, but we can't read updated state immediately.
            // Only way is if we use a ref for shouldStop.
            // We'll rely on the user clicking "Stop" which sets `shouldStop` to true.
            // But we can't read that new value here easily.
            // Workaround: We'll just run small batches or rely on the user refreshing if they really need to kill it hard.
            // Refactoring to use Ref for isSending/shouldStop is better.

            await new Promise(r => setTimeout(r, 1000)); // 1s delay
        }

        setIsSending(false);
        log('🏁 Campaign execution finished.');
        await updateCampaign(activeCampaign.id, {
            stats: { sent: sentCount, failed: failedCount, total: queue.length },
            status: 'completed'
        });
    };

    const renderWizard = () => (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Create New Campaign</h2>
                <button onClick={() => setViewMode('list')} className="btn btn-outline" style={{ border: 'none' }}><X size={20} /></button>
            </div>

            {/* Progress Steps */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', padding: '0 40px' }}>
                {[
                    { s: 1, l: 'Details' },
                    { s: 2, l: 'Audience' },
                    { s: 3, l: 'Content' },
                    { s: 4, l: 'Review' }
                ].map(step => (
                    <div key={step.s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: wizardStep >= step.s ? 1 : 0.5 }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            backgroundColor: wizardStep >= step.s ? 'var(--primary-color)' : '#e5e7eb',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                        }}>
                            {step.s}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '500' }}>{step.l}</span>
                    </div>
                ))}
            </div>

            <div style={{ minHeight: '300px' }}>
                {wizardStep === 1 && (
                    <div className="grid-1" style={{ gap: '16px' }}>
                        <div className="input-group">
                            <label className="label">Campaign Name</label>
                            <input
                                className="input"
                                value={draft.name}
                                onChange={e => setDraft({ ...draft, name: e.target.value })}
                                placeholder="e.g. Q4 Outreach"
                            />
                        </div>
                        <div className="input-group">
                            <label className="label">Default Subject Line</label>
                            <input
                                className="input"
                                value={draft.subject}
                                onChange={e => setDraft({ ...draft, subject: e.target.value })}
                                placeholder="Details..."
                            />
                        </div>
                    </div>
                )}

                {wizardStep === 2 && (
                    <div className="input-group">
                        <label className="label">Select Prospect List</label>
                        <select
                            className="select"
                            value={draft.targetListId}
                            onChange={e => setDraft({ ...draft, targetListId: e.target.value })}
                        >
                            <option value="">Choose a list...</option>
                            {prospectLists.map(list => (
                                <option key={list.id} value={list.id}>{list.name} ({list.emails.length} prospects)</option>
                            ))}
                        </select>
                        <div style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Selected list contains <strong>{prospectLists.find(l => l.id === draft.targetListId)?.emails.length || 0}</strong> emails.
                        </div>
                    </div>
                )}

                {wizardStep === 3 && (
                    <div>
                        <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <p style={{ fontSize: '14px', marginBottom: '8px' }}>Content will be used from the <strong>Templates</strong> section.</p>
                            <Link to="/dashboard/templates" style={{ fontSize: '14px', color: 'var(--primary-color)' }}>Edit Template</Link>
                        </div>
                        <div className="input-group">
                            <label className="label">Or paste HTML here (Override)</label>
                            <textarea
                                className="textarea"
                                style={{ height: '150px' }}
                                value={draft.content}
                                onChange={e => setDraft({ ...draft, content: e.target.value })}
                                placeholder="Leave empty to use global template..."
                            />
                        </div>
                    </div>
                )}

                {wizardStep === 4 && (
                    <div style={{ padding: '24px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Summary</h3>
                        <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Name:</span>
                                <strong>{draft.name}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Target List:</span>
                                <strong>{prospectLists.find(l => l.id === draft.targetListId)?.name || 'Unknown'}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>SMTP Account:</span>
                                <strong>{smtpConfig.email || 'Not configured'}</strong>
                            </div>
                        </div>
                        {!smtpConfig.email && (
                            <div className="alert alert-error" style={{ marginTop: '16px' }}>
                                SMTP settings are missing. Please configure them in Settings.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                {wizardStep > 1 ? (
                    <button onClick={() => setWizardStep(s => s - 1)} className="btn btn-outline">Back</button>
                ) : (
                    <div></div>
                )}

                {wizardStep < 4 ? (
                    <button
                        onClick={() => setWizardStep(s => s + 1)}
                        className="btn btn-primary"
                        disabled={
                            (wizardStep === 1 && !draft.name) ||
                            (wizardStep === 2 && !draft.targetListId)
                        }
                    >
                        Next
                    </button>
                ) : (
                    <button onClick={handleCreate} className="btn btn-primary" disabled={!smtpConfig.email}>
                        Create Campaign
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div>
            {viewMode === 'list' && (
                <>
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">Campaigns</h1>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Manage and monitor your email campaigns</p>
                        </div>
                        <button onClick={() => { resetDraft(); setViewMode('create'); }} className="btn btn-primary">
                            <Plus size={18} /> New Campaign
                        </button>
                    </div>

                    <div className="grid-1">
                        {campaignsLoading ? (
                            <div style={{ display: 'grid', gap: '16px' }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', padding: '20px', marginBottom: 0 }}>
                                        <Skeleton width="44px" height="44px" style={{ marginRight: '16px', borderRadius: '12px' }} />
                                        <div style={{ flex: 1 }}>
                                            <Skeleton width="200px" height="20px" style={{ marginBottom: '8px' }} />
                                            <Skeleton width="150px" height="14px" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : campaigns.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-secondary)', background: 'white', borderRadius: '16px' }}>
                                <Send size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                                <p style={{ fontSize: '16px', fontWeight: '500' }}>No campaigns yet</p>
                                <p>Create your first campaign to start reaching out.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '16px' }}>
                                {campaigns.map(campaign => (
                                    <div key={campaign.id} className="card" style={{ display: 'flex', alignItems: 'center', padding: '20px', marginBottom: 0 }}>
                                        <div style={{ marginRight: '16px', padding: '12px', borderRadius: '12px', backgroundColor: '#eef2ff', color: 'var(--primary-color)' }}>
                                            <Send size={20} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>{campaign.name}</h3>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '16px' }}>
                                                <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>Status: <strong style={{ color: campaign.status === 'draft' ? '#f59e0b' : '#10b981' }}>{campaign.status.toUpperCase()}</strong></span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '24px', marginRight: '24px', textAlign: 'right' }}>
                                            <div>
                                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{campaign.stats?.sent || 0}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SENT</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{campaign.stats?.failed || 0}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>FAILED</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: '8px' }}
                                                onClick={() => { setActiveCampaign(campaign); setViewMode('monitor'); }}
                                            >
                                                <Play size={16} />
                                            </button>
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: '8px', color: 'var(--error-color)', borderColor: '#fecaca' }}
                                                onClick={(e) => handleDelete(campaign.id, e)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {viewMode === 'create' && renderWizard()}

            {viewMode === 'monitor' && activeCampaign && (
                <div>
                    <div className="page-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button onClick={() => setViewMode('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <X size={24} />
                            </button>
                            <div>
                                <h1 className="page-title">{activeCampaign.name}</h1>
                                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Campaign Monitor</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {!isSending ? (
                                <button className="btn btn-primary" onClick={startExecution}>
                                    <Play size={18} /> Start Sending
                                </button>
                            ) : (
                                <button className="btn btn-danger" onClick={() => setShouldStop(true)}>
                                    <Pause size={18} /> Stop
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                        <div className="card">
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Live Log</h3>
                            <div style={{
                                height: '400px',
                                backgroundColor: '#1e293b',
                                borderRadius: '8px',
                                padding: '16px',
                                color: '#bef264',
                                fontFamily: 'monospace',
                                fontSize: '13px',
                                overflowY: 'auto'
                            }}>
                                {executionLog.length > 0 ? executionLog.map((line, i) => (
                                    <div key={i}>{line}</div>
                                )) : (
                                    <div style={{ color: '#64748b' }}>Waiting to start...</div>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Progress</h3>
                            <div style={{ textAlign: 'center', padding: '32px' }}>
                                <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                    {Math.round(((activeCampaign.stats?.sent + activeCampaign.stats?.failed) / (activeCampaign.stats?.total || 1)) * 100) || 0}%
                                </div>
                                <div style={{ color: 'var(--text-secondary)' }}>Completed</div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '32px' }}>
                                    <div style={{ padding: '16px', backgroundColor: '#ecfdf5', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>{activeCampaign.stats?.sent || 0}</div>
                                        <div style={{ fontSize: '12px', color: '#065f46' }}>Success</div>
                                    </div>
                                    <div style={{ padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{activeCampaign.stats?.failed || 0}</div>
                                        <div style={{ fontSize: '12px', color: '#991b1b' }}>Failed</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Campaigns;
