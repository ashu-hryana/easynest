// /src/screens/owner/listing_flow/Step2_Amenities.jsx
import React from 'react';
import { useListing } from '../../../contexts/ListingContext';
import { Box, Typography, Divider } from '@mui/material';

// Master lists aur SelectableChip import karo
import { AVAILABLE_AMENITIES, AVAILABLE_RULES } from '../../../constants/data';
import SelectableChip from '../../../components/listing/SelectableChip';

const Step2_Amenities = () => {
    const { listingData, updateListingData } = useListing();

    // Yeh function context ko update karne ke liye bilkul same rahega
    const toggleSelection = (itemLabel, key) => {
        const currentSelection = listingData[key] || [];
        const newSelection = currentSelection.includes(itemLabel)
            ? currentSelection.filter(i => i !== itemLabel)
            : [...currentSelection, itemLabel];
        updateListingData({ [key]: newSelection });
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>What your place offers</Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Select all the amenities available at your PG.
            </Typography>

            {/* Chip Cloud for Amenities */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {AVAILABLE_AMENITIES.map(amenity => (
                    <SelectableChip
                        key={amenity.label}
                        icon={amenity.icon}
                        label={amenity.label}
                        isSelected={listingData.amenities?.includes(amenity.label)}
                        onPress={() => toggleSelection(amenity.label, 'amenities')}
                    />
                ))}
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Set your house rules</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {AVAILABLE_RULES.map(rule => (
                    <SelectableChip
                        key={rule.label}
                        icon={rule.icon}
                        label={rule.label}
                        isSelected={listingData.rules?.includes(rule.label)}
                        onPress={() => toggleSelection(rule.label, 'rules')}
                    />
                ))}
            </Box>
        </Box>
    );
};

export default Step2_Amenities;