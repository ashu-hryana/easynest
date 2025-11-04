// src/screens/app/RoommateFinderScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    CircularProgress,
    Grid,
    TextField,
    InputAdornment,
    Fab,
    Stack,
    Tooltip,
    Chip,
    Button,
    Paper,
    IconButton,
    Menu,
    MenuItem,
    Fade,
    useTheme,
    alpha,
    Badge
} from '@mui/material';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Search, Add, FilterList, Person, Home, AccountBalanceWallet, LocationOn, Schedule } from '@mui/icons-material';
import { format } from 'date-fns';

import RoommatePostCard from '../../components/roommates/RoommatePostCard';
import RoommateSearchFilters from '../../components/roommates/RoommateSearchFilters';

const RoommateFinderScreen = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const theme = useTheme();

    const [myPost, setMyPost] = useState(null);
    const [otherPosts, setOtherPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState({
        lookingFor: '',
        budgetRange: [0, 50000],
        location: '',
        smoking: '',
        drinking: '',
        vegetarian: '',
        gender: '',
        ageRange: [18, 35],
        moveInDate: null
    });
    const [sortBy, setSortBy] = useState('recent');
    const [stats, setStats] = useState({
        totalPosts: 0,
        activeToday: 0,
        newThisWeek: 0,
        avgBudget: 0
    });

    const filterMenuAnchor = useRef(null);

    useEffect(() => {
        if (!currentUser) return;

        const postsCollectionRef = collection(db, 'roommate_posts');
        const q = query(postsCollectionRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const allPosts = [];
            querySnapshot.forEach((doc) => {
                allPosts.push({ id: doc.id, ...doc.data() });
            });
            
            // Apni post aur doosron ki posts ko alag-alag karo
            const userPost = allPosts.find(post => post.authorId === currentUser.uid);
            const others = allPosts.filter(post => post.authorId !== currentUser.uid);
            
            setMyPost(userPost);
            setOtherPosts(others);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);
    
    const filteredPosts = otherPosts.filter(post =>
        post.authorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.preferences?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Container maxWidth="lg" sx={{ py: 3, pb: 12 /* Floating buttons ke liye jagah */ }}>
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Find Your Perfect Roommate</Typography>
                    <Typography color="text.secondary">Browse posts from students looking for rooms and roommates.</Typography>
                </Box>

                <Box sx={{ mb: 4 }}>
                    <TextField fullWidth placeholder="Search posts by name, location, or preferences..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><Search /></InputAdornment>), sx: { borderRadius: '25px' } }} />
                </Box>

                <Grid container spacing={3}>
                    {filteredPosts.map(post => (
                        <Grid item key={post.id} xs={12} sm={6} md={4} lg={3}>
                            <RoommatePostCard post={post} />
                        </Grid>
                    ))}
                </Grid>
            </Container>
            
            {/* --- YEH HAI CORRECTED FLOATING BUTTONS SECTION --- */}
            <Stack spacing={2} sx={{ position: 'fixed', bottom: 80, right: 30, alignItems: 'flex-end' }}>
                

                {/* 'Add Post' ka button sirf tab dikhega jab post na ho */}
                {!myPost && (
                    <Tooltip title="Post Your Requirement">
                        <Fab
                            color="primary"
                            aria-label="add post"
                            onClick={() => navigate('/roommates/create')}
                            sx={{ backgroundColor: 'black', color: 'white' }}
                        >
                            <Add />
                        </Fab>
                    </Tooltip>
                )}
            </Stack>
        </Box>
    );
};

export default RoommateFinderScreen;