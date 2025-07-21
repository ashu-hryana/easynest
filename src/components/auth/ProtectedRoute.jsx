import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { currentUser } = useAuth();

    if (!currentUser) {
        // Agar user login nahi hai, to login page par redirect kar do
        return <Navigate to="/login" />;
    }

    return children; // Agar login hai, to page dikhao
};

export default ProtectedRoute;