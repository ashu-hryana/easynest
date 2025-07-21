// /src/components/details/AmenityChip.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

// IMPORTANT: Icon ko ab component ki tarah pass karna hoga.
// For example: import AcUnitIcon from '@mui/icons-material/AcUnit';
// Aur use karte waqt <AmenityChip icon={<AcUnitIcon />} ... />

const AmenityChip = ({ icon, label }) => {
  return (
    <Box sx={styles.chipContainer}>
      {/* Icon ko yahan render karenge */}
      {icon}
      <Typography sx={styles.chipLabel}>{label}</Typography>
    </Box>
  );
};

// Styles ko ab ek simple object mein rakhenge
const styles = {
  chipContainer: {
    display: 'flex', // 'flexDirection: row' ke liye
    flexDirection: 'row',
    alignItems: 'center',
    border: '1px solid', // borderWidth + borderColor
    borderColor: 'grey.300', // MUI theme ka color
    borderRadius: '12px',
    py: '10px', // paddingVertical
    px: '12px', // paddingHorizontal
    width: '48%',
    mb: '10px', // marginBottom
  },
  chipLabel: {
    ml: '8px', // marginLeft
    fontSize: 14,
    color: 'text.secondary', // MUI theme ka color
  },
};

export default AmenityChip;