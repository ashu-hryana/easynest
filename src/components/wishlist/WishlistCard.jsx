// /src/components/wishlist/WishlistCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardActionArea, CardMedia, CardContent, Typography, Box, Button } from '@mui/material';
import StarIcon from '@mui/icons-material/Star'; // Star icon ke liye
import { useWishlist } from '../../contexts/WishlistContext';

const WishlistCard = ({ item }) => {
  const { removeItem } = useWishlist(); // Yeh hook same kaam karega
  const navigate = useNavigate();

  // Card par click hone par
  const handleNavigate = () => {
    // Web mein nested stack jaisa concept nahi hota, hum seedha URL par navigate karte hain
    navigate(`/listing/${item.id}`, { state: { item } });
  };

  // Unsave button par click hone par
  const handleRemove = (e) => {
    e.stopPropagation(); // Card ke click ko trigger hone se rokne ke liye
    removeItem(item.id);
  };

  return (
    <Card sx={{ marginBottom: 3, borderRadius: 3, boxShadow: 3 }}>
      <CardActionArea onClick={handleNavigate}>
        <CardMedia
          component="img"
          height="200"
          image={item.image || 'https://placehold.co/600x400/EEE/31343C?text=Photo'}
          alt={item.name}
        />
      </CardActionArea>
      <CardContent>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-end' 
          }}
        >
          {/* Left side info */}
          <Box>
            <Typography 
              variant="body2" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: 'text.secondary' 
              }}
            >
              <StarIcon sx={{ color: '#FFC700', fontSize: 16, marginRight: 0.5 }} />
              {item.rating}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginY: 0.5 }}>
              {item.name}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              ₹{item.price}/month
            </Typography>
          </Box>

          {/* Right side "Unsave" button */}
          <Button
            variant="contained"
            onClick={handleRemove}
            sx={{
              backgroundColor: 'black',
              borderRadius: '20px',
              px: 2, // paddingHorizontal
              '&:hover': {
                backgroundColor: '#333',
              },
            }}
          >
            Unsave
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WishlistCard;