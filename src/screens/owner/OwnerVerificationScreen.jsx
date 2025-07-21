// src/screens/owner/OwnerVerificationScreen.jsx

import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Stack, Paper, Divider, Chip, Icon, Alert, CircularProgress } from '@mui/material';
import { CloudUpload, CheckCircle, HourglassEmpty, Cancel } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// Cloudinary details
const CLOUDINARY_CLOUD_NAME = "dr0nc9xqj";
const CLOUDINARY_UPLOAD_PRESET = "easynest_preset";

const VerificationStep = ({ title, description, status, onUpload, isUploading }) => {
    const getStatusIcon = () => {
        switch(status) {
            case 'VERIFIED': return <CheckCircle color="success" />;
            case 'PENDING': return <HourglassEmpty color="warning" />;
            case 'REJECTED': return <Cancel color="error" />;
            default: return <CloudUpload />;
        }
    };

    return (
        <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Icon component={getStatusIcon} sx={{ fontSize: '2.5rem' }} />
            <Box flexGrow={1}>
                <Typography fontWeight="bold">{title}</Typography>
                <Typography variant="body2" color="text.secondary">{description}</Typography>
            </Box>
            {status === 'NOT_UPLOADED' && (
                 <Button variant="contained" component="label" startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}>
                    {isUploading ? 'Uploading...' : 'Upload'}
                    <input type="file" hidden onChange={(e) => onUpload(e.target.files[0])} disabled={isUploading} />
                </Button>
            )}
            {status === 'PENDING' && <Chip label="Pending" color="warning" />}
            {status === 'VERIFIED' && <Chip label="Verified" color="success" />}
        </Paper>
    );
};


const OwnerVerificationScreen = () => {
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isIdUploading, setIsIdUploading] = useState(false);
    const [isAddressUploading, setIsAddressUploading] = useState(false);
    
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists()) {
                    setUserProfile(docSnap.data());
                }
            }
            setLoading(false);
        };
        fetchUserProfile();
    }, [currentUser]);


    const handleFileUpload = async (file, documentType) => {
        if (!file) return;

        if (documentType === 'idProof') setIsIdUploading(true);
        if (documentType === 'addressProof') setIsAddressUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        try {
            // Step 1: Upload to Cloudinary
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (!data.secure_url) {
                throw new Error("File upload failed.");
            }

            // Step 2: Update Firestore
            const userDocRef = doc(db, 'users', currentUser.uid);
            const docUpdate = {
                [documentType]: {
                    url: data.secure_url,
                    status: 'PENDING',
                    uploadedAt: new Date(),
                },
                verificationStatus: 'PENDING', // Update overall status
            };
            await updateDoc(userDocRef, docUpdate);
            
            // Step 3: Update UI
            setUserProfile(prev => ({ ...prev, ...docUpdate }));
            showNotification(`${documentType === 'idProof' ? 'Identity' : 'Address'} proof submitted for verification.`, "success");

        } catch (error) {
            console.error("Error uploading file:", error);
            showNotification("Upload failed. Please try again.", "error");
        } finally {
            if (documentType === 'idProof') setIsIdUploading(false);
            if (documentType === 'addressProof') setIsAddressUploading(false);
        }
    };
    
    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA', py: 4, minHeight: '100vh' }}>
            <Container maxWidth="md">
                <Typography variant="h4" fontWeight="bold">Owner Verification</Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Become a Verified Owner to build trust with students and get more bookings.
                </Typography>

                <Alert severity="info" sx={{mb: 3}}>
                    Your documents are reviewed manually and kept private. Verification usually takes 24-48 hours.
                </Alert>

                <Stack spacing={3}>
                    <VerificationStep 
                        title="Identity Proof (Aadhaar/PAN)"
                        description="Upload a clear photo of your ID card."
                        status={userProfile?.idProof?.status || 'NOT_UPLOADED'}
                        onUpload={(file) => handleFileUpload(file, 'idProof')}
                        isUploading={isIdUploading}
                    />
                     <VerificationStep 
                        title="Property Address Proof"
                        description="Upload a recent electricity or water bill of the listed property."
                        status={userProfile?.addressProof?.status || 'NOT_UPLOADED'}
                        onUpload={(file) => handleFileUpload(file, 'addressProof')}
                        isUploading={isAddressUploading}
                    />
                </Stack>

                <Divider sx={{ my: 4 }}>
                    <Chip label="Current Status" />
                </Divider>

                <Box textAlign="center">
                    <Typography variant="h6">
                        Your verification status is: 
                        <Typography component="span" variant="h6" color={userProfile?.verificationStatus === 'VERIFIED' ? 'success.main' : 'warning.main'} sx={{fontWeight: 'bold', ml:1}}>
                           {(userProfile?.verificationStatus || 'NOT_VERIFIED').replace('_', ' ')}
                        </Typography>
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default OwnerVerificationScreen;

