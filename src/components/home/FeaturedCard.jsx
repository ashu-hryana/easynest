import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardActionArea, CardMedia, CardContent, Typography, IconButton } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useWishlist } from '../../contexts/WishlistContext';
import { useNotification } from '../../contexts/NotificationContext'; // Notification context import karein

const FeaturedCard = ({ item }) => {
  const navigate = useNavigate();
  const { addItem, removeItem, isSaved } = useWishlist();
  const { showNotification } = useNotification(); // showNotification function lein
  const saved = isSaved(item.id);

  const handleCardClick = () => {
    // --- FIX: Safety check add kiya gaya hai ---
    if (item && item.id) {
      console.log("FeaturedCard: Navigating to listing with ID:", item.id);
      navigate(`/listing/${item.id}`);
    } else {
      console.error("FeaturedCard Error: Listing ID is missing!", item);
      showNotification("Could not open listing. ID is missing.", "error");
    }
  };

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    saved ? removeItem(item.id) : addItem(item);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <IconButton
        onClick={handleWishlistToggle}
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          color: saved ? 'error.main' : 'text.secondary',
          boxShadow: 2,
          '&:hover': {
            backgroundColor: 'white',
            transform: 'scale(1.1)',
          },
          transition: 'all 0.2s ease-in-out',
          width: 40,
          height: 40,
        }}
      >
        {saved ? (
          <FavoriteIcon fontSize="small" />
        ) : (
          <FavoriteBorderIcon fontSize="small" />
        )}
      </IconButton>

      <Card
        sx={{
          width: '100%',
          cursor: 'pointer',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          }
        }}
        onClick={handleCardClick}
      >
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          <CardMedia
            component="img"
            height="200"
            image={item.photos?.[0]?.url || 'https://placehold.co/400x300/F7F7F7/CCCCCC?text=No+Photo'}
            alt={item.name}
            sx={{
              backgroundColor: 'grey.50',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
              }
            }}
          />
          {item.rating && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Typography variant="caption">★</Typography>
              <Typography variant="caption">{item.rating}</Typography>
            </Box>
          )}
        </Box>
        <CardContent sx={{ p: 2 }}>
          <Typography
            variant="h6"
            component="div"
            noWrap
            sx={{
              fontWeight: 600,
              mb: 0.5,
              color: 'text.primary',
              fontSize: '1rem'
            }}
          >
            {item.name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.5 }}
          >
            {item.city}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              ₹{item.price}
              <Typography component="span" variant="caption" sx={{ fontWeight: 400, color: 'text.secondary' }}>
                /month
              </Typography>
            </Typography>
            {item.propertyType && (
              <Chip
                label={item.propertyType}
                size="small"
                sx={{
                  backgroundColor: 'grey.100',
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  height: 24,
                }}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FeaturedCard;