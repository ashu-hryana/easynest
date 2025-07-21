import React, { createContext, useState, useContext } from 'react';
import { collection, addDoc, doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore"; // updateDoc import karein
import { db, auth } from '../firebase';

const ListingContext = createContext();

export const useListing = () => {
    return useContext(ListingContext);
};

const initialState = {
    id: null,
    name: '',
    address: '',
    city: '',
    pincode: '',
    description: '',
    amenities: [],
    rules: [],
    photos: [],
    propertyType: '',
    houseDetails: {},
    availableUnits: '',
    price: '',
    securityDeposit: '',
    electricityRate: '',
    electricityPaymentBy: '',
};

export const ListingProvider = ({ children }) => {
    const [listingData, setListingData] = useState(initialState);

    const updateListingData = (newData) => {
        setListingData(prevData => ({ ...prevData, ...newData }));
    };

    const resetListingData = () => {
        setListingData(initialState);
    };

    const saveListingToFirebase = async (dataToSave) => {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("User not authenticated.");

        const finalData = {
            ...dataToSave,
            ownerId: currentUser.uid,
            ownerName: currentUser.displayName,
            ownerPhotoURL: currentUser.photoURL,
        };
        
        if (finalData.photos && finalData.photos.length > 0) {
            finalData.image = finalData.photos[0].url || finalData.photos[0];
        }

        try {
            // Edit aur Add New ka logic
            if (finalData.id) {
                // Listing EDIT ho rahi hai
                const listingDocRef = doc(db, 'listings', finalData.id);
                const { id, ...dataToUpdate } = finalData; // ID ko data se alag karein
                
                await updateDoc(listingDocRef, dataToUpdate);
                
                resetListingData();
                return finalData.id;
            } else {
                // NAYI Listing ban rahi hai
                // Hum yahan 'status' aur 'createdAt' add karenge
                finalData.status = 'live'; // <-- FIX: 'active' ki jagah 'live'
                finalData.createdAt = serverTimestamp();
                finalData.rating = 4.5; // Default rating
                finalData.reviews = 0;

                const docRef = await addDoc(collection(db, "listings"), finalData);
                resetListingData();
                return docRef.id;
            }
        } catch (e) {
            console.error("Error saving document:", e);
            throw e;
        }
    };

    const value = {
        listingData,
        updateListingData,
        saveListingToFirebase,
        resetListingData,
    };

    return (
        <ListingContext.Provider value={value}>
            {children}
        </ListingContext.Provider>
    );
};