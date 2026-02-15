import React, { createContext, useContext, useState, useEffect } from 'react';

const DashboardContext = createContext();

export const useDashboard = () => {
    return useContext(DashboardContext);
};

export const DashboardProvider = ({ children }) => {
    // State from original tool
    const [subjects, setSubjects] = useState([]);
    const [emailList, setEmailList] = useState([]); // Deprecated in favor of selected list, but kept for compatibility
    const [completedEmails, setCompletedEmails] = useState([]);
    const [emailContent, setEmailContent] = useState(() => {
        const saved = localStorage.getItem('emailContent_v2');
        if (saved) return saved;

        return `<div style="font-family: sans-serif; line-height: 1.5;">
  <h3 style="color: #059669;">Hello {{name}},</h3>
  <p>I hope <b>{{company}}</b> is having a great week!</p>
  <p>Best regards,<br/>[Your Name]</p>
</div>`;
    });

    // Save email content to localStorage
    useEffect(() => {
        localStorage.setItem('emailContent_v2', emailContent);
    }, [emailContent]);
    const [smtpConfig, setSmtpConfig] = useState(() => {
        const saved = localStorage.getItem('smtpConfig');
        return saved ? JSON.parse(saved) : {
            server: 'smtp.gmail.com',
            port: '587',
            email: '',
            password: ''
        };
    });

    // Save SMTP config on change
    useEffect(() => {
        localStorage.setItem('smtpConfig', JSON.stringify(smtpConfig));
    }, [smtpConfig]);

    const [sendingConfig, setSendingConfig] = useState(() => {
        const saved = localStorage.getItem('sendingConfig');
        return saved ? JSON.parse(saved) : {
            delay: 3,
            maxRetries: 1,
            signature: ''
        };
    });

    useEffect(() => {
        localStorage.setItem('sendingConfig', JSON.stringify(sendingConfig));
    }, [sendingConfig]);
    const [status, setStatus] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [shouldStop, setShouldStop] = useState(false);

    // Toast Notification State
    const [toast, setToast] = useState({ message: '', type: 'info', visible: false });

    const showToast = (message, type = 'info') => {
        setToast({ message, type, visible: true });
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 3000); // Auto-hide after 3 seconds
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    // Stats
    const [emailStats, setEmailStats] = useState({
        emailsToday: 0,
        emailsThisHour: 0,
        maxPerDay: 400,
        maxPerHour: 50,
        history: [] // Added history
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

    // Prospect Lists State
    const [prospectLists, setProspectLists] = useState([]);
    const [selectedListId, setSelectedListId] = useState('default');

    // Campaigns State
    const [campaigns, setCampaigns] = useState([]);
    const [campaignsLoading, setCampaignsLoading] = useState(true);

    // Load data on mount
    useEffect(() => {
        fetchEmailLists();
        fetchEmailStats();
        fetchProspectLists();
        fetchCampaigns();
        const interval = setInterval(fetchEmailStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchEmailLists = async () => {
        try {
            const response = await fetch('http://localhost:3001/email-lists');
            const data = await response.json();
            // setEmailList(data.pendingEmails || []); // No longer primary source
            setCompletedEmails(data.completedEmails || []);
        } catch (error) {
            console.error('Failed to fetch email lists:', error);
        }
    };

    const fetchProspectLists = async () => {
        try {
            const response = await fetch('http://localhost:3001/prospect-lists');
            const data = await response.json();
            if (Array.isArray(data)) {
                setProspectLists(data);
            } else {
                console.error('Invalid prospect lists data:', data);
                setProspectLists([]);
            }

            // If currently selected list is not in fetched lists (e.g. deleted), select default
            if (selectedListId && !data.find(l => l.id === selectedListId)) {
                setSelectedListId('default');
            }
        } catch (error) {
            console.error('Failed to fetch prospect lists:', error);
        }
    };

    const createProspectList = async (name) => {
        try {
            const response = await fetch('http://localhost:3001/prospect-lists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const data = await response.json();
            if (data.success) {
                setProspectLists([...prospectLists, data.list]);
                return data.list;
            }
        } catch (error) {
            console.error('Failed to create prospect list:', error);
        }
    };

    const deleteProspectList = async (id) => {
        try {
            const response = await fetch(`http://localhost:3001/prospect-lists/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                setProspectLists(prospectLists.filter(l => l.id !== id));
                if (selectedListId === id) setSelectedListId('default');
            }
        } catch (error) {
            console.error('Failed to delete prospect list:', error);
        }
    };

    const addEmailsToList = async (listId, emails) => {
        try {
            const response = await fetch(`http://localhost:3001/prospect-lists/${listId}/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails })
            });
            const data = await response.json();
            if (data.success) {
                // Update local state
                setProspectLists(prospectLists.map(list =>
                    list.id === listId ? data.list : list
                ));
            }
            return data;
        } catch (error) {
            console.error('Failed to add emails to list:', error);
            throw error;
        }
    };

    const updateListEmails = async (listId, emails) => {
        try {
            const response = await fetch(`http://localhost:3001/prospect-lists/${listId}/emails`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails })
            });
            const data = await response.json();
            if (data.success) {
                setProspectLists(prospectLists.map(list =>
                    list.id === listId ? data.list : list
                ));
            }
        } catch (error) {
            console.error('Failed to update list emails:', error);
        }
    };

    // Template Management
    const [savedTemplates, setSavedTemplates] = useState(() => {
        const saved = localStorage.getItem('savedTemplates');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('savedTemplates', JSON.stringify(savedTemplates));
    }, [savedTemplates]);

    const saveTemplate = (name, content, type) => {
        const newTemplate = {
            id: Date.now().toString(),
            name,
            content,
            type,
            createdAt: new Date().toISOString()
        };
        setSavedTemplates(prev => [...prev, newTemplate]);
        return newTemplate;
    };

    const updateTemplate = (id, updates) => {
        setSavedTemplates(prev => prev.map(t =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        ));
    };

    const deleteTemplate = (id) => {
        setSavedTemplates(prev => prev.filter(t => t.id !== id));
    };

    // Campaign Management Functions
    const fetchCampaigns = async () => {
        setCampaignsLoading(true);
        try {
            const response = await fetch('http://localhost:3001/campaigns');
            const data = await response.json();
            setCampaigns(data);
        } catch (error) {
            console.error('Failed to fetch campaigns:', error);
        } finally {
            setCampaignsLoading(false);
        }
    };

    const createCampaign = async (campaignData) => {
        try {
            const response = await fetch('http://localhost:3001/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campaignData)
            });
            const data = await response.json();
            if (data.success) {
                setCampaigns([...campaigns, data.campaign]);
                return data.campaign;
            }
        } catch (error) {
            console.error('Failed to create campaign:', error);
            throw error;
        }
    };

    const updateCampaign = async (id, updates) => {
        try {
            const response = await fetch(`http://localhost:3001/campaigns/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const data = await response.json();
            if (data.success) {
                setCampaigns(campaigns.map(c => c.id === id ? data.campaign : c));
                return data.campaign;
            }
        } catch (error) {
            console.error('Failed to update campaign:', error);
            throw error;
        }
    };

    const deleteCampaign = async (id) => {
        try {
            const response = await fetch(`http://localhost:3001/campaigns/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                setCampaigns(campaigns.filter(c => c.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete campaign:', error);
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

    // Derived state: Current list emails
    const currentList = prospectLists.find(l => l.id === selectedListId) || { emails: [] };
    const currentEmails = currentList.emails || [];

    // Theme State
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    // Apply theme to body
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const value = {
        theme,
        toggleTheme,
        subjects, setSubjects,
        emailList: currentEmails, // Map current list emails to emailList for compatibility
        setEmailList: (emails) => updateListEmails(selectedListId, emails), // Map setter to update current list
        completedEmails, setCompletedEmails,
        emailContent, setEmailContent,
        smtpConfig, setSmtpConfig,
        sendingConfig, setSendingConfig,
        status, setStatus,
        isSending, setIsSending,
        shouldStop, setShouldStop,
        toast, showToast, hideToast,
        emailStats, setEmailStats,
        csvHeaders, setCsvHeaders,
        csvRows, setCsvRows,
        columnMapping, setColumnMapping,
        showColumnMapping, setShowColumnMapping,
        bounceableEmails, setBounceableEmails,
        invalidEmails, setInvalidEmails,
        isCheckingBounceable, setIsCheckingBounceable,
        validationProgress, setValidationProgress,
        prospectLists, setProspectLists,
        selectedListId, setSelectedListId,
        createProspectList, deleteProspectList, addEmailsToList, updateListEmails,
        savedTemplates, saveTemplate, updateTemplate, deleteTemplate,
        campaigns, setCampaigns, campaignsLoading,
        fetchCampaigns, createCampaign, updateCampaign, deleteCampaign,
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
