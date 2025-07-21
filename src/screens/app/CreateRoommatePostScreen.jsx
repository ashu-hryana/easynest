// src/screens/app/CreateRoommatePostScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, CircularProgress, Paper, Stack, FormControl, FormLabel, RadioGroup, Radio, FormControlLabel } from '@mui/material';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import PlacesAutocomplete from '../../components/common/PlacesAutocomplete';
import { useNotification } from '../../contexts/NotificationContext.jsx';

const CreateRoommatePostScreen = () => {
    const { postId } = useParams();
    const isEditMode = Boolean(postId);

    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { showNotification } = useNotification();
    const [postData, setPostData] = useState({
        lookingFor: 'room_and_roommate', location: '', budget: '', preferences: '',
    });

    useEffect(() => {
        if (isEditMode) {
            const fetchPost = async () => {
                const postDocRef = doc(db, 'roommate_posts', postId);
                const docSnap = await getDoc(postDocRef);
                if (docSnap.exists()) {
                    setPostData(docSnap.data());
                }
                setLoading(false);
            };
            fetchPost();
        } else {
            setLoading(false);
        }
    }, [postId, isEditMode]);

    const handleChange = (e) => {
        setPostData(p => ({ ...p, [e.target.name]: e.target.value }));
    };

    const handleLocationSelect = (address) => {
        setPostData(p => ({ ...p, location: address }));
    };

    const handleSubmitPost = async () => {
        if (!postData.location || !postData.budget) {
            showNotification("Please fill in the location and your budget.");
            return;
        }
        setIsSaving(true);
        
        try {
            if (isEditMode) {
                const postDocRef = doc(db, 'roommate_posts', postId);
                await updateDoc(postDocRef, postData);
                showNotification('Your post has been updated!');
            } else {
                const postToSave = {
                    ...postData,
                    authorId: currentUser.uid,
                    authorName: currentUser.displayName,
                    authorPhotoURL: currentUser.photoURL,
                    createdAt: serverTimestamp(),
                    status: 'active'
                };
                await addDoc(collection(db, 'roommate_posts'), postToSave);
                showNotification('Your post has been published!');
            }
            navigate('/roommates');
        } catch (error) {
            console.error("Error saving post:", error);
            showNotification("Failed to save post.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA' }}>
            <Paper elevation={0} sx={{ backgroundColor: 'white', p: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                    {isEditMode ? 'Edit Your Requirement' : 'Post Your Roommate Requirement'}
                </Typography>
            </Paper>
            <Container maxWidth="sm" sx={{ py: 4 }}>
                <Stack spacing={3}>
                    {/* --- YEH SECTION WAPAS ADD HUA HAI --- */}
                    <FormControl component="fieldset">
                        <FormLabel component="legend">What are you looking for?</FormLabel>
                        <RadioGroup row name="lookingFor" value={postData.lookingFor} onChange={handleChange}>
                            <FormControlLabel value="room_and_roommate" control={<Radio />} label="A Room & a Roommate" />
                            <FormControlLabel value="only_roommate" control={<Radio />} label="Just a Roommate (I have a room)" />
                        </RadioGroup>
                    </FormControl>

                    <PlacesAutocomplete
                        label="Preferred Location / Area"
                        placeholder="e.g., Sector 15, Sonipat"
                        onSelect={handleLocationSelect}
                        initialValue={postData.location}
                    />
                    
                    <TextField
                        label="Your Monthly Budget (per person)"
                        name="budget"
                        type="number"
                        value={postData.budget}
                        onChange={handleChange}
                        placeholder="e.g., 8000"
                    />
                    
                    <TextField
                        label="Describe your ideal roommate/place"
                        name="preferences"
                        multiline
                        rows={4}
                        value={postData.preferences}
                        onChange={handleChange}
                        placeholder="e.g., Looking for a clean, non-smoking, studious roommate..."
                    />
                    {/* --- YAHAN TAK --- */}

                    <Button
                        variant="contained" size="large"
                        onClick={handleSubmitPost} disabled={isSaving}
                        sx={{ py: 1.5, backgroundColor: 'black' }}
                    >
                        {isSaving ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? 'Update Post' : 'Publish Post')}
                    </Button>
                </Stack>
            </Container>
        </Box>
    );
};

export default CreateRoommatePostScreen;
