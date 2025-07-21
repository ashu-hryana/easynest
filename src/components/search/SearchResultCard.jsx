// /src/components/search/SearchResultCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  IconButton,
} from '@mui/material';
import { useWishlist } from '../../contexts/WishlistContext';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

const SearchResultCard = ({ item }) => {
  const navigate = useNavigate();
  const { addItem, removeItem, isSaved } = useWishlist();
  const saved = isSaved(item.id);

  // Yeh JavaScript logic bilkul same rahega
  const locationText = `Room in Boys PG · ${item.location.split(',')[0]}`;

  const handleWishlistToggle = (e) => {
    e.stopPropagation(); // Main card click ko rokne ke liye
    saved ? removeItem(item.id) : addItem(item);
  };

  return (
    <ListItem
      disablePadding // Default padding hata rahe hain
      // Heart icon ko end mein daalne ka sabse aasan tareeka
      secondaryAction={
        <IconButton edge="end" aria-label="wishlist" onClick={handleWishlistToggle}>
          {saved ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
        </IconButton>
      }
    >
      <ListItemButton onClick={() => navigate(`/listing/${item.id}`, { state: { item } })}>
        <ListItemAvatar>
          <Avatar 
            variant="rounded" 
            src={item.image} 
            sx={{ width: 64, height: 64, marginRight: 2 }} 
          />
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: 16 }}>
              {item.name}
            </Typography>
          }
          secondary={locationText}
        />
        <Typography variant="body1" sx={{ fontWeight: 'bold', marginLeft: 2 }}>
          ₹{item.price}/month
        </Typography>
      </ListItemButton>
    </ListItem>
  );
};

export default SearchResultCard;