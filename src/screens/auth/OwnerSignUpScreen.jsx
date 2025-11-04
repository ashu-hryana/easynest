// /src/screens/auth/OwnerSignUpScreen.jsx
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
    Business,
    Home,
    Person,
    LocationOn,
    Language
} from '@mui/icons-material';

// Firebase imports
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from '../../firebase';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { phoneVerificationService } from '../../services/phoneVerification.js';

const OwnerSignUpScreen = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const handleEmailSignUp = async () => {
        if (!fullName || !email || !password) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (userCredential.user) {
                await updateProfile(userCredential.user, {
                    displayName: fullName,
                });

                await setDoc(doc(db, "users", userCredential.user.uid), {
                    role: 'owner',
                    fullName: fullName,
                    email: email,
                    createdAt: serverTimestamp(),
                });
                
                navigate('/profile-choice'); 
            }
        } catch (error) {
            console.error("Owner Sign-up Failed", error);
            showNotification(`Sign-up Failed: ${error.message}`, 'error');
        }
    };

    // --- YEH NAYA FUNCTION ADD HUA HAI ---
    const handleGoogleSignUp = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                if (userDoc.data().role === 'owner') {
                    // Agar pehle se owner hai, to choice screen par bhej do (ho sakta hai account type na select kiya ho)
                    navigate('/profile-choice');
                } else {
                    // Agar student hai, to error dikhao
                    showNotification('This email is already registered as a student.', 'error');
                }
            } else {
                // Agar user naya hai, to uski details save karo with role: 'owner'
                await setDoc(userDocRef, {
                    role: 'owner',
                    fullName: user.displayName,
                    email: user.email,
                    createdAt: serverTimestamp(),
                });
                navigate('/profile-choice');
            }
        } catch (error) {
            console.error("Google Sign-Up Failed", error);
            showNotification(`Google Sign-Up Failed: ${error.message}`, 'error');
        }
    };


    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 4, mb: 4 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ alignSelf: 'flex-start', mb: 2 }}>
                <ArrowBackIcon />
            </IconButton>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold' }}>
                    Become an Owner
                </Typography>
                <Typography sx={{ color: 'text.secondary', textAlign: 'center', mt: 1, mb: 3 }}>
                    Let's start by setting up your account.
                </Typography>

                <TextField
                    margin="normal" required fullWidth label="Full Name"
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                />
                <TextField
                    margin="normal" required fullWidth label="Email Address"
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
                <Button fullWidth variant="contained" onClick={handleEmailSignUp}
                    sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: '30px', backgroundColor: 'black' }}>
                    Agree and sign up
                </Button>

                <Typography sx={{ mt: 2, textAlign: 'center' }}>
                    Already have an account?{' '}
                    <Link component={RouterLink} to="/owner-login" sx={{ fontWeight: 'bold' }}>
                        Log in
                    </Link>
                </Typography>
                
                <Divider sx={{ my: 2, width: '100%' }}>OR</Divider>

                {/* --- IS BUTTON MEIN onClick ADD HUA HAI --- */}
                <Button 
                    fullWidth 
                    variant="outlined" 
                    onClick={handleGoogleSignUp} 
                    startIcon={<GoogleIcon />}
                    sx={{ py: 1.5, borderRadius: '30px', color: 'black', borderColor: 'grey.400' }}
                >
                    Continue with Google
                </Button>

                <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', mt: 4 }}>
                    By continuing, you agree to the EasyNest Owner{' '}
                    <Link href="#" underline="always">Terms of Service</Link> and acknowledge the{' '}
                    <Link href="#" underline="always">Privacy Policy</Link>.
                </Typography>
            </Box>
        </Container>
    );
};

export default OwnerSignUpScreen;
