import React, { useRef, useState } from 'react';
import { useDashboard } from './DashboardContext';
import { Upload, FileText, Check, AlertCircle, X, Plus, Trash2 } from 'lucide-react';

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
        setIsCheckingBounceable,
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

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const rows = text.split('\n').map(row => row.split(','));
                const headers = rows[0].map(header => header.trim());
                setCsvHeaders(headers);
                setCsvRows(rows.slice(1).filter(row => row.length === headers.length));
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
            };
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
            // Fallback if no list selected (shouldn't happen with default)
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

    const checkBounceability = async () => {
        setIsCheckingBounceable(true);
        setBounceableEmails([]);
        setInvalidEmails([]);

        const batchSize = 10;
        for (let i = 0; i < emailList.length; i += batchSize) {
            const batch = emailList.slice(i, i + batchSize);
            await Promise.all(batch.map(async (prospect) => {
                try {
                    const response = await fetch(`http://localhost:3001/validate-emails`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ emails: [prospect], useSSE: false })
                    });
                    const data = await response.json();
                    if (data.bounceableEmails && data.bounceableEmails.length > 0) {
                        setBounceableEmails(prev => [...prev, prospect]);
                    } else {
                        setInvalidEmails(prev => [...prev, prospect]);
                    }
                } catch (error) {
                    console.error('Validation error:', error);
                }
            }));
        }
        setIsCheckingBounceable(false);
    };

    return (
        <div>
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h1 className="page-title">Prospects</h1>

                    {/* List Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                            className="select"
                            style={{ width: '200px' }}
                            value={selectedListId}
                            onChange={(e) => setSelectedListId(e.target.value)}
                        >
                            {prospectLists.map(list => (
                                <option key={list.id} value={list.id}>{list.name}</option>
                            ))}
                        </select>

                        <button
                            className="btn btn-outline"
                            style={{ padding: '8px' }}
                            onClick={() => setShowCreateList(!showCreateList)}
                            title="Create New List"
                        >
                            <Plus size={20} />
                        </button>

                        {selectedListId !== 'default' && (
                            <button
                                className="btn-danger"
                                style={{ padding: '8px', borderRadius: '8px' }}
                                onClick={() => handleDeleteList(selectedListId)}
                                title="Delete Current List"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn btn-outline"
                        onClick={() => emailCsvRef.current.click()}
                    >
                        <Upload size={20} />
                        Import CSV
                    </button>
                    <input
                        type="file"
                        ref={emailCsvRef}
                        onChange={handleFileUpload}
                        accept=".csv"
                        style={{ display: 'none' }}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={checkBounceability}
                        disabled={isCheckingBounceable || emailList.length === 0}
                    >
                        {isCheckingBounceable ? 'Checking...' : 'Validate Emails'}
                    </button>
                </div>
            </div>

            {/* Create List Modal/Inline */}
            {showCreateList && (
                <div className="card" style={{ marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="New List Name"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        style={{ maxWidth: '300px' }}
                    />
                    <button className="btn btn-primary" onClick={handleCreateList}>Create</button>
                    <button className="btn btn-outline" onClick={() => setShowCreateList(false)}>Cancel</button>
                </div>
            )}

            {showColumnMapping && (
                <div className="card">
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Map Columns</h3>
                    <div className="grid-3" style={{ marginTop: 0, marginBottom: '24px' }}>
                        <div className="input-group">
                            <label className="label">Email Column</label>
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
                            <label className="label">Name Column (Optional)</label>
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
                            <label className="label">Company Column (Optional)</label>
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
                    <button className="btn btn-primary" onClick={handleImport}>
                        Confirm Import to "{prospectLists.find(l => l.id === selectedListId)?.name || 'Current List'}"
                    </button>
                </div>
            )}

            <div className="card">
                <div className="page-header" style={{ marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                        {prospectLists.find(l => l.id === selectedListId)?.name} ({emailList.length})
                    </h2>
                    {bounceableEmails.length > 0 && (
                        <span className="text-success" style={{ fontSize: '14px', fontWeight: '500' }}>
                            {bounceableEmails.length} Validated
                        </span>
                    )}
                </div>

                {emailList.length > 0 ? (
                    <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <table className="table">
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 1 }}>
                                <tr>
                                    <th>Email</th>
                                    <th>Name</th>
                                    <th>Company</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {emailList.map((prospect, index) => {
                                    const isValid = bounceableEmails.some(e => e.email === prospect.email);
                                    const isInvalid = invalidEmails.some(e => e.email === prospect.email);

                                    return (
                                        <tr key={index}>
                                            <td>{prospect.email}</td>
                                            <td>{prospect.name || '-'}</td>
                                            <td>{prospect.company || '-'}</td>
                                            <td>
                                                {isValid && <span className="text-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={16} /> Valid</span>}
                                                {isInvalid && <span className="text-error" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={16} /> Invalid</span>}
                                                {!isValid && !isInvalid && <span style={{ color: 'var(--text-secondary)' }}>Pending</span>}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-danger"
                                                    style={{ padding: '4px 8px', borderRadius: '6px' }}
                                                    onClick={() => {
                                                        const newList = emailList.filter((_, i) => i !== index);
                                                        setEmailList(newList);
                                                    }}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                        <FileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>No prospects in this list. Import a CSV file to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Prospects;
