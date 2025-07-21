import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, IconButton, Chip, Paper } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useWishlist } from '../../contexts/WishlistContext';
import { useNotification } from '../../contexts/NotificationContext.jsx'; // Notification context import karein

const ListingRow = ({ item }) => {
  const navigate = useNavigate();
  const { addItem, removeItem, isSaved } = useWishlist();
  const { showNotification } = useNotification(); // showNotification function lein
  const saved = isSaved(item.id);

  const handleNavigate = () => {
    // --- FIX: Safety check yahan bhi add kiya gaya hai ---
    if (item && item.id) {
      console.log("ListingRow: Navigating to listing with ID:", item.id);
      navigate(`/listing/${item.id}`);
    } else {
      console.error("ListingRow Error: Listing ID is missing!", item);
      showNotification("Could not open listing. ID is missing.", "error");
    }
  };

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    saved ? removeItem(item.id) : addItem(item);
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        position: 'relative', 
        overflow: 'hidden',
        borderRadius: 3,
        mb: 3,
        cursor: 'pointer' // Add cursor pointer to the whole paper
      }}
      onClick={handleNavigate} // Make the whole paper clickable
    >
      <IconButton onClick={handleWishlistToggle} sx={styles.heartButton}>
        {saved ? (
          <FavoriteIcon sx={{ color: 'red' }} fontSize="small" />
        ) : (
          <FavoriteBorderIcon sx={{ color: 'white' }} fontSize="small" />
        )}
      </IconButton>
      
      <Box sx={styles.container}>
        <Box sx={styles.textContainer}>
          <Typography sx={styles.newTag}>New</Typography>
          <Typography variant="h6" sx={styles.name}>{item.name}</Typography>
          <Typography sx={styles.location}>{item.city}</Typography>
          <Chip label={`₹${item.price} / month`} sx={styles.priceChip} />
        </Box>

        <Box
          component="img"
          src={item.photos?.[0]?.url || 'https://placehold.co/400x400/EEE/31343C?text=Photo'}
          alt={item.name}
          sx={styles.image}
        />
      </Box>
    </Paper>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    padding: 2,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  image: {
    width: 120,
    height: 140, // Consistent height
    objectFit: 'cover',
  },
  newTag: { 
    fontSize: 12, 
    color: 'text.secondary', 
    mb: 0.5 
  },
  name: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    mb: 0.5 
  },
  location: { 
    fontSize: 14, 
    color: 'text.secondary', 
    mb: 1 
  },
  priceChip: {
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    backgroundColor: '#f5f5f5',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.6)',
    }
  },
};

export default ListingRow;