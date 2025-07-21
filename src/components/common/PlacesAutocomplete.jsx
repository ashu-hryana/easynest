// src/components/common/PlacesAutocomplete.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { TextField, List, ListItemButton, ListItemText, Paper, Box, CircularProgress } from '@mui/material';

// --- YAHAN APNI LOCATIONIQ API KEY DAALO ---
const LOCATIONIQ_API_KEY = "pk.f20038a5e15f928413b45b4caa49ba00"; // Aapki LocationIQ Access Token

const PlacesAutocomplete = ({ onSelect, label, placeholder, initialValue = '' }) => {
    const [inputValue, setInputValue] = useState(initialValue);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Debounce function to avoid too many API calls
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    const fetchSuggestions = async (query) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(
                `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_API_KEY}&q=${query}&countrycodes=in&limit=5&dedupe=1`
            );
            const data = await response.json();
            setSuggestions(data || []);
        } catch (error) {
            console.error("Error fetching suggestions:", error);
        }
        setLoading(false);
    };

    const debouncedFetch = useCallback(debounce(fetchSuggestions, 500), []);

    useEffect(() => {
        debouncedFetch(inputValue);
    }, [inputValue, debouncedFetch]);
    
    useEffect(() => {
        setInputValue(initialValue); // Update input when initialValue changes
    }, [initialValue]);


    const handleSelect = (suggestion) => {
        const address = suggestion.display_name;
        setInputValue(address);
        setSuggestions([]);
        onSelect(address); // Parent ko selected value bhejo
    };

    return (
        <Box sx={{ position: 'relative', width: '100%' }}>
            <TextField
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                label={label}
                placeholder={placeholder}
                fullWidth
                InputProps={{
                    endAdornment: loading ? <CircularProgress color="inherit" size={20} /> : null,
                }}
            />
            {suggestions.length > 0 && (
                <Paper sx={{ position: 'absolute', zIndex: 1000, width: '100%', mt: 1 }}>
                    <List>
                        {suggestions.map((suggestion, index) => (
                            // --- YEH LINE UPDATE HUI HAI ---
                            // Key ko aur unique bana diya hai taaki warning na aaye
                            <ListItemButton key={`${suggestion.place_id}-${index}`} onClick={() => handleSelect(suggestion)}>
                                <ListItemText primary={suggestion.display_name} />
                            </ListItemButton>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default PlacesAutocomplete;