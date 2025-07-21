import React, { createContext, useState, useContext } from 'react';
import { Snackbar, Alert } from '@mui/material';

const NotificationContext = createContext();

export const useNotification = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success', // 'success', 'error', 'warning', 'info'
    });

    const showNotification = (message, severity = 'success') => {
        setNotification({ open: true, message, severity });
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setNotification(prev => ({ ...prev, open: false }));
    };

    const value = {
        showNotification,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleClose} severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </NotificationContext.Provider>
    );
};