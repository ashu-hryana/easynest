// /src/screens/auth/OwnerLoginScreen.jsx
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box, Typography, Button, Container, TextField,
    IconButton, InputAdornment, Divider, Link
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import GoogleIcon from '@mui/icons-material/Google';

import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from '../../firebase';
import { useNotification } from '../../contexts/NotificationContext.jsx';


const OwnerLoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const handleLogin = async () => {
        if (!email || !password) {
            showNotification('Please enter both email and password.', 'error');
            return;
        }
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists() && userDoc.data().role === 'owner') {
                showNotification('Login successful!', 'success');
                navigate('/owner/dashboard');
            } else {
                await signOut(auth);
                showNotification('This account is not registered as an owner.', 'error');
            }
        } catch (error) {
            console.error("Owner Login Failed", error);
            showNotification('Login Failed: Invalid email or password.', 'error');
        }
    };

    return (
        // This outer Box takes the full screen height and becomes a flex container
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                justifyContent: 'center', // Vertically centers the content
                alignItems: 'center',    // Horizontally centers the content
                px: 2, // Adds some padding on the sides for very small screens
            }}
        >
            {/* Back Button positioned independently */}
            <IconButton onClick={() => navigate('/')} sx={{ position: 'absolute', top: 16, left: 16 }}>
                <ArrowBackIcon />
            </IconButton>
            
            {/* Container now just holds the form content with a max width */}
            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold' }}>
                        Welcome Back, Owner
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', textAlign: 'center', mt: 1, mb: 3 }}>
                        Log in to manage your properties.
                    </Typography>

                    <TextField
                        margin="normal" required fullWidth label="Email Address"
                        value={email} onChange={(e) => setEmail(e.target.value)}
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
                    <Box sx={{ width: '100%', textAlign: 'right', mt: -1, mb: 2 }}>
                        <Link component={RouterLink} to="/forgot-password" variant="body2">
                            Forgot Password?
                        </Link>
                    </Box>
                    
                    <Button fullWidth variant="contained" onClick={handleLogin}
                        sx={{ py: 1.5, borderRadius: '30px', backgroundColor: 'black' }}>
                        Log in
                    </Button>

                    <Divider sx={{ my: 2, width: '100%' }}>OR</Divider>

                    <Button fullWidth variant="outlined" startIcon={<GoogleIcon />}
                        sx={{ py: 1.5, borderRadius: '30px', color: 'black', borderColor: 'grey.400' }}>
                        Continue with Google
                    </Button>

                    <Typography sx={{ mt: 4 }}>
                        New to EasyNest?{' '}
                        <Link component={RouterLink} to="/owner-signup" sx={{ fontWeight: 'bold' }}>
                            Sign up
                        </Link>
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default OwnerLoginScreen;
