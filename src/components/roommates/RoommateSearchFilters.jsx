import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    FormControl,
    FormControlLabel,
    RadioGroup,
    Radio,
    Slider,
    TextField,
    Chip,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    FormGroup,
    Checkbox
} from '@mui/material';
import {
    ExpandMore,
    LocationOn,
    AccountBalanceWallet,
    Person,
    SmokingRooms,
    LocalBar,
    Restaurant,
    CalendarToday,
    Home
} from '@mui/icons-material';

const RoommateSearchFilters = ({ open, onClose, filters, onApplyFilters }) => {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (key, value) => {
        setLocalFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleApplyFilters = () => {
        onApplyFilters(localFilters);
        onClose();
    };

    const handleResetFilters = () => {
        const resetFilters = {
            lookingFor: '',
            budgetRange: [0, 50000],
            location: '',
            smoking: '',
            drinking: '',
            vegetarian: '',
            gender: '',
            ageRange: [18, 35],
            moveInDate: null
        };
        setLocalFilters(resetFilters);
        onApplyFilters(resetFilters);
    };

    const QUICK_LOCATIONS = [
        'Delhi University North Campus',
        'Delhi University South Campus',
        'IIT Delhi',
        'JNU',
        'IP University',
        'Amity University',
        'Gurgaon Cyber City',
        'Noida Sector 18'
    ];

    const getActiveFiltersCount = () => {
        let count = 0;
        if (localFilters.lookingFor) count++;
        if (localFilters.location) count++;
        if (localFilters.gender) count++;
        if (localFilters.smoking) count++;
        if (localFilters.drinking) count++;
        if (localFilters.vegetarian) count++;
        if (localFilters.budgetRange[0] > 0 || localFilters.budgetRange[1] < 50000) count++;
        if (localFilters.ageRange[0] > 18 || localFilters.ageRange[1] < 35) count++;
        if (localFilters.moveInDate) count++;
        return count;
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3 }
            }}
        >
            <DialogTitle sx={{ pb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Advanced Filters
                    </Typography>
                    <Chip
                        label={`${getActiveFiltersCount()} filters applied`}
                        color="primary"
                        size="small"
                    />
                </Box>
            </DialogTitle>

            <DialogContent sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* What are you looking for? */}
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Home color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                    What are you looking for?
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <RadioGroup
                                value={localFilters.lookingFor}
                                onChange={(e) => handleFilterChange('lookingFor', e.target.value)}
                            >
                                <FormControlLabel
                                    value=""
                                    control={<Radio />}
                                    label="Show me everything"
                                />
                                <FormControlLabel
                                    value="room"
                                    control={<Radio />}
                                    label="I need a room"
                                />
                                <FormControlLabel
                                    value="only_roommate"
                                    control={<Radio />}
                                    label="I have a room and need a roommate"
                                />
                            </RadioGroup>
                        </AccordionDetails>
                    </Accordion>

                    {/* Location */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationOn color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                    Location
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <TextField
                                fullWidth
                                label="Enter location, college, or area"
                                value={localFilters.location}
                                onChange={(e) => handleFilterChange('location', e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                                Popular locations:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {QUICK_LOCATIONS.map(location => (
                                    <Chip
                                        key={location}
                                        label={location}
                                        clickable
                                        color={localFilters.location === location ? 'primary' : 'default'}
                                        onClick={() => handleFilterChange('location', localFilters.location === location ? '' : location)}
                                        variant={localFilters.location === location ? 'filled' : 'outlined'}
                                        size="small"
                                    />
                                ))}
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    {/* Budget Range */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccountBalanceWallet color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                    Budget Range (per month)
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box>
                                <Typography gutterBottom>
                                    ₹{localFilters.budgetRange[0]} - ₹{localFilters.budgetRange[1]}
                                </Typography>
                                <Slider
                                    value={localFilters.budgetRange}
                                    onChange={(e, value) => handleFilterChange('budgetRange', value)}
                                    min={0}
                                    max={50000}
                                    step={1000}
                                    marks={[
                                        { value: 0, label: '₹0' },
                                        { value: 5000, label: '₹5k' },
                                        { value: 10000, label: '₹10k' },
                                        { value: 20000, label: '₹20k' },
                                        { value: 30000, label: '₹30k' },
                                        { value: 50000, label: '₹50k' }
                                    ]}
                                    sx={{ mb: 2 }}
                                />
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip
                                        label="Under ₹10k"
                                        clickable
                                        color={localFilters.budgetRange[1] === 10000 ? 'primary' : 'default'}
                                        onClick={() => handleFilterChange('budgetRange', [0, 10000])}
                                        size="small"
                                    />
                                    <Chip
                                        label="₹10k - ₹20k"
                                        clickable
                                        color={localFilters.budgetRange[0] === 10000 && localFilters.budgetRange[1] === 20000 ? 'primary' : 'default'}
                                        onClick={() => handleFilterChange('budgetRange', [10000, 20000])}
                                        size="small"
                                    />
                                    <Chip
                                        label="₹20k - ₹30k"
                                        clickable
                                        color={localFilters.budgetRange[0] === 20000 && localFilters.budgetRange[1] === 30000 ? 'primary' : 'default'}
                                        onClick={() => handleFilterChange('budgetRange', [20000, 30000])}
                                        size="small"
                                    />
                                    <Chip
                                        label="Above ₹30k"
                                        clickable
                                        color={localFilters.budgetRange[0] === 30000 ? 'primary' : 'default'}
                                        onClick={() => handleFilterChange('budgetRange', [30000, 50000])}
                                        size="small"
                                    />
                                </Box>
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    {/* Personal Preferences */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                    Personal Preferences
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {/* Gender Preference */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                        Gender Preference
                                    </Typography>
                                    <RadioGroup
                                        value={localFilters.gender}
                                        onChange={(e) => handleFilterChange('gender', e.target.value)}
                                    >
                                        <FormControlLabel
                                            value=""
                                            control={<Radio />}
                                            label="No preference"
                                        />
                                        <FormControlLabel
                                            value="male"
                                            control={<Radio />}
                                            label="Male"
                                        />
                                        <FormControlLabel
                                            value="female"
                                            control={<Radio />}
                                            label="Female"
                                        />
                                        <FormControlLabel
                                            value="other"
                                            control={<Radio />}
                                            label="Other"
                                        />
                                    </RadioGroup>
                                </Box>

                                {/* Age Range */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                        Age Range: {localFilters.ageRange[0]} - {localFilters.ageRange[1]} years
                                    </Typography>
                                    <Slider
                                        value={localFilters.ageRange}
                                        onChange={(e, value) => handleFilterChange('ageRange', value)}
                                        min={16}
                                        max={50}
                                        step={1}
                                        marks={[
                                            { value: 16, label: '16' },
                                            { value: 20, label: '20' },
                                            { value: 25, label: '25' },
                                            { value: 30, label: '30' },
                                            { value: 40, label: '40' },
                                            { value: 50, label: '50' }
                                        ]}
                                    />
                                </Box>
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    {/* Lifestyle Preferences */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                Lifestyle Preferences
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {/* Smoking Preference */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <SmokingRooms fontSize="small" />
                                        Smoking Preference
                                    </Typography>
                                    <RadioGroup
                                        value={localFilters.smoking}
                                        onChange={(e) => handleFilterChange('smoking', e.target.value)}
                                    >
                                        <FormControlLabel
                                            value=""
                                            control={<Radio />}
                                            label="No preference"
                                        />
                                        <FormControlLabel
                                            value="yes"
                                            control={<Radio />}
                                            label="Smoking allowed"
                                        />
                                        <FormControlLabel
                                            value="no"
                                            control={<Radio />}
                                            label="Non-smoking only"
                                        />
                                    </RadioGroup>
                                </Box>

                                {/* Drinking Preference */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LocalBar fontSize="small" />
                                        Drinking Preference
                                    </Typography>
                                    <RadioGroup
                                        value={localFilters.drinking}
                                        onChange={(e) => handleFilterChange('drinking', e.target.value)}
                                    >
                                        <FormControlLabel
                                            value=""
                                            control={<Radio />}
                                            label="No preference"
                                        />
                                        <FormControlLabel
                                            value="yes"
                                            control={<Radio />}
                                            label="Drinking allowed"
                                        />
                                        <FormControlLabel
                                            value="no"
                                            control={<Radio />}
                                            label="Non-drinking only"
                                        />
                                    </RadioGroup>
                                </Box>

                                {/* Food Preference */}
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Restaurant fontSize="small" />
                                        Food Preference
                                    </Typography>
                                    <RadioGroup
                                        value={localFilters.vegetarian}
                                        onChange={(e) => handleFilterChange('vegetarian', e.target.value)}
                                    >
                                        <FormControlLabel
                                            value=""
                                            control={<Radio />}
                                            label="No preference"
                                        />
                                        <FormControlLabel
                                            value="yes"
                                            control={<Radio />}
                                            label="Vegetarian only"
                                        />
                                        <FormControlLabel
                                            value="no"
                                            control={<Radio />}
                                            label="Non-vegetarian allowed"
                                        />
                                    </RadioGroup>
                                </Box>
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    {/* Move-in Date */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarToday color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                    Move-in Date
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <TextField
                                fullWidth
                                type="date"
                                label="Preferred move-in date"
                                value={localFilters.moveInDate || ''}
                                onChange={(e) => handleFilterChange('moveInDate', e.target.value)}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Leave empty to see all availability
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 1 }}>
                <Button onClick={handleResetFilters} color="inherit">
                    Reset All
                </Button>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button onClick={handleApplyFilters} variant="contained" color="primary">
                    Apply Filters ({getActiveFiltersCount()})
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RoommateSearchFilters;