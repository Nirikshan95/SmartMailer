import React, { useRef, useState, useEffect } from 'react';
import { useDashboard } from './DashboardContext';
import { FileText, Upload, Save, Eye, Code, Plus, Trash2, RefreshCw, Copy, Check } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { EditorView, Decoration, MatchDecorator, ViewPlugin } from "@codemirror/view";

// Custom Extension for Variable Highlighting
const variableDecorator = new MatchDecorator({
    regexp: /{{[\w-]+}}/g,
    decoration: m => Decoration.mark({
        attributes: { style: "color: var(--primary-color); font-weight: 700; background: rgba(5, 150, 105, 0.1); padding: 0 2px; border-radius: 4px; border: 1px solid rgba(5, 150, 105, 0.2);" }
    })
});

const variableHighlightExtension = ViewPlugin.fromClass(class {
    constructor(view) { this.decorations = variableDecorator.createDeco(view) }
    update(update) { this.decorations = variableDecorator.updateDeco(update, this.decorations) }
}, {
    decorations: v => v.decorations
});

const themeExtension = EditorView.theme({
    "&": { height: "100%" },
    ".cm-scroller": { fontFamily: "inherit" },
    ".cm-content": { fontSize: '14px', padding: '16px 0' },
    ".cm-gutters": { backgroundColor: "#f8fafc", borderRight: "1px solid var(--border-color)", color: "#94a3b8" },
    ".cm-activeLineGutter": { backgroundColor: "#f1f5f9" }
});

const SAMPLE_TEXT = `Hello {{name}},

I hope {{company}} is having a great week!

Best regards,
[Your Name]`;

const SAMPLE_HTML = `<div style="font-family: sans-serif; line-height: 1.5;">
  <h3 style="color: #059669;">Hello {{name}},</h3>
  <p>I hope <b>{{company}}</b> is having a great week!</p>
  <p>Best regards,<br/>[Your Name]</p>
</div>`;

const Templates = () => {
    const { emailContent, setEmailContent, subjects, setSubjects, setStatus, savedTemplates, saveTemplate, deleteTemplate, showToast } = useDashboard();
    const templateFileRef = useRef(null);
    const subjectFileRef = useRef(null);
    const textFileRef = useRef(null);

    // UI State
    const [viewMode, setViewMode] = useState('split'); // 'edit', 'preview', 'split'
    const [newSubject, setNewSubject] = useState('');
    const [previewContact, setPreviewContact] = useState({
        name: 'John Doe',
        company: 'Acme Corp',
        email: 'john@acme.com'
    });
    const [splitWidth, setSplitWidth] = useState(50); // percentage for editor width
    const [isDragging, setIsDragging] = useState(false);
    const [editorMode, setEditorMode] = useState('html'); // 'html' or 'text'
    const [showLoadDropdown, setShowLoadDropdown] = useState(false);
    const resizerRef = useRef(null);
    const textareaRef = useRef(null);

    // Handle resizing
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const container = document.getElementById('templates-split-container');
            if (!container) return;

            const containerRect = container.getBoundingClientRect();
            const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

            // Constrain between 20% and 80%
            if (newWidth >= 20 && newWidth <= 80) {
                setSplitWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    // Handle Template File Upload
    const handleEmailTemplate = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setEmailContent(event.target.result);
                setEditorMode('html');
                setStatus('✅ Email template loaded');
            };
            reader.readAsText(file);
        }
    };

    // Handle Text File Upload
    const handleTextFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setEmailContent(event.target.result);
                setEditorMode('text');
                setStatus('✅ Text file loaded');
            };
            reader.readAsText(file);
        }
    };

    // Handle Subject File Upload
    const handleSubjectFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target.result;
                const lines = content.split('\n').filter(line => line.trim() !== '');
                setSubjects(prev => [...new Set([...prev, ...lines])]); // Merge and unique
                setStatus(`✅ Loaded ${lines.length} subjects`);
            };
            reader.readAsText(file);
        }
    };

    const addSubject = () => {
        if (newSubject.trim()) {
            setSubjects(prev => [...prev, newSubject.trim()]);
            setNewSubject('');
        }
    };

    const removeSubject = (index) => {
        setSubjects(prev => prev.filter((_, i) => i !== index));
    };

    const insertVariable = (variable) => {
        // Since both are now CodeMirror, we can handle it uniformly
        // if we had the refs to the view, but for now state-based is fine.
        // However, we want to improve this to append at end if no focus
        setEmailContent(prev => prev + variable);
    };

    // Convert content between HTML and Text modes
    const convertContentForMode = (content, fromMode, toMode) => {
        if (fromMode === toMode) return content;

        if (toMode === 'text') {
            // Convert HTML to plain text
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            return tempDiv.textContent || tempDiv.innerText || '';
        } else {
            // Convert text to HTML (wrap in basic HTML structure)
            const lines = content.split('\n');
            const htmlLines = lines.map(line => {
                const trimmed = line.trim();
                return trimmed ? `<p>${trimmed}</p>` : '<br/>';
            });
            return htmlLines.join('\n');
        }
    };

    // Handle editor mode change with content conversion
    const handleEditorModeChange = (newMode) => {
        const convertedContent = convertContentForMode(emailContent, editorMode, newMode);
        setEditorMode(newMode);
        setEmailContent(convertedContent);
    };

    // Render Preview
    const renderPreview = () => {
        if (!emailContent) return '<div style="color: #9ca3af; text-align: center; padding: 40px;">No content to preview</div>';

        let preview = emailContent;
        // Basic variable replacement
        preview = preview.replace(/{{name}}/gi, previewContact.name);
        preview = preview.replace(/{name}/gi, previewContact.name);
        preview = preview.replace(/{{company}}/gi, previewContact.company);
        preview = preview.replace(/{company}/gi, previewContact.company);
        preview = preview.replace(/{{email}}/gi, previewContact.email);
        preview = preview.replace(/{email}/gi, previewContact.email);

        return preview;
    };

    // UI State for Tabs
    const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'subjects'

    return (
        <div style={{ minHeight: 'calc(100vh - 64px)', paddingBottom: '24px', display: 'flex', flexDirection: 'column' }}>
            <div className="page-header" style={{ marginBottom: '16px' }}>
                <div>
                    <h1 className="page-title">Templates & Subjects</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Design your emails and manage subject lines</p>
                </div>
                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '4px', background: '#eef2ff', padding: '4px', borderRadius: '8px', alignSelf: 'flex-start' }}>
                    <button
                        onClick={() => setActiveTab('editor')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            background: activeTab === 'editor' ? 'white' : 'transparent',
                            borderRadius: '6px',
                            color: activeTab === 'editor' ? 'var(--primary-color)' : 'var(--text-secondary)',
                            fontWeight: '600',
                            fontSize: '13px',
                            boxShadow: activeTab === 'editor' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer',
                            display: 'flex', gap: '8px', alignItems: 'center'
                        }}
                    >
                        <FileText size={16} /> Email Editor
                    </button>
                    <button
                        onClick={() => setActiveTab('subjects')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            background: activeTab === 'subjects' ? 'white' : 'transparent',
                            borderRadius: '6px',
                            color: activeTab === 'subjects' ? 'var(--primary-color)' : 'var(--text-secondary)',
                            fontWeight: '600',
                            fontSize: '13px',
                            boxShadow: activeTab === 'subjects' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer',
                            display: 'flex', gap: '8px', alignItems: 'center'
                        }}
                    >
                        <Code size={16} /> Subject Lines
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* Email Editor Tab Content */}
                {activeTab === 'editor' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Email Editor</h2>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ display: 'flex', background: '#eef2ff', padding: '4px', borderRadius: '8px' }}>
                                    <button onClick={() => setViewMode('edit')} style={{ padding: '6px 12px', border: 'none', background: viewMode === 'edit' ? 'white' : 'transparent', borderRadius: '6px', color: viewMode === 'edit' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: '500', boxShadow: viewMode === 'edit' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}><Code size={16} /> Edit</button>
                                    <button onClick={() => setViewMode('split')} style={{ padding: '6px 12px', border: 'none', background: viewMode === 'split' ? 'white' : 'transparent', borderRadius: '6px', color: viewMode === 'split' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: '500', boxShadow: viewMode === 'split' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center' }}><Code size={14} /> | <Eye size={14} /> Split</button>
                                    <button onClick={() => setViewMode('preview')} style={{ padding: '6px 12px', border: 'none', background: viewMode === 'preview' ? 'white' : 'transparent', borderRadius: '6px', color: viewMode === 'preview' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: '500', boxShadow: viewMode === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}><Eye size={16} /> Preview</button>
                                </div>
                                <button onClick={() => { if (window.confirm('Reset to Sample Text?')) { setEmailContent(SAMPLE_TEXT); setEditorMode('text'); showToast('Sample text template loaded', 'info'); } }} className="btn btn-outline" style={{ fontSize: '11px', padding: '10px' }}><RefreshCw size={14} /> Sample Text</button>
                                <button onClick={() => { if (window.confirm('Reset to Sample HTML?')) { setEmailContent(SAMPLE_HTML); setEditorMode('html'); showToast('Sample HTML template loaded', 'info'); } }} className="btn btn-outline" style={{ fontSize: '11px', padding: '10px' }}><Code size={14} /> Sample HTML</button>
                                <button onClick={() => { const name = prompt('Enter a name for this template:'); if (name) { saveTemplate(name, emailContent); showToast('Template saved successfully', 'success'); } }} className="btn btn-outline"><Save size={18} /> Save</button>
                                <div style={{ position: 'relative' }}>
                                    <button onClick={() => setShowLoadDropdown(!showLoadDropdown)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Upload size={18} /> Load File <span style={{ fontSize: '10px' }}>▼</span></button>
                                    {showLoadDropdown && (
                                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '140px' }}>
                                            <button onClick={() => { templateFileRef.current?.click(); setShowLoadDropdown(false); }} style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><Code size={14} /> Load HTML</button>
                                            <button onClick={() => { textFileRef.current?.click(); setShowLoadDropdown(false); }} style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={14} /> Load Text</button>
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={templateFileRef} accept=".html,.htm" onChange={handleEmailTemplate} style={{ display: 'none' }} />
                                <input type="file" ref={textFileRef} accept=".txt" onChange={handleTextFile} style={{ display: 'none' }} />
                            </div>
                        </div>

                        {/* Editor & Preview Area */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', marginBottom: 0 }}>
                            {/* Toolbar */}
                            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', alignSelf: 'center', marginRight: '8px' }}>Insert Variable:</span>
                                    {['{{name}}', '{{company}}', '{{email}}'].map(v => (
                                        <button key={v} onClick={() => insertVariable(v)} style={{ padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'white', fontSize: '12px', fontFamily: 'monospace', cursor: 'pointer', color: 'var(--primary-color)' }}>{v}</button>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const v = prompt('Enter variable name:');
                                            if (v) insertVariable(`{{${v}}}`);
                                        }}
                                        style={{
                                            padding: '4px 8px',
                                            border: '1px solid var(--primary-color)',
                                            borderRadius: '4px',
                                            background: 'var(--surface-color)',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            color: 'var(--primary-color)',
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        + Custom
                                    </button>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div
                                id="templates-split-container"
                                style={{
                                    display: 'flex',
                                    flexDirection: viewMode === 'split' ? 'row' : 'column',
                                    height: viewMode === 'split' ? '600px' : 'auto',
                                    position: 'relative'
                                }}
                            >

                                {/* Editor Section (Left in Split, Top in Column) */}
                                {(viewMode === 'edit' || viewMode === 'split') && (
                                    <div style={{
                                        height: viewMode === 'split' ? '100%' : '500px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        width: viewMode === 'split' ? `${splitWidth}%` : '100%',
                                        flexShrink: 0,
                                        borderRight: (viewMode === 'split' && !isDragging) ? '1px solid var(--border-color)' : 'none'
                                    }}>
                                        <div style={{
                                            height: '52px',
                                            padding: '0 16px',
                                            background: '#f1f5f9',
                                            borderBottom: '1px solid var(--border-color)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between'
                                        }}>
                                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {editorMode === 'html' ? 'HTML Editor' : 'Text Editor'}
                                            </span>
                                            <select
                                                value={editorMode}
                                                onChange={(e) => handleEditorModeChange(e.target.value)}
                                                style={{
                                                    padding: '6px 12px',
                                                    fontSize: '12px',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border-color)',
                                                    background: 'white',
                                                    outline: 'none',
                                                    cursor: 'pointer',
                                                    fontWeight: '700',
                                                    color: 'var(--primary-color)',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                    appearance: 'none',
                                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23059669' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                                    backgroundRepeat: 'no-repeat',
                                                    backgroundPosition: 'right 8px center',
                                                    paddingRight: '32px'
                                                }}
                                            >
                                                <option value="html">HTML Mode</option>
                                                <option value="text">Text Mode</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 1, padding: '16px', background: '#f1f5f9', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                            <div
                                                className="custom-scrollbar"
                                                style={{
                                                    flex: 1,
                                                    background: '#fff',
                                                    borderRadius: '12px',
                                                    border: '1px solid var(--border-color)',
                                                    overflow: 'hidden',
                                                    boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.03)',
                                                    display: 'flex',
                                                    flexDirection: 'column'
                                                }}
                                            >
                                                <CodeMirror
                                                    value={emailContent || ""}
                                                    height="100%"
                                                    extensions={editorMode === 'html' ? [html(), variableHighlightExtension, themeExtension] : [variableHighlightExtension, themeExtension]}
                                                    onChange={(value) => setEmailContent(value)}
                                                    basicSetup={{
                                                        lineNumbers: true,
                                                        foldGutter: true,
                                                        highlightActiveLine: true,
                                                    }}
                                                    style={{
                                                        fontSize: '14px',
                                                        height: '100%',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Draggable Divider */}
                                {viewMode === 'split' && (
                                    <div
                                        onMouseDown={() => setIsDragging(true)}
                                        style={{
                                            width: '24px',
                                            cursor: 'col-resize',
                                            zIndex: 10,
                                            position: 'relative',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            transition: 'background 0.2s',
                                            background: isDragging ? 'rgba(5, 150, 105, 0.04)' : 'transparent'
                                        }}
                                    >
                                        {/* Divider Line */}
                                        <div style={{
                                            width: '1px',
                                            height: '100%',
                                            background: isDragging ? 'var(--primary-color)' : 'var(--border-color)',
                                            opacity: 0.6
                                        }} />

                                        {/* Draggable Handle Indicator */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            width: '8px',
                                            height: '40px',
                                            background: 'white',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '3px',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                            pointerEvents: 'none'
                                        }}>
                                            {[1, 2, 3].map(i => (
                                                <div key={i} style={{ width: '2px', height: '2px', background: 'var(--text-tertiary)', borderRadius: '50%' }} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Preview Section (Right in Split, Bottom in Column) */}
                                {(viewMode === 'preview' || viewMode === 'split') && (
                                    <div style={{
                                        height: viewMode === 'split' ? '100%' : '500px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        backgroundColor: '#f9fafb',
                                        flex: 1,
                                        minWidth: 0
                                    }}>
                                        <div style={{
                                            height: '52px',
                                            padding: '0 16px',
                                            borderBottom: '1px solid var(--border-color)',
                                            background: 'white',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Preview</h4>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    className="input"
                                                    style={{ height: '28px', fontSize: '12px', width: '120px' }}
                                                    value={previewContact.name}
                                                    onChange={e => setPreviewContact({ ...previewContact, name: e.target.value })}
                                                    placeholder="Name"
                                                />
                                                <input
                                                    className="input"
                                                    style={{ height: '28px', fontSize: '12px', width: '120px' }}
                                                    value={previewContact.company}
                                                    onChange={e => setPreviewContact({ ...previewContact, company: e.target.value })}
                                                    placeholder="Company"
                                                />
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                                            <div
                                                style={{
                                                    background: 'white',
                                                    padding: '24px',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                    minHeight: '100%',
                                                    whiteSpace: editorMode === 'text' ? 'pre-wrap' : 'normal',
                                                    wordWrap: 'break-word',
                                                    fontFamily: editorMode === 'text' ? 'inherit' : 'sans-serif'
                                                }}
                                                dangerouslySetInnerHTML={{ __html: renderPreview() }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Saved Templates Card */}
                        <div className="card" style={{ height: '240px', display: 'flex', flexDirection: 'column', padding: 0, marginBottom: 0, flexShrink: 0 }}>
                            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Saved Templates</h3>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                                {savedTemplates.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                                        {savedTemplates.map(template => (
                                            <div key={template.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', background: 'var(--surface-color)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                    <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>{template.name}</h4>
                                                    <button onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0 }}><Trash2 size={14} /></button>
                                                </div>
                                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{new Date(template.createdAt).toLocaleDateString()}</p>
                                                <button className="btn btn-outline" style={{ width: '100%', fontSize: '12px', padding: '6px' }} onClick={() => { if (window.confirm('Load this template? Current content will be replaced.')) { setEmailContent(template.content); showToast('Template loaded', 'success'); } }}>Load Template</button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
                                        <FileText size={32} style={{ opacity: 0.3, marginBottom: '8px' }} /><p>No saved templates yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
                }

                {/* Subject Lines Tab Content */}
                {
                    activeTab === 'subjects' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Subject Lines Manager</h2>
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', marginBottom: 0 }}>
                                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Active Subjects</h3>
                                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{subjects.length} active subjects</p>
                                        </div>
                                        <button className="btn btn-outline" style={{ fontSize: '12px' }} onClick={() => subjectFileRef.current?.click()}><Upload size={14} /> Bulk Upload (.txt)</button>
                                        <input type="file" ref={subjectFileRef} accept=".txt" onChange={handleSubjectFile} style={{ display: 'none' }} />
                                    </div>
                                </div>
                                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="text" className="input" placeholder="Enter a new subject line..." style={{ flex: 1 }} value={newSubject} onChange={(e) => setNewSubject(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSubject()} />
                                        <button className="btn btn-primary" onClick={addSubject}><Plus size={16} /> Add Subject</button>
                                    </div>
                                </div>
                                <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0' }}>
                                    {subjects.length > 0 ? (
                                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                            {subjects.map((subject, index) => (
                                                <li key={index} style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ flex: 1, marginRight: '16px' }} title={subject}>{subject}</span>
                                                    <button onClick={() => removeSubject(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}><Trash2 size={16} /></button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>No subject lines added yet. Add one above or upload a list.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
};

export default Templates;
