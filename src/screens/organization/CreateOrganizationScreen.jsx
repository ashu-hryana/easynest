// src/screens/organization/CreateOrganizationScreen.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, TextField, Button, CircularProgress,
    Paper, Stack, Avatar, IconButton, Alert, Tooltip
} from '@mui/material';
import { Edit, Business } from '@mui/icons-material';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';

// Cloudinary details
const CLOUDINARY_CLOUD_NAME = "dr0nc9xqj";
const CLOUDINARY_UPLOAD_PRESET = "easynest_preset";

const CreateOrganizationScreen = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const logoInputRef = useRef(null);
    
    const [isSaving, setIsSaving] = useState(false);
    const [orgData, setOrgData] = useState({
        orgName: '',
        orgDescription: '',
        orgLogoURL: '',
    });
    const [logoFile, setLogoFile] = useState(null);

    const handleChange = (e) => {
        setOrgData(p => ({ ...p, [e.target.name]: e.target.value }));
    };

    const handleLogoChange = (e) => {
        if (e.target.files[0]) {
            setLogoFile(e.target.files[0]);
            setOrgData(p => ({ ...p, orgLogoURL: URL.createObjectURL(e.target.files[0]) }));
        }
    };

    const handleCreateOrganization = async () => {
        if (!orgData.orgName) {
            showNotification("Please enter your business name.", "error");
            return;
        }
        if (!logoFile) {
            showNotification("Please upload a logo for your business.", "error");
            return;
        }

        setIsSaving(true);
        let finalLogoURL = '';

        // Step 1: Upload logo to Cloudinary
        const formData = new FormData();
        formData.append('file', logoFile);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
            const data = await response.json();
            if (data.secure_url) {
                finalLogoURL = data.secure_url;
            } else {
                throw new Error("Logo upload failed.");
            }
        } catch (error) {
            showNotification('Failed to upload logo. Please try again.', 'error');
            setIsSaving(false);
            return;
        }

        // Step 2: Save organization data to Firestore
        const orgCollectionRef = collection(db, 'organizations');
        const dataToSave = {
            ...orgData,
            orgLogoURL: finalLogoURL,
            admins: [currentUser.uid], // Current user is the first admin
            members: [currentUser.uid], // And also a member
            createdAt: serverTimestamp(),
        };

        try {
            // Create the new organization document
            const orgDocRef = await addDoc(orgCollectionRef, dataToSave);
            
            // Step 3: Update the user's profile to link them to this organization
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, {
                organizationId: orgDocRef.id,
                organizationName: dataToSave.orgName
            }, { merge: true });
            
            showNotification("Business profile created successfully!", "success");
            navigate('/owner/dashboard'); // Navigate to the dashboard
        } catch (error) {
            showNotification('Failed to create business profile.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
            <Container maxWidth="sm">
                <Paper sx={{ p: 4, borderRadius: 3 }}>
                    <Stack spacing={3} alignItems="center">
                        <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
                            <Business sx={{ fontSize: 50 }} />
                        </Avatar>
                        <Typography variant="h5" fontWeight="bold">Create Your Business Profile</Typography>

                        <input
                            type="file"
                            accept="image/*"
                            ref={logoInputRef}
                            onChange={handleLogoChange}
                            style={{ display: 'none' }}
                        />
                        <Tooltip title="Upload Business Logo">
                            <IconButton onClick={() => logoInputRef.current.click()}>
                                <Avatar src={orgData.orgLogoURL} sx={{ width: 100, height: 100 }} />
                            </IconButton>
                        </Tooltip>

                        <TextField
                            fullWidth
                            label="Business or Company Name"
                            name="orgName"
                            value={orgData.orgName}
                            onChange={handleChange}
                        />
                        <TextField
                            fullWidth
                            label="Short Description about your Business"
                            name="orgDescription"
                            multiline
                            rows={3}
                            value={orgData.orgDescription}
                            onChange={handleChange}
                        />
                        
                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleCreateOrganization}
                            disabled={isSaving}
                            sx={{ py: 1.5 }}
                        >
                            {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Create and Continue'}
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
};

export default CreateOrganizationScreen;