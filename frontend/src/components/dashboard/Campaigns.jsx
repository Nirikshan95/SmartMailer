import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from './DashboardContext';
import { Play, Pause, Plus, MoreVertical, Trash2, Edit, Check, AlertCircle, FileText, Users, Send, BarChart2, X, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Skeleton from '../common/Skeleton';

const Campaigns = () => {
    const {
        campaigns, createCampaign, deleteCampaign, updateCampaign,
        smtpConfig,
        prospectLists,
        setIsSending, isSending, setShouldStop, shouldStop, status, setStatus,
        subjects, subjectLists, savedTemplates, campaignsLoading
    } = useDashboard();

    const navigate = useNavigate();

    const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'monitor', 'details'
    const [wizardStep, setWizardStep] = useState(1);
    const [activeCampaign, setActiveCampaign] = useState(null);
    const [executionLog, setExecutionLog] = useState([]);
    const [editingId, setEditingId] = useState(null);

    // Draft Campaign State
    const [draft, setDraft] = useState({
        name: '',
        subject: '',
        targetListId: '',
        content: '',
        subjectConfig: {
            source: 'new', // 'template', 'list', or 'new'
            selectedSubjects: [], // array of subject strings
            sendingMode: 'random', // 'random' or 'sequential'
            currentIndex: 0 // for sequential mode
        },
        contentConfig: {
            source: 'new', // 'new', 'template', or 'create'
            selectedContent: '' // HTML content string
        }
    });

    const resetDraft = () => {
        setDraft({
            name: '',
            subject: '',
            targetListId: '',
            content: '',
            subjectConfig: {
                source: 'new',
                selectedSubjects: [],
                sendingMode: 'random',
                currentIndex: 0
            },
            contentConfig: {
                source: 'new',
                selectedContent: ''
            }
        });
        setEditingId(null);
        setWizardStep(1);
    };

    const handleCreate = async () => {
        if (!draft.name || !draft.targetListId) return;

        try {
            // Use contentConfig.selectedContent as the campaign content
            // Sync legacy subject field if using 'new' source
            let subject = draft.subject;
            if (draft.subjectConfig.source === 'new' && draft.subjectConfig.selectedSubjects.length > 0) {
                subject = draft.subjectConfig.selectedSubjects[0];
            }

            const campaignData = {
                ...draft,
                subject,
                content: draft.contentConfig.selectedContent,
                subjectConfig: draft.subjectConfig
            };

            let newCamp;
            if (editingId) {
                newCamp = await updateCampaign(editingId, campaignData);
                setExecutionLog(['Campaign updated.']);
            } else {
                newCamp = await createCampaign(campaignData);
                setExecutionLog(['Campaign created. Ready to launch.']);
            }

            // If we were editing, just go back to list view
            if (editingId) {
                setViewMode('list');
                setStatus('');
                resetDraft();
            } else {
                // New campaign goes to monitor
                setActiveCampaign(newCamp);
                setViewMode('monitor');
                setStatus('Ready to launch');
                resetDraft();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleEditCampaign = (campaign) => {
        // Ensure subjectConfig and contentConfig have required structures
        const subjectConfig = campaign.subjectConfig || {
            source: 'new',
            selectedSubjects: campaign.subject ? [campaign.subject] : [],
            sendingMode: 'random',
            currentIndex: 0
        };

        const contentConfig = campaign.contentConfig || {
            source: 'new',
            selectedContent: campaign.content || ''
        };

        setDraft({
            name: campaign.name || '',
            subject: campaign.subject || '',
            targetListId: campaign.targetListId ? String(campaign.targetListId) : '',
            content: campaign.content || '',
            subjectConfig: {
                ...subjectConfig,
                source: subjectConfig.source || 'new',
                selectedSubjects: Array.isArray(subjectConfig.selectedSubjects) ? subjectConfig.selectedSubjects : (campaign.subject ? [campaign.subject] : []),
                sendingMode: subjectConfig.sendingMode || 'random',
                currentIndex: subjectConfig.currentIndex || 0
            },
            contentConfig: {
                ...contentConfig,
                source: contentConfig.source || 'new',
                selectedContent: contentConfig.selectedContent || campaign.content || ''
            }
        });
        setEditingId(campaign.id);
        setViewMode('create');
        setWizardStep(1);
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

        // Validate subject configuration
        if (!activeCampaign.subjectConfig || !activeCampaign.subjectConfig.selectedSubjects || activeCampaign.subjectConfig.selectedSubjects.length === 0) {
            log('❌ No subjects configured for this campaign');
            return;
        }

        setIsSending(true);
        setShouldStop(false);
        log('🚀 Starting campaign execution...');
        log(`📋 Using ${activeCampaign.subjectConfig.selectedSubjects.length} subjects in ${activeCampaign.subjectConfig.sendingMode} mode`);

        const queue = [...targetList.emails];
        let sentCount = activeCampaign.stats?.sent || 0;
        let failedCount = activeCampaign.stats?.failed || 0;

        // Subject rotation state
        const subjects = activeCampaign.subjectConfig.selectedSubjects;
        const sendingMode = activeCampaign.subjectConfig.sendingMode;
        let currentIndex = activeCampaign.subjectConfig.currentIndex || 0;

        // Helper function to get next subject
        const getNextSubject = () => {
            if (sendingMode === 'random') {
                return subjects[Math.floor(Math.random() * subjects.length)];
            } else {
                // Sequential mode
                const subject = subjects[currentIndex % subjects.length];
                currentIndex++;
                return subject;
            }
        };

        // Simple loop for now. In real app, consider batching and backend queue.
        for (let i = 0; i < queue.length; i++) {
            const recipient = queue[i];
            const subject = getNextSubject();

            log(`📧 Sending to ${recipient.email} (${i + 1}/${queue.length}) with subject: "${subject}"...`);

            try {
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
                    stats: { sent: sentCount, failed: failedCount, total: queue.length },
                    subjectConfig: { ...activeCampaign.subjectConfig, currentIndex }
                });
                setActiveCampaign(prev => ({
                    ...prev,
                    stats: { sent: sentCount, failed: failedCount, total: queue.length },
                    subjectConfig: { ...prev.subjectConfig, currentIndex }
                }));
            }

            await new Promise(r => setTimeout(r, 1000)); // 1s delay
        }

        setIsSending(false);
        log('🏁 Campaign execution finished.');
        await updateCampaign(activeCampaign.id, {
            stats: { sent: sentCount, failed: failedCount, total: queue.length },
            status: 'completed',
            subjectConfig: { ...activeCampaign.subjectConfig, currentIndex }
        });
    };

    // Helper to normalize campaign data for display
    const getCampaignDetails = (campaign) => {
        if (!campaign) return null;

        let subjectConfig = campaign.subjectConfig;

        if (!subjectConfig) {
            subjectConfig = {
                source: 'new',
                selectedSubjects: campaign.subject ? [campaign.subject] : [],
                sendingMode: 'random'
            };
        } else if ((!subjectConfig.selectedSubjects || subjectConfig.selectedSubjects.length === 0) && campaign.subject) {
            subjectConfig = {
                ...subjectConfig,
                selectedSubjects: [campaign.subject]
            };
        }

        if (!subjectConfig.selectedSubjects) subjectConfig.selectedSubjects = [];

        const content = campaign.content || campaign.contentConfig?.selectedContent || 'No content configured';

        const sourceLabels = {
            'new': 'Single Subject',
            'template': 'Subject Templates',
            'list': 'Subject List'
        };

        const subjectCount = subjectConfig.selectedSubjects ? subjectConfig.selectedSubjects.length : 0;

        return {
            ...campaign,
            subjectConfig,
            content,
            details: {
                subjectSource: sourceLabels[subjectConfig.source] || 'Custom',
                subjectCount: subjectCount,
                isSequential: subjectConfig.sendingMode === 'sequential',
                formattedStatus: campaign.status === 'draft' ? 'DRAFT' : campaign.status === 'completed' ? 'COMPLETED' : campaign.status.toUpperCase()
            }
        };
    };

    const renderPerformanceSnapshot = (details) => {
        const targetListTotal = prospectLists.find(l => l.id === details.targetListId)?.emails.length || 0;
        const statsSent = details.stats?.sent || 0;
        const statsFailed = details.stats?.failed || 0;
        const statsTotal = details.stats?.total || 0;
        const effectiveTotal = statsTotal > 0 ? statsTotal : targetListTotal;
        const completion = effectiveTotal > 0
            ? Math.round(((statsSent + statsFailed) / effectiveTotal) * 100)
            : 0;

        return (
            <>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                    {completion}%
                </div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Completion</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    <div style={{ padding: '16px', backgroundColor: '#ecfdf5', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>Sent</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>{statsSent}</div>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>Failed</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>{statsFailed}</div>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>Total Target</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{effectiveTotal}</div>
                    </div>
                </div>
            </>
        );
    };

    const renderDetails = () => {
        const details = getCampaignDetails(activeCampaign);
        if (!details) return null;

        return (
            <div>
                <div className="page-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => setViewMode('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            <X size={24} />
                        </button>
                        <div>
                            <h1 className="page-title">{details.name}</h1>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Campaign Details</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => handleEditCampaign(details)}
                                disabled={details.status === 'completed'}
                            >
                                <Edit size={18} /> Edit
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => setViewMode('monitor')}
                            >
                                <Play size={18} /> Monitor / Start
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={(e) => handleDelete(details.id, e)}
                            >
                                <Trash2 size={18} /> Delete
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    <div className="card">
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Configuration</h3>

                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Status</div>
                                <div style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', background: details.status === 'draft' ? '#fef3c7' : '#d1fae5', color: details.status === 'draft' ? '#d97706' : '#059669', fontSize: '12px', fontWeight: 'bold' }}>
                                    {details.details.formattedStatus}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Target Audience</div>
                                <div style={{ fontWeight: '500' }}>
                                    {prospectLists.find(l => l.id === details.targetListId)?.name || 'Unknown List'}
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px', marginLeft: '8px' }}>
                                        ({prospectLists.find(l => l.id === details.targetListId)?.emails.length || 0} recipients)
                                    </span>
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Subject Configuration</div>
                                <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px' }}>
                                    <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <span style={{ fontSize: '12px', fontWeight: '600' }}>Source: </span>
                                            <span style={{ fontSize: '13px' }}>{details.details.subjectSource}</span>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '12px', fontWeight: '600' }}>Count: </span>
                                            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{details.details.subjectCount}</span>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '8px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: '600' }}>Sending Mode: </span>
                                        <span style={{ fontSize: '13px' }}>{details.details.isSequential ? 'Sequential Order' : 'Random Selection'}</span>
                                        {details.details.isSequential && details.subjectConfig.currentIndex > 0 && (
                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '8px' }}>(Next: #{details.subjectConfig.currentIndex + 1})</span>
                                        )}
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '12px', fontWeight: '600' }}>Subjects Preview:</span>
                                        <ul style={{ margin: '4px 0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {details.subjectConfig.selectedSubjects.slice(0, 3).map((s, i) => (
                                                <li key={i}>{s}</li>
                                            ))}
                                            {details.details.subjectCount > 3 && (
                                                <li>...and {details.details.subjectCount - 3} more</li>
                                            )}
                                            {details.details.subjectCount === 0 && (
                                                <li style={{ fontStyle: 'italic' }}>No subjects configured</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Email Content Preview</div>
                                <div
                                    style={{
                                        background: '#ffffff',
                                        padding: '16px',
                                        borderRadius: '6px',
                                        maxHeight: '400px',
                                        overflowY: 'auto',
                                        border: '1px solid var(--border-color)',
                                        fontFamily: 'inherit',
                                        color: '#333'
                                    }}
                                    dangerouslySetInnerHTML={{ __html: details.content }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Performance Snapshot</h3>
                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                            {renderPerformanceSnapshot(details)}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderWizardStep1 = () => (
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

            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>Subject Line Configuration</h3>
                <div className="input-group" style={{ marginBottom: '16px' }}>
                    <label className="label">Subject Source</label>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {['new', 'template', 'list'].map(source => (
                            <label key={source} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: draft.subjectConfig.source === source ? '#eef2ff' : 'white' }}>
                                <input
                                    type="radio"
                                    name="subjectSource"
                                    value={source}
                                    checked={draft.subjectConfig.source === source}
                                    onChange={e => setDraft({ ...draft, subjectConfig: { ...draft.subjectConfig, source: e.target.value, selectedSubjects: [] } })}
                                />
                                <span style={{ fontSize: '13px' }}>{source === 'new' ? 'Create New' : source === 'template' ? 'Templates' : 'Subject List'}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {draft.subjectConfig.source === 'new' && (
                    <div className="input-group">
                        <label className="label">Subject Line</label>
                        <input
                            className="input"
                            value={draft.subjectConfig.selectedSubjects[0] || ''}
                            onChange={e => setDraft({ ...draft, subjectConfig: { ...draft.subjectConfig, selectedSubjects: e.target.value ? [e.target.value] : [] } })}
                            placeholder="Enter your subject line..."
                        />
                    </div>
                )}

                {draft.subjectConfig.source === 'template' && (
                    <div className="input-group">
                        <label className="label">Select Subject Templates ({draft.subjectConfig.selectedSubjects.length} selected)</label>
                        {subjects.length > 0 ? (
                            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', background: 'white' }}>
                                {subjects.map((subject, idx) => (
                                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <input
                                            type="checkbox"
                                            checked={draft.subjectConfig.selectedSubjects.includes(subject)}
                                            onChange={e => {
                                                const newSelected = e.target.checked
                                                    ? [...draft.subjectConfig.selectedSubjects, subject]
                                                    : draft.subjectConfig.selectedSubjects.filter(s => s !== subject);
                                                setDraft({ ...draft, subjectConfig: { ...draft.subjectConfig, selectedSubjects: newSelected } });
                                            }}
                                        />
                                        <span style={{ fontSize: '13px', flex: 1 }}>{subject}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'white' }}>
                                No subject templates available.
                            </div>
                        )}
                    </div>
                )}

                {draft.subjectConfig.source === 'list' && (
                    <div className="input-group">
                        <label className="label">Select Subject List</label>
                        {subjectLists.length > 0 ? (
                            <select
                                className="select"
                                value={subjectLists.find(list =>
                                    list.subjects.length === draft.subjectConfig.selectedSubjects.length &&
                                    list.subjects.every((s, i) => s === draft.subjectConfig.selectedSubjects[i])
                                )?.name || ''}
                                onChange={e => {
                                    const selectedList = subjectLists.find(list => list.name === e.target.value);
                                    setDraft({
                                        ...draft,
                                        subjectConfig: {
                                            ...draft.subjectConfig,
                                            selectedSubjects: selectedList ? selectedList.subjects : []
                                        }
                                    });
                                }}
                            >
                                <option value="">Choose a subject list...</option>
                                {subjectLists.map((list, idx) => (
                                    <option key={idx} value={list.name}>{list.name} ({list.subjects.length} subjects)</option>
                                ))}
                            </select>
                        ) : (
                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'white' }}>
                                No subject lists available.
                            </div>
                        )}
                    </div>
                )}

                {draft.subjectConfig.selectedSubjects.length > 1 && (
                    <div className="input-group" style={{ marginTop: '16px' }}>
                        <label className="label">Subject Sending Mode</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {['random', 'sequential'].map(mode => (
                                <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: draft.subjectConfig.sendingMode === mode ? '#eef2ff' : 'white', flex: 1 }}>
                                    <input
                                        type="radio"
                                        name="sendingMode"
                                        value={mode}
                                        checked={draft.subjectConfig.sendingMode === mode}
                                        onChange={e => setDraft({ ...draft, subjectConfig: { ...draft.subjectConfig, sendingMode: e.target.value } })}
                                    />
                                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderWizardStep2 = () => (
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
                Selected list contains <strong>{prospectLists.find(l => String(l.id) === String(draft.targetListId))?.emails.length || 0}</strong> emails.
            </div>
        </div>
    );

    const renderWizardStep3 = () => (
        <div className="grid-1" style={{ gap: '16px' }}>
            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>Email Content Configuration</h3>
                <div className="input-group" style={{ marginBottom: '16px' }}>
                    <label className="label">Content Source</label>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {['new', 'template', 'create'].map(source => (
                            <label key={source} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: draft.contentConfig.source === source ? '#eef2ff' : 'white' }}>
                                <input
                                    type="radio"
                                    name="contentSource"
                                    value={source}
                                    checked={draft.contentConfig.source === source}
                                    onChange={e => setDraft({ ...draft, contentConfig: { ...draft.contentConfig, source: e.target.value, selectedContent: '' } })}
                                />
                                <span style={{ fontSize: '13px' }}>{source === 'new' ? 'Write Content' : source === 'template' ? 'Templates' : 'Create New'}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {draft.contentConfig.source === 'new' && (
                    <div className="input-group">
                        <label className="label">Email Content (HTML)</label>
                        <textarea
                            className="textarea"
                            style={{ height: '200px', fontFamily: 'monospace', fontSize: '13px' }}
                            value={draft.contentConfig.selectedContent}
                            onChange={e => setDraft({ ...draft, contentConfig: { ...draft.contentConfig, selectedContent: e.target.value } })}
                            placeholder="Enter your HTML content here..."
                        />
                    </div>
                )}

                {draft.contentConfig.source === 'template' && (
                    <div className="input-group">
                        <label className="label">Select Email Template</label>
                        {savedTemplates.length > 0 ? (
                            <select
                                className="select"
                                value={savedTemplates.find(t => String(t.content).trim() === String(draft.contentConfig.selectedContent).trim())?.name || ''}
                                onChange={e => {
                                    const selectedTemplate = savedTemplates.find(t => t.name === e.target.value);
                                    setDraft({
                                        ...draft,
                                        contentConfig: {
                                            ...draft.contentConfig,
                                            selectedContent: selectedTemplate ? selectedTemplate.content : ''
                                        }
                                    });
                                }}
                            >
                                <option value="">Choose a template...</option>
                                {savedTemplates.map((template, idx) => (
                                    <option key={idx} value={template.name}>{template.name}</option>
                                ))}
                            </select>
                        ) : (
                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'white' }}>
                                No email templates available.
                            </div>
                        )}
                    </div>
                )}

                {draft.contentConfig.source === 'create' && (
                    <div style={{ padding: '20px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'white' }}>
                        <FileText size={48} style={{ color: 'var(--primary-color)', margin: '0 auto 16px' }} />
                        <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Create a New Email Template</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Redirect to Templates section.</p>
                        <button className="btn btn-primary" onClick={() => { navigate('/dashboard/templates'); setViewMode('list'); }}>Go to Templates</button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderWizardStep4 = () => (
        <div style={{ padding: '24px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Configuration Summary</h3>
            <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Campaign Name:</span>
                    <strong>{draft.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Subjects:</span>
                    <strong>{draft.subjectConfig.selectedSubjects.length} selected ({draft.subjectConfig.source})</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Target Audience:</span>
                    <strong>{prospectLists.find(l => String(l.id) === String(draft.targetListId))?.name || 'Unknown'} ({prospectLists.find(l => String(l.id) === String(draft.targetListId))?.emails.length || 0} prospects)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>SMTP Account:</span>
                    <strong style={{ color: smtpConfig.email ? 'inherit' : 'var(--error-color)' }}>{smtpConfig.email || 'Not configured'}</strong>
                </div>
            </div>

            {!smtpConfig.email && (
                <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '6px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <AlertCircle style={{ color: '#ea580c', flexShrink: 0 }} size={20} />
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#9a3412' }}>SMTP Not Configured</div>
                        <p style={{ fontSize: '13px', color: '#9a3412', marginTop: '4px' }}>You need to configure your SMTP settings in the Dashboard before you can send a campaign.</p>
                        <button className="btn btn-outline" style={{ marginTop: '12px', fontSize: '12px', padding: '6px 12px' }} onClick={() => navigate('/dashboard/settings')}>Go to Settings</button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderWizard = () => (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{editingId ? 'Edit Campaign' : 'Create New Campaign'}</h2>
                <button onClick={() => { resetDraft(); setViewMode('list'); }} className="btn btn-outline" style={{ border: 'none' }}><X size={20} /></button>
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
                {wizardStep === 1 && renderWizardStep1()}
                {wizardStep === 2 && renderWizardStep2()}
                {wizardStep === 3 && renderWizardStep3()}
                {wizardStep === 4 && renderWizardStep4()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                {wizardStep > 1 ? (
                    <button onClick={() => setWizardStep(s => s - 1)} className="btn btn-outline">Back</button>
                ) : (
                    <div></div>
                )}

                {wizardStep < 4 ? (
                    draft.contentConfig.source !== 'create' && (
                        <button
                            onClick={() => setWizardStep(s => s + 1)}
                            className="btn btn-primary"
                            disabled={
                                (wizardStep === 1 && (!draft.name || draft.subjectConfig.selectedSubjects.length === 0)) ||
                                (wizardStep === 2 && !draft.targetListId) ||
                                (wizardStep === 3 && !draft.contentConfig.selectedContent)
                            }
                        >
                            Next
                        </button>
                    )
                ) : (
                    <button onClick={handleCreate} className="btn btn-primary" disabled={!smtpConfig.email}>
                        {editingId ? 'Update Campaign' : 'Create Campaign'}
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
                                    <div
                                        key={campaign.id}
                                        className="card"
                                        style={{ display: 'flex', alignItems: 'center', padding: '20px', marginBottom: 0, cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                                        onClick={() => { setActiveCampaign(campaign); setViewMode('details'); }}
                                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}
                                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'}
                                    >
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
                                                onClick={(e) => { e.stopPropagation(); handleEditCampaign(campaign); }}
                                                disabled={campaign.status === 'completed'}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: '8px' }}
                                                onClick={(e) => { e.stopPropagation(); setActiveCampaign(campaign); setViewMode('monitor'); }}
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
                        <h1>Monitoring: {activeCampaign.name}</h1>
                        <button className="btn btn-outline" onClick={() => setViewMode('list')}><X size={20} /></button>
                    </div>
                    <div className="card">
                        <div style={{ height: '300px', backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', color: '#bef264', fontFamily: 'monospace', overflowY: 'auto' }}>
                            {executionLog.map((l, i) => <div key={i}>{l}</div>)}
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            {!isSending ? <button onClick={startExecution} className="btn btn-primary">Start</button> : <button onClick={() => setShouldStop(true)} className="btn btn-danger">Stop</button>}
                        </div>
                    </div>
                </div>
            )}
            {viewMode === 'details' && activeCampaign && renderDetails()}
        </div>
    );
};

export default Campaigns;
