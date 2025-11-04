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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    alpha,
    LinearProgress,
    InputAdornment,
    Grid
} from '@mui/material';
import {
    Edit as EditIcon,
    CloudUpload as CloudUploadIcon,
    CheckCircle as CheckCircleIcon,
    PhotoCamera as PhotoCameraIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    Person,
    Email,
    Phone,
    BusinessCenter,
    School,
    LocationOn,
    CalendarToday,
    Language,
    SmokingRooms,
    LocalBar,
    AccountCircle,
    HourglassEmpty
} from '@mui/icons-material';
import { format } from 'date-fns';

// Firebase imports
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { avatarService } from '../../services/avatarService.js';
import { phoneVerificationService } from '../../services/phoneVerification.js';

const LANGUAGES = ['Hindi', 'English', 'Haryanvi', 'Punjabi', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Odia', 'Urdu', 'Others'];
const HABITS = ['Non-smoker', 'Smoker', 'Occasional Smoker', 'Non-drinker', 'Social Drinker', 'Regular Drinker'];
const HOOKAH_HABITS = ['Never', 'Occasionally', 'Frequently', 'Daily'];

const EditStudentProfileScreen = () => {
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const theme = useTheme();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [avatarFile, setAvatarFile] = useState(null);

    const [profileData, setProfileData] = useState({
        photoURL: '',
        fullName: '',
        hometown: '',
        college: '',
        course: '',
        year: '',
        bio: '',
        languages: [],
        habits: '',
        hookah: '',
        verificationStatus: 'not_verified',
        dateOfBirth: '',
        nationality: '',
        gender: '',
        phoneNumber: '',
        phoneVerified: false
    });

    useEffect(() => {
        if (currentUser) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            getDoc(userDocRef).then(docSnap => {
                if (docSnap.exists()) {
                    setProfileData(prevData => ({ ...prevData, ...docSnap.data() }));
                }
                setLoading(false);
            }).catch(error => {
                console.error('Error fetching user data:', error);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [currentUser]);

    const handleChange = useCallback((e) => {
        setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);

    const handleAvatarClick = useCallback(() => {
        setAvatarDialogOpen(true);
    }, []);

    const handleAvatarClose = useCallback(() => {
        setAvatarDialogOpen(false);
        setAvatarPreview(null);
        setAvatarFile(null);
    }, []);

    const handleAvatarSelect = useCallback(async (file) => {
        if (!file) return;

        try {
            setIsUploading(true);
            setUploadProgress(0);

            const processedFile = await avatarService.processImageForUpload(file);
            const preview = await avatarService.createAvatarPreview(processedFile);

            setAvatarPreview(preview);
            setAvatarFile(preview.file);
            setUploadProgress(100);
            showNotification('Image processed successfully!', 'success');
        } catch (error) {
            showNotification('Failed to process image. Please try a different image.', 'error');
        } finally {
            setIsUploading(false);
        }
    }, [showNotification]);

    const handleAvatarSave = useCallback(async () => {
        if (!avatarFile) {
            showNotification('Please select an image first', 'error');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const result = await avatarService.uploadAvatar(avatarFile, {
                folder: `avatars/${currentUser.uid}`,
                tags: ['profile', 'student'],
                transformation: avatarService.getTransformationOptions('profile')
            });

            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
                ...profileData,
                photoURL: result.url,
                avatarPublicId: result.public_id,
                avatarWidth: result.width,
                avatarHeight: result.height,
                avatarFormat: result.format
            }, { merge: true });

            setProfileData(prev => ({ ...prev, photoURL: result.url }));
            showNotification('Avatar uploaded successfully!', 'success');
            setAvatarDialogOpen(false);
            setAvatarPreview(null);
            setAvatarFile(null);
        } catch (error) {
            showNotification('Failed to upload avatar. Please try again.', 'error');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    }, [avatarFile, currentUser, profileData, showNotification]);

    const handleRemoveAvatar = useCallback(async () => {
        if (!profileData.photoURL) return;

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const avatarPublicId = avatarService.extractPublicIdFromUrl(profileData.photoURL);

            if (avatarPublicId) {
                await avatarService.deleteAvatar(avatarPublicId);
            }

            await updateDoc(userDocRef, {
                photoURL: '',
                avatarPublicId: ''
            }, { merge: true });

            setProfileData(prev => ({ ...prev, photoURL: '', avatarPublicId: '' }));
            showNotification('Avatar removed successfully', 'info');
        } catch (error) {
            showNotification('Failed to remove avatar', 'error');
        }
    }, [profileData.photoURL, currentUser, showNotification]);

    const handleSaveProfile = async () => {
        if (!currentUser) return;

        setIsSaving(true);

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, {
                ...profileData,
                profileCompleted: true,
                updatedAt: new Date().toISOString()
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
                                        color: '#FF385C',
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
                </Paper>

                {/* Personal Information */}
                <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                        Personal Information
                    </Typography>

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
                                    }
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
                                    }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Date of Birth"
                                name="dateOfBirth"
                                type="date"
                                value={profileData.dateOfBirth || ''}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <CalendarToday />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        backgroundColor: 'grey.50',
                                        '&:hover': { backgroundColor: 'grey.100' },
                                        '& fieldset': { border: 'none' }
                                    }
                                }}
                            />
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
                                        }
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
                                        }
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
                </Paper>

                {/* Academic Information */}
                <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                        Academic Information
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Hometown"
                                name="hometown"
                                value={profileData.hometown || ''}
                                onChange={handleChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LocationOn />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        backgroundColor: 'grey.50',
                                        '&:hover': { backgroundColor: 'grey.100' },
                                        '& fieldset': { border: 'none' }
                                    }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="College/University"
                                name="college"
                                value={profileData.college || ''}
                                onChange={handleChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <BusinessCenter />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        backgroundColor: 'grey.50',
                                        '&:hover': { backgroundColor: 'grey.100' },
                                        '& fieldset': { border: 'none' }
                                    }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Course"
                                name="course"
                                value={profileData.course || ''}
                                onChange={handleChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <School />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        backgroundColor: 'grey.50',
                                        '&:hover': { backgroundColor: 'grey.100' },
                                        '& fieldset': { border: 'none' }
                                    }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Year"
                                name="year"
                                value={profileData.year || ''}
                                onChange={handleChange}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        backgroundColor: 'grey.50',
                                        '&:hover': { backgroundColor: 'grey.100' },
                                        '& fieldset': { border: 'none' }
                                    }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="About Me / Bio"
                                name="bio"
                                multiline
                                rows={4}
                                value={profileData.bio || ''}
                                onChange={handleChange}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        backgroundColor: 'grey.50',
                                        '&:hover': { backgroundColor: 'grey.100' },
                                        '& fieldset': { border: 'none' }
                                    }
                                }}
                            />
                        </Grid>
                    </Grid>
                </Paper>

                {/* Lifestyle & Habits */}
                <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                        Lifestyle & Habits
                    </Typography>

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
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {selected.map((value) => (
                                                <Chip key={value} label={value} size="small" color="primary" />
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
                                        }
                                    }}
                                >
                                    {HABITS.map(habit => (
                                        <MenuItem key={habit} value={habit}>{habit}</MenuItem>
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
                                            }
                                        }}
                                    >
                                        {HOOKAH_HABITS.map(habit => (
                                            <MenuItem key={habit} value={habit}>{habit}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}
                    </Grid>
                </Paper>

                {/* Verification Status */}
                <Paper sx={{
                    p: 4,
                    borderRadius: 3,
                    mb: 3,
                    backgroundColor: profileData.verificationStatus === 'verified'
                        ? alpha(theme.palette.success.light, 0.1)
                        : alpha(theme.palette.warning.light, 0.1),
                    border: profileData.verificationStatus === 'verified'
                        ? `1px solid ${theme.palette.success.main}`
                        : `1px solid ${theme.palette.warning.main}`
                }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Verification Status
                    </Typography>

                    {profileData.verificationStatus === 'verified' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                            <CheckCircle />
                            <Typography variant="body1">
                                Your profile is verified.
                            </Typography>
                        </Box>
                    ) : (
                        <Alert severity="info" icon={<HourglassEmpty fontSize="inherit" />}>
                            <Typography variant="body1">
                                Your profile is not verified. Verification helps build trust in the community.
                            </Typography>
                        </Alert>
                    )}
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
                                        borderRadius: 8
                                    }}
                                />
                            </Box>
                            {avatarPreview.size > 1024 * 1024 && (
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                    Large image detected. Image will be optimized for web viewing.
                                </Alert>
                            )}
                        </Box>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="body1" color="text.secondary">
                                Choose a profile picture to upload
                            </Typography>
                        </Box>
                    )}

                    {/* Upload Options */}
                    <Stack spacing={2}>
                        <Button
                            variant="contained"
                            component="label"
                            onClick={() => document.getElementById('avatar-upload-input')?.click()}
                            startIcon={<CloudUploadIcon />}
                            disabled={isUploading}
                            sx={{ py: 2, borderRadius: 2 }}
                        >
                            {isUploading ? (
                                <>
                                    <CircularProgress size={20} color="inherit" />
                                    <span style={{ marginLeft: 8 }}>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <CloudUploadIcon />
                                    <span style={{ marginLeft: 8 }}>Choose Photo</span>
                                </>
                            )}
                        </Button>

                        {profileData.photoURL && (
                            <Button
                                variant="outlined"
                                startIcon={<DeleteIcon />}
                                onClick={handleRemoveAvatar}
                                sx={{ py: 2, borderRadius: 2 }}
                            >
                                Remove Current Avatar
                            </Button>
                        )}

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
                                {uploadProgress}% processed
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

            <input
                type="file"
                accept="image/*"
                onChange={(e) => handleAvatarSelect(e.target.files[0])}
                style={{ display: 'none' }}
                id="avatar-upload-input"
            />
        </Box>
    );
};

export default EditStudentProfileScreen;