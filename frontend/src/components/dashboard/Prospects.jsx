import React, { useRef, useState } from 'react';
import { useDashboard } from './DashboardContext';
import { Upload, FileText, Check, AlertCircle, X, Plus, Trash2, Search, Filter, Download, MoreVertical, RefreshCw, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const Prospects = () => {
    const {
        emailList,
        setEmailList,
        csvHeaders,
        setCsvHeaders,
        csvRows,
        setCsvRows,
        columnMapping,
        setColumnMapping,
        showColumnMapping,
        setShowColumnMapping,
        bounceableEmails,
        setBounceableEmails,
        invalidEmails,
        setInvalidEmails,
        isCheckingBounceable,
        isChecking,
        prospectLists,
        selectedListId,
        setSelectedListId,
        createProspectList,
        deleteProspectList,
        addEmailsToList
    } = useDashboard();

    const emailCsvRef = useRef(null);
    const [newListName, setNewListName] = useState('');
    const [showCreateList, setShowCreateList] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Derived statistics
    const totalProspects = emailList.length;
    const validProspects = bounceableEmails.filter(e => emailList.some(p => p.email === e.email)).length;
    const invalidCount = invalidEmails.filter(e => emailList.some(p => p.email === e.email)).length;
    const pendingValidation = totalProspects - validProspects - invalidCount;

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();
        const reader = new FileReader();

        reader.onload = (e) => {
            let headers = [];
            let rows = [];

            if (fileName.endsWith('.csv')) {
                const text = e.target.result;
                const result = Papa.parse(text, { skipEmptyLines: true });
                headers = result.data[0].map(h => h.trim());
                rows = result.data.slice(1);
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                headers = jsonData[0].map(h => String(h).trim());
                rows = jsonData.slice(1);
            } else if (fileName.endsWith('.txt')) {
                const text = e.target.result;
                const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                // Check if it's a simple list of emails or delimited
                const firstLine = lines[0];
                if (firstLine.includes(',') || firstLine.includes('\t')) {
                    const delimiter = firstLine.includes(',') ? ',' : '\t';
                    headers = firstLine.split(delimiter).map(h => h.trim());
                    rows = lines.slice(1).map(l => l.split(delimiter));
                } else {
                    // Simple list of emails - treat as one column
                    headers = ['Email'];
                    rows = lines.map(l => [l]);
                }
            }

            if (headers.length > 0) {
                setCsvHeaders(headers);
                setCsvRows(rows.filter(row => row.length > 0));
                setShowColumnMapping(true);

                // Auto-detect columns
                const newMapping = { ...columnMapping };
                headers.forEach(header => {
                    const lowerHeader = header.toLowerCase();
                    if (lowerHeader.includes('email')) newMapping.email = header;
                    else if (lowerHeader.includes('name')) newMapping.name = header;
                    else if (lowerHeader.includes('company')) newMapping.company = header;
                });
                setColumnMapping(newMapping);
            }
        };

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    };

    const handleImport = async () => {
        if (!columnMapping.email) {
            alert('Please map the Email column');
            return;
        }

        const emailIndex = csvHeaders.indexOf(columnMapping.email);
        const nameIndex = csvHeaders.indexOf(columnMapping.name);
        const companyIndex = csvHeaders.indexOf(columnMapping.company);

        const newEmails = csvRows.map(row => ({
            email: row[emailIndex]?.trim(),
            name: nameIndex !== -1 ? row[nameIndex]?.trim() : '',
            company: companyIndex !== -1 ? row[companyIndex]?.trim() : ''
        })).filter(item => item.email && item.email.includes('@'));

        if (selectedListId) {
            await addEmailsToList(selectedListId, newEmails);
        } else {
            setEmailList([...emailList, ...newEmails]);
        }

        setShowColumnMapping(false);
        setCsvHeaders([]);
        setCsvRows([]);
    };

    const handleCreateList = async () => {
        if (!newListName.trim()) return;
        const newList = await createProspectList(newListName);
        if (newList) {
            setSelectedListId(newList.id);
            setNewListName('');
            setShowCreateList(false);
        }
    };

    const handleDeleteList = async (id) => {
        if (window.confirm('Are you sure you want to delete this list?')) {
            await deleteProspectList(id);
        }
    };

    // Filtered list based on search
    const safeEmailList = Array.isArray(emailList) ? emailList : [];
    const filteredList = safeEmailList.filter(prospect =>
        prospect.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prospect.name && prospect.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (prospect.company && prospect.company.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!prospectLists || !emailList) {
        return <div style={{ padding: '24px' }}>Loading prospects...</div>;
    }

    return (
        <div>
            {/* Header Section */}
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 className="page-title">Prospects</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Manage your email lists and contacts</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateList(true)}
                    >
                        <Plus size={18} /> New List
                    </button>
                </div>
            </div>

            {/* List Selection & Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px', marginBottom: '24px' }}>
                {/* Left: List Sidebar */}
                <div className="card" style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Your Lists</h3>
                    </div>

                    {showCreateList && (
                        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                className="input"
                                placeholder="List Name"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                autoFocus
                            />
                            <button className="btn btn-primary" style={{ padding: '8px' }} onClick={handleCreateList}>
                                <Check size={16} />
                            </button>
                            <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => setShowCreateList(false)}>
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {Array.isArray(prospectLists) && prospectLists.map(list => (
                            <div
                                key={list.id}
                                onClick={() => setSelectedListId(list.id)}
                                style={{
                                    padding: '12px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: selectedListId === list.id ? 'var(--surface-color)' : 'transparent',
                                    border: selectedListId === list.id ? '1px solid var(--primary-color)' : '1px solid transparent',
                                    marginBottom: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: selectedListId === list.id ? '600' : '400', color: selectedListId === list.id ? 'var(--primary-color)' : 'var(--text-primary)' }}>
                                        {list.name}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {list.emails ? list.emails.length : 0} prospects
                                    </div>
                                </div>
                                {selectedListId === list.id && list.id !== 'default' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Stats Row */}
                    <div className="stat-grid" style={{ marginBottom: '0', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                        <div className="stat-card" style={{ padding: '16px' }}>
                            <div>
                                <p className="stat-label">Total Contacts</p>
                                <h3 className="stat-value">{totalProspects}</h3>
                            </div>
                            <div className="stat-icon" style={{ marginLeft: 'auto', backgroundColor: '#eef2ff', marginBottom: 0 }}>
                                <Users size={20} color="#4f46e5" />
                            </div>
                        </div>
                        <div className="stat-card" style={{ padding: '16px' }}>
                            <div>
                                <p className="stat-label">Validated</p>
                                <h3 className="stat-value">{validProspects}</h3>
                            </div>
                            <div className="stat-icon" style={{ marginLeft: 'auto', backgroundColor: '#ecfdf5', marginBottom: 0 }}>
                                <Check size={20} color="#10b981" />
                            </div>
                        </div>
                        <div className="stat-card" style={{ padding: '16px' }}>
                            <div>
                                <p className="stat-label">Invalid</p>
                                <h3 className="stat-value">{invalidCount}</h3>
                            </div>
                            <div className="stat-icon" style={{ marginLeft: 'auto', backgroundColor: '#fef2f2', marginBottom: 0 }}>
                                <AlertCircle size={20} color="#ef4444" />
                            </div>
                        </div>
                        <div className="stat-card" style={{ padding: '16px' }}>
                            <div>
                                <p className="stat-label">Pending</p>
                                <h3 className="stat-value">{pendingValidation}</h3>
                            </div>
                            <div className="stat-icon" style={{ marginLeft: 'auto', backgroundColor: '#fffbeb', marginBottom: 0 }}>
                                <RefreshCw size={20} color="#f59e0b" />
                            </div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                        <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                            <div style={{ position: 'relative', width: '300px' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Search prospects..."
                                    style={{ paddingLeft: '36px' }}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => emailCsvRef.current.click()}
                            >
                                <Upload size={16} /> Import CSV
                            </button>
                            <input
                                type="file"
                                ref={emailCsvRef}
                                onChange={handleFileUpload}
                                accept=".csv"
                                style={{ display: 'none' }}
                            />
                            <button
                                className="btn btn-outline"
                                onClick={() => { }} // TODO: Export
                            >
                                <Download size={16} /> Export
                            </button>
                        </div>
                    </div>

                    {/* Import Mapping UI */}
                    {showColumnMapping && (
                        <div className="card">
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Map CSV Columns</h3>
                            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                                <div className="input-group">
                                    <label className="label">Email Column *</label>
                                    <select
                                        className="select"
                                        value={columnMapping.email}
                                        onChange={(e) => setColumnMapping({ ...columnMapping, email: e.target.value })}
                                    >
                                        <option value="">Select Column</option>
                                        {csvHeaders.map(header => (
                                            <option key={header} value={header}>{header}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="label">Name Column</label>
                                    <select
                                        className="select"
                                        value={columnMapping.name}
                                        onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                                    >
                                        <option value="">Select Column</option>
                                        {csvHeaders.map(header => (
                                            <option key={header} value={header}>{header}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="label">Company Column</label>
                                    <select
                                        className="select"
                                        value={columnMapping.company}
                                        onChange={(e) => setColumnMapping({ ...columnMapping, company: e.target.value })}
                                    >
                                        <option value="">Select Column</option>
                                        {csvHeaders.map(header => (
                                            <option key={header} value={header}>{header}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button className="btn btn-outline" onClick={() => setShowColumnMapping(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleImport}>
                                    Confirm Import
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {filteredList.length > 0 ? (
                            <div className="table-container" style={{ border: 'none', borderRadius: 0, flex: 1 }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Email</th>
                                            <th>Name</th>
                                            <th>Company</th>
                                            <th>Status</th>
                                            <th style={{ width: '50px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredList.map((prospect, index) => {
                                            const isValid = bounceableEmails && bounceableEmails.some(e => e.email === prospect.email);
                                            const isInvalid = invalidEmails && invalidEmails.some(e => e.email === prospect.email);

                                            return (
                                                <tr key={index}>
                                                    <td style={{ fontWeight: '500' }}>{prospect.email}</td>
                                                    <td>{prospect.name || '-'}</td>
                                                    <td>{prospect.company || '-'}</td>
                                                    <td>
                                                        {isValid ? (
                                                            <span className="text-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '12px' }}>
                                                                <Check size={12} /> Valid
                                                            </span>
                                                        ) : isInvalid ? (
                                                            <span className="text-error" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', backgroundColor: '#fef2f2', padding: '2px 8px', borderRadius: '12px' }}>
                                                                <AlertCircle size={12} /> Invalid
                                                            </span>
                                                        ) : (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '12px' }}>
                                                                Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            onClick={() => {
                                                                const newList = emailList.filter(p => p.email !== prospect.email);
                                                                setEmailList(newList);
                                                            }}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-secondary)' }}>
                                <FileText size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                                <p style={{ fontSize: '16px', fontWeight: '500' }}>No prospects found</p>
                                <p>Import a CSV file or select a different list to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Prospects;
