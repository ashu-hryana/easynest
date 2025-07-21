// src/screens/app/EditStudentProfileScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, TextField, Button, CircularProgress,
    Paper, Stack, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Chip, Avatar, Badge, IconButton, Alert, Divider
} from '@mui/material';
import { Edit, CloudUpload, CheckCircle, HourglassEmpty } from '@mui/icons-material';
// --- YEH LINE UPDATE HUI HAI ---
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import PlacesAutocomplete from '../../components/common/PlacesAutocomplete';

const OCR_API_KEY = "K83213374788957";
const CLOUDINARY_CLOUD_NAME = "dr0nc9xqj";
const CLOUDINARY_UPLOAD_PRESET = "easynest_preset";

const LANGUAGES = ['Haryanvi', 'English', 'Hindi', 'Punjabi', 'Bengali', 'Marathi', 'Tamil', 'Telugu'];
const HABITS = ['Non-Smoker, Non-Drinker', 'Smoker', 'Drinker', 'Prefers not to say'];
const HOOKAH_HABITS = ['Yes', 'No', 'Occasionally'];

const EditStudentProfileScreen = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const profilePicInputRef = useRef(null);
    const idCardInputRef = useRef(null);
    
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    
    const [profileData, setProfileData] = useState({
        photoURL: '', hometown: '', college: '', course: '', year: '',
        bio: '', languages: [], habits: '', hookah: '',
        verificationStatus: 'not_verified',
    });
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [idCardFile, setIdCardFile] = useState(null);

    useEffect(() => {
        if (currentUser) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            getDoc(userDocRef).then(docSnap => {
                if (docSnap.exists()) {
                    setProfileData(prevData => ({ ...prevData, ...docSnap.data() }));
                }
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [currentUser]);

    const handleChange = (e) => setProfileData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleAutocompleteSelect = (field, value) => setProfileData(p => ({ ...p, [field]: value }));
    const handlePhotoChange = (e) => {
        if (e.target.files[0]) {
            setProfilePictureFile(e.target.files[0]);
            setProfileData(p => ({ ...p, photoURL: URL.createObjectURL(e.target.files[0]) }));
        }
    };
    const handleIdCardChange = (e) => { if (e.target.files[0]) { setIdCardFile(e.target.files[0]); } };

    const handleSaveProfile = async () => {
        if (!currentUser) return;
        setIsSaving(true);
        let finalPhotoURL = profileData.photoURL;

        if (profilePictureFile) {
            const formData = new FormData();
            formData.append('file', profilePictureFile);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            try {
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
                const data = await response.json();
                if (data.secure_url) { finalPhotoURL = data.secure_url; }
            } catch (error) {
                showNotification('Failed to upload profile picture.', 'error');
                setIsSaving(false); return;
            }
        }

        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
            const dataToSave = { ...profileData, photoURL: finalPhotoURL };
            await setDoc(userDocRef, dataToSave, { merge: true });
            showNotification('Profile updated successfully!', 'success');
            navigate('/profile');
        } catch (error) {
            showNotification('Failed to update profile.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleVerificationSubmit = async () => {
        if (!idCardFile) { showNotification("Please select your College ID card.", "error"); return; }
        setIsVerifying(true);

        const formData = new FormData();
        formData.append('file', idCardFile);
        formData.append('apikey', OCR_API_KEY);

        try {
            const ocrResponse = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: formData });
            const ocrResult = await ocrResponse.json();

            if (ocrResult.IsErroredOnProcessing || !ocrResult.ParsedResults?.[0]?.ParsedText) {
                throw new Error("Could not read text from image.");
            }
            
            const extractedText = ocrResult.ParsedResults[0].ParsedText.toLowerCase();
            const userName = currentUser.displayName.toLowerCase();

            if (!extractedText.includes(userName.split(' ')[0])) {
                throw new Error("Your name could not be found on the ID card.");
            }

            const regMatch = extractedText.match(/\b(\d{8,12})\b/);
            if (!regMatch) throw new Error("Registration number not found on the ID.");
            const regNumber = regMatch[0];

            const usersRef = collection(db, "users");
            const q = query(usersRef, where("registrationNumber", "==", regNumber));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty && querySnapshot.docs.some(doc => doc.id !== currentUser.uid)) {
                throw new Error("This ID card is already registered with another account.");
            }
            
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, { 
                registrationNumber: regNumber,
                verificationStatus: 'verified',
            }, { merge: true });
            
            showNotification("Profile Verified Successfully!", "success");
            setProfileData(p => ({ ...p, verificationStatus: 'verified', registrationNumber: regNumber }));

        } catch (error) {
            showNotification(error.message, "error");
        } finally {
            setIsVerifying(false);
        }
    };

    if (loading) { return <CircularProgress />; }

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA' }}>
            <Paper elevation={0} sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold">Edit Profile</Typography>
            </Paper>
            <Container maxWidth="sm" sx={{ py: 4 }}>
                <Stack spacing={3}>
                    <Stack alignItems="center">
                        <input type="file" accept="image/*" ref={profilePicInputRef} onChange={handlePhotoChange} style={{ display: 'none' }} />
                        <Badge badgeContent={ <IconButton onClick={() => profilePicInputRef.current.click()} sx={{ bgcolor: 'background.paper', p: 0.5 }}><Edit fontSize="small" /></IconButton> } overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                            <Avatar src={profileData.photoURL} sx={{ width: 120, height: 120 }}>{currentUser?.displayName?.[0]}</Avatar>
                        </Badge>
                    </Stack>
                    
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Stack spacing={2}>
                             <Typography variant="h6" fontWeight="bold">Personal & Academic Info</Typography>
                             <PlacesAutocomplete label="Hometown" onSelect={(val) => handleAutocompleteSelect('hometown', val)} initialValue={profileData.hometown} />
                             <PlacesAutocomplete label="College/University" onSelect={(val) => handleAutocompleteSelect('college', val)} initialValue={profileData.college} />
                             <Stack direction="row" spacing={2}><TextField fullWidth label="Course" name="course" value={profileData.course || ''} onChange={handleChange} /><TextField fullWidth label="Year" name="year" value={profileData.year || ''} onChange={handleChange} /></Stack>
                             <TextField fullWidth label="About Me / Bio" name="bio" multiline rows={4} value={profileData.bio || ''} onChange={handleChange} />
                        </Stack>
                    </Paper>

                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Stack spacing={2}>
                             <Typography variant="h6" fontWeight="bold">Lifestyle & Habits</Typography>
                             <FormControl fullWidth><InputLabel>Languages</InputLabel><Select name="languages" multiple value={profileData.languages || []} onChange={handleChange} input={<OutlinedInput label="Languages" />} renderValue={(selected) => ( <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map((value) => (<Chip key={value} label={value} />))}</Box>)}>{LANGUAGES.map((lang) => (<MenuItem key={lang} value={lang}>{lang}</MenuItem>))}</Select></FormControl>
                             <FormControl fullWidth><InputLabel>Smoking/Drinking</InputLabel><Select name="habits" value={profileData.habits || ''} label="Smoking/Drinking" onChange={handleChange}>{HABITS.map(habit => (<MenuItem key={habit} value={habit}>{habit}</MenuItem>))}</Select></FormControl>
                             {profileData.languages?.includes('Haryanvi') && (<FormControl fullWidth><InputLabel>Hookah</InputLabel><Select name="hookah" value={profileData.hookah || ''} label="Hookah" onChange={handleChange}>{HOOKAH_HABITS.map(habit => (<MenuItem key={habit} value={habit}>{habit}</MenuItem>))}</Select></FormControl>)}
                        </Stack>
                    </Paper>
                    
                    <Button variant="contained" size="large" onClick={handleSaveProfile} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Profile Changes'}
                    </Button>
                    
                    <Divider><Typography variant="overline">Verification</Typography></Divider>
                    
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: profileData.verificationStatus === 'verified' ? 'success.main' : 'inherit' }}>
                        {profileData.verificationStatus === 'verified' ? (
                            <Alert severity="success" icon={<CheckCircle />}>Your profile is verified using your ID card.</Alert>
                        ) : ( <>
                                <Typography sx={{ mb: 1 }}>Verify your profile to build trust in the community.</Typography>
                                <input type="file" accept="image/*" onChange={handleIdCardChange} style={{ display: 'none' }} id="id-card-upload" />
                                <label htmlFor="id-card-upload"><Button variant="outlined" component="span" startIcon={<CloudUpload />}>Select ID Card</Button></label>
                                {idCardFile && <Typography variant="body2" sx={{ mt: 1 }}>Selected: {idCardFile.name}</Typography>}
                                <Button variant="contained" onClick={handleVerificationSubmit} disabled={!idCardFile || isVerifying} sx={{ display: 'block', mx: 'auto', mt: 2 }}>
                                    {isVerifying ? <CircularProgress size={24} /> : 'Verify with ID Card'}
                                </Button>
                            </>
                        )}
                    </Paper>
                </Stack>
            </Container>
        </Box>
    );
};
export default EditStudentProfileScreen;
