// /src/contexts/WishlistContext.js
import React, { createContext, useState, useContext } from 'react';

// 1. Create the context
const WishlistContext = createContext();

// 2. Create the provider component
export const WishlistProvider = ({ children }) => {
  const [savedItems, setSavedItems] = useState([]);

  const addItem = (itemId) => {
    setSavedItems((prevItems) => [...prevItems, itemId]);
  };

  const removeItem = (itemId) => {
    setSavedItems((prevItems) => prevItems.filter((id) => id !== itemId));
  };

  const isSaved = (itemId) => {
    return savedItems.includes(itemId);
  };

  const value = {
    savedItems,
    addItem,
    removeItem,
    isSaved,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

// 3. Create a custom hook for easy access to the context
export const useWishlist = () => {
  return useContext(WishlistContext);
};