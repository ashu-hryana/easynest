// src/screens/app/ChatScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Paper, Typography, TextField, IconButton,
    AppBar, Toolbar, Avatar, CircularProgress, Stack, Container
} from '@mui/material';
import { ArrowBack, Send } from '@mui/icons-material';
import {
    collection, query, orderBy, onSnapshot, addDoc, serverTimestamp,
    doc, getDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { format } from 'date-fns';

const ChatScreen = () => {
    const { connectionId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [otherUser, setOtherUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Scroll to the bottom of the chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    };

    useEffect(() => {
        // Run after messages state updates
        scrollToBottom();
    }, [messages]);

    // Fetch messages and connection details
    useEffect(() => {
        if (!connectionId || !currentUser) return;

        const connDocRef = doc(db, 'connections', connectionId);
        getDoc(connDocRef).then(docSnap => {
            if (docSnap.exists()) {
                const connData = docSnap.data();
                const otherUserId = connData.participants.find(id => id !== currentUser.uid);
                const otherUserName = currentUser.uid === connData.requesterId ? connData.receiverName : connData.requesterName;
                const otherUserPhoto = currentUser.uid === connData.requesterId ? connData.receiverPhotoURL : connData.requesterPhotoURL;
                setOtherUser({ id: otherUserId, name: otherUserName, photoURL: otherUserPhoto });
            }
        });

        const messagesRef = collection(db, 'connections', connectionId, 'messages');
        const q = query(messagesRef, orderBy('createdAt'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedMessages = [];
            querySnapshot.forEach((doc) => {
                fetchedMessages.push({ id: doc.id, ...doc.data() });
            });
            setMessages(fetchedMessages);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [connectionId, currentUser]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser) return;

        const messagesRef = collection(db, 'connections', connectionId, 'messages');
        await addDoc(messagesRef, {
            text: newMessage,
            createdAt: serverTimestamp(),
            senderId: currentUser.uid,
        });

        setNewMessage('');
    };
    
    if (loading || !otherUser) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100vw', // Force full width
            bgcolor: '#E5DDD5', // WhatsApp like background
        }}>
            {/* Chat Header */}
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar>
                    <IconButton onClick={() => navigate(-1)} edge="start">
                        <ArrowBack />
                    </IconButton>
                    <Avatar src={otherUser.photoURL} sx={{ mx: 1.5 }} />
                    <Typography variant="h6">{otherUser.name}</Typography>
                </Toolbar>
            </AppBar>

            {/* Messages Area - Container centers content */}
            <Container maxWidth="md" sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
                <Stack spacing={2}>
                    {messages.map(msg => {
                        const isSentByMe = msg.senderId === currentUser.uid;
                        return (
                            <Box key={msg.id} sx={{ display: 'flex', justifyContent: isSentByMe ? 'flex-end' : 'flex-start' }}>
                                <Paper
                                    sx={{
                                        p: '10px 14px',
                                        borderRadius: '10px',
                                        maxWidth: '75%',
                                        bgcolor: isSentByMe ? '#DCF8C6' : 'white',
                                        color: 'black',
                                        boxShadow: 1,
                                    }}
                                >
                                    <Typography variant="body1" sx={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>
                                        {msg.text}
                                    </Typography>
                                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', opacity: 0.6, mt: 0.5 }}>
                                        {msg.createdAt ? format(msg.createdAt.toDate(), 'p') : ''}
                                    </Typography>
                                </Paper>
                            </Box>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </Stack>
            </Container>

            {/* Message Input - using Container to align with messages */}
            <Paper component="form" onSubmit={handleSendMessage} sx={{ width: '100%' }} elevation={0}>
                 <Container maxWidth="md" sx={{ p: 1, display: 'flex', alignItems: 'center', bgcolor: 'grey.200' }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        size="small"
                        sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: '25px' } }}
                    />
                    <IconButton type="submit" color="primary" sx={{ p: '10px', ml: 1 }}>
                        <Send />
                    </IconButton>
                </Container>
            </Paper>
        </Box>
    );
};

export default ChatScreen;
