import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Slider,
    FormControl,
    FormControlLabel,
    Checkbox,
    FormGroup,
    Chip,
    Divider,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Stack,
    TextField,
    Autocomplete
} from '@mui/material';
import {
    ExpandMore,
    Close,
    LocationOn,
    Home,
    AttachMoney,
    Bed,
    Group,
    Pets,
    SmokeFree,
    LocalParking,
    Wifi,
    Kitchen,
    AcUnit,
    Elevator,
    Security
} from '@mui/icons-material';

const PROPERTY_TYPES = [
    { value: 'pg', label: 'Paying Guest (PG)' },
    { value: 'flat', label: 'Flat/Apartment' },
    { value: 'house', label: 'Independent House' },
    { value: 'hostel', label: 'Hostel' },
    { value: 'shared', label: 'Shared Room' }
];

const OCCUPANCY_TYPES = [
    { value: 'single', label: 'Single Occupancy' },
    { value: 'double', label: 'Double Sharing' },
    { value: 'triple', label: 'Triple Sharing' },
    { value: 'four', label: 'Four Sharing' }
];

const AMENITIES = [
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'parking', label: 'Parking', icon: LocalParking },
    { id: 'kitchen', label: 'Kitchen', icon: Kitchen },
    { id: 'ac', label: 'Air Conditioning', icon: AcUnit },
    { id: 'elevator', label: 'Elevator', icon: Elevator },
    { id: 'security', label: 'Security', icon: Security }
];

const RULES = [
    { id: 'vegetarian', label: 'Vegetarian Only' },
    { id: 'non-vegetarian', label: 'Non-Vegetarian Allowed' },
    { id: 'no-smoking', label: 'No Smoking', icon: SmokeFree },
    { id: 'pets-allowed', label: 'Pets Allowed', icon: Pets },
    { id: 'no-alcohol', label: 'No Alcohol' },
    { id: 'visitors-allowed', label: 'Visitors Allowed' }
];

const AdvancedSearchModal = ({ open, onClose, onApplyFilters, initialFilters }) => {
    const [filters, setFilters] = useState({
        location: '',
        propertyType: [],
        occupancyType: [],
        priceRange: [0, 50000],
        radius: 5,
        amenities: [],
        rules: [],
        genderPreference: '',
        furnished: '',
        ageOfProperty: '',
        availableFrom: null
    });

    useEffect(() => {
        if (initialFilters) {
            setFilters(prev => ({ ...prev, ...initialFilters }));
        }
    }, [initialFilters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleArrayFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: prev[key].includes(value)
                ? prev[key].filter(item => item !== value)
                : [...prev[key], value]
        }));
    };

    const handleApplyFilters = () => {
        onApplyFilters(filters);
        onClose();
    };

    const handleResetFilters = () => {
        setFilters({
            location: '',
            propertyType: [],
            occupancyType: [],
            priceRange: [0, 50000],
            radius: 5,
            amenities: [],
            rules: [],
            genderPreference: '',
            furnished: '',
            ageOfProperty: '',
            availableFrom: null
        });
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        if (filters.location) count++;
        if (filters.propertyType.length > 0) count++;
        if (filters.occupancyType.length > 0) count++;
        if (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000) count++;
        if (filters.amenities.length > 0) count++;
        if (filters.rules.length > 0) count++;
        if (filters.genderPreference) count++;
        if (filters.furnished) count++;
        return count;
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle sx={{ pb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Advanced Search
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
                {getActiveFiltersCount() > 0 && (
                    <Chip
                        label={`${getActiveFiltersCount()} filters applied`}
                        color="primary"
                        size="small"
                        sx={{ mt: 1 }}
                    />
                )}
            </DialogTitle>

            <DialogContent sx={{ pb: 1 }}>
                <Stack spacing={3}>
                    {/* Location Search */}
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationOn color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                    Location & Radius
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                <TextField
                                    fullWidth
                                    label="Search Location"
                                    placeholder="Enter area, college, or landmark..."
                                    value={filters.location}
                                    onChange={(e) => handleFilterChange('location', e.target.value)}
                                />
                                <Box>
                                    <Typography gutterBottom>
                                        Search Radius: {filters.radius} km
                                    </Typography>
                                    <Slider
                                        value={filters.radius}
                                        onChange={(e, value) => handleFilterChange('radius', value)}
                                        min={1}
                                        max={20}
                                        step={1}
                                        marks={[
                                            { value: 1, label: '1km' },
                                            { value: 5, label: '5km' },
                                            { value: 10, label: '10km' },
                                            { value: 20, label: '20km' }
                                        ]}
                                    />
                                </Box>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    {/* Property Type */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Home color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                    Property Type
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {PROPERTY_TYPES.map((type) => (
                                    <Chip
                                        key={type.value}
                                        label={type.label}
                                        clickable
                                        color={filters.propertyType.includes(type.value) ? 'primary' : 'default'}
                                        onClick={() => handleArrayFilterChange('propertyType', type.value)}
                                        variant={filters.propertyType.includes(type.value) ? 'filled' : 'outlined'}
                                    />
                                ))}
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    {/* Price Range */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AttachMoney color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                    Price Range (per month)
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box>
                                <Typography gutterBottom>
                                    ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                                </Typography>
                                <Slider
                                    value={filters.priceRange}
                                    onChange={(e, value) => handleFilterChange('priceRange', value)}
                                    min={0}
                                    max={50000}
                                    step={1000}
                                    marks={[
                                        { value: 0, label: '₹0' },
                                        { value: 10000, label: '₹10k' },
                                        { value: 25000, label: '₹25k' },
                                        { value: 50000, label: '₹50k' }
                                    ]}
                                />
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    {/* Occupancy Type */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Group color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                    Occupancy Type
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {OCCUPANCY_TYPES.map((type) => (
                                    <Chip
                                        key={type.value}
                                        label={type.label}
                                        clickable
                                        color={filters.occupancyType.includes(type.value) ? 'primary' : 'default'}
                                        onClick={() => handleArrayFilterChange('occupancyType', type.value)}
                                        variant={filters.occupancyType.includes(type.value) ? 'filled' : 'outlined'}
                                    />
                                ))}
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    {/* Amenities */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                Amenities
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {AMENITIES.map((amenity) => (
                                    <Chip
                                        key={amenity.id}
                                        icon={amenity.icon && <amenity.icon fontSize="small" />}
                                        label={amenity.label}
                                        clickable
                                        color={filters.amenities.includes(amenity.id) ? 'primary' : 'default'}
                                        onClick={() => handleArrayFilterChange('amenities', amenity.id)}
                                        variant={filters.amenities.includes(amenity.id) ? 'filled' : 'outlined'}
                                    />
                                ))}
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    {/* Rules & Preferences */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                Rules & Preferences
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                <Typography variant="subtitle2">House Rules</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {RULES.map((rule) => (
                                        <Chip
                                            key={rule.id}
                                            icon={rule.icon && <rule.icon fontSize="small" />}
                                            label={rule.label}
                                            clickable
                                            color={filters.rules.includes(rule.id) ? 'primary' : 'default'}
                                            onClick={() => handleArrayFilterChange('rules', rule.id)}
                                            variant={filters.rules.includes(rule.id) ? 'filled' : 'outlined'}
                                        />
                                    ))}
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="subtitle2">Gender Preference</Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    {['', 'male', 'female', 'any'].map((gender) => (
                                        <Chip
                                            key={gender}
                                            label={gender === '' ? 'Any' : gender.charAt(0).toUpperCase() + gender.slice(1)}
                                            clickable
                                            color={filters.genderPreference === gender ? 'primary' : 'default'}
                                            onClick={() => handleFilterChange('genderPreference', gender)}
                                            variant={filters.genderPreference === gender ? 'filled' : 'outlined'}
                                        />
                                    ))}
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="subtitle2">Furnishing</Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    {['', 'furnished', 'semi-furnished', 'unfurnished'].map((furnished) => (
                                        <Chip
                                            key={furnished}
                                            label={furnished === '' ? 'Any' : furnished.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                            clickable
                                            color={filters.furnished === furnished ? 'primary' : 'default'}
                                            onClick={() => handleFilterChange('furnished', furnished)}
                                            variant={filters.furnished === furnished ? 'filled' : 'outlined'}
                                        />
                                    ))}
                                </Box>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 1 }}>
                <Button onClick={handleResetFilters} color="inherit">
                    Reset All
                </Button>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button onClick={handleApplyFilters} variant="contained" color="primary">
                    Apply Filters
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdvancedSearchModal;