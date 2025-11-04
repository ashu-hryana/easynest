import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Rating,
    Button,
    Paper,
    Avatar,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Grid,
    Divider,
    LinearProgress,
    useTheme,
    Fade,
    Slide
} from '@mui/material';
import {
    Star,
    StarRate,
    ThumbUp,
    ThumbDown,
    Flag,
    Verified,
    CalendarToday,
    LocationOn,
    Send,
    Close,
    ExpandMore,
    ExpandLess,
    Edit,
    Delete
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const ReviewSystem = ({ propertyId, propertyDetails, onReviewSubmitted }) => {
    const theme = useTheme();
    const { user } = useAuth();

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [userReview, setUserReview] = useState(null);
    const [expandedReviews, setExpandedReviews] = useState(new Set());
    const [filterRating, setFilterRating] = useState(0);
    const [sortBy, setSortBy] = useState('recent');

    // Review form state
    const [newReview, setNewReview] = useState({
        overall: 0,
        cleanliness: 0,
        food: 0,
        safety: 0,
        amenities: 0,
        location: 0,
        value: 0,
        title: '',
        content: '',
        wouldRecommend: null,
        pros: [],
        cons: []
    });

    const REVIEW_CATEGORIES = [
        { key: 'cleanliness', label: 'Cleanliness', icon: '🧹' },
        { key: 'food', label: 'Food Quality', icon: '🍽️' },
        { key: 'safety', label: 'Safety & Security', icon: '🔒' },
        { key: 'amenities', label: 'Amenities', icon: '🏠' },
        { key: 'location', label: 'Location', icon: '📍' },
        { key: 'value', label: 'Value for Money', icon: '💰' }
    ];

    const COMMON_PROS = [
        'Great location',
        'Clean and well-maintained',
        'Helpful staff',
        'Good food quality',
        'Safe and secure',
        'Affordable pricing',
        'Modern amenities',
        'Peaceful environment'
    ];

    const COMMON_CONS = [
        'Small rooms',
        'Limited parking',
        'Noisy environment',
        'Poor food quality',
        'Maintenance issues',
        'Unresponsive staff',
        'High prices',
        'Poor internet connectivity'
    ];

    // Mock reviews data
    useEffect(() => {
        const fetchReviews = async () => {
            setLoading(true);
            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000));

                const mockReviews = [
                    {
                        id: '1',
                        userId: 'user1',
                        userName: 'Rahul Sharma',
                        userAvatar: '',
                        verified: true,
                        bookingId: 'booking1',
                        stayPeriod: 'Jan 2024 - Mar 2024',
                        rating: 4.5,
                        categories: {
                            cleanliness: 5,
                            food: 4,
                            safety: 5,
                            amenities: 4,
                            location: 5,
                            value: 4
                        },
                        title: 'Great stay near Delhi University',
                        content: 'I stayed here for 3 months while preparing for my exams. The location is perfect - just 10 minutes walk from the college. The rooms are clean and well-maintained. Food quality is good with variety in menu. Staff is very helpful and responsive. Would definitely recommend to other students.',
                        pros: ['Great location', 'Clean and well-maintained', 'Helpful staff', 'Good food quality'],
                        cons: ['Small rooms'],
                        wouldRecommend: true,
                        images: ['image1.jpg', 'image2.jpg'],
                        helpfulCount: 12,
                        notHelpfulCount: 2,
                        response: {
                            text: 'Thank you for your wonderful feedback! We are glad you had a comfortable stay with us.',
                            respondedBy: 'Property Manager',
                            respondedAt: new Date(Date.now() - 86400000)
                        },
                        createdAt: new Date(Date.now() - 172800000),
                        verified: true
                    },
                    {
                        id: '2',
                        userId: 'user2',
                        userName: 'Priya Patel',
                        userAvatar: '',
                        verified: true,
                        bookingId: 'booking2',
                        stayPeriod: 'Feb 2024 - Apr 2024',
                        rating: 3.5,
                        categories: {
                            cleanliness: 4,
                            food: 3,
                            safety: 4,
                            amenities: 3,
                            location: 4,
                            value: 3
                        },
                        title: 'Decent place with some room for improvement',
                        content: 'The PG is decent overall. Location is convenient and safety is good. However, food quality could be improved and rooms are quite small. The price is reasonable for the location.',
                        pros: ['Great location', 'Safe and secure', 'Affordable pricing'],
                        cons: ['Small rooms', 'Poor food quality', 'Limited parking'],
                        wouldRecommend: false,
                        images: [],
                        helpfulCount: 8,
                        notHelpfulCount: 1,
                        createdAt: new Date(Date.now() - 259200000),
                        verified: true
                    }
                ];

                setReviews(mockReviews);
                checkUserReview(mockReviews);
            } catch (error) {
                console.error('Error fetching reviews:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [propertyId, user?.uid]);

    const checkUserReview = (reviewsData) => {
        if (user?.uid) {
            const userExistingReview = reviewsData.find(review => review.userId === user.uid);
            setUserReview(userExistingReview);
        }
    };

    const calculateOverallRating = (reviewList) => {
        if (reviewList.length === 0) return 0;
        const sum = reviewList.reduce((acc, review) => acc + review.rating, 0);
        return (sum / reviewList.length).toFixed(1);
    };

    const calculateCategoryAverages = () => {
        const categories = {};
        REVIEW_CATEGORIES.forEach(category => {
            const sum = reviews.reduce((acc, review) => acc + (review.categories[category.key] || 0), 0);
            categories[category.key] = reviews.length > 0 ? (sum / reviews.length).toFixed(1) : 0;
        });
        return categories;
    };

    const getRatingDistribution = () => {
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(review => {
            const rating = Math.floor(review.rating);
            distribution[rating]++;
        });
        return distribution;
    };

    const handleReviewSubmit = async () => {
        try {
            const reviewData = {
                ...newReview,
                overall: (newReview.cleanliness + newReview.food + newReview.safety +
                         newReview.amenities + newReview.location + newReview.value) / 6,
                userId: user.uid,
                userName: user.displayName,
                userAvatar: user.photoURL,
                createdAt: new Date(),
                verified: true
            };

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            setReviews(prev => [reviewData, ...prev]);
            setUserReview(reviewData);
            setReviewDialogOpen(false);
            resetReviewForm();
            onReviewSubmitted?.(reviewData);
        } catch (error) {
            console.error('Error submitting review:', error);
        }
    };

    const resetReviewForm = () => {
        setNewReview({
            overall: 0,
            cleanliness: 0,
            food: 0,
            safety: 0,
            amenities: 0,
            location: 0,
            value: 0,
            title: '',
            content: '',
            wouldRecommend: null,
            pros: [],
            cons: []
        });
    };

    const handleHelpful = (reviewId, helpful) => {
        // Implement helpful/not helpful functionality
        console.log(`Review ${reviewId} marked as ${helpful ? 'helpful' : 'not helpful'}`);
    };

    const toggleReviewExpansion = (reviewId) => {
        const newExpanded = new Set(expandedReviews);
        if (newExpanded.has(reviewId)) {
            newExpanded.delete(reviewId);
        } else {
            newExpanded.add(reviewId);
        }
        setExpandedReviews(newExpanded);
    };

    const filteredAndSortedReviews = () => {
        let filtered = reviews;

        if (filterRating > 0) {
            filtered = filtered.filter(review => Math.floor(review.rating) === filterRating);
        }

        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'recent':
                    return b.createdAt - a.createdAt;
                case 'rating-high':
                    return b.rating - a.rating;
                case 'rating-low':
                    return a.rating - b.rating;
                case 'helpful':
                    return b.helpfulCount - a.helpfulCount;
                default:
                    return 0;
            }
        });
    };

    const overallRating = calculateOverallRating(reviews);
    const categoryAverages = calculateCategoryAverages();
    const ratingDistribution = getRatingDistribution();
    const filteredReviews = filteredAndSortedReviews();

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography>Loading reviews...</Typography>
                <LinearProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Rating Summary */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
                    Guest Reviews
                </Typography>

                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {overallRating}
                            </Typography>
                            <Rating value={parseFloat(overallRating)} precision={0.1} readOnly size="large" />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {reviews.length} reviews
                            </Typography>
                            {userReview && (
                                <Chip
                                    icon={<Verified />}
                                    label="You've reviewed this property"
                                    color="primary"
                                    sx={{ mt: 2 }}
                                />
                            )}
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Box sx={{ mb: 3 }}>
                            {[5, 4, 3, 2, 1].map(rating => {
                                const percentage = reviews.length > 0 ? (ratingDistribution[rating] / reviews.length) * 100 : 0;
                                return (
                                    <Box key={rating} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Typography sx={{ minWidth: 40 }}>{rating}★</Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={percentage}
                                            sx={{ flex: 1, mx: 2, height: 8, borderRadius: 4 }}
                                        />
                                        <Typography sx={{ minWidth: 40, textAlign: 'right' }}>
                                            {ratingDistribution[rating]}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Box>

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => setReviewDialogOpen(true)}
                            disabled={!!userReview}
                            sx={{ borderRadius: 2 }}
                        >
                            {userReview ? 'Review Submitted' : 'Write a Review'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Category Ratings */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Category Ratings
                </Typography>
                <Grid container spacing={2}>
                    {REVIEW_CATEGORIES.map(category => (
                        <Grid item xs={12} sm={6} md={4} key={category.key}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2">{category.icon}</Typography>
                                <Typography variant="body2" sx={{ flex: 1 }}>
                                    {category.label}
                                </Typography>
                                <Rating
                                    value={parseFloat(categoryAverages[category.key])}
                                    precision={0.1}
                                    readOnly
                                    size="small"
                                />
                                <Typography variant="body2" sx={{ minWidth: 30 }}>
                                    {categoryAverages[category.key]}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            {/* Filters and Sort */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    Filter by rating:
                </Typography>
                {[0, 5, 4, 3, 2, 1].map(rating => (
                    <Chip
                        key={rating}
                        label={rating === 0 ? 'All' : `${rating}★`}
                        clickable
                        color={filterRating === rating ? 'primary' : 'default'}
                        onClick={() => setFilterRating(rating)}
                        variant={filterRating === rating ? 'filled' : 'outlined'}
                    />
                ))}
            </Box>

            {/* Reviews List */}
            <Box>
                {filteredReviews.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                            No reviews yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Be the first to share your experience!
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => setReviewDialogOpen(true)}
                            disabled={!!userReview}
                        >
                            Write a Review
                        </Button>
                    </Paper>
                ) : (
                    filteredReviews.map(review => (
                        <Paper key={review.id} sx={{ p: 3, mb: 2, borderRadius: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <Avatar src={review.userAvatar} sx={{ width: 48, height: 48 }}>
                                    {review.userName?.charAt(0)}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            {review.userName}
                                        </Typography>
                                        {review.verified && (
                                            <Chip
                                                icon={<Verified fontSize="small" />}
                                                label="Verified Stay"
                                                size="small"
                                                color="success"
                                            />
                                        )}
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                        <Rating value={review.rating} precision={0.1} readOnly size="small" />
                                        <Typography variant="body2" color="text.secondary">
                                            {format(review.createdAt, 'MMM dd, yyyy')}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            • {review.stayPeriod}
                                        </Typography>
                                    </Box>

                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                        {review.title}
                                    </Typography>

                                    <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                                        {expandedReviews.has(review.id) || review.content.length <= 300
                                            ? review.content
                                            : `${review.content.substring(0, 300)}...`
                                        }
                                    </Typography>

                                    {review.content.length > 300 && (
                                        <Button
                                            size="small"
                                            onClick={() => toggleReviewExpansion(review.id)}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            {expandedReviews.has(review.id) ? 'Show less' : 'Read more'}
                                            {expandedReviews.has(review.id) ? <ExpandLess /> : <ExpandMore />}
                                        </Button>
                                    )}

                                    {review.pros.length > 0 && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>
                                                👍 Pros:
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {review.pros.map((pro, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={pro}
                                                        size="small"
                                                        variant="outlined"
                                                        color="success"
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    )}

                                    {review.cons.length > 0 && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" color="error.main" sx={{ mb: 1 }}>
                                                👎 Cons:
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {review.cons.map((con, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={con}
                                                        size="small"
                                                        variant="outlined"
                                                        color="error"
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    )}

                                    {review.response && (
                                        <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 2, mt: 2 }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                                Response from {review.response.respondedBy}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {review.response.text}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {format(review.response.respondedAt, 'MMM dd, yyyy')}
                                            </Typography>
                                        </Box>
                                    )}

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                                        <Button
                                            size="small"
                                            startIcon={<ThumbUp />}
                                            onClick={() => handleHelpful(review.id, true)}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Helpful ({review.helpfulCount})
                                        </Button>
                                        <Button
                                            size="small"
                                            startIcon={<ThumbDown />}
                                            onClick={() => handleHelpful(review.id, false)}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Not Helpful ({review.notHelpfulCount})
                                        </Button>
                                        <IconButton size="small">
                                            <Flag fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    ))
                )}
            </Box>

            {/* Review Dialog */}
            <Dialog
                open={reviewDialogOpen}
                onClose={() => setReviewDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ pb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Write Your Review
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ pb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Share your experience to help others make informed decisions
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Rate Each Category:
                        </Typography>
                        {REVIEW_CATEGORIES.map(category => (
                            <Box key={category.key} sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Typography variant="body2">{category.icon}</Typography>
                                    <Typography variant="body2">{category.label}</Typography>
                                </Box>
                                <Rating
                                    value={newReview[category.key]}
                                    onChange={(e, value) => setNewReview(prev => ({
                                        ...prev,
                                        [category.key]: value
                                    }))}
                                    size="large"
                                />
                            </Box>
                        ))}
                    </Box>

                    <TextField
                        fullWidth
                        label="Review Title"
                        value={newReview.title}
                        onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Your Review"
                        placeholder="Share details about your stay..."
                        value={newReview.content}
                        onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                        sx={{ mb: 3 }}
                    />

                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                        Would you recommend this property?
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <Button
                            variant={newReview.wouldRecommend === true ? 'contained' : 'outlined'}
                            onClick={() => setNewReview(prev => ({ ...prev, wouldRecommend: true }))}
                            startIcon={<ThumbUp />}
                        >
                            Yes, I recommend it
                        </Button>
                        <Button
                            variant={newReview.wouldRecommend === false ? 'contained' : 'outlined'}
                            onClick={() => setNewReview(prev => ({ ...prev, wouldRecommend: false }))}
                            startIcon={<ThumbDown />}
                        >
                            No, I don't recommend it
                        </Button>
                    </Box>

                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                        What did you like? (Select all that apply)
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                        {COMMON_PROS.map(pro => (
                            <Chip
                                key={pro}
                                label={pro}
                                clickable
                                color={newReview.pros.includes(pro) ? 'success' : 'default'}
                                onClick={() => {
                                    setNewReview(prev => ({
                                        ...prev,
                                        pros: prev.pros.includes(pro)
                                            ? prev.pros.filter(p => p !== pro)
                                            : [...prev.pros, pro]
                                    }));
                                }}
                                variant={newReview.pros.includes(pro) ? 'filled' : 'outlined'}
                            />
                        ))}
                    </Box>

                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                        What could be improved? (Select all that apply)
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {COMMON_CONS.map(con => (
                            <Chip
                                key={con}
                                label={con}
                                clickable
                                color={newReview.cons.includes(con) ? 'error' : 'default'}
                                onClick={() => {
                                    setNewReview(prev => ({
                                        ...prev,
                                        cons: prev.cons.includes(con)
                                            ? prev.cons.filter(c => c !== con)
                                            : [...prev.cons, con]
                                    }));
                                }}
                                variant={newReview.cons.includes(con) ? 'filled' : 'outlined'}
                            />
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setReviewDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleReviewSubmit}
                        disabled={!newReview.title || !newReview.content || newReview.overall === 0}
                    >
                        Submit Review
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ReviewSystem;