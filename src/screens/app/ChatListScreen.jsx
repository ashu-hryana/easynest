// src/screens/app/ChatListScreen.jsx
import React from 'react';
import {
    Container,
    Box,
    Typography,
    CircularProgress,
    Paper,
    Alert,
    List,
    ListItemButton,
    ListItemAvatar,
    Avatar,
    ListItemText
} from '@mui/material';
import { useConnections } from '../../contexts/ConnectionContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const ChatListScreen = () => {
    const { currentUser } = useAuth();
    const { connections, loading } = useConnections();
    const navigate = useNavigate();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Sirf 'accepted' connections ko filter karo
    const acceptedConnections = connections.filter(c => c.status === 'accepted');

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA', minHeight: '100vh' }}>
            <Paper elevation={0} sx={{ backgroundColor: 'white', p: 2, textAlign: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Chats
                </Typography>
            </Paper>

            <Container maxWidth="md" sx={{ py: 3 }}>
                {acceptedConnections.length > 0 ? (
                    <List>
                        {acceptedConnections.map(conn => {
                            // Pata lagao ki doosra user kaun hai
                            const otherUser = {
                                id: currentUser.uid === conn.requesterId ? conn.receiverId : conn.requesterId,
                                name: currentUser.uid === conn.requesterId ? conn.receiverName : conn.requesterName,
                                photoURL: currentUser.uid === conn.requesterId ? conn.receiverPhotoURL : conn.requesterPhotoURL,
                            };

                            return (
                                <Paper key={conn.id} sx={{ mb: 1, borderRadius: 2, overflow: 'hidden' }}>
                                    {/* --- YEH ITEM AB CLICKABLE HAI --- */}
                                    <ListItemButton onClick={() => navigate(`/chat/${conn.id}`)}>
                                        <ListItemAvatar>
                                            <Avatar src={otherUser.photoURL}>
                                                {otherUser.name?.[0]}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={otherUser.name}
                                            secondary="Tap to start chatting"
                                        />
                                    </ListItemButton>
                                </Paper>
                            );
                        })}
                    </List>
                ) : (
                    <Alert severity="info" sx={{ mt: 3 }}>
                        Once a connection is accepted, your chats will appear here.
                    </Alert>
                )}
            </Container>
        </Box>
    );
};

export default ChatListScreen;