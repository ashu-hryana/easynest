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
        const q = query(postsCollectionRef, where('status', '==', 'active'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const allPosts = [];
            const today = new Date();
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            let activeTodayCount = 0;
            let newThisWeekCount = 0;
            let totalBudget = 0;

            querySnapshot.forEach((doc) => {
                const postData = { id: doc.id, ...doc.data() };
                allPosts.push(postData);

                // Calculate stats
                const postDate = postData.createdAt?.toDate();
                if (postDate) {
                    if (postDate.toDateString() === today.toDateString()) {
                        activeTodayCount++;
                    }
                    if (postDate >= weekAgo) {
                        newThisWeekCount++;
                    }
                }

                if (postData.budget) {
                    totalBudget += parseInt(postData.budget);
                }
            });

            // Separate user's post and others
            const userPost = allPosts.find(post => post.authorId === currentUser.uid);
            const others = allPosts.filter(post => post.authorId !== currentUser.uid);

            setMyPost(userPost);
            setOtherPosts(others);

            // Update stats
            setStats({
                totalPosts: others.length,
                activeToday: activeTodayCount,
                newThisWeek: newThisWeekCount,
                avgBudget: others.length > 0 ? Math.round(totalBudget / others.length) : 0
            });

            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const applyFilters = (posts) => {
        return posts.filter(post => {
            // Text search
            const searchMatch = !searchQuery ||
                post.authorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.preferences?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.college?.toLowerCase().includes(searchQuery.toLowerCase());

            // Looking for filter
            const lookingForMatch = !activeFilters.lookingFor || post.lookingFor === activeFilters.lookingFor;

            // Budget filter
            const budgetMatch = !post.budget ||
                (post.budget >= activeFilters.budgetRange[0] && post.budget <= activeFilters.budgetRange[1]);

            // Location filter
            const locationMatch = !activeFilters.location ||
                post.location?.toLowerCase().includes(activeFilters.location.toLowerCase());

            // Gender filter
            const genderMatch = !activeFilters.gender || post.gender === activeFilters.gender;

            // Lifestyle filters
            const smokingMatch = !activeFilters.smoking ||
                (activeFilters.smoking === 'yes' && post.smokingAllowed) ||
                (activeFilters.smoking === 'no' && !post.smokingAllowed);

            const drinkingMatch = !activeFilters.drinking ||
                (activeFilters.drinking === 'yes' && post.drinkingAllowed) ||
                (activeFilters.drinking === 'no' && !post.drinkingAllowed);

            const vegetarianMatch = !activeFilters.vegetarian ||
                (activeFilters.vegetarian === 'yes' && post.vegetarian) ||
                (activeFilters.vegetarian === 'no' && !post.vegetarian);

            return searchMatch && lookingForMatch && budgetMatch && locationMatch &&
                   genderMatch && smokingMatch && drinkingMatch && vegetarianMatch;
        });
    };

    const sortPosts = (posts) => {
        const sorted = [...posts];
        switch (sortBy) {
            case 'recent':
                return sorted.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
            case 'budget_low':
                return sorted.sort((a, b) => (a.budget || 0) - (b.budget || 0));
            case 'budget_high':
                return sorted.sort((a, b) => (b.budget || 0) - (a.budget || 0));
            case 'name':
                return sorted.sort((a, b) => (a.authorName || '').localeCompare(b.authorName || ''));
            default:
                return sorted;
        }
    };

    const filteredAndSortedPosts = sortPosts(applyFilters(otherPosts));

    const getActiveFiltersCount = () => {
        let count = 0;
        if (activeFilters.lookingFor) count++;
        if (activeFilters.location) count++;
        if (activeFilters.gender) count++;
        if (activeFilters.smoking) count++;
        if (activeFilters.drinking) count++;
        if (activeFilters.vegetarian) count++;
        if (activeFilters.budgetRange[0] > 0 || activeFilters.budgetRange[1] < 50000) count++;
        return count;
    };

    const clearFilters = () => {
        setActiveFilters({
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
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: 'background.default', minHeight: '100vh', pb: { xs: '80px', md: 0 } }}>
            <Container maxWidth="lg" sx={{ pt: 3, px: { xs: 2, md: 3 } }}>
                {/* Header Section */}
                <Box sx={{ mb: { xs: 3, md: 4 } }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                        Find Your Perfect Roommate 🤝
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'text.secondary', mb: 3 }}>
                        Connect with students looking for rooms and roommates
                    </Typography>

                    {/* Stats Cards */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    {stats.totalPosts}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Active Posts
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.success.main, 0.1) }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                                    {stats.activeToday}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Active Today
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.info.main, 0.1) }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                                    {stats.newThisWeek}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    New This Week
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.warning.main, 0.1) }}>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                    ₹{stats.avgBudget}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Avg. Budget
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>

                {/* Search and Filters Section */}
                <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search by name, location, college, or preferences..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title="Advanced Filters">
                                        <IconButton onClick={() => setFiltersOpen(true)}>
                                            <Badge badgeContent={getActiveFiltersCount()} color="primary">
                                                <FilterList />
                                            </Badge>
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            ),
                            sx: {
                                borderRadius: 3,
                                backgroundColor: 'grey.50',
                                '&:hover': { backgroundColor: 'grey.100' },
                                '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
                            }
                        }}
                    />

                    {/* Quick Filters */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                        <Chip
                            label="Looking for Room"
                            clickable
                            color={activeFilters.lookingFor === 'room' ? 'primary' : 'default'}
                            onClick={() => setActiveFilters(prev => ({
                                ...prev,
                                lookingFor: prev.lookingFor === 'room' ? '' : 'room'
                            }))}
                            icon={<Home />}
                        />
                        <Chip
                            label="Has Room"
                            clickable
                            color={activeFilters.lookingFor === 'only_roommate' ? 'primary' : 'default'}
                            onClick={() => setActiveFilters(prev => ({
                                ...prev,
                                lookingFor: prev.lookingFor === 'only_roommate' ? '' : 'only_roommate'
                            }))}
                            icon={<Person />}
                        />
                        <Chip
                            label="Budget: ≤10k"
                            clickable
                            color={activeFilters.budgetRange[1] === 10000 ? 'primary' : 'default'}
                            onClick={() => setActiveFilters(prev => ({
                                ...prev,
                                budgetRange: prev.budgetRange[1] === 10000 ? [0, 50000] : [0, 10000]
                            }))}
                            icon={<AccountBalanceWallet />}
                        />
                        <Chip
                            label="Near Me"
                            clickable
                            onClick={() => {
                                // Implement location-based filter
                                setActiveFilters(prev => ({ ...prev, location: 'near me' }));
                            }}
                            icon={<LocationOn />}
                        />
                    </Box>

                    {/* Sort Options */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            {filteredAndSortedPosts.length} {filteredAndSortedPosts.length === 1 ? 'result' : 'results'} found
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">Sort by:</Typography>
                            <Chip
                                label="Recent"
                                size="small"
                                clickable
                                color={sortBy === 'recent' ? 'primary' : 'default'}
                                onClick={() => setSortBy('recent')}
                            />
                            <Chip
                                label="Budget"
                                size="small"
                                clickable
                                color={sortBy === 'budget_low' ? 'primary' : 'default'}
                                onClick={() => setSortBy('budget_low')}
                            />
                        </Box>
                    </Box>

                    {getActiveFiltersCount() > 0 && (
                        <Box sx={{ mt: 2, p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.1), borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2">
                                    {getActiveFiltersCount()} filter{getActiveFiltersCount() > 1 ? 's' : ''} applied
                                </Typography>
                                <Button size="small" onClick={clearFilters}>
                                    Clear all
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {activeFilters.lookingFor && (
                                    <Chip
                                        label={`Looking for: ${activeFilters.lookingFor}`}
                                        onDelete={() => setActiveFilters(prev => ({ ...prev, lookingFor: '' }))}
                                        size="small"
                                    />
                                )}
                                {activeFilters.location && (
                                    <Chip
                                        label={`Location: ${activeFilters.location}`}
                                        onDelete={() => setActiveFilters(prev => ({ ...prev, location: '' }))}
                                        size="small"
                                    />
                                )}
                                {activeFilters.gender && (
                                    <Chip
                                        label={`Gender: ${activeFilters.gender}`}
                                        onDelete={() => setActiveFilters(prev => ({ ...prev, gender: '' }))}
                                        size="small"
                                    />
                                )}
                            </Box>
                        </Box>
                    )}
                </Paper>

                {/* Results Section */}
                {filteredAndSortedPosts.length === 0 ? (
                    <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
                        <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
                            No roommate posts found
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                            Try adjusting your filters or search terms
                        </Typography>
                        <Button variant="outlined" onClick={clearFilters} sx={{ mr: 2 }}>
                            Clear Filters
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/roommates/create')}
                            disabled={!!myPost}
                        >
                            Create Post
                        </Button>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {filteredAndSortedPosts.map(post => (
                            <Fade in key={post.id} timeout={300}>
                                <Grid item xs={12} sm={6} md={4} lg={3}>
                                    <RoommatePostCard post={post} />
                                </Grid>
                            </Fade>
                        ))}
                    </Grid>
                )}
            </Container>

            {/* Floating Action Buttons */}
            <Stack spacing={2} sx={{ position: 'fixed', bottom: { xs: 90, md: 30 }, right: 20, alignItems: 'flex-end' }}>
                {/* Edit Post Button */}
                {myPost && (
                    <Tooltip title="Edit Your Post">
                        <Fab
                            color="secondary"
                            aria-label="edit post"
                            onClick={() => navigate(`/roommates/edit/${myPost.id}`)}
                            sx={{ backgroundColor: theme.palette.warning.main }}
                        >
                            <Edit />
                        </Fab>
                    </Tooltip>
                )}

                {/* Create Post Button */}
                {!myPost && (
                    <Tooltip title="Create Roommate Post">
                        <Fab
                            color="primary"
                            aria-label="add post"
                            onClick={() => navigate('/roommates/create')}
                            sx={{
                                background: 'linear-gradient(135deg, #FF385C 0%, #E01E5A 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #E01E5A 0%, #D10134 100%)',
                                }
                            }}
                        >
                            <Add />
                        </Fab>
                    </Tooltip>
                )}
            </Stack>

            {/* Advanced Filters Dialog */}
            <RoommateSearchFilters
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                filters={activeFilters}
                onApplyFilters={setActiveFilters}
            />
        </Box>
    );
};

export default RoommateFinderScreen;