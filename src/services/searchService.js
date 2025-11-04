// src/services/searchService.js

/**
 * Advanced Search Service for EasyNest
 * Handles location-based search, filtering, and property discovery
 */

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
};

/**
 * Get coordinates for a location using geocoding API
 */
export const geocodeLocation = async (location) => {
    try {
        // Using OpenStreetMap Nominatim API (free alternative to Google Maps)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
        );
        const data = await response.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                displayName: data[0].display_name
            };
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
};

/**
 * Get user's current location
 */
export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    });
};

/**
 * Filter properties within a given radius
 */
export const filterByRadius = (properties, centerLat, centerLng, radiusKm) => {
    if (!centerLat || !centerLng) return properties;

    return properties.filter(property => {
        if (!property.latitude || !property.longitude) return false;

        const distance = calculateDistance(
            centerLat, centerLng,
            property.latitude, property.longitude
        );

        return distance <= radiusKm;
    });
};

/**
 * Apply advanced filters to property search
 */
export const applyAdvancedFilters = (properties, filters) => {
    let filteredProperties = [...properties];

    // Location-based radius filter
    if (filters.coordinates && filters.radius) {
        filteredProperties = filterByRadius(
            filteredProperties,
            filters.coordinates.lat,
            filters.coordinates.lng,
            filters.radius
        );
    }

    // Property type filter
    if (filters.propertyType && filters.propertyType.length > 0) {
        filteredProperties = filteredProperties.filter(property =>
            filters.propertyType.includes(property.propertyType)
        );
    }

    // Occupancy type filter
    if (filters.occupancyType && filters.occupancyType.length > 0) {
        filteredProperties = filteredProperties.filter(property =>
            filters.occupancyType.includes(property.occupancyType)
        );
    }

    // Price range filter
    if (filters.priceRange) {
        const [minPrice, maxPrice] = filters.priceRange;
        filteredProperties = filteredProperties.filter(property =>
            property.price >= minPrice && property.price <= maxPrice
        );
    }

    // Gender preference filter
    if (filters.genderPreference) {
        filteredProperties = filteredProperties.filter(property =>
            property.genderPreference === filters.genderPreference ||
            property.genderPreference === 'any'
        );
    }

    // Furnishing filter
    if (filters.furnished) {
        filteredProperties = filteredProperties.filter(property =>
            property.furnishing === filters.furnished
        );
    }

    // Amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
        filteredProperties = filteredProperties.filter(property =>
            filters.amenities.every(amenity =>
                property.amenities && property.amenities.includes(amenity)
            )
        );
    }

    // Rules filter
    if (filters.rules && filters.rules.length > 0) {
        filteredProperties = filteredProperties.filter(property =>
            filters.rules.every(rule =>
                property.rules && property.rules.includes(rule)
            )
        );
    }

    // Age of property filter
    if (filters.ageOfProperty) {
        const currentYear = new Date().getFullYear();
        filteredProperties = filteredProperties.filter(property => {
            if (!property.yearBuilt) return true;
            const age = currentYear - property.yearBuilt;

            switch (filters.ageOfProperty) {
                case 'new': return age <= 2;
                case 'recent': return age > 2 && age <= 5;
                case 'old': return age > 5;
                default: return true;
            }
        });
    }

    // Available from filter
    if (filters.availableFrom) {
        filteredProperties = filteredProperties.filter(property => {
            if (!property.availableFrom) return true;
            return new Date(property.availableFrom) <= new Date(filters.availableFrom);
        });
    }

    return filteredProperties;
};

/**
 * Search properties with location and text search
 */
export const searchProperties = async (searchQuery, filters = {}) => {
    try {
        // This would typically be a Firebase query or API call
        // For now, returning a mock structure

        let query = searchQuery || '';
        let coordinates = null;

        // Try to geocode the search query if it looks like a location
        if (query && query.length > 2) {
            coordinates = await geocodeLocation(query);
        }

        // If user location is available and no specific search query, use it
        if (!query && filters.useCurrentLocation) {
            try {
                coordinates = await getCurrentLocation();
            } catch (error) {
                console.error('Could not get user location:', error);
            }
        }

        // Apply filters to the results
        const searchFilters = {
            ...filters,
            coordinates
        };

        return {
            query,
            coordinates,
            filters: searchFilters
        };
    } catch (error) {
        console.error('Search error:', error);
        throw error;
    }
};

/**
 * Get popular search suggestions
 */
export const getSearchSuggestions = async (query) => {
    if (!query || query.length < 2) return [];

    try {
        // This would typically call an API for suggestions
        // For now, providing local suggestions

        const commonSuggestions = [
            'Near Me',
            'Colleges',
            'IT Parks',
            'Metro Stations',
            'Hospitals',
            'Shopping Malls'
        ];

        return commonSuggestions.filter(suggestion =>
            suggestion.toLowerCase().includes(query.toLowerCase())
        );
    } catch (error) {
        console.error('Suggestions error:', error);
        return [];
    }
};

/**
 * Calculate popular areas based on search density
 */
export const getPopularAreas = (properties) => {
    const areaCounts = {};

    properties.forEach(property => {
        const area = property.area || property.locality || property.city;
        if (area) {
            areaCounts[area] = (areaCounts[area] || 0) + 1;
        }
    });

    return Object.entries(areaCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([area, count]) => ({ area, count }));
};

/**
 * Save search to user's search history
 */
export const saveSearchHistory = (userId, searchQuery, filters) => {
    // This would save to Firebase or local storage
    const searchHistory = {
        query: searchQuery,
        filters,
        timestamp: new Date().toISOString(),
        userId
    };

    // Implementation depends on your storage strategy
    console.log('Saving search history:', searchHistory);
    return searchHistory;
};

/**
 * Get saved searches for a user
 */
export const getSavedSearches = async (userId) => {
    // This would fetch from Firebase or local storage
    // For now, returning mock data
    return [
        {
            id: '1',
            name: 'PG near Delhi University',
            query: 'Delhi University',
            filters: { propertyType: ['pg'], priceRange: [5000, 15000] },
            createdAt: '2024-01-15T10:30:00Z'
        },
        {
            id: '2',
            name: 'Furnished flats in Bangalore',
            query: 'Bangalore',
            filters: {
                propertyType: ['flat'],
                furnished: 'furnished',
                priceRange: [15000, 30000]
            },
            createdAt: '2024-01-10T15:45:00Z'
        }
    ];
};

export default {
    geocodeLocation,
    getCurrentLocation,
    filterByRadius,
    applyAdvancedFilters,
    searchProperties,
    getSearchSuggestions,
    getPopularAreas,
    saveSearchHistory,
    getSavedSearches
};