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
        <Container component="main" maxWidth="xs" sx={{ mt: 4, mb: 4 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ alignSelf: 'flex-start', mb: 2 }}>
                <ArrowBackIcon />
            </IconButton>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold' }}>
                    Create your account
                </Typography>
                <Typography sx={{ color: 'text.secondary', textAlign: 'center', mt: 1, mb: 3 }}>
                    Let's get you started on finding your perfect stay.
                </Typography>

                <TextField
                    margin="normal" required fullWidth id="fullName" label="Full Name"
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                />
                <TextField
                    margin="normal" required fullWidth id="email" label="Email Address"
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                    margin="normal" required fullWidth label="Password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={() => setIsPasswordVisible(!isPasswordVisible)} edge="end">
                                    {isPasswordVisible ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
                <Button fullWidth variant="contained" onClick={handleSignUp}
                    sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: '30px', backgroundColor: 'black' }}>
                    Create Account
                </Button>

                <Link component={RouterLink} to="/login" variant="body2" sx={{ textDecoration: 'underline' }}>
                    Already have an account? Log in
                </Link>

                <Divider sx={{ my: 2, width: '100%' }}>OR</Divider>

                <Button fullWidth variant="outlined" startIcon={<GoogleIcon />}
                    sx={{ py: 1.5, borderRadius: '30px', color: 'black', borderColor: 'grey.400' }}>
                    Continue with Google
                </Button>
            </Box>
        </Container>
    );
};

export default StudentSignUpScreen;