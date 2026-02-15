import React, { useRef, useState, useEffect } from 'react';
import { useDashboard } from './DashboardContext';
import { FileText, Upload, Save, Eye, Code, Plus, Trash2, RefreshCw, Copy, Check, ArrowLeft, Edit, CheckSquare, Download } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { EditorView, Decoration, MatchDecorator, ViewPlugin } from "@codemirror/view";
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

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

    // Subject Creation Mode State
    const [subjectCreationMode, setSubjectCreationMode] = useState('subject'); // 'subject' or 'list'
    const [subjectLists, setSubjectLists] = useState([]); // Array of { name: string, subjects: string[] }
    const [currentListName, setCurrentListName] = useState('');
    const [currentListSubjects, setCurrentListSubjects] = useState([]);
    const [selectedListIndex, setSelectedListIndex] = useState(null);
    const [selectedListsForDelete, setSelectedListsForDelete] = useState(new Set());

    // Handle Subject Management
    const addSubject = () => {
        if (newSubject.trim()) {
            setSubjects([...subjects, newSubject.trim()]);
            setNewSubject('');
            showToast('Subject added', 'success');
        }
    };

    const removeSubject = (index) => {
        setSubjects(subjects.filter((_, i) => i !== index));
        showToast('Subject removed', 'info');
    };

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

    // Handle Subject File Upload - Creates subject list or appends to current list
    const handleSubjectFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();
        const reader = new FileReader();

        reader.onload = (event) => {
            let subjectsArr = [];
            const listName = file.name.replace(/\.[^/.]+$/, '');

            if (fileName.endsWith('.csv')) {
                const text = event.target.result;
                const result = Papa.parse(text, { skipEmptyLines: true });
                if (result.data.length > 0) {
                    const headers = result.data[0];
                    const subjectIndex = headers.findIndex(h => String(h).toLowerCase().includes('subject'));
                    const indexToUse = subjectIndex !== -1 ? subjectIndex : 0;

                    // If it has headers, slice(1), else use all
                    const dataToProcess = subjectIndex !== -1 ? result.data.slice(1) : result.data;
                    subjectsArr = dataToProcess.map(row => String(row[indexToUse] || '').trim()).filter(s => s);
                }
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheet];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length > 0) {
                    const headers = jsonData[0];
                    const subjectIndex = headers.findIndex(h => String(h).toLowerCase().includes('subject'));
                    const indexToUse = subjectIndex !== -1 ? subjectIndex : 0;

                    const dataToProcess = subjectIndex !== -1 ? jsonData.slice(1) : jsonData;
                    subjectsArr = dataToProcess.map(row => String(row[indexToUse] || '').trim()).filter(s => s);
                }
            } else {
                const content = event.target.result;
                subjectsArr = content.split('\n').map(line => line.trim()).filter(line => line !== '');
            }

            if (subjectsArr.length > 0) {
                if (subjectCreationMode === 'list') {
                    setCurrentListSubjects(prev => [...prev, ...subjectsArr]);
                    if (!currentListName) setCurrentListName(listName);
                    showToast(`Imported ${subjectsArr.length} subjects to current list`, 'success');
                } else {
                    setSubjectLists(prev => [...prev, { name: listName, subjects: subjectsArr }]);
                    showToast(`Created new subject list "${listName}" with ${subjectsArr.length} subjects`, 'success');
                }
            } else {
                showToast('No valid subjects found in file', 'error');
            }
        };

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }

        // Reset input
        e.target.value = '';
    };

    // Handle multi-select toggle for lists
    const toggleListSelection = (listIndex) => {
        setSelectedListsForDelete(prev => {
            const newSet = new Set(prev);
            if (newSet.has(listIndex)) {
                newSet.delete(listIndex);
            } else {
                newSet.add(listIndex);
            }
            return newSet;
        });
    };

    // Delete selected lists
    const deleteSelectedLists = () => {
        if (selectedListsForDelete.size > 0 && window.confirm(`Delete ${selectedListsForDelete.size} selected list(s)?`)) {
            setSubjectLists(prev => prev.filter((_, i) => !selectedListsForDelete.has(i)));
            setSelectedListsForDelete(new Set());
            showToast(`${selectedListsForDelete.size} list(s) deleted`, 'info');
        }
    };

    // Truncate text with ellipsis
    const truncateText = (text, maxLength = 50) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
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

        // Return content as-is without variable replacement
        return emailContent;
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
                )}

                {/* Subject Lines Tab Content */}
                {activeTab === 'subjects' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Subject Lines Manager</h2>

                        {/* Two Cards Section */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {/* Card 1: Individual Subjects */}
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', height: '400px' }}>
                                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Individual Subjects</h3>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{subjects.length} subjects</p>
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                                    {subjects.length > 0 ? (
                                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                            {subjects.map((subject, index) => (
                                                <li key={index} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ flex: 1, marginRight: '16px' }} title={subject}>{subject}</span>
                                                    <button onClick={() => removeSubject(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}><Trash2 size={16} /></button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>No subjects added yet</div>
                                    )}
                                </div>
                            </div>

                            {/* Card 2: Subject Lists */}
                            <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', height: '400px' }}>
                                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Subject Lists</h3>
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{subjectLists.length} lists</p>
                                    </div>
                                    {selectedListsForDelete.size > 0 && (
                                        <button
                                            onClick={deleteSelectedLists}
                                            className="btn btn-primary"
                                            style={{ fontSize: '12px', padding: '6px 12px' }}
                                        >
                                            <Trash2 size={14} /> Delete Selected ({selectedListsForDelete.size})
                                        </button>
                                    )}
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                                    {subjectLists.length > 0 ? (
                                        selectedListIndex === null ? (
                                            // List view - show only list names with hover actions
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {subjectLists.map((list, listIndex) => (
                                                    <div
                                                        key={listIndex}
                                                        style={{
                                                            border: selectedListsForDelete.has(listIndex) ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                                            borderRadius: '8px',
                                                            padding: '12px',
                                                            background: selectedListsForDelete.has(listIndex) ? 'rgba(5, 150, 105, 0.05)' : 'var(--surface-color)',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            position: 'relative'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = '#f8fafc';
                                                            e.currentTarget.querySelector('.hover-actions').style.opacity = '1';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = selectedListsForDelete.has(listIndex) ? 'rgba(5, 150, 105, 0.05)' : 'var(--surface-color)';
                                                            e.currentTarget.querySelector('.hover-actions').style.opacity = '0';
                                                        }}
                                                    >
                                                        <div style={{ flex: 1 }} onClick={() => setSelectedListIndex(listIndex)}>
                                                            <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>{list.name}</h4>
                                                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{list.subjects.length} subjects</p>
                                                        </div>
                                                        <div className="hover-actions" style={{ opacity: 0, display: 'flex', gap: '4px', transition: 'opacity 0.2s' }}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleListSelection(listIndex);
                                                                }}
                                                                style={{
                                                                    background: selectedListsForDelete.has(listIndex) ? 'var(--primary-color)' : 'white',
                                                                    border: '1px solid var(--border-color)',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    padding: '4px',
                                                                    color: selectedListsForDelete.has(listIndex) ? 'white' : 'var(--text-tertiary)'
                                                                }}
                                                                title={selectedListsForDelete.has(listIndex) ? 'Deselect' : 'Select for deletion'}
                                                            >
                                                                <CheckSquare size={14} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const newName = prompt('Enter new list name:', list.name);
                                                                    if (newName && newName.trim()) {
                                                                        setSubjectLists(prev => prev.map((l, i) => i === listIndex ? { ...l, name: newName.trim() } : l));
                                                                        showToast('List name updated', 'success');
                                                                    }
                                                                }}
                                                                style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', padding: '4px', color: 'var(--text-tertiary)' }}
                                                                title="Edit list name"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm(`Delete list "${list.name}"?`)) {
                                                                        setSubjectLists(prev => prev.filter((_, i) => i !== listIndex));
                                                                        showToast('Subject list deleted', 'info');
                                                                    }
                                                                }}
                                                                style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', padding: '4px', color: 'var(--text-tertiary)' }}
                                                                title="Delete list"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            // Detail view - show subjects in selected list
                                            <div>
                                                <button
                                                    onClick={() => setSelectedListIndex(null)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '8px 12px',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '6px',
                                                        background: 'white',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        color: 'var(--text-primary)',
                                                        marginBottom: '12px'
                                                    }}
                                                >
                                                    <ArrowLeft size={16} /> Back to Lists
                                                </button>
                                                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', background: 'var(--surface-color)' }}>
                                                    <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>{subjectLists[selectedListIndex].name}</h4>
                                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{subjectLists[selectedListIndex].subjects.length} subjects</p>
                                                    <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '13px', color: 'var(--text-primary)' }}>
                                                        {subjectLists[selectedListIndex].subjects.map((subject, idx) => (
                                                            <div key={idx} style={{ padding: '6px 0', borderBottom: idx < subjectLists[selectedListIndex].subjects.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                                                                {truncateText(subject)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    ) : (
                                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                            <FileText size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                            <p>No subject lists created yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Creation Panel */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Create Subject or Subject List</h3>
                            </div>
                            <div style={{ padding: '16px' }}>
                                {/* Selection: Subject or Subject List */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                                        Select Type:
                                    </label>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="subjectType"
                                                value="subject"
                                                checked={subjectCreationMode === 'subject'}
                                                onChange={() => setSubjectCreationMode('subject')}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Single Subject</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="subjectType"
                                                value="list"
                                                checked={subjectCreationMode === 'list'}
                                                onChange={() => setSubjectCreationMode('list')}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Subject List</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Conditional Input Fields */}
                                {subjectCreationMode === 'subject' ? (
                                    // Single Subject Mode
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="text" className="input" placeholder="Enter a new subject line..." style={{ flex: 1 }} value={newSubject} onChange={(e) => setNewSubject(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSubject()} />
                                        <button className="btn btn-primary" onClick={addSubject}><Plus size={16} /> Add Subject</button>
                                    </div>
                                ) : (
                                    // Subject List Mode
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', margin: 0 }}>
                                                    List Name:
                                                </label>
                                                <button
                                                    onClick={() => subjectFileRef.current.click()}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'var(--primary-color)',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <Upload size={14} /> Import from File
                                                </button>
                                                <input
                                                    type="file"
                                                    ref={subjectFileRef}
                                                    onChange={handleSubjectFile}
                                                    accept=".csv,.xlsx,.xls,.txt"
                                                    style={{ display: 'none' }}
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder="Enter a name for this subject list..."
                                                value={currentListName}
                                                onChange={(e) => setCurrentListName(e.target.value)}
                                                style={{ width: '100%' }}
                                            />
                                        </div>

                                        {/* Subject Content Input with Hint */}
                                        <div>
                                            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                                                Subject Content:
                                            </label>
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder="Enter a subject line..."
                                                value={newSubject}
                                                onChange={(e) => setNewSubject(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && newSubject.trim()) {
                                                        setCurrentListSubjects(prev => [...prev, newSubject.trim()]);
                                                        setNewSubject('');
                                                    }
                                                }}
                                                style={{ width: '100%' }}
                                            />
                                            {/* Hint */}
                                            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', fontStyle: 'italic' }}>
                                                💡 Press <kbd style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '10px' }}>Enter</kbd> to add a new subject to the list
                                            </p>
                                        </div>

                                        {/* List Preview */}
                                        {currentListSubjects.length > 0 && (
                                            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid var(--border-color)' }}>
                                                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                    Subjects in this list ({currentListSubjects.length}):
                                                </div>
                                                <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: '13px', maxHeight: '200px', overflowY: 'auto' }}>
                                                    {currentListSubjects.map((subject, index) => (
                                                        <li key={index} style={{ padding: '4px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span>{subject}</span>
                                                            <button
                                                                onClick={() => setCurrentListSubjects(prev => prev.filter((_, i) => i !== index))}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Save List Button */}
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => {
                                                if (currentListName.trim() && currentListSubjects.length > 0) {
                                                    setSubjectLists(prev => [...prev, { name: currentListName.trim(), subjects: [...currentListSubjects] }]);
                                                    setCurrentListName('');
                                                    setCurrentListSubjects([]);
                                                    showToast(`Subject list "${currentListName}" saved with ${currentListSubjects.length} subjects`, 'success');
                                                } else {
                                                    showToast('Please enter a list name and add at least one subject', 'error');
                                                }
                                            }}
                                            disabled={!currentListName.trim() || currentListSubjects.length === 0}
                                            style={{ alignSelf: 'flex-start', opacity: (!currentListName.trim() || currentListSubjects.length === 0) ? 0.5 : 1 }}
                                        >
                                            <Save size={16} /> Save List
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div >
        </div >
    );
};

export default Templates;
