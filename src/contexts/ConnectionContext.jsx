// src/contexts/ConnectionContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext.jsx';
import { useNotification } from './NotificationContext.jsx';

const ConnectionContext = createContext();

export const useConnections = () => {
    return useContext(ConnectionContext);
};

export const ConnectionProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setConnections([]);
            setLoading(false);
            return;
        }

        const connectionsRef = collection(db, 'connections');
        const q = query(connectionsRef, where('participants', 'array-contains', currentUser.uid));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const allConnections = [];
            querySnapshot.forEach((doc) => {
                allConnections.push({ id: doc.id, ...doc.data() });
            });
            setConnections(allConnections);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const sendConnectionRequest = async (post) => {
        if (!currentUser) return;

        const existingConnection = connections.find(c =>
            (c.requesterId === currentUser.uid && c.receiverId === post.authorId) ||
            (c.requesterId === post.authorId && c.receiverId === currentUser.uid)
        );

        if (existingConnection) {
            showNotification("You've already connected with this user.", "info");
            return;
        }

        const newConnection = {
            postId: post.id,
            requesterId: currentUser.uid,
            requesterName: currentUser.displayName,
            requesterPhotoURL: currentUser.photoURL,
            receiverId: post.authorId,
            receiverName: post.authorName,
            receiverPhotoURL: post.authorPhotoURL,
            participants: [currentUser.uid, post.authorId],
            status: 'pending',
            createdAt: serverTimestamp(),
        };

        try {
            await addDoc(collection(db, 'connections'), newConnection);
            showNotification('Connection request sent!', 'success');
        } catch (error) {
            console.error("Error sending connection request:", error);
            showNotification('Failed to send request.', 'error');
        }
    };

    const updateConnectionStatus = async (connectionId, newStatus) => {
        const connectionDocRef = doc(db, 'connections', connectionId);
        try {
            await updateDoc(connectionDocRef, { status: newStatus });
            showNotification(`Connection ${newStatus}!`, 'success');
        } catch (error) {
            console.error("Error updating connection:", error);
            showNotification('Failed to update connection.', 'error');
        }
    };

    const value = {
        connections,
        loading,
        sendConnectionRequest,
        updateConnectionStatus,
    };

    return (
        <ConnectionContext.Provider value={value}>
            {children}
        </ConnectionContext.Provider>
    );
};