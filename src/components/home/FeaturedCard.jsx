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
    <Box sx={{ position: 'relative', width: 220, marginRight: 2 }}>
      <IconButton
        onClick={handleWishlistToggle}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 2,
          backgroundColor: 'rgba(0,0,0,0.4)',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.6)',
          }
        }}
      >
        {saved ? (
          <FavoriteIcon sx={{ color: 'red' }} fontSize="small" />
        ) : (
          <FavoriteBorderIcon sx={{ color: 'white' }} fontSize="small" />
        )}
      </IconButton>

      <Card sx={{ width: '100%', borderRadius: 3 }}>
        <CardActionArea onClick={handleCardClick}>
          <CardMedia
            component="img"
            height="140"
            image={item.photos?.[0]?.url || 'https://placehold.co/600x400/EEE/31343C?text=Photo'}
            alt={item.name}
            sx={{ backgroundColor: '#EFEFEF' }}
          />
          <CardContent>
            <Typography gutterBottom variant="h6" component="div" noWrap>
              {item.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.city}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </Box>
  );
};

export default FeaturedCard;