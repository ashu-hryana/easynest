import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserDetails, setCurrentUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This listener only handles Firebase Auth state (logged in or out)
        const unsubscribeAuth = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
            // If user logs out, clear their details immediately
            if (!user) {
                setCurrentUserDetails(null);
                setLoading(false);
            }
        });

        return unsubscribeAuth;
    }, []);

    // This new useEffect fetches user's extra details and ROLE from Firestore
    useEffect(() => {
        // Only run if a user is logged in
        if (currentUser) {
            // Assume the user details are in a 'users' collection.
            // If you have a separate 'owners' collection, you'll need to check both.
            const userDocRef = doc(db, 'users', currentUser.uid);
            
            const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    // Set the user details along with their role
                    setCurrentUserDetails({
                        uid: currentUser.uid,
                        ...docSnap.data()
                        // Ensure a 'role' field exists in your user documents, e.g., role: 'student' or role: 'owner'
                    });
                } else {
                    // If not found in 'users', maybe they are an owner?
                    // You can add logic here to check an 'owners' collection if you have one.
                    // For now, we'll set details to null if not found in 'users'.
                    setCurrentUserDetails(null); 
                }
                setLoading(false);
            });

            return () => unsubscribeFirestore();
        }
    }, [currentUser]);

    const value = {
        currentUser,
        currentUserDetails, // This object now contains role and other details
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}