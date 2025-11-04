import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Paper,
    Typography,
    Avatar,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Divider,
    useTheme,
    Fade,
    Slide,
    CircularProgress
} from '@mui/material';
import {
    Send,
    AttachFile,
    Mic,
    MoreVert,
    Phone,
    Videocam,
    LocationOn,
    Schedule,
    Check,
    CheckCircle,
    DoneAll,
    Image,
    Description
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const EnhancedChatScreen = ({ connectionId, connectionName, connectionAvatar }) => {
    const theme = useTheme();
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [typing, setTyping] = useState(false);
    const [onlineStatus, setOnlineStatus] = useState('offline');
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);

    const QUICK_RESPONSES = [
        "Is the property still available?",
        "Can I schedule a visit?",
        "What is the monthly rent?",
        "Are utilities included?",
        "Is there a security deposit?",
        "What is the notice period?"
    ];

    const ATTACHMENT_TYPES = [
        { type: 'image', label: 'Photo', icon: Image, accept: 'image/*' },
        { type: 'document', label: 'Document', icon: Document, accept: '.pdf,.doc,.docx' },
        { type: 'location', label: 'Location', icon: LocationOn, action: 'shareLocation' }
    ];

    // Mock messages - in real app, this would come from Firebase/Socket.io
    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000));

                const mockMessages = [
                    {
                        id: '1',
                        senderId: 'other',
                        text: 'Hi! I saw your inquiry about the PG near Delhi University. Is it still available?',
                        timestamp: new Date(Date.now() - 3600000),
                        status: 'read',
                        type: 'text'
                    },
                    {
                        id: '2',
                        senderId: 'me',
                        text: 'Yes, it\'s available! We have single and double sharing rooms starting from ₹8000/month.',
                        timestamp: new Date(Date.now() - 3000000),
                        status: 'read',
                        type: 'text'
                    },
                    {
                        id: '3',
                        senderId: 'other',
                        text: 'Great! Can I schedule a visit for tomorrow afternoon?',
                        timestamp: new Date(Date.now() - 2400000),
                        status: 'delivered',
                        type: 'text'
                    }
                ];

                setMessages(mockMessages);
                setOnlineStatus('online');
            } catch (error) {
                console.error('Error fetching messages:', error);
                showNotification('Failed to load messages', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [connectionId, showNotification]);

    // Simulate real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            setOnlineStatus(prev => {
                const statuses = ['online', 'away', 'offline'];
                return Math.random() > 0.7 ? statuses[Math.floor(Math.random() * statuses.length)] : prev;
            });
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || sending) return;

        setSending(true);
        const messageText = newMessage.trim();
        setNewMessage('');

        try {
            const newMessageObj = {
                id: Date.now().toString(),
                senderId: user?.uid || 'me',
                text: messageText,
                timestamp: new Date(),
                status: 'sending',
                type: 'text'
            };

            setMessages(prev => [...prev, newMessageObj]);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update message status to sent
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === newMessageObj.id
                        ? { ...msg, status: 'sent' }
                        : msg
                )
            );

            // Simulate delivery and read receipts
            setTimeout(() => {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === newMessageObj.id
                            ? { ...msg, status: 'delivered' }
                            : msg
                    )
                );
            }, 2000);

            setTimeout(() => {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === newMessageObj.id
                            ? { ...msg, status: 'read' }
                            : msg
                    )
                );
            }, 4000);

        } catch (error) {
            console.error('Error sending message:', error);
            showNotification('Failed to send message', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleQuickResponse = (response) => {
        setNewMessage(response);
        setShowQuickActions(false);
    };

    const handleAttachment = (type) => {
        if (type === 'shareLocation') {
            handleShareLocation();
        } else {
            fileInputRef.current?.click();
        }
        setShowAttachmentDialog(false);
    };

    const handleShareLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const locationMessage = `📍 My location: https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`;
                    setNewMessage(locationMessage);
                },
                (error) => {
                    showNotification('Could not get your location', 'error');
                }
            );
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Handle file upload
            const fileMessage = `📎 ${file.name}`;
            setNewMessage(fileMessage);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'sending':
                return <CircularProgress size={12} />;
            case 'sent':
                return <Check fontSize="small" sx={{ color: 'text.secondary' }} />;
            case 'delivered':
                return <CheckCircle fontSize="small" sx={{ color: 'text.secondary' }} />;
            case 'read':
                return <DoneAll fontSize="small" sx={{ color: 'primary.main' }} />;
            default:
                return null;
        }
    };

    const getOnlineStatusColor = () => {
        switch (onlineStatus) {
            case 'online':
                return theme.palette.success.main;
            case 'away':
                return theme.palette.warning.main;
            default:
                return theme.palette.grey[500];
        }
    };

    const formatMessageTime = (timestamp) => {
        return format(timestamp, 'h:mm a');
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'background.default' }}>
            {/* Chat Header */}
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 0 }}>
                <Avatar src={connectionAvatar} sx={{ width: 40, height: 40 }}>
                    {connectionName?.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                        {connectionName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: getOnlineStatusColor()
                            }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {onlineStatus.charAt(0).toUpperCase() + onlineStatus.slice(1)}
                        </Typography>
                    </Box>
                </Box>
                <IconButton>
                    <Phone />
                </IconButton>
                <IconButton>
                    <Videocam />
                </IconButton>
                <IconButton>
                    <MoreVert />
                </IconButton>
            </Paper>

            {/* Messages Area */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {messages.map((message) => (
                            <Fade in key={message.id} timeout={300}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: message.senderId === 'me' ? 'flex-end' : 'flex-start',
                                        mb: 2
                                    }}
                                >
                                    <Box
                                        sx={{
                                            maxWidth: '70%',
                                            backgroundColor: message.senderId === 'me' ? 'primary.main' : 'grey.100',
                                            color: message.senderId === 'me' ? 'white' : 'text.primary',
                                            p: 2,
                                            borderRadius: 2,
                                            borderBottomLeftRadius: message.senderId === 'me' ? 2 : 0,
                                            borderBottomRightRadius: message.senderId === 'me' ? 0 : 2,
                                            boxShadow: 1
                                        }}
                                    >
                                        <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                                            {message.text}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                                {formatMessageTime(message.timestamp)}
                                            </Typography>
                                            {message.senderId === 'me' && getStatusIcon(message.status)}
                                        </Box>
                                    </Box>
                                </Box>
                            </Fade>
                        ))}
                        {typing && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                                <Box sx={{ backgroundColor: 'grey.100', p: 2, borderRadius: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        {connectionName} is typing...
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </Box>

            {/* Quick Actions */}
            {showQuickActions && (
                <Paper sx={{ mx: 2, mb: 1, p: 1 }}>
                    <Typography variant="caption" sx={{ p: 1, color: 'text.secondary' }}>
                        Quick Responses:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {QUICK_RESPONSES.map((response, index) => (
                            <Chip
                                key={index}
                                label={response}
                                variant="outlined"
                                size="small"
                                clickable
                                onClick={() => handleQuickResponse(response)}
                                sx={{ fontSize: '0.75rem' }}
                            />
                        ))}
                    </Box>
                </Paper>
            )}

            {/* Message Input */}
            <Paper sx={{ p: 2, borderRadius: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                    <IconButton
                        onClick={() => setShowAttachmentDialog(true)}
                        sx={{ color: 'text.secondary' }}
                    >
                        <AttachFile />
                    </IconButton>
                    <IconButton
                        onClick={() => setShowQuickActions(!showQuickActions)}
                        sx={{ color: 'text.secondary' }}
                    >
                        <Schedule />
                    </IconButton>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sending}
                        multiline
                        maxRows={3}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                backgroundColor: 'grey.50',
                                '& fieldset': { border: 'none' }
                            }
                        }}
                    />
                    <IconButton
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        sx={{
                            backgroundColor: 'primary.main',
                            color: 'white',
                            '&:hover': { backgroundColor: 'primary.dark' },
                            '&:disabled': { backgroundColor: 'grey.300' }
                        }}
                    >
                        {sending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                    </IconButton>
                </Box>
            </Paper>

            {/* Attachment Dialog */}
            <Dialog
                open={showAttachmentDialog}
                onClose={() => setShowAttachmentDialog(false)}
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle>Share Attachment</DialogTitle>
                <DialogContent>
                    <List>
                        {ATTACHMENT_TYPES.map((type) => {
                            const Icon = type.icon;
                            return (
                                <ListItem
                                    key={type.type}
                                    button
                                    onClick={() => handleAttachment(type.type)}
                                    sx={{ borderRadius: 2 }}
                                >
                                    <ListItemAvatar>
                                        <Avatar sx={{ backgroundColor: 'primary.100', color: 'primary.main' }}>
                                            <Icon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText primary={type.label} />
                                </ListItem>
                            );
                        })}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowAttachmentDialog(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx"
                style={{ display: 'none' }}
            />
        </Box>
    );
};

export default EnhancedChatScreen;