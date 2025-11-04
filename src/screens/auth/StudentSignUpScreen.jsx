// /src/screens/auth/StudentSignUpScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Container,
    TextField,
    IconButton,
    InputAdornment,
    Divider,
    Link,
    Stepper,
    Step,
    StepLabel,
    Paper,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Chip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    alpha
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Visibility,
    VisibilityOff,
    Google as GoogleIcon,
    Phone,
    CheckCircle,
    Refresh,
    Info,
    LocationOn,
    Language
} from '@mui/icons-material';
import { format } from 'date-fns';

// Firebase imports
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from '../../firebase';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { phoneVerificationService } from '../../services/phoneVerification.js';

const StudentSignUpScreen = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    // Stepper state
    const [activeStep, setActiveStep] = useState(0);
    const steps = ['Basic Info', 'Contact Details', 'Verification', 'Complete'];

    // Basic info
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    // Contact details
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [nationality, setNationality] = useState('IN');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('');

    // Phone verification
    const [otpDialogOpen, setOtpDialogOpen] = useState(false);
    const [otpSessionId, setOtpSessionId] = useState('');
    const [otp, setOtp] = useState('');
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpResendLoading, setOtpResendLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // Loading states
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Form validation errors
    const [errors, setErrors] = useState({});

    const countryList = phoneVerificationService.getCountryList();
    const nationalities = phoneVerificationService.getNationalities();

    // Form validation
    const validateBasicInfo = () => {
        const newErrors = {};

        if (!fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        } else if (fullName.trim().length < 2) {
            newErrors.fullName = 'Full name must be at least 2 characters';
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            newErrors.password = 'Password must contain uppercase, lowercase, and number';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateContactDetails = () => {
        const newErrors = {};

        if (!phoneNumber.trim()) {
            newErrors.phoneNumber = 'Phone number is required';
        } else if (!/^\d{10}$/.test(phoneNumber.replace(/\D/g, ''))) {
            newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
        }

        if (!dateOfBirth) {
            newErrors.dateOfBirth = 'Date of birth is required';
        } else {
            const age = Math.floor((new Date() - new Date(dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
            if (age < 16 || age > 100) {
                newErrors.dateOfBirth = 'You must be between 16 and 100 years old';
            }
        }

        if (!gender) {
            newErrors.gender = 'Gender is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Navigation functions
    const handleNext = () => {
        if (activeStep === 0) {
            if (validateBasicInfo()) {
                setActiveStep(1);
            }
        } else if (activeStep === 1) {
            if (validateContactDetails()) {
                setActiveStep(2);
            }
        } else if (activeStep === 2) {
            setActiveStep(3);
        }
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    // Phone verification functions
    const handleSendOTP = async () => {
        if (!phoneNumber || errors.phoneNumber) {
            return;
        }

        setOtpLoading(true);
        setOtpError('');

        try {
            const result = await phoneVerificationService.sendOTP(phoneNumber, countryCode);
            setOtpSessionId(result.sessionId);
            setOtpSent(true);
            setOtpDialogOpen(true);
            showNotification('OTP sent successfully!');
        } catch (error) {
            setOtpError(error.message);
            showNotification('Failed to send OTP: ' + error.message, 'error');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            setOtpError('Please enter a valid 6-digit OTP');
            return;
        }

        setOtpLoading(true);
        setOtpError('');

        try {
            const result = await phoneVerificationService.verifyOTP(otpSessionId, otp);
            if (result.success) {
                setIsPhoneVerified(true);
                setOtpDialogOpen(false);
                showNotification('Phone number verified successfully!', 'success');
            } else {
                setOtpError(result.message);
            }
        } catch (error) {
            setOtpError(error.message);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setOtpResendLoading(true);
        setOtpError('');

        try {
            const result = await phoneVerificationService.resendOTP(otpSessionId);
            setOtpSessionId(result.sessionId);
            setOtpSent(true);
            setOtp('');
            showNotification('New OTP sent successfully!');
        } catch (error) {
            setOtpError(error.message);
        } finally {
            setOtpResendLoading(false);
        }
    };

    // Enhanced signup with all collected data
    const handleCompleteSignup = async () => {
        if (!isPhoneVerified) {
            showNotification('Please verify your phone number first', 'error');
            return;
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (userCredential.user) {
                // Update profile
                await updateProfile(userCredential.user, {
                    displayName: fullName,
                });

                // Create user document with all details
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    role: 'student',
                    fullName,
                    email,
                    phoneNumber: `${countryCode}${phoneNumber}`,
                    nationality,
                    dateOfBirth,
                    gender,
                    phoneVerified: isPhoneVerified,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    profileCompleted: false // User will need to complete profile
                });

                showNotification('Account created successfully!', 'success');
                navigate('/home');
            }
        } catch (error) {
            console.error("Sign-up Failed", error);
            showNotification(`Sign-up Failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Google signup with enhanced data collection
    const handleGoogleSignUp = async () => {
        setGoogleLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user already exists
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                // User already exists, navigate to home
                navigate('/home');
            } else {
                // Create new user with basic info
                await setDoc(userDocRef, {
                    role: 'student',
                    fullName: user.displayName,
                    email: user.email,
                    createdAt: serverTimestamp(),
                    phoneVerified: false,
                    profileCompleted: false
                });

                showNotification('Account created! Please complete your profile to access all features.', 'info');
                navigate('/profile/edit'); // Redirect to profile completion
            }
        } catch (error) {
            console.error("Google Sign-up Failed", error);
            showNotification(`Google Sign-up Failed: ${error.message}`, 'error');
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <IconButton onClick={() => navigate(-1)} sx={{ mb: 2 }}>
                <ArrowBackIcon />
            </IconButton>

            <Paper sx={{ p: 4, borderRadius: 3, flex: 1 }}>
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography component="h1" variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        Create Student Account 🎓
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Join thousands of students finding their perfect stay
                    </Typography>
                </Box>

                {/* Stepper */}
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {/* Step Content */}
                <Box sx={{ mb: 4 }}>
                    {activeStep === 0 && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 3 }}>
                                Basic Information
                            </Typography>
                            <TextField
                                fullWidth
                                label="Full Name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                error={!!errors.fullName}
                                helperText={errors.fullName}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                error={!!errors.email}
                                helperText={errors.email}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Password"
                                type={isPasswordVisible ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                error={!!errors.password}
                                helperText={errors.password}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setIsPasswordVisible(!isPasswordVisible)} edge="end">
                                                {isPasswordVisible ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="Confirm Password"
                                type={isConfirmPasswordVisible ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                error={!!errors.confirmPassword}
                                helperText={errors.confirmPassword}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} edge="end">
                                                {isConfirmPasswordVisible ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                    )}

                    {activeStep === 1 && (
                        <Box>
                            <Typography variant="h6" sx={{ mb: 3 }}>
                                Contact Details
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <FormControl sx={{ minWidth: 120 }}>
                                    <InputLabel>Country</InputLabel>
                                    <Select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        label="Country"
                                    >
                                        {countryList.map((country) => (
                                            <MenuItem key={country.code} value={country.code}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <span>{country.flag}</span>
                                                    <span>{country.code}</span>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                    error={!!errors.phoneNumber}
                                    helperText={errors.phoneNumber}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Phone />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <FormControl sx={{ flex: 1 }}>
                                    <InputLabel>Nationality</InputLabel>
                                    <Select
                                        value={nationality}
                                        onChange={(e) => setNationality(e.target.value)}
                                        label="Nationality"
                                    >
                                        {nationalities.map((nat) => (
                                            <MenuItem key={nat.code} value={nat.code}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <span>{nat.flag}</span>
                                                    <span>{nat.name}</span>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl sx={{ flex: 1 }}>
                                    <InputLabel>Gender</InputLabel>
                                    <Select
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        label="Gender"
                                        error={!!errors.gender}
                                    >
                                        <MenuItem value="male">Male</MenuItem>
                                        <MenuItem value="female">Female</MenuItem>
                                        <MenuItem value="other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            <TextField
                                fullWidth
                                label="Date of Birth"
                                type="date"
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                error={!!errors.dateOfBirth}
                                helperText={errors.dateOfBirth}
                                InputLabelProps={{ shrink: true }}
                                sx={{ mb: 2 }}
                            />
                        </Box>
                    )}

                    {activeStep === 2 && (
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ mb: 3 }}>
                                Phone Verification
                            </Typography>

                            <Alert severity="info" sx={{ mb: 3 }}>
                                <Typography variant="body2">
                                    We need to verify your phone number to ensure the security of your account.
                                </Typography>
                            </Alert>

                            <Box sx={{ p: 3, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2, mb: 3 }}>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    Phone Number: <strong>{countryCode} {phoneNumber}</strong>
                                </Typography>

                                {isPhoneVerified ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                                        <CheckCircle />
                                        <Typography variant="body1" sx={{ color: 'success.main' }}>
                                            Phone number verified successfully!
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box>
                                        <Button
                                            variant="contained"
                                            onClick={handleSendOTP}
                                            disabled={otpLoading || !phoneNumber}
                                            startIcon={otpLoading ? <CircularProgress size={16} /> : <Phone />}
                                            sx={{ mb: 2 }}
                                        >
                                            {otpLoading ? 'Sending...' : 'Send OTP'}
                                        </Button>

                                        {otpSent && (
                                            <Typography variant="body2" color="text.secondary">
                                                Check your phone for the 6-digit verification code
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}

                    {activeStep === 3 && (
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ mb: 3 }}>
                                Account Ready!
                            </Typography>

                            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />

                            <Typography variant="body1" sx={{ mb: 1 }}>
                                Your student account has been created successfully!
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                You can now start searching for your perfect stay.
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}
                    >
                        Back
                    </Button>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {activeStep < 2 && (
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                sx={{
                                    background: 'linear-gradient(135deg, #FF385C 0%, #E01E5A 100%)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #E01E5A 0%, #D10134 100%)',
                                    }
                                }}
                            >
                                {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                            </Button>
                        )}

                        {activeStep === 2 && (
                            <Button
                                variant="contained"
                                onClick={handleCompleteSignup}
                                disabled={!isPhoneVerified || loading}
                                sx={{
                                    background: 'linear-gradient(135deg, #FF385C 0%, #E01E5A 100%)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #E01E5A 0%, #D10134 100%)',
                                    }
                                }}
                            >
                                {loading ? 'Creating Account...' : 'Complete Signup'}
                            </Button>
                        )}

                        {activeStep === 3 && (
                            <Button
                                variant="contained"
                                onClick={() => navigate('/home')}
                                sx={{
                                    background: 'linear-gradient(135deg, #FF385C 0%, #E01E5A 100%)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #E01E5A 0%, #D10134 100%)',
                                    }
                                }}
                            >
                                Go to Dashboard
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* Google Sign Up */}
                {activeStep === 0 && (
                    <>
                        <Divider sx={{ my: 3 }}>OR</Divider>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={handleGoogleSignUp}
                            disabled={googleLoading}
                            startIcon={googleLoading ? <CircularProgress size={16} /> : <GoogleIcon />}
                            sx={{ py: 1.5, borderRadius: 2 }}
                        >
                            {googleLoading ? 'Signing up...' : 'Continue with Google'}
                        </Button>
                    </>
                )}

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Already have an account?{' '}
                        <Link component={RouterLink} to="/login" sx={{ fontWeight: 600 }}>
                            Log in
                        </Link>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Are you a property owner?{' '}
                        <Link component={RouterLink} to="/owner-signup" sx={{ fontWeight: 600 }}>
                            Sign up as owner
                        </Link>
                    </Typography>
                </Box>
            </Paper>

            {/* OTP Dialog */}
            <Dialog open={otpDialogOpen} onClose={() => setOtpDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Verify Phone Number</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Enter the 6-digit code sent to {countryCode} {phoneNumber}
                    </Typography>

                    <TextField
                        fullWidth
                        label="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        error={!!otpError}
                        helperText={otpError}
                        sx={{ mb: 2 }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Didn't receive the code?
                        </Typography>
                        <Button
                            variant="text"
                            onClick={handleResendOTP}
                            disabled={otpResendLoading}
                            startIcon={otpResendLoading ? <CircularProgress size={16} /> : <Refresh />}
                        >
                            Resend OTP
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOtpDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleVerifyOTP}
                        disabled={otpLoading || otp.length !== 6}
                        startIcon={otpLoading ? <CircularProgress size={16} /> : <CheckCircle />}
                    >
                        {otpLoading ? 'Verifying...' : 'Verify'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default StudentSignUpScreen;