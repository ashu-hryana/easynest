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
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const handleSignUp = async () => {
        if (!fullName || !email || !password) {
            showNotification('Error: Please fill in all fields.'); // Simple alert for now
            return;
        }

        try {
            // Web SDK ka syntax use karke user create karo
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (userCredential.user) {
                // Profile update karo
                await updateProfile(userCredential.user, {
                    displayName: fullName,
                });

                // Firestore mein document create karo
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    role: 'student',
                    fullName: fullName,
                    email: email,
                    createdAt: serverTimestamp(),
                });
                
                // Signup ke baad home page par bhej do
                navigate('/home'); 
            }
        } catch (error) {
            console.error("Sign-up Failed", error);
            showNotification(`Sign-up Failed: ${error.message}`);
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