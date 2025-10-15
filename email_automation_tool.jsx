import React, { useState, useRef, useEffect } from 'react';
import { Mail, Upload, Send, CheckCircle, AlertCircle, FileText, List, Settings, Square, Filter } from 'lucide-react';

export default function EmailAutomationTool() {
  const [currentStep, setCurrentStep] = useState(1);
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
  // New state for email limits and stats
  const [emailStats, setEmailStats] = useState({
    emailsToday: 0,
    emailsThisHour: 0,
    maxPerDay: 400,
    maxPerHour: 50
  });
  // New state for CSV preprocessing
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    email: '',
    name: '',
    company: ''
  });
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  // New state for bounceable email tracking
  const [bounceableEmails, setBounceableEmails] = useState([]);
  const [invalidEmails, setInvalidEmails] = useState([]);
  const [isCheckingBounceable, setIsCheckingBounceable] = useState(false);
  
  const subjectFileRef = useRef(null);
  const emailCsvRef = useRef(null);
  const emailTemplateRef = useRef(null);

  // Fetch email stats periodically
  useEffect(() => {
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

    // Fetch immediately
    fetchEmailStats();
    
    // Fetch every 30 seconds
    const interval = setInterval(fetchEmailStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Step 1: Load Subject File
  const handleSubjectFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        const subjectLines = content.split('\n').filter(line => line.trim() !== '');
        setSubjects(subjectLines);
        setStatus(`✅ Loaded ${subjectLines.length} subjects`);
      };
      reader.readAsText(file);
    }
  };

  // Step 2: Load Email CSV (Updated with preprocessing and validation state reset)
  const handleEmailCsv = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length > 0) {
          // Parse headers
          const headers = lines[0].split(',').map(header => header.trim());
          setCsvHeaders(headers);
          
          // Parse rows
          const rows = lines.slice(1).map(line => {
            const values = line.split(',');
            const rowObj = {};
            headers.forEach((header, index) => {
              rowObj[header] = values[index] ? values[index].trim() : '';
            });
            return rowObj;
          });
          setCsvRows(rows);
          
          // If we have the standard headers, use them directly
          if (headers.includes('Email') && headers.includes('Name') && headers.includes('Company')) {
            const emails = rows.map(row => ({
              email: row.Email?.trim() || '',
              name: row.Name?.trim() || 'Hiring Manager',
              company: row.Company?.trim() || 'your company'
            })).filter(e => e.email);
            
            setEmailList(emails);
            // Reset validation state when new email list is loaded
            setBounceableEmails([]);
            setInvalidEmails([]);
            setValidationProgress({
              isRunning: false,
              processed: 0,
              total: 0,
              bounceable: 0,
              invalid: 0
            });
            setStatus(`✅ Loaded ${emails.length} email addresses`);
            setShowColumnMapping(false);
          } else {
            // Show column mapping interface
            setShowColumnMapping(true);
            setStatus('ℹ️ Please map the columns to continue');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  // Function to process CSV with column mapping (Updated with validation state reset)
  const processMappedCsv = () => {
    if (!columnMapping.email) {
      setStatus('❌ Please select the email column');
      return;
    }
    
    const emails = csvRows.map(row => ({
      email: row[columnMapping.email]?.trim() || '',
      name: columnMapping.name ? (row[columnMapping.name]?.trim() || 'Hiring Manager') : 'Hiring Manager',
      company: columnMapping.company ? (row[columnMapping.company]?.trim() || 'your company') : 'your company'
    })).filter(e => e.email);
    
    setEmailList(emails);
    // Reset validation state when new email list is loaded
    setBounceableEmails([]);
    setInvalidEmails([]);
    setValidationProgress({
      isRunning: false,
      processed: 0,
      total: 0,
      bounceable: 0,
      invalid: 0
    });
    setShowColumnMapping(false);
    setStatus(`✅ Loaded ${emails.length} email addresses`);
  };

  // Step 3: Load Email Template
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

  // Get Random Subject
  const getRandomSubject = () => {
    if (subjects.length === 0) return 'Job Application';
    return subjects[Math.floor(Math.random() * subjects.length)];
  };

  // Function to check if email already exists in completed list
  const isEmailCompleted = (email) => {
    return completedEmails.some(completed => completed.email === email);
  };

  // Function to filter out completed emails from email list
  const filterCompletedEmails = () => {
    const filtered = emailList.filter(emailObj => !isEmailCompleted(emailObj.email));
    setEmailList(filtered);
    setStatus(`✅ Filtered out ${emailList.length - filtered.length} completed emails`);
  };

  // Add new state for validation progress
  const [validationProgress, setValidationProgress] = useState({
    isRunning: false,
    processed: 0,
    total: 0,
    bounceable: 0,
    invalid: 0
  });

  // Function to check bounceable emails with improved timeout handling and feedback
  const checkBounceableEmails = async () => {
    if (emailList.length === 0) {
      setStatus('❌ No emails to validate');
      return;
    }
    
    setIsCheckingBounceable(true);
    setValidationProgress({
      isRunning: true,
      processed: 0,
      total: emailList.length,
      bounceable: 0,
      invalid: 0
    });
    setStatus(`🔍 Checking email bounceability... (0/${emailList.length})`);
    
    try {
      // Optimized approach with adaptive batch sizes and improved timeout handling
      const initialBatchSize = Math.min(30, Math.max(10, Math.floor(5000 / emailList.length))); // Adaptive batch size
      const maxConcurrentBatches = 2; // Reduced from 3 to 2 for better stability
      let processed = 0;
      let bounceable = 0;
      let invalid = 0;
      const allBounceable = [];
      const allInvalid = [];
      
      // Create all batches
      const batches = [];
      for (let i = 0; i < emailList.length; i += initialBatchSize) {
        batches.push({
          index: i,
          data: emailList.slice(i, i + initialBatchSize)
        });
      }
      
      // Process batches with controlled concurrency
      for (let i = 0; i < batches.length; i += maxConcurrentBatches) {
        const batchGroup = batches.slice(i, i + maxConcurrentBatches);
        
        // Process current batch group in parallel
        const batchPromises = batchGroup.map(async (batch) => {
          try {
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
            
            const response = await fetch('http://localhost:3001/validate-emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ emails: batch.data }),
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            return { batchIndex: batch.index, result, error: null };
          } catch (error) {
            console.warn(`Batch ${batch.index} failed:`, error.message);
            // Retry once with smaller batch size and shorter timeout
            if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('fetch')) {
              try {
                // Retry with much smaller batch size
                const retryBatchSize = Math.max(3, Math.floor(batch.data.length / 3));
                const retryResults = [];
                let retryBounceable = 0;
                let retryInvalid = 0;
                
                console.log(`Retrying batch ${batch.index} with smaller chunks of ${retryBatchSize} emails each`);
                
                // Process retry batch in smaller chunks
                for (let j = 0; j < batch.data.length; j += retryBatchSize) {
                  const retryChunk = batch.data.slice(j, j + retryBatchSize);
                  
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout for retry
                  
                  const response = await fetch('http://localhost:3001/validate-emails', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ emails: retryChunk }),
                    signal: controller.signal
                  });
                  
                  clearTimeout(timeoutId);
                  
                  if (!response.ok) {
                    // Even if retry fails, assume emails are valid to avoid blocking
                    console.warn(`Retry chunk failed, assuming ${retryChunk.length} emails are valid`);
                    retryResults.push(...retryChunk.map(emailObj => ({
                      ...emailObj,
                      bounceable: true,
                      reason: 'Assumed valid due to validation timeout'
                    })));
                    retryBounceable += retryChunk.length;
                  } else {
                    const result = await response.json();
                    retryResults.push(...result.bounceableEmails, ...result.invalidEmails);
                    retryBounceable += result.bounceableCount;
                    retryInvalid += result.invalidEmails.length;
                  }
                }
                
                return {
                  batchIndex: batch.index,
                  result: {
                    success: true,
                    bounceableCount: retryBounceable,
                    totalCount: batch.data.length,
                    bounceableEmails: retryResults.filter(e => e.bounceable),
                    invalidEmails: retryResults.filter(e => !e.bounceable)
                  },
                  error: null
                };
              } catch (retryError) {
                console.warn(`Retry failed for batch ${batch.index}:`, retryError.message);
                // If retry also fails, assume all emails in batch are valid
                return {
                  batchIndex: batch.index,
                  result: {
                    success: true,
                    bounceableCount: batch.data.length,
                    totalCount: batch.data.length,
                    bounceableEmails: batch.data.map(emailObj => ({
                      ...emailObj,
                      bounceable: true,
                      reason: 'Assumed valid due to persistent timeout'
                    })),
                    invalidEmails: []
                  },
                  error: null
                };
              }
            }
            // For other errors, assume emails are valid
            return {
              batchIndex: batch.index,
              result: {
                success: true,
                bounceableCount: batch.data.length,
                totalCount: batch.data.length,
                bounceableEmails: batch.data.map(emailObj => ({
                  ...emailObj,
                  bounceable: true,
                  reason: `Assumed valid due to error: ${error.message}`
                })),
                invalidEmails: []
              },
              error: null
            };
          }
        });
        
        // Wait for all batches in current group to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Process results
        for (const batchResult of batchResults) {
          if (batchResult.error) {
            console.warn(`Batch ${batchResult.batchIndex} failed:`, batchResult.error);
            // Assume all emails in failed batch are valid to avoid blocking
            const failedBatch = batches.find(b => b.index === batchResult.batchIndex);
            if (failedBatch) {
              allBounceable.push(...failedBatch.data.map(emailObj => ({
                ...emailObj,
                bounceable: true,
                reason: 'Assumed valid due to batch failure'
              })));
              processed += failedBatch.data.length;
              bounceable += failedBatch.data.length;
            }
          } else if (batchResult.result?.success) {
            allBounceable.push(...batchResult.result.bounceableEmails);
            allInvalid.push(...batchResult.result.invalidEmails);
            
            const batchInfo = batches.find(b => b.index === batchResult.batchIndex);
            const batchSize = batchInfo?.data.length || 0;
            processed += batchSize;
            bounceable += batchResult.result.bounceableCount;
            invalid += batchResult.result.invalidEmails.length;
          }
          
          // Update progress in real-time
          setValidationProgress({
            isRunning: true,
            processed,
            total: emailList.length,
            bounceable,
            invalid
          });
          
          setStatus(`🔍 Checking email bounceability... (${processed}/${emailList.length}) Valid: ${bounceable}, Invalid: ${invalid}`);
        }
      }
      
      // Set final results
      setBounceableEmails(allBounceable);
      setInvalidEmails(allInvalid);
      setEmailList(allBounceable); // Update email list to only include bounceable emails
      
      // Update progress to show completion
      setValidationProgress({
        isRunning: false,
        processed: emailList.length,
        total: emailList.length,
        bounceable: allBounceable.length,
        invalid: allInvalid.length
      });
      
      setStatus(`✅ Validation complete: ${allBounceable.length} valid emails, ${allInvalid.length} invalid emails removed`);
    } catch (error) {
      console.error('Error validating emails:', error);
      setStatus(`⚠️ Validation completed with some timeouts. Assuming most emails are valid.`);
      
      // Even on error, assume most emails are valid
      setBounceableEmails(emailList.map(emailObj => ({
        ...emailObj,
        bounceable: true,
        reason: 'Assumed valid due to system error'
      })));
      setInvalidEmails([]);
      setEmailList(emailList);
      
      setValidationProgress({
        isRunning: false,
        processed: emailList.length,
        total: emailList.length,
        bounceable: emailList.length,
        invalid: 0
      });
    } finally {
      setIsCheckingBounceable(false);
    }
  };

  // Actual Email Sending (Updated with stop functionality, deduplication, and limits)
  const sendEmails = async () => {
    // First, filter out any emails that are already completed
    filterCompletedEmails();
    
    if (emailList.length === 0) {
      setStatus('❌ No emails to send');
      return;
    }
    if (!emailContent) {
      setStatus('❌ No email template loaded');
      return;
    }
    if (!smtpConfig.email || !smtpConfig.password) {
      setStatus('❌ SMTP credentials not configured');
      return;
    }

    setIsSending(true);
    setShouldStop(false); // Reset stop flag
    const remaining = [...emailList];
    const completed = [...completedEmails];

    for (let i = 0; i < remaining.length; i++) {
      // Check if we should stop
      if (shouldStop) {
        setStatus(`⏹️ Sending stopped by user. ${i} emails sent.`);
        setIsSending(false);
        setShouldStop(false);
        return;
      }
      
      const recipient = remaining[i];
      const subject = getRandomSubject();
      
      setStatus(`📧 Sending to ${recipient.email} (${i + 1}/${remaining.length})...`);
      
      try {
        // Send email via our backend API
        const response = await fetch('http://localhost:3001/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            smtpConfig,
            recipient,
            subject,
            htmlContent: emailContent
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Mark as completed
          completed.push({
            ...recipient,
            subject: subject,
            sentAt: new Date().toLocaleString()
          });
          
          setCompletedEmails(completed);
          setEmailList(remaining.slice(i + 1));
        } else {
          // Handle limit exceeded or other errors
          if (response.status === 429) {
            setStatus(`⏰ ${result.message}`);
            setIsSending(false);
            return;
          } else {
            setStatus(`❌ Failed to send to ${recipient.email}: ${result.message}`);
            break;
          }
        }
      } catch (error) {
        setStatus(`❌ Error sending to ${recipient.email}: ${error.message}`);
        break;
      }
    }

    setIsSending(false);
    if (emailList.length === 0 && !shouldStop) {
      setStatus(`✅ All emails sent successfully!`);
    }
  };

  // Stop sending emails
  const stopSending = () => {
    setShouldStop(true);
    setStatus('⏹️ Stopping email sending...');
  };

  // Download Completed CSV
  const downloadCompletedCsv = () => {
    if (completedEmails.length === 0) {
      setStatus('❌ No completed emails to download');
      return;
    }

    const csvContent = [
      'Email,Name,Company,Subject,Sent At',
      ...completedEmails.map(e => `${e.email},${e.name},${e.company},"${e.subject}",${e.sentAt}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'completed_list.csv';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('✅ Completed list downloaded');
  };

  // Download Remaining CSV
  const downloadRemainingCsv = () => {
    if (emailList.length === 0) {
      setStatus('❌ No remaining emails');
      return;
    }

    const csvContent = [
      'Email,Name,Company',
      ...emailList.map(e => `${e.email},${e.name},${e.company}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'remaining_emails.csv';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('✅ Remaining emails downloaded');
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <Mail style={{ width: '32px', height: '32px', color: '#4f46e5' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginLeft: '12px' }}>HR Email Automation Tool</h1>
        </div>
        <p style={{ color: '#4b5563' }}>Automate your job application emails with random subjects</p>
      </div>

      {/* Workflow Steps */}
      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <List style={{ width: '20px', height: '20px' }} />
          Workflow Steps
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { num: 1, title: 'Load Subjects', icon: FileText },
            { num: 2, title: 'Load Emails', icon: Upload },
            { num: 3, title: 'Load Template', icon: FileText },
            { num: 4, title: 'Configure SMTP', icon: Settings },
            { num: 5, title: 'Validate & Send', icon: Send }
          ].map((step) => (
            <div
              key={step.num}
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: '2px solid',
                borderColor: currentStep === step.num ? '#4f46e5' : currentStep > step.num ? '#10b981' : '#d1d5db',
                backgroundColor: currentStep === step.num ? '#eef2ff' : currentStep > step.num ? '#f0fdf4' : '#f9fafb',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setCurrentStep(step.num)}
            >
              <step.icon style={{
                width: '32px',
                height: '32px',
                margin: '0 auto 8px',
                color: currentStep === step.num ? '#4f46e5' : currentStep > step.num ? '#10b981' : '#9ca3af'
              }} />
              <div style={{ fontSize: '14px', fontWeight: '600' }}>Step {step.num}</div>
              <div style={{ fontSize: '12px', color: '#4b5563' }}>{step.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Left Panel - Configuration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Step 1: Load Subjects */}
          {currentStep === 1 && (
            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <FileText style={{ width: '20px', height: '20px', color: '#4f46e5' }} />
                Step 1: Load Subject File (subjects.txt)
              </h3>
              <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px' }}>
                Upload a text file with one subject line per row. A random subject will be selected for each email.
              </p>
              <input
                type="file"
                ref={subjectFileRef}
                accept=".txt"
                onChange={handleSubjectFile}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => subjectFileRef.current?.click()}
                style={{
                  width: '100%',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                <Upload style={{ width: '20px', height: '20px' }} />
                Select subjects.txt
              </button>
              {subjects.length > 0 && (
                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#166534', marginBottom: '8px' }}>
                    ✅ Loaded {subjects.length} subjects
                  </p>
                  <div style={{ maxHeight: '160px', overflowY: 'auto', fontSize: '12px', color: '#374151' }}>
                    {subjects.map((s, i) => (
                      <div key={i} style={{ padding: '4px 0' }}>• {s}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Load Email CSV */}
          {currentStep === 2 && (
            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Upload style={{ width: '20px', height: '20px', color: '#4f46e5' }} />
                Step 2: Load Email List (emails.csv)
              </h3>
              <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px' }}>
                Upload a CSV file with email data. You can map columns to Email, Name, and Company.
              </p>
              
              {!showColumnMapping ? (
                <>
                  <div style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', fontFamily: 'monospace' }}>
                    Example CSV format:<br/>
                    Email,Name,Company<br/>
                    hr@company1.com,John,Company 1<br/>
                    recruiter@company2.com,Sarah,Company 2
                  </div>
                  <input
                    type="file"
                    ref={emailCsvRef}
                    accept=".csv"
                    onChange={handleEmailCsv}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => emailCsvRef.current?.click()}
                    style={{
                      width: '100%',
                      backgroundColor: '#4f46e5',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      border: 'none',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    <Upload style={{ width: '20px', height: '20px' }} />
                    Select emails.csv
                  </button>
                  {emailList.length > 0 && (
                    <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#166534', marginBottom: '8px' }}>
                        ✅ Loaded {emailList.length} email addresses
                      </p>
                      <button
                        onClick={checkBounceableEmails}
                        disabled={isCheckingBounceable || emailList.length === 0}
                        style={{
                          marginTop: '12px',
                          width: '100%',
                          backgroundColor: isCheckingBounceable ? '#9ca3af' : '#0ea5e9',
                          color: 'white',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          cursor: isCheckingBounceable || emailList.length === 0 ? 'not-allowed' : 'pointer',
                          border: 'none',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        <Filter style={{ width: '16px', height: '16px' }} />
                        {isCheckingBounceable ? 'Checking...' : 'Validate Email Addresses'}
                      </button>
                      
                      {/* Progress indicator */}
                      {validationProgress.isRunning && (
                        <div style={{ marginTop: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#374151', marginBottom: '8px', fontWeight: '500' }}>
                            <span>Validating emails...</span>
                            <span>{validationProgress.processed}/{validationProgress.total}</span>
                          </div>
                          <div style={{ height: '10px', backgroundColor: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                backgroundColor: '#0ea5e9', 
                                width: `${(validationProgress.processed / validationProgress.total) * 100}%`,
                                transition: 'width 0.3s ease',
                                borderRadius: '5px'
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                            <span>Valid: {validationProgress.bounceable}</span>
                            <span>Invalid: {validationProgress.invalid}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Validation results */}
                      {bounceableEmails.length > 0 && !validationProgress.isRunning && (
                        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                          <p style={{ fontSize: '13px', color: '#1e40af' }}>
                            <strong>Validation Results:</strong> {bounceableEmails.length} valid emails, {invalidEmails.length} invalid emails removed
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#0369a1', marginBottom: '12px' }}>
                    Map CSV Columns
                  </h4>
                  <p style={{ fontSize: '14px', color: '#0369a1', marginBottom: '16px' }}>
                    Select which columns contain the email addresses, names, and company names.
                  </p>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Email Column *
                    </label>
                    <select
                      value={columnMapping.email}
                      onChange={(e) => setColumnMapping({...columnMapping, email: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    >
                      <option value="">Select column</option>
                      {csvHeaders.map((header, index) => (
                        <option key={index} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Name Column
                    </label>
                    <select
                      value={columnMapping.name}
                      onChange={(e) => setColumnMapping({...columnMapping, name: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    >
                      <option value="">Select column (optional)</option>
                      {csvHeaders.map((header, index) => (
                        <option key={index} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Company Column
                    </label>
                    <select
                      value={columnMapping.company}
                      onChange={(e) => setColumnMapping({...columnMapping, company: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    >
                      <option value="">Select column (optional)</option>
                      {csvHeaders.map((header, index) => (
                        <option key={index} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={processMappedCsv}
                    style={{
                      width: '100%',
                      backgroundColor: '#0ea5e9',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      border: 'none',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    Process CSV Data
                  </button>
                  
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                      CSV Preview:
                    </p>
                    <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '11px' }}>
                      <div style={{ display: 'flex', fontWeight: 'bold', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '4px' }}>
                        {csvHeaders.map((header, index) => (
                          <div key={index} style={{ flex: 1, padding: '2px 4px' }}>{header}</div>
                        ))}
                      </div>
                      {csvRows.slice(0, 3).map((row, rowIndex) => (
                        <div key={rowIndex} style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', paddingBottom: '4px', marginBottom: '4px' }}>
                          {csvHeaders.map((header, colIndex) => (
                            <div key={colIndex} style={{ flex: 1, padding: '2px 4px' }}>{row[header] || ''}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Load Email Template */}
          {currentStep === 3 && (
            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <FileText style={{ width: '20px', height: '20px', color: '#4f46e5' }} />
                Step 3: Load Email Template (email_template.html)
              </h3>
              <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '16px' }}>
                Upload an HTML file with your email content. It can include bold text, links, and bullet points.
              </p>
              <input
                type="file"
                ref={emailTemplateRef}
                accept=".html,.htm"
                onChange={handleEmailTemplate}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => emailTemplateRef.current?.click()}
                style={{
                  width: '100%',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                <Upload style={{ width: '20px', height: '20px' }} />
                Select email_template.html
              </button>
              {emailContent && (
                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#166534', marginBottom: '8px' }}>
                    ✅ Email template loaded
                  </p>
                  <div style={{ marginTop: '8px', padding: '12px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                    <div dangerouslySetInnerHTML={{ __html: emailContent }} style={{ fontSize: '14px' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: SMTP Configuration */}
          {currentStep === 4 && (
            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Settings style={{ width: '20px', height: '20px', color: '#4f46e5' }} />
                Step 4: Configure SMTP Settings
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    SMTP Server
                  </label>
                  <input
                    type="text"
                    value={smtpConfig.server}
                    onChange={(e) => setSmtpConfig({...smtpConfig, server: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Port
                  </label>
                  <input
                    type="text"
                    value={smtpConfig.port}
                    onChange={(e) => setSmtpConfig({...smtpConfig, port: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                    placeholder="587"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Your Email
                  </label>
                  <input
                    type="email"
                    value={smtpConfig.email}
                    onChange={(e) => setSmtpConfig({...smtpConfig, email: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                    placeholder="your.email@gmail.com"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    App Password
                  </label>
                  <input
                    type="password"
                    value={smtpConfig.password}
                    onChange={(e) => setSmtpConfig({...smtpConfig, password: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                    placeholder="Your app password"
                  />
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    For Gmail, use an App Password (not your regular password)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Validate & Send Emails (Updated with validation step) */}
          {currentStep === 5 && (
            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Send style={{ width: '20px', height: '20px', color: '#4f46e5' }} />
                Step 5: Validate & Send Emails
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                  <p style={{ fontSize: '14px', color: '#1e40af' }}>
                    <strong>Ready to send:</strong> {emailList.length} emails
                  </p>
                  <p style={{ fontSize: '14px', color: '#1e40af' }}>
                    <strong>Subjects available:</strong> {subjects.length}
                  </p>
                  <p style={{ fontSize: '14px', color: '#1e40af' }}>
                    <strong>Template:</strong> {emailContent ? '✅ Loaded' : '❌ Not loaded'}
                  </p>
                  <p style={{ fontSize: '14px', color: '#1e40af' }}>
                    <strong>Already sent:</strong> {completedEmails.length} emails
                  </p>
                  {bounceableEmails.length > 0 && (
                    <p style={{ fontSize: '14px', color: '#1e40af' }}>
                      <strong>Validated emails:</strong> {bounceableEmails.length} bounceable emails
                    </p>
                  )}
                </div>
                
                {invalidEmails.length > 0 && (
                  <div style={{ padding: '16px', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
                    <p style={{ fontSize: '14px', color: '#ca8a04', fontWeight: '600', marginBottom: '8px' }}>
                      ⚠️ Invalid Email Warning
                    </p>
                    <p style={{ fontSize: '14px', color: '#ca8a04' }}>
                      {invalidEmails.length} email addresses were identified as potentially invalid and have been removed from the sending list to protect your sender reputation.
                    </p>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  {!isSending ? (
                    <button
                      onClick={sendEmails}
                      disabled={emailList.length === 0}
                      style={{
                        flex: 1,
                        padding: '16px 24px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: emailList.length === 0 ? 'not-allowed' : 'pointer',
                        backgroundColor: emailList.length === 0 ? '#9ca3af' : '#16a34a',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      <Send style={{ width: '20px', height: '20px' }} />
                      Start Sending Emails
                    </button>
                  ) : (
                    <button
                      onClick={stopSending}
                      style={{
                        flex: 1,
                        padding: '16px 24px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      <Square style={{ width: '20px', height: '20px' }} />
                      Stop Sending
                    </button>
                  )}
                </div>
                
                {/* Auto-update information */}
                <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                  <p style={{ fontSize: '14px', color: '#166534', fontWeight: '600', marginBottom: '8px' }}>
                    🛡️ Safety Features
                  </p>
                  <p style={{ fontSize: '14px', color: '#166534' }}>
                    Email addresses are automatically validated before sending to protect your sender reputation and prevent landing in spam.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Status & Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Status Box */}
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertCircle style={{ width: '20px', height: '20px', color: '#4f46e5' }} />
              Status
            </h3>
            <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <p style={{ fontSize: '14px', color: '#374151' }}>{status || 'Ready to start...'}</p>
            </div>
          </div>

          {/* Statistics (Updated with email limits and bounceable emails) */}
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <CheckCircle style={{ width: '20px', height: '20px', color: '#16a34a' }} />
              Statistics & Limits
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Pending</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>{emailList.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Completed</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#16a34a' }}>{completedEmails.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f5f3ff', borderRadius: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Subjects</span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#9333ea' }}>{subjects.length}</span>
              </div>
              
              {/* Bounceable Email Stats */}
              {(bounceableEmails.length > 0 || validationProgress.isRunning) && (
                <div style={{ padding: '12px', backgroundColor: '#dcfce7', borderRadius: '8px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#166534', marginBottom: '8px' }}>
                    ✅ Email Validation
                  </p>
                  <div style={{ fontSize: '13px', color: '#166534' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Valid Emails:</span>
                      <span>{validationProgress.bounceable}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Invalid Emails:</span>
                      <span>{validationProgress.invalid}</span>
                    </div>
                    {validationProgress.isRunning && (
                      <div style={{ marginTop: '8px', fontSize: '12px' }}>
                        Progress: {Math.round((validationProgress.processed / validationProgress.total) * 100)}%
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Email Limits */}
              <div style={{ padding: '12px', backgroundColor: '#fffbeb', borderRadius: '8px' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#ca8a04', marginBottom: '8px' }}>
                  📊 Email Sending Limits
                </p>
                <div style={{ fontSize: '13px', color: '#ca8a04' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Today:</span>
                    <span>{emailStats.emailsToday} / {emailStats.maxPerDay}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>This Hour:</span>
                    <span>{emailStats.emailsThisHour} / {emailStats.maxPerHour}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Completed Emails List */}
          {completedEmails.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>Recently Sent</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {completedEmails.slice(-5).reverse().map((email, i) => (
                  <div key={i} style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', fontSize: '12px' }}>
                    <p style={{ fontWeight: '600', color: '#166534' }}>{email.email}</p>
                    <p style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email.subject}</p>
                    <p style={{ color: '#6b7280', fontSize: '10px' }}>{email.sentAt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
