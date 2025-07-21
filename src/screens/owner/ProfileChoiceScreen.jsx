// src/screens/owner/ProfileChoiceScreen.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, Button, Paper, Stack,
    CircularProgress, Tooltip
} from '@mui/material';
import { Person, Business } from '@mui/icons-material';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';

const ProfileChoiceScreen = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(false);

    const handleChoice = async (accountType) => {
        if (!currentUser) {
            showNotification("You need to be logged in.", "error");
            return;
        }

        setLoading(true);
        const userDocRef = doc(db, 'users', currentUser.uid);

        try {
            await setDoc(userDocRef, { accountType: accountType }, { merge: true });
            
            showNotification("Profile type saved successfully!", "success");

            // --- YEH LINE UPDATE HUI HAI ---
            if (accountType === 'business') {
                // Ab yeh naye 'Create Organization' page par bhejega
                navigate('/organization/create'); 
            } else {
                navigate('/owner/dashboard');
            }

        } catch (error) {
            console.error("Error updating account type: ", error);
            showNotification("Failed to save your choice. Please try again.", "error");
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#F8F9FA'
            }}
        >
            <Container component="main" maxWidth="sm">
                <Paper sx={{ p: {xs: 2, sm: 4}, textAlign: 'center', borderRadius: 4, boxShadow: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                        How will you be using EasyNest?
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 4 }}>
                        Choose your account type. This helps us tailor your experience.
                    </Typography>

                    <Stack spacing={3}>
                        <Paper 
                            elevation={0}
                            variant="outlined"
                            onClick={() => handleChoice('individual')}
                            sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'center', textAlign: 'left', cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' } }}
                        >
                            <Person sx={{ fontSize: 40, color: 'primary.main' }} />
                            <Box>
                                <Typography fontWeight="bold">I'm an Individual Owner</Typography>
                                <Typography variant="body2" color="text.secondary">Listing my own properties.</Typography>
                            </Box>
                        </Paper>

                        <Paper 
                            elevation={0}
                            variant="outlined"
                            onClick={() => handleChoice('business')}
                            sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'center', textAlign: 'left', cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' } }}
                        >
                            <Business sx={{ fontSize: 40, color: 'primary.main' }} />
                            <Box>
                                <Typography fontWeight="bold">I'm a Business</Typography>
                                <Typography variant="body2" color="text.secondary">Managing multiple properties for a company.</Typography>
                            </Box>
                        </Paper>

                        {loading && <CircularProgress sx={{ mt: 2 }} />}
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
};

export default ProfileChoiceScreen;
