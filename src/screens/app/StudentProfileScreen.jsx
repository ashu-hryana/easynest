// src/screens/app/StudentProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Button,
    Paper,
    Avatar,
    Chip,
    Stack,
    CircularProgress,
    IconButton,
    Tooltip,
    Grid,
    Alert,
    useTheme,
    alpha,
    Badge,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress
} from '@mui/material';
import {
    Edit as EditIcon,
    CheckCircle,
    Person,
    Email,
    Phone,
    BusinessCenter,
    School,
    Language,
    SmokingRooms,
    LocalBar,
    AccountCircle,
    PhoneVerified,
    PhotoCamera,
    Close,
    CloudUpload,
    LocationOn,
    CalendarToday,
    HourglassEmpty
} from '@mui/icons-material';
import { format } from 'date-fns';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { avatarService } from '../../services/avatarService.js';
import { phoneVerificationService } from '../../services/phoneVerification.js';

const StudentProfileScreen = () => {
    const { currentUser } = useAuth();
    const theme = useTheme();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const [loading, setLoading] = useState(true);
    const [userDetails, setUserDetails] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (currentUser) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUserDetails(docSnap.data());
                } else {
                    console.log("User document does not exist");
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching user details:", error);
                setLoading(false);
            });

            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            showNotification('Logged out successfully', 'info');
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
            showNotification('Failed to log out', 'error');
        }
    };

    const handleAvatarClick = () => {
        if (userDetails?.photoURL) {
            setAvatarPreview({
                file: null,
                preview: userDetails.photoURL,
                name: 'profile.jpg'
            });
        }
        setAvatarDialogOpen(true);
    };

    const handleAvatarClose = () => {
        setAvatarDialogOpen(false);
        setAvatarPreview(null);
        setAvatarFile(null);
    };

    const handleAvatarSelect = async (file) => {
        if (!file) return;

        try {
            const processedFile = await avatarService.processImageForUpload(file);
            const preview = await avatarService.createAvatarPreview(processedFile);

            setAvatarPreview(preview);
            setAvatarFile(preview.file);
            setUserDetails(prev => ({ ...prev, photoURL: preview.preview }));
        } catch (error) {
            showNotification('Failed to process image. Please try a different image.', 'error');
        }
    };

    const handleAvatarSave = async () => {
        if (!avatarFile) {
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const result = await avatarService.uploadAvatar(avatarFile, {
                folder: `avatars/${currentUser.uid}`,
                tags: ['profile', 'student', 'user', 'verified'],
                transformation: avatarService.getTransformationOptions('profile')
            });

            const userDocRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userDocRef, {
                ...userDetails,
                photoURL: result.url,
                avatarPublicId: result.public_id,
                avatarWidth: result.width,
                avatarHeight: result.height,
                avatarFormat: result.format,
                avatarSize: result.bytes
            }, { merge: true });

            showNotification('Avatar updated successfully!', 'success');
            setAvatarDialogOpen(false);
            setAvatarPreview(null);
            setAvatarFile(null);
        } catch (error) {
            showNotification('Failed to update avatar. Please try again.', 'error');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!userDetails?.photoURL) return;

        const userDocRef = doc(db, 'users', currentUser.uid);
        const avatarPublicId = avatarService.extractPublicIdFromUrl(userDetails.photoURL);

        try {
            if (avatarPublicId) {
                await avatarService.deleteAvatar(avatarPublicId);
            }
            await updateDoc(userDocRef, {
                photoURL: '',
                avatarPublicId: ''
            }, { merge: true });

            setUserDetails(prev => ({ ...prev, photoURL: '', avatarPublicId: '' }));
            showNotification('Avatar removed successfully', 'info');
        } catch (error) {
            showNotification('Failed to remove avatar', 'error');
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

    const verificationStatus = userDetails?.verificationStatus || 'not_verified';

    const renderVerificationBadge = () => {
        if (verificationStatus === 'verified') {
            return (
                <Tooltip title="Verified Profile">
                    <CheckCircle color="success" sx={{ ml: 1 }} />
                </Tooltip>
            );
        }
        return null;
    };

    return (
        <Box sx={{
            flexGrow: 1,
            backgroundColor: 'background.default',
            minHeight: '100vh',
            pb: { xs: '80px', md: 0 }
        }}>
            <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
                {/* Profile Header */}
                <Paper
                    elevation={2}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #FF385C 0%, #E01E5A 100%)',
                        color: 'white',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <Stack spacing={3} alignItems="center">
                        <Box sx={{ position: 'relative' }}>
                            <Avatar
                                src={userDetails?.photoURL || ''}
                                onClick={handleAvatarClick}
                                sx={{
                                    width: 120,
                                    height: 120,
                                    border: '3px solid rgba(255, 255, 255, 0.3)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    }
                                }}
                            >
                                {currentUser?.displayName?.[0] || 'U'}
                            </Avatar>
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                sx={{
                                    '& .MuiBadge-badge': {
                                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                                        color: '#FF385C',
                                        cursor: 'pointer'
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
                        </Box>

                        <Typography variant="h4" sx={{ fontWeight: 600, color: 'white' }}>
                            {userDetails?.fullName || currentUser?.displayName || 'Student'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                {currentUser?.email}
                            </Typography>
                            {userDetails?.phoneVerified && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PhoneVerified sx={{ fontSize: 14 }} />
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                        Verified
                                    </Typography>
                                </Box>
                            )}
                            {renderVerificationBadge()}
                        </Box>

                        {/* Avatar Stats */}
                        {userDetails?.photoURL && (
                            <Box sx={{ mt: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                                    <Chip
                                        size="small"
                                        label={`${userDetails.avatarWidth || '200'}x${userDetails.avatarHeight || '200'}`}
                                        sx={{
                                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            fontSize: '0.75rem'
                                        }}
                                    />
                                    <Chip
                                        size="small"
                                        label={userDetails.avatarFormat || 'webp'}
                                        sx={{
                                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                                            color: 'white',
                                            fontSize: '0.75rem'
                                        }}
                                    />
                                </Box>
                            </Box>
                        )}

                        {/* Edit Profile Button */}
                        <Button
                            variant="contained"
                            onClick={() => navigate('/profile/edit')}
                            startIcon={<EditIcon />}
                            sx={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                color: 'text.primary',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    color: '#FF385C',
                                },
                                px: 4,
                                py: 2,
                                borderRadius: 3,
                                textTransform: 'none',
                                fontWeight: 500
                            }}
                        >
                            Edit Profile
                        </Button>
                    </Stack>
                </Paper>

                {/* Verification Status */}
                {verificationStatus === 'pending' && (
                    <Alert
                        severity="info"
                        icon={<HourglassEmpty fontSize="inherit" />}
                        sx={{ mb: 3 }}
                    >
                        <Typography variant="body1">
                            Your verification is pending. We are reviewing your ID.
                        </Typography>
                    </Alert>
                )}
                {verificationStatus === 'not_verified' && (
                    <Alert
                        severity="warning"
                        action={
                            <Button color="inherit" size="small" onClick={() => navigate('/profile/edit')}>
                                VERIFY NOW
                            </Button>
                        }
                        sx={{ mb: 3 }}
                    >
                        <Typography variant="body1">
                            Your profile is not verified. Verify now to find roommates.
                        </Typography>
                    </Alert>
                )}

                {/* About Me Section */}
                <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                        About Me
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {userDetails?.bio || "No bio added yet. Click edit to tell us about yourself!"}
                    </Typography>
                </Paper>

                {/* Personal Details Section */}
                <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                        Personal Details
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Person sx={{ color: 'text.secondary' }} />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Full Name
                                    </Typography>
                                    <Typography fontWeight="bold" color="text.primary">
                                        {userDetails?.fullName || 'Not specified'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Email sx={{ color: 'text.secondary' }} />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Email
                                    </Typography>
                                    <Typography color="text.primary">
                                        {currentUser?.email}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Phone sx={{ color: 'text.secondary' }} />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Phone
                                    </Typography>
                                    <Typography color="text.primary">
                                        {userDetails?.phoneNumber || 'Not specified'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        {userDetails?.dateOfBirth && (
                            <Grid item xs={12} sm={6} md={4}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <CalendarToday sx={{ color: 'text.secondary' }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Date of Birth
                                        </Typography>
                                        <Typography color="text.primary">
                                            {format(new Date(userDetails.dateOfBirth), 'PPP')}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}

                        {userDetails?.nationality && (
                            <Grid item xs={12} sm={6} md={4}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Language sx={{ color: 'text.secondary' }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Nationality
                                        </Typography>
                                        <Typography color="text.primary">
                                            {phoneVerificationService.getNationalities().find(n => n.code === userDetails.nationality)?.name || 'Not specified'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}

                        {userDetails?.gender && (
                            <Grid item xs={12} sm={6} md={4}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Person sx={{ color: 'text.secondary' }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Gender
                                        </Typography>
                                        <Typography color="text.primary">
                                            {userDetails.gender.charAt(0).toUpperCase() + userDetails.gender.slice(1)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </Paper>

                {/* Academic Details */}
                <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                        Academic Information
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <LocationOn sx={{ color: 'text.secondary' }} />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Hometown
                                    </Typography>
                                    <Typography fontWeight="bold" color="text.primary">
                                        {userDetails?.hometown || 'Not specified'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <BusinessCenter sx={{ color: 'text.secondary' }} />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        College
                                    </Typography>
                                    <Typography fontWeight="bold" color="text.primary">
                                        {userDetails?.college || 'Not specified'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <School sx={{ color: 'text.secondary' }} />
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Course & Year
                                    </Typography>
                                    <Typography fontWeight="bold" color="text.primary">
                                        {userDetails?.course && userDetails?.year
                                            ? `${userDetails.course}, ${userDetails.year}`
                                            : 'Not specified'
                                        }
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Lifestyle & Habits Section */}
                <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                        Lifestyle & Habits
                    </Typography>

                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'text.primary', mb: 1 }}>
                                Languages
                            </Typography>
                            {userDetails?.languages?.length > 0 ? (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {userDetails.languages.map(lang => (
                                        <Chip
                                            key={lang}
                                            label={lang}
                                            size="small"
                                            color="primary"
                                            sx={{
                                                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                                                backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                            }}
                                        />
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Not specified
                                </Typography>
                            )}
                        </Box>

                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'text.primary', mb: 1 }}>
                                Habits
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {userDetails?.habits || 'Not specified'}
                            </Typography>
                        </Box>

                        {userDetails?.languages?.includes('Haryanvi') && userDetails?.hookah && (
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'text.primary', mb: 1 }}>
                                    Hookah
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {userDetails.hookah}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </Paper>

                {/* Stats Section */}
                <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: verificationStatus === 'verified' ? 'success' : 'info' }}>
                        Profile Stats
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    {userDetails?.totalConnections || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Connections
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    {userDetails?.totalListings || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Listings
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    {userDetails?.wishlistCount || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Wishlist
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={6} sm={3}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    {userDetails?.profileViews || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Views
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Action Buttons */}
                <Stack spacing={2} sx={{ mb: 4 }}>
                    <Button
                        variant="contained"
                        onClick={handleLogout}
                        startIcon={<AccountCircle />}
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
                        Log Out
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={() => navigate('/profile/edit')}
                        startIcon={<EditIcon />}
                        sx={{
                            borderRadius: 3,
                            px: 4,
                            py: 2,
                            textTransform: 'none',
                            fontWeight: 500,
                            borderColor: 'divider'
                        }}
                    >
                        Edit Profile
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
                        Update Profile Picture
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
                        <>
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
                                            <CloudUpload />
                                            <span style={{ marginLeft: 8 }}>Choose Photo</span>
                                        </>
                                    )}
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
                        </>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="body1" color="text.secondary">
                                Choose a profile picture to upload
                            </Typography>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleAvatarSelect(e.target.files[0])}
                                style={{ display: 'none' }}
                                id="avatar-upload-input"
                            />
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
                        sx={{
                            background: 'linear-gradient(135deg, #FF385C 0%, #E01E5A 100%)'
                        }}
                    >
                        {isUploading ? 'Saving...' : 'Save Avatar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StudentProfileScreen;