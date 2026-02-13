import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', visible, onClose }) => {
    if (!visible) return null;

    const icons = {
        success: <CheckCircle size={20} color="var(--success-color)" />,
        error: <AlertCircle size={20} color="var(--error-color)" />,
        info: <Info size={20} color="var(--primary-color)" />
    };

    return (
        <div className="toast-container">
            <div className={`toast toast-${type}`}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    {icons[type] || icons.info}
                </div>
                <div className="toast-content">
                    <h4 className="toast-title">
                        {type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'}
                    </h4>
                    <p className="toast-message">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 0 }}
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default Toast;
