import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    Chip,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    useTheme
} from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    EventAvailable,
    EventBusy,
    Today,
    Info,
    Close
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

const AvailabilityCalendar = ({ propertyId, onDateSelect, existingBookings = [] }) => {
    const theme = useTheme();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDates, setSelectedDates] = useState([]);
    const [availabilityData, setAvailabilityData] = useState({});
    const [loading, setLoading] = useState(true);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedDateDetails, setSelectedDateDetails] = useState(null);

    // Generate calendar days
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Mock availability data - in real app, this would come from API
    useEffect(() => {
        const fetchAvailability = async () => {
            setLoading(true);
            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Generate mock availability data
                const mockData = {};
                calendarDays.forEach(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isAvailable = Math.random() > 0.3; // 70% availability
                    const availableRooms = isAvailable ? Math.floor(Math.random() * 5) + 1 : 0;
                    const price = Math.floor(Math.random() * 10000) + 5000;

                    mockData[dateStr] = {
                        available: isAvailable,
                        availableRooms,
                        price,
                        status: availableRooms > 3 ? 'high' : availableRooms > 0 ? 'limited' : 'unavailable',
                        bookings: existingBookings.filter(booking =>
                            isSameDay(new Date(booking.checkIn), day) ||
                            isSameDay(new Date(booking.checkOut), day)
                        )
                    };
                });

                setAvailabilityData(mockData);
            } catch (error) {
                console.error('Error fetching availability:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAvailability();
    }, [currentMonth, propertyId, existingBookings]);

    const handlePreviousMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const handleDateClick = (day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const availability = availabilityData[dateStr];

        if (availability && availability.available) {
            setSelectedDates(prev => {
                const isSelected = prev.some(date => isSameDay(date, day));
                if (isSelected) {
                    return prev.filter(date => !isSameDay(date, day));
                } else {
                    return [...prev, day];
                }
            });
        }

        setSelectedDateDetails({ day, availability });
        setDetailsOpen(true);
    };

    const getDayStatus = (day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const availability = availabilityData[dateStr];

        if (!availability) return 'loading';
        if (!availability.available) return 'unavailable';
        if (availability.status === 'limited') return 'limited';
        return 'available';
    };

    const getDayColor = (day) => {
        const status = getDayStatus(day);
        const isSelected = selectedDates.some(date => isSameDay(date, day));

        if (isSelected) {
            return {
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                fontWeight: 600
            };
        }

        switch (status) {
            case 'available':
                return {
                    backgroundColor: theme.palette.success.light,
                    color: theme.palette.success.dark,
                    '&:hover': {
                        backgroundColor: theme.palette.success.main,
                        color: 'white'
                    }
                };
            case 'limited':
                return {
                    backgroundColor: theme.palette.warning.light,
                    color: theme.palette.warning.dark,
                    '&:hover': {
                        backgroundColor: theme.palette.warning.main,
                        color: 'white'
                    }
                };
            case 'unavailable':
                return {
                    backgroundColor: theme.palette.grey[100],
                    color: theme.palette.grey[500],
                    cursor: 'not-allowed'
                };
            case 'loading':
            default:
                return {
                    backgroundColor: theme.palette.grey[50],
                    color: theme.palette.grey[400]
                };
        }
    };

    const getRoomCountIndicator = (day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const availability = availabilityData[dateStr];

        if (!availability || !availability.available) return null;

        return (
            <Typography variant="caption" sx={{ fontSize: '0.6rem', lineHeight: 1 }}>
                {availability.availableRooms} rooms
            </Typography>
        );
    };

    const handleProceedToBooking = () => {
        if (selectedDates.length > 0) {
            onDateSelect(selectedDates.sort((a, b) => a - b));
        }
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    Availability Calendar
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Select your preferred dates to check availability and pricing
                </Typography>
            </Box>

            {/* Month Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={handlePreviousMonth} disabled={loading}>
                    <ChevronLeft />
                </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {format(currentMonth, 'MMMM yyyy')}
                </Typography>
                <IconButton onClick={handleNextMonth} disabled={loading}>
                    <ChevronRight />
                </IconButton>
            </Box>

            {/* Legend */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Chip
                    icon={<EventAvailable />}
                    label="Available"
                    size="small"
                    sx={{
                        backgroundColor: theme.palette.success.light,
                        color: theme.palette.success.dark
                    }}
                />
                <Chip
                    icon={<EventAvailable />}
                    label="Limited"
                    size="small"
                    sx={{
                        backgroundColor: theme.palette.warning.light,
                        color: theme.palette.warning.dark
                    }}
                />
                <Chip
                    icon={<EventBusy />}
                    label="Unavailable"
                    size="small"
                    sx={{
                        backgroundColor: theme.palette.grey[100],
                        color: theme.palette.grey[500]
                    }}
                />
            </Box>

            {/* Calendar Grid */}
            {loading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">Loading availability...</Typography>
                </Box>
            ) : (
                <Grid container spacing={1}>
                    {/* Week day headers */}
                    {weekDays.map(day => (
                        <Grid item xs={12/7} key={day}>
                            <Typography
                                variant="caption"
                                sx={{
                                    textAlign: 'center',
                                    fontWeight: 600,
                                    color: 'text.secondary',
                                    display: 'block'
                                }}
                            >
                                {day}
                            </Typography>
                        </Grid>
                    ))}

                    {/* Calendar days */}
                    {calendarDays.map((day, index) => {
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isToday = isSameDay(day, new Date());
                        const status = getDayStatus(day);

                        return (
                            <Grid item xs={12/7} key={index}>
                                <Box
                                    onClick={() => isCurrentMonth && status !== 'unavailable' && handleDateClick(day)}
                                    sx={{
                                        ...getDayColor(day),
                                        aspectRatio: '1',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 2,
                                        cursor: isCurrentMonth && status !== 'unavailable' ? 'pointer' : 'default',
                                        opacity: isCurrentMonth ? 1 : 0.3,
                                        border: isToday ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
                                        transition: 'all 0.2s ease-in-out',
                                        position: 'relative',
                                        minHeight: '60px'
                                    }}
                                >
                                    <Typography variant="body2" sx={{ lineHeight: 1 }}>
                                        {format(day, 'd')}
                                    </Typography>
                                    {isCurrentMonth && getRoomCountIndicator(day)}
                                    {isToday && (
                                        <Chip
                                            label="Today"
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: -8,
                                                fontSize: '0.6rem',
                                                height: 16,
                                                backgroundColor: theme.palette.primary.main,
                                                color: 'white'
                                            }}
                                        />
                                    )}
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Selected Dates Summary */}
            {selectedDates.length > 0 && (
                <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Selected Dates ({selectedDates.length} {selectedDates.length === 1 ? 'night' : 'nights'}):
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {selectedDates.map((date, index) => (
                            <Chip
                                key={index}
                                label={format(date, 'MMM d')}
                                onDelete={() => {
                                    setSelectedDates(prev => prev.filter(d => !isSameDay(d, date)));
                                }}
                                size="small"
                            />
                        ))}
                    </Box>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleProceedToBooking}
                        sx={{ borderRadius: 2 }}
                    >
                        Proceed to Booking
                    </Button>
                </Box>
            )}

            {/* Date Details Dialog */}
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                        {selectedDateDetails && format(selectedDateDetails.day, 'EEEE, MMMM d, yyyy')}
                    </Typography>
                    <IconButton onClick={() => setDetailsOpen(false)} size="small">
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {selectedDateDetails?.availability && (
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Chip
                                    icon={selectedDateDetails.availability.available ? <EventAvailable /> : <EventBusy />}
                                    label={selectedDateDetails.availability.available ? 'Available' : 'Unavailable'}
                                    color={selectedDateDetails.availability.available ? 'success' : 'default'}
                                />
                                {selectedDateDetails.availability.available && (
                                    <Typography variant="h6" color="primary.main">
                                        ₹{selectedDateDetails.availability.price}/night
                                    </Typography>
                                )}
                            </Box>

                            {selectedDateDetails.availability.available && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Available Rooms: {selectedDateDetails.availability.availableRooms}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Status: {selectedDateDetails.availability.status === 'high' ? 'Good Availability' : 'Limited Availability'}
                                    </Typography>
                                </Box>
                            )}

                            {selectedDateDetails.availability.bookings.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Existing Bookings:
                                    </Typography>
                                    {selectedDateDetails.availability.bookings.map((booking, index) => (
                                        <Box key={index} sx={{ p: 1, backgroundColor: 'grey.50', borderRadius: 1, mb: 1 }}>
                                            <Typography variant="body2">
                                                {booking.guestName} - {booking.roomType}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsOpen(false)}>
                        Close
                    </Button>
                    {selectedDateDetails?.availability?.available && (
                        <Button
                            variant="contained"
                            onClick={() => {
                                handleDateClick(selectedDateDetails.day);
                                setDetailsOpen(false);
                            }}
                        >
                            {selectedDates.some(date => isSameDay(date, selectedDateDetails.day)) ? 'Remove' : 'Select'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default AvailabilityCalendar;