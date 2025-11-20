import React, { createContext, useContext, useState, useEffect } from 'react';

const DashboardContext = createContext();

export const useDashboard = () => {
    return useContext(DashboardContext);
};

export const DashboardProvider = ({ children }) => {
    // State from original tool
    const [subjects, setSubjects] = useState([]);
    const [emailList, setEmailList] = useState([]);
    const [completedEmails, setCompletedEmails] = useState([]);
    const [emailContent, setEmailContent] = useState('');
    const [smtpConfig, setSmtpConfig] = useState({
        server: 'smtp.gmail.com',
        port: '587',
        email: '',
        password: ''
    });
    const [status, setStatus] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [shouldStop, setShouldStop] = useState(false);

    // Stats
    const [emailStats, setEmailStats] = useState({
        emailsToday: 0,
        emailsThisHour: 0,
        maxPerDay: 400,
        maxPerHour: 50
    });

    // CSV Processing State
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [csvRows, setCsvRows] = useState([]);
    const [columnMapping, setColumnMapping] = useState({
        email: '',
        name: '',
        company: ''
    });
    const [showColumnMapping, setShowColumnMapping] = useState(false);

    // Validation State
    const [bounceableEmails, setBounceableEmails] = useState([]);
    const [invalidEmails, setInvalidEmails] = useState([]);
    const [isCheckingBounceable, setIsCheckingBounceable] = useState(false);
    const [validationProgress, setValidationProgress] = useState({
        isRunning: false,
        processed: 0,
        total: 0,
        bounceable: 0,
        invalid: 0
    });

    // Load data on mount
    useEffect(() => {
        fetchEmailLists();
        fetchEmailStats();
        const interval = setInterval(fetchEmailStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchEmailLists = async () => {
        try {
            const response = await fetch('http://localhost:3001/email-lists');
            const data = await response.json();
            setEmailList(data.pendingEmails || []);
            setCompletedEmails(data.completedEmails || []);
        } catch (error) {
            console.error('Failed to fetch email lists:', error);
        }
    };

    const fetchEmailStats = async () => {
        try {
            const response = await fetch('http://localhost:3001/email-stats');
            if (response.ok) {
                const stats = await response.json();
                setEmailStats(stats);
            }
        } catch (error) {
            console.error('Failed to fetch email stats:', error);
        }
    };

    const saveEmailLists = async (pendingEmails, completedEmails) => {
        try {
            await fetch('http://localhost:3001/update-email-lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pendingEmails, completedEmails }),
            });
        } catch (error) {
            console.error('Failed to save email lists:', error);
        }
    };

    const value = {
        subjects, setSubjects,
        emailList, setEmailList,
        completedEmails, setCompletedEmails,
        emailContent, setEmailContent,
        smtpConfig, setSmtpConfig,
        status, setStatus,
        isSending, setIsSending,
        shouldStop, setShouldStop,
        emailStats, setEmailStats,
        csvHeaders, setCsvHeaders,
        csvRows, setCsvRows,
        columnMapping, setColumnMapping,
        showColumnMapping, setShowColumnMapping,
        bounceableEmails, setBounceableEmails,
        invalidEmails, setInvalidEmails,
        isCheckingBounceable, setIsCheckingBounceable,
        validationProgress, setValidationProgress,
        fetchEmailLists,
        saveEmailLists,
        fetchEmailStats
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};
