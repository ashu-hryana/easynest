// src/screens/app/EditStudentProfileScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Paper,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    OutlinedInput,
    Chip,
    Avatar,
    Badge,
    IconButton,
    Alert,
    Divider,
    useTheme,
    alpha,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Card,
    CardContent,
    useMediaQuery,
    Fab
} from '@mui/material';
import {
    Edit as EditIcon,
    CloudUpload as CloudUploadIcon,
    CheckCircle as CheckCircleIcon,
    PhotoCamera as PhotoCameraIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    Crop,
    Rotate90,
    Visibility,
    VisibilityOff,
    Person,
    Email,
    Phone,
    BusinessCenter,
    School,
    Language,
    SmokingRooms,
    LocalBar,
    AccountCircle
} from '@mui/icons-material';
import { format } from 'date-fns';

// Firebase imports
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import PlacesAutocomplete from '../../components/common/PlacesAutocomplete';
import { avatarService } from '../../services/avatarService.js';
  const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
    [avatarPreview, setAvatarPreview] = useState(null);
    [uploadProgress, setUploadProgress] = useState(0);

    const [profileData, setProfileData] = useState({
        photoURL: '', hometown: '', college: '', course: '', year: '',
        bio: '', languages: [], habits: '', hookah: '',
        verificationStatus: 'not_verified',
        dateOfBirth: '', nationality: '', gender: '',
        phoneVerified: false
    });

    // Avatar upload states
    const [avatarFile, setAvatarFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    [cropDialogOpen, setCropDialogOpen] = useState(false);
    [cropImageSrc, setCropImageSrc] = useState('');
    const idCardInputRef = useRef(null);

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

    const handleChange = useCallback((e) => {
        setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);

    const handleAutocompleteSelect = useCallback((field, value) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleAvatarClick = useCallback(() => {
        setAvatarDialogOpen(true);
    }, []);

    const handleAvatarClose = useCallback(() => {
        setAvatarDialogOpen(false);
        setAvatarPreview(null);
        setCropImageSrc('');
        setUploadError('');
    }, []);

    const handleAvatarSelect = useCallback((file) => {
        if (!file) return;

        setIsUploading(true);
        setUploadProgress(0);
        setUploadError('');

        avatarService.createAvatarPreview(file)
            .then(preview => {
                setAvatarPreview(preview);
                setAvatarFile(preview.file);
                setUploadProgress(100);
                setUploadError('');
                setIsUploading(false);
            })
            .catch(error => {
                setUploadError(error.message);
                setIsUploading(false);
            });
    }, []);

    const handleAvatarCrop = useCallback(() => {
        if (!avatarPreview) return;

        // Create cropping interface for square crop
        const cropperOptions = {
            aspectRatio: 1,
            guides: true,
            viewMode: 1,
            dragMode: 'move',
            responsive: true,
            restore: false,
            checkOrientation: false,
            checkCrossOrigin: false
        };

        // Create image for cropping
        const img = new Image();
        img.onload = () => {
            setCropImageSrc(avatarPreview.preview);
            setCropDialogOpen(true);
        };
        img.src = avatarPreview.preview;
    }, [avatarPreview]);

    const handleCroppedAvatar = useCallback(() => {
        if (!cropImageSrc) return;

        avatarService.cropToSquare(avatarPreview.file)
            .then(croppedFile => {
                setAvatarFile(croppedFile);
                setProfileData(prev => ({ ...prev, photoURL: URL.createObjectURL(croppedFile) }));
                setCropDialogOpen(false);
                setCropImageSrc('');
                showNotification('Avatar cropped successfully!', 'success');
            })
            .catch(error => {
                showNotification('Failed to crop avatar. Please try again.', 'error');
                setCropDialogOpen(false);
                setCropImageSrc('');
            });
    }, [cropImageSrc]);

    const handleAvatarSave = useCallback(async () => {
        if (!avatarFile) {
            handleAvatarSelect();
            return;
        }

        setIsUploading(true);
        setUploadProgress(50);

        try {
            const result = await avatarService.uploadAvatar(avatarFile, {
                folder: `avatars/${currentUser.uid}`,
                tags: ['profile', 'student'],
                transformation: avatarService.getTransformationOptions('profile')
            });

            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, {
                ...profileData,
                photoURL: result.url,
                avatarPublicId: result.public_id,
                avatarWidth: result.width,
                avatarHeight: result.height,
                avatarFormat: result.format
            }, { merge: true });

            showNotification('Avatar uploaded successfully!', 'success');
            setAvatarDialogOpen(false);
            setAvatarPreview(null);
            setIsUploading(false);
        } catch (error) {
            setUploadError(error.message);
            setIsUploading(false);
        }
    }, [avatarFile, currentUser, profileData]);

    const handleRemoveAvatar = useCallback(async () => {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const avatarPublicId = avatarService.extractPublicIdFromUrl(profileData.photoURL);

        if (avatarPublicId) {
            try {
                await avatarService.deleteAvatar(avatarPublicId);
                await updateDoc(userDocRef, { photoURL: '', avatarPublicId: '' }, { merge: true });
                setProfileData(prev => ({ ...prev, photoURL: '', avatarPublicId: '' }));
                showNotification('Avatar removed successfully', 'info');
            } catch (error) {
                showNotification('Failed to remove avatar', 'error');
            }
        } else {
            setProfileData(prev => ({ ...prev, photoURL: '' }));
        }
    }, [profileData.photoURL, currentUser]);

    const handleSaveProfile = async () => {
        if (!currentUser) return;
        setIsSaving(true);

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, {
                ...profileData,
                profileCompleted: true,
                updatedAt: new Date.now().toISOString()
            }, { merge: true });

            showNotification('Profile updated successfully!', 'success');
            navigate('/profile');
        } catch (error) {
            console.error('Failed to update profile:', error);
            showNotification('Failed to update profile', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleVerificationSubmit = async () => {
        if (!idCardFile) {
            showNotification("Please select your College ID card.", "error");
            return;
        }
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
            if (!regMatch) throw new Error("Registration number not found on the ID card.");
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

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <CircularProgress size={40} />
            </Box>
        );
    }

    return (
        <Box sx={{
            flexGrow: 1,
            backgroundColor: 'background.default',
            minHeight: '100vh',
            pb: { xs: '80px', md: 0 }
        }}>
            <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
                {/* Profile Header */}
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                        Edit Profile
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Customize your profile information
                    </Typography>
                </Box>

                {/* Avatar Section */}
                <Paper
                    elevation={2}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #FF385C 0%, #E01E5A 100%)',
                        color: 'white',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        mb: 4
                    }}
                >
                    <Stack spacing={3} alignItems="center">
                        <Box sx={{ position: 'relative' }}>
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                sx={{
                                    '& .MuiBadge-badge': {
                                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                                        color: 'text.primary',
                                    '&:hover': {
                                            bgcolor: 'rgba(255, 255, 255, 0.3)',
                                        }
                                    }
                                }}
                            >
                                <IconButton
                                    onClick={handleAvatarClick}
                                    sx={{
                                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                                        color: 'text.primary',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 1)',
                                        },
                                    }}
                                >
                                    <PhotoCamera />
                                </IconButton>
                            </Badge>
                            <Avatar
                                src={profileData.photoURL || ''}
                                sx={{
                                    width: 120,
                                    height: 120,
                                    border: '3px solid rgba(255, 255, 255, 0.3)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                }}
                            >
                                {currentUser?.displayName?.[0] || 'U'}
                            </Avatar>
                        </Box>

                        <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                            Profile Picture
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            {profileData.photoURL ? 'Click to change' : 'Add a profile picture'}
                        </Typography>
                    </Stack>

                    {/* Avatar Stats */}
                    {profileData.photoURL && (
                        <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                                <Chip
                                    size="small"
                                    label={`${profileData.avatarWidth || '200'}x${profileData.avatarHeight || '200'}`}
                                    sx={{
                                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        fontSize: '0.75rem'
                                    }}
                                />
                                <Chip
                                    size="small"
                                    label={profileData.avatarFormat || 'webp' || 'jpg'}
                                    sx={{
                                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        fontSize: '0.75rem'
                                    }}
                                />
                            </Box>
                        </Box>
                    )}
                </Paper>

                {/* Quick Actions */}
                <Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ mb: 3 }}>
                    <Button
                        variant="contained"
                        component="label"
                        onClick={handleAvatarClick}
                        startIcon={<PhotoCamera />}
                        sx={{
                            borderRadius: 2,
                            py: 1.5,
                            px: 3,
                            background: 'linear-gradient(135deg, #FF385C 0%, #E01E5A 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #E01E5A 0%, #D10134 100%)',
                            },
                            color: 'white'
                        }}
                    >
                        Change Avatar
                    </Button>
                    {profileData.photoURL && (
                        <Button
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            onClick={handleRemoveAvatar}
                            sx={{
                                borderRadius: 2,
                                py: 1.5,
                                px: 3,
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                color: 'text.primary',
                                '&:hover': {
                                    borderColor: 'rgba(255, 56, 52, 0.5)',
                                color: 'text.primary',
                                backgroundColor: alpha(theme.palette.primary.main, 0.04)
                                }
                            }}
                        >
                            Remove
                        </Button>
                    )}
                </Stack>

                {/* Personal Information */}
                <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                        Personal Information
                    </Typography>

                    <Stack spacing={3}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Full Name"
                                    name="fullName"
                                    value={profileData.fullName || ''}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Person />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            backgroundColor: 'grey.50',
                                            '&:hover': { backgroundColor: 'grey.100' },
                                            '& fieldset': { border: 'none' }
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={currentUser?.email || ''}
                                    disabled
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Email />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .Mui-disabled .MuiInputBase-input': {
                                            color: 'text.disabled'
                                        }
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    name="phoneNumber"
                                    value={profileData.phoneNumber || ''}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Phone />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            backgroundColor: 'grey.50',
                                            '&:hover': { backgroundColor: 'grey.100' },
                                            '& fieldset': { border: 'none' }
                                        }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Date of Birth</InputLabel>
                                    <TextField
                                        type="date"
                                        name="dateOfBirth"
                                        value={profileData.dateOfBirth || ''}
                                        onChange={handleChange}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                backgroundColor: 'grey.50',
                                                '&:hover': { backgroundColor: 'grey.100' },
                                                '& fieldset': { border: 'none' }
                                        }}
                                    />
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Gender</InputLabel>
                                    <Select
                                        name="gender"
                                        value={profileData.gender || ''}
                                        onChange={handleChange}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                backgroundColor: 'grey.50',
                                                '&:hover': { backgroundColor: 'grey.100' },
                                                '& fieldset': { border: 'none' }
                                        }}
                                    >
                                        <MenuItem value="">Select Gender</MenuItem>
                                        <MenuItem value="male">Male</MenuItem>
                                        <MenuItem value="female">Female</MenuItem>
                                        <MenuItem value="other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Nationality</InputLabel>
                                    <Select
                                        name="nationality"
                                        value={profileData.nationality || ''}
                                        onChange={handleChange}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                backgroundColor: 'grey.50',
                                                '&:hover': { backgroundColor: 'grey.100' },
                                                '& fieldset': { border: 'none' }
                                        }}
                                    >
                                        {phoneVerificationService.getNationalities().map(nat => (
                                            <MenuItem key={nat.code} value={nat.code}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <span>{nat.flag}</span>
                                                    <span>{nat.name}</span>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Stack>
                </Paper>

                {/* Academic Information */}
                <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                        Academic Information
                    </Typography>

                    <Stack spacing={3}>
                        <PlacesAutocomplete
                            label="Hometown"
                            onSelect={(val) => handleAutocompleteSelect('hometown', val)}
                            initialValue={profileData.hometown || ''}
                        />
                        <PlacesAutocomplete
                            label="College/University"
                            onSelect={(val) => handleAutocompleteSelect('college', val)}
                            initialValue={profileData.college || ''}
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                fullWidth
                                label="Course"
                                name="course"
                                value={profileData.course || ''}
                                onChange={handleChange}
                                sx={{ flex: { xs: 1, sm: 0.5 } }}
                            />
                            <TextField
                                fullWidth
                                label="Year"
                                name="year"
                                value={profileData.year || ''}
                                onChange={handleChange}
                                sx={{ flex: { xs: 1, sm: 0.5 } }}
                            />
                        </Stack>
                        <TextField
                            fullWidth
                            label="About Me / Bio"
                            name="bio"
                            multiline
                            rows={4}
                            value={profileData.bio || ''}
                            onChange={handleChange}
                            InputProps={{
                                sx: {
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        backgroundColor: 'grey.50',
                                        '&:hover': { backgroundColor: 'grey.100' },
                                        '& fieldset': { border: 'none' }
                                }
                            }}
                        />
                    </Stack>
                </Paper>

                {/* Lifestyle & Habits */}
                <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                        Lifestyle & Habits
                    </Typography>

                    <Stack spacing={3}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Languages</InputLabel>
                                    <Select
                                        name="languages"
                                        multiple
                                        value={profileData.languages || []}
                                        onChange={handleChange}
                                        input={<OutlinedInput label="Select Languages" />}
                                        renderValue={(selected) => (
                                            <Box sx={{
                                                display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 1
                                                }}
                                                >
                                                {selected.map((value) => (
                                                    <Chip
                                                        key={value}
                                                        label={value}
                                                        size="small"
                                                        color="primary"
                                                    />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {LANGUAGES.map((lang) => (
                                            <MenuItem key={lang} value={lang}>{lang}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Smoking/Drinking</InputLabel>
                                    <Select
                                        name="habits"
                                        value={profileData.habits || ''}
                                        onChange={handleChange}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                backgroundColor: 'grey.50',
                                                '&:hover': { backgroundColor: 'grey.100' },
                                                '& fieldset': { border: 'none' }
                                        }}
                                    >
                                        {HABITS.map(habit => (
                                            <MenuItem key={habit}>{habit}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {profileData.languages?.includes('Haryanvi') && (
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Hookah</InputLabel>
                                        <Select
                                            name="hookah"
                                            value={profileData.hookah || ''}
                                            onChange={handleChange}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2,
                                                    backgroundColor: 'grey.50',
                                                    '&:hover': { backgroundColor: 'grey.100' },
                                                    '& fieldset': { border: 'none' }
                                                }}
                                        >
                                            {HOOKAH_HABITS.map(habit => (
                                                <MenuItem key={habit}>{habit}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            )}
                        </Grid>
                    </Stack>
                </Paper>

                {/* Contact Information */}
                <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                        Contact Information
                    </Typography>

                    <Stack spacing={3}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                                    📧 Address
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {userDetails?.businessAddress || 'Not specified'}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Stack>
                </Paper>

                {/* Action Buttons */}
                <Stack spacing={2} sx={{ mb: 4 }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        sx={{
                            background: 'linear-gradient(135deg, #FF385C 0%, #E01E5A 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #E01E5A 0%, #D10134 100%)',
                            },
                            color: 'white',
                            py: 2,
                            px: 4,
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 500
                        }}
                    >
                        {isSaving ? 'Saving...' : 'Save Profile'}
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={() => navigate('/profile')}
                        sx={{
                            borderRadius: 3,
                            px: 4,
                            py: 2,
                            textTransform: 'none',
                            fontWeight: 500,
                            borderColor: 'divider'
                        }}
                    >
                        Cancel
                    </Button>
                </Stack>

                {/* Verification Section */}
                <Paper sx={{
                    p: 4,
                    borderRadius: 3,
                    mb: 3,
                    backgroundColor:
                        profileData.verificationStatus === 'verified'
                            ? alpha(theme.palette.success.light, 0.1)
                            : alpha(theme.palette.warning.light, 0.1),
                    border: profileData.verificationStatus === 'verified' ? `1px solid ${theme.palette.success.main}` : `1px solid ${theme.palette.warning.main}`
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        {profileData.verificationStatus === 'verified' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                                <CheckCircle />
                                <Typography variant="body1">
                                    Your profile is verified using your ID card.
                                </Typography>
                            </Box>
                        ) : (
                            <>
                                <Alert
                                    severity="info"
                                    icon={<HourglassEmpty fontSize="inherit" />}
                                    sx={{ mb: 2 }}
                                >
                                    <Typography variant="body1">
                                        Verify your profile to build trust in the community.
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                        Add your ID card to complete verification
                                    </Typography>
                                </Alert>
                            )}
                        </Typography>

                        {profileData.verificationStatus === 'not_verified' && (
                            <Stack spacing={2}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleIdCardChange}
                                    ref={idCardInputRef}
                                    style={{ display: 'none' }}
                                    id="id-card-upload"
                                />
                                <Button
                                    variant="contained"
                                    onClick={handleVerificationSubmit}
                                    disabled={!idCardFile || isVerifying}
                                    startIcon={<CloudUpload />}
                                    sx={{
                                        display: 'block',
                                        mx: 'auto',
                                        mt: 2,
                                        background: 'linear-gradient(135deg, #FF385C 0%, #E01E5A 100%)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #E01E5A 0%, #D10134 100%)',
                                        },
                                        color: 'white',
                                        py: 2,
                                        px: 4,
                                        borderRadius: 3,
                                        textTransform: 'none',
                                        fontWeight: 500
                                    }}
                                >
                                    {isVerifying ? <CircularProgress size={24} color="inherit" /> : 'Verify with ID Card'}
                                </Button>

                                {idCardFile && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        Selected: {idCardFile.name}
                                    </Typography>
                                )}
                            </Stack>
                        )}
                    </Paper>
            </Container>

            {/* Avatar Upload Dialog */}
            <Dialog
                open={avatarDialogOpen}
                onClose={handleAvatarClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle sx={{ pb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Upload Profile Picture
                    </Typography>
                    <IconButton
                        onClick={handleAvatarClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: 'text.secondary',
                            '&:hover': { color: 'text.primary' }
                        }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ pt: 1, pb: 1 }}>
                    {avatarPreview ? (
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Box sx={{ mb: 2, position: 'relative', display: 'inline-block' }}>
                                <img
                                    src={avatarPreview.preview}
                                    alt="Avatar Preview"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '300px',
                                        borderRadius: 2
                                    }}
                                />
                                {cropDialogOpen && (
                                    <IconButton
                                        onClick={handleCropAvatar}
                                        sx={{
                                            position: 'absolute',
                                            right: -4,
                                            top: -4,
                                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                            color: 'text.primary',
                                            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
                                        }}
                                    >
                                        <Crop />
                                    </IconButton>
                                )}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {avatarPreview.size > 1024 * 1024 && (
                                    <Alert severity="warning" sx={{ mt: 2 }}>
                                        Large image detected. Image will be optimized for web viewing.
                                    </Alert>
                                )}
                            </Box>
                        </Box>

                        {/* Upload Options */}
                        <Stack spacing={2}>
                            <Button
                                variant="contained"
                                component="label"
                                onClick={() => document.getElementById('avatar-upload-input')?.click()}
                                startIcon={<CloudUpload />}
                                disabled={isUploading}
                                sx={{ py: 2, borderRadius: 2 }}
                            >
                                {isUploading ? (
                                    <>
                                        <CircularProgress size={20} color="inherit" />
                                        <span style={{ marginLeft: 8 }}>Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload />
                                        <span style={{ marginLeft: 8 }}>Choose Photo</span>
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="outlined"
                                onClick={handleAvatarCrop}
                                disabled={!cropImageSrc}
                                startIcon={<Crop />}
                                sx={{ py: 2, borderRadius: 2 }}
                            >
                                <Crop />
                            </Button>

                            <Button
                                variant="text"
                                onClick={handleAvatarClose}
                                startIcon={<Close />}
                                sx={{ py: 2, borderRadius: 2 }}
                            >
                                Cancel
                            </Button>
                        </Stack>

                        {/* Upload Progress */}
                        {isUploading && (
                            <Box sx={{ width: '100%', mt: 2 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={uploadProgress}
                                    sx={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: 2
                                    }}
                                />
                                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                                    {uploadProgress}% uploaded
                                </Typography>
                            </Box>
                        )}
                    </DialogContent>

                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={handleAvatarClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleAvatarSave}
                            disabled={!avatarFile || isUploading}
                            startIcon={<CheckCircle />}
                            sx={{ background: 'linear-gradient(135deg, #FF385C 0%, #E01E5A 100%)' }}
                        >
                            {isUploading ? 'Saving...' : 'Save Avatar'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Crop Dialog */}
                <Dialog
                    open={cropDialogOpen}
                    onClose={handleAvatarClose}
                    maxWidth="md"
                    fullWidth
                    PaperProps={{
                        sx: { borderRadius: 3 }
                    }}
                >
                    <DialogTitle sx={{ pb: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            Crop Profile Picture
                        </Typography>
                        <IconButton
                            onClick={handleAvatarClose}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                color: 'text.secondary',
                                '&:hover': { color: 'text.primary' }
                            }}
                        >
                            <Close />
                        </IconButton>
                    </DialogTitle>

                    <DialogContent sx={{ pt: 1 }}>
                        <Box sx={{ textAlign: 'center', minHeight: 400 }}>
                            {cropImageSrc ? (
                                <img
                                    src={cropImageSrc}
                                    alt="Crop Preview"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '400px',
                                        borderRadius: 2
                                    }}
                                />
                            ) : (
                                <Typography variant="body1" color="text.secondary">
                                    Preview will appear here after image selection
                                </Typography>
                            )}
                        </Box>
                    </DialogContent>

                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={handleAvatarClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleCroppedAvatar}
                            startIcon={<CheckCircle />}
                            sx={{ background: 'linear-gradient(135deg, #FF385C 0%, #E01E5A 100%)' }}
                        >
                            Crop & Save
                        </Button>
                    </DialogActions>
                </Dialog>

            </Box>
        </Box>
    );
};

export default EditStudentProfileScreen;

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
