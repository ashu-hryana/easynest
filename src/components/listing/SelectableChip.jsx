// /src/components/listing/SelectableChip.jsx
import React from 'react';
import { Chip } from '@mui/material';

// Yaad rakhein: Icon ko ab component ki tarah pass karna hoga.
// Parent component se aise bhejenge: icon={<SomeIcon />}

const SelectableChip = ({ icon, label, isSelected, onPress }) => {
  return (
    <Chip
      icon={icon}
      label={label}
      onClick={onPress}
      sx={{
        // Conditional styling using the sx prop
        backgroundColor: isSelected ? 'black' : '#f5f5f5', // offWhite equivalent
        color: isSelected ? 'white' : 'black',
        border: '1px solid',
        borderColor: isSelected ? 'black' : 'grey.300', // lightGray equivalent
        
        // Hover effects for better UX
        '&:hover': {
          backgroundColor: isSelected ? '#333' : '#e0e0e0',
        },

        // Styling for the icon inside the chip
        '& .MuiChip-icon': {
          color: isSelected ? 'white' : 'black',
        },
        
        // Other styles
        height: 'auto',
        paddingY: '10px',
        paddingX: '8px',
        marginRight: '10px',
        marginBottom: '10px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        borderRadius: '20px',
      }}
    />
  );
};

export default SelectableChip;