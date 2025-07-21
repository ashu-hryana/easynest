// /src/screens/auth/LoginScreen.jsx
import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, Container, TextField, Divider, Link } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

// Firebase Web SDK se functions import karo
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from '../../firebase'; // Hamari config file se
import { useNotification } from '../../contexts/NotificationContext.jsx';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const handleLogin = async () => {
        if (!email || !password) {
            showNotification('Error: Please enter email and password.');
            return;
        }
        try {
            // Web SDK ka syntax use karke sign in karo
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/home'); // Login ke baad home page par bhej do
        } catch (error) {
            console.error("Login Failed", error);
            showNotification('Login Failed: Invalid email or password.');
        }
    };

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check karo ki user Firestore mein exist karta hai ya nahi
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                // Agar user naya hai (Google se pehli baar), to uski details save karo
                await setDoc(userDocRef, {
                    role: 'student',
                    fullName: user.displayName,
                    email: user.email,
                    createdAt: serverTimestamp(),
                });
            }

            navigate('/home'); // Login ke baad home page par bhej do
        } catch (error) {
            console.error("Google Sign-In Failed", error);
            showNotification(`Google Sign-In Failed: ${error.message}`);
        }
    };

    return (
        <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold' }}>
                    Welcome Back
                </Typography>
                <Typography sx={{ color: 'text.secondary', textAlign: 'center', mt: 1, mb: 3 }}>
                    Log in to continue your journey with EasyNest.
                </Typography>

                <TextField
                    margin="normal" required fullWidth id="email" label="Email Address"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                    margin="normal" required fullWidth label="Password"
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                />
                <Button fullWidth variant="contained" onClick={handleLogin}
                    sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: '30px', backgroundColor: 'black' }}>
                    Continue
                </Button>

                <Divider sx={{ my: 2, width: '100%' }}>OR</Divider>

                <Button fullWidth variant="outlined" onClick={handleGoogleSignIn} startIcon={<GoogleIcon />}
                    sx={{ py: 1.5, borderRadius: '30px', color: 'black', borderColor: 'grey.400' }}>
                    Continue with Google
                </Button>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Link component={RouterLink} to="/signup" variant="body2" sx={{ textDecoration: 'underline' }}>
                        New to EasyNest? Sign up
                    </Link>
                    <br />
                    <Link component={RouterLink} to="/owner-login" variant="body2" sx={{ textDecoration: 'underline', mt: 1, display: 'inline-block' }}>
                        Are you an owner?
                    </Link>
                </Box>
            </Box>
        </Container>
    );
};

export default LoginScreen;