// /src/data/dummyData.js

// THIS IS THE FIX: We add the "export" keyword here.
export const ALL_STAYS = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914',
    name: 'Zen Student Living',
    location: 'Manipal, Karnataka',
    rating: 4.92,
    reviews: 34,
    manager: 'Anand',
    price: '9,500',
    amenities: [
      { icon: 'wifi', label: 'Wi-Fi' },
      { icon: 'snow', label: 'Air Conditioning' },
    ],
    rules: [
      { icon: 'time-outline', label: '10 PM Curfew' },
    ],
  },
  // ... (the rest of your property objects)
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0e278e090',
    name: 'The Scholar’s Abode',
    location: 'Hubli, Karnataka',
    rating: 4.8,
    reviews: 25,
    manager: 'Deepa',
    price: '7,500',
    amenities: [
        { icon: 'wifi', label: 'Wi-Fi' },
    ],
    rules: [
        { icon: 'flame-outline', label: 'No Smoking' },
    ],
  },
];

export const FEATURED_STAYS = ALL_STAYS.slice(0, 3);
export const NEW_LISTINGS = ALL_STAYS.slice(3, 6);