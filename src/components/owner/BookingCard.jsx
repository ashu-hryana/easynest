// src/components/owner/BookingCard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardActionArea, CardContent, Typography, Box, Chip } from '@mui/material';
import { Apartment, Bed, Person, MonetizationOn, Event } from '@mui/icons-material';

const BookingCard = ({ booking }) => {
    const navigate = useNavigate();
    const isOccupied = !!booking.studentName;

    return (
        <Card 
            elevation={3}
            sx={{ 
                height: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                width: '100%' // <-- YEH LINE ADD KAREIN
            }}
        >
            <CardActionArea 
                onClick={() => navigate(`/owner/rooms/${booking.id}`)}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column'}}
            >
                {/* ... Baaki saara code jaisa tha waisa hi rahega ... */}
                <Box
                    sx={{
                        width: '100%',
                        p: 1.5,
                        backgroundColor: 'primary.main',
                        color: 'white',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Apartment sx={{ mr: 1, fontSize: '1.2rem' }} />
                        <Typography variant="body1" fontWeight="bold" noWrap>
                            {booking.buildingName || 'Building Not Set'}
                        </Typography>
                    </Box>
                </Box>
                
                <CardContent sx={{ flexGrow: 1, width: '100%', p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                           <Bed sx={{ mr: 1, color: 'text.secondary' }}/>
                           <Typography variant="h6" fontWeight="bold">
                               Room: {booking.roomId || 'N/A'}
                           </Typography>
                        </Box>
                        <Chip 
                            label={isOccupied ? "Occupied" : "Vacant"}
                            color={isOccupied ? "success" : "warning"}
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                        <Person sx={{ mr: 1.5, fontSize: '1.2rem' }} />
                        <Typography variant="body2" sx={{ color: isOccupied ? 'text.primary' : 'text.secondary' }}>
                            {booking.studentName || 'Tenant Not Assigned'}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                        <MonetizationOn sx={{ mr: 1.5, fontSize: '1.2rem' }} />
                        <Typography variant="body2">
                            Rent: ₹{booking.rentAmount || '0'}
                        </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                        <Event sx={{ mr: 1.5, fontSize: '1.2rem' }} />
                        <Typography variant="body2">
                            Started: {booking.checkInDate ? new Date(booking.checkInDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </Typography>
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default BookingCard;