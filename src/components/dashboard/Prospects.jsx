import React, { useRef } from 'react';
import { useDashboard } from './DashboardContext';
import { Upload, FileText, Check, AlertCircle, X } from 'lucide-react';

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
        setIsCheckingBounceable
    } = useDashboard();

    const emailCsvRef = useRef(null);

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

    const handleImport = () => {
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

        setEmailList([...emailList, ...newEmails]);
        setShowColumnMapping(false);
        setCsvHeaders([]);
        setCsvRows([]);
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
                    const response = await fetch(`http://localhost:3001/validate-email?email=${prospect.email}`);
                    const data = await response.json();
                    if (data.isValid) {
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
                <h1 className="page-title">Prospects</h1>
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
                        Confirm Import
                    </button>
                </div>
            )}

            <div className="card">
                <div className="page-header" style={{ marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Email List ({emailList.length})</h2>
                    {bounceableEmails.length > 0 && (
                        <span className="text-success" style={{ fontSize: '14px', fontWeight: '500' }}>
                            {bounceableEmails.length} Validated
                        </span>
                    )}
                </div>

                {emailList.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
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
                        <p>No prospects added yet. Import a CSV file to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Prospects;
