// src/App.jsx

import { Routes, Route } from 'react-router-dom';

// Components & Layouts
import ProtectedRoute from './components/auth/ProtectedRoute';
import StudentAppLayout from './components/layout/StudentAppLayout';
import OwnerAppLayout from './components/layout/OwnerAppLayout';
import ListingFlowLayout from './screens/owner/listing_flow/ListingFlowLayout';

// Screen Imports
import WelcomeScreen from './screens/auth/WelcomeScreen';
import StudentSignUpScreen from './screens/auth/StudentSignUpScreen';
import LoginScreen from './screens/auth/LoginScreen';
import OwnerLoginScreen from './screens/auth/OwnerLoginScreen';
import OwnerSignUpScreen from './screens/auth/OwnerSignUpScreen';
import ProfileChoiceScreen from './screens/owner/ProfileChoiceScreen';
import CreateOrganizationScreen from './screens/organization/CreateOrganizationScreen';

import HomeScreen from './screens/app/HomeScreen';
import SearchResultsScreen from './screens/app/SearchResultsScreen';
import ListingDetailsScreen from './screens/app/ListingDetailsScreen';
import BookingScreen from './screens/app/BookingScreen';
import SavedScreen from './screens/app/SavedScreen';
import StudentProfileScreen from './screens/app/StudentProfileScreen';
import EditStudentProfileScreen from './screens/app/EditStudentProfileScreen';
import MyBookingsScreen from './screens/app/MyBookingsScreen';
import RoommateFinderScreen from './screens/app/RoommateFinderScreen';
import CreateRoommatePostScreen from './screens/app/CreateRoommatePostScreen';
import PublicProfileScreen from './screens/app/PublicProfileScreen';
import ChatListScreen from './screens/app/ChatListScreen';
import ChatScreen from './screens/app/ChatScreen';
import TenantDashboardScreen from './screens/app/TenantDashboardScreen';
import PhotoGalleryScreen from './screens/app/PhotoGalleryScreen';
import CheckInScreen from './screens/app/CheckInScreen';

import OwnerDashboardScreen from './screens/owner/OwnerDashboardScreen';
import MyListingsScreen from './screens/owner/MyListingsScreen';
import OwnerProfileScreen from './screens/owner/OwnerProfileScreen';
import BookingRequestsScreen from './screens/owner/BookingRequestsScreen';
import RoomManagementScreen from './screens/owner/RoomManagementScreen';
import RoomDetailScreen from './screens/owner/RoomDetailScreen'; 
import OwnerVerificationScreen from './screens/owner/OwnerVerificationScreen';
import QRScannerScreen from './screens/owner/QRScannerScreen'; // Yeh import yahan hai

import Step1_BasicInfo from './screens/owner/listing_flow/Step1_BasicInfo';
import Step2_Amenities from './screens/owner/listing_flow/Step2_Amenities';
import Step3_Photos from './screens/owner/listing_flow/Step3_Photos';
import Step4_Pricing from './screens/owner/listing_flow/Step4_Pricing';


function App() {
  return (
    <Routes>
      {/* --- Public Auth Flow --- */}
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/signup" element={<StudentSignUpScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/owner-login" element={<OwnerLoginScreen />} />
      <Route path="/owner-signup" element={<OwnerSignUpScreen />} />
      
      {/* --- Post-signup choice screen for owners --- */}
      <Route path="/profile-choice" element={<ProtectedRoute><ProfileChoiceScreen /></ProtectedRoute>} />
      <Route path="/organization/create" element={<ProtectedRoute><CreateOrganizationScreen /></ProtectedRoute>} />

      {/* --- Protected Student Routes with Bottom Nav Bar --- */}
      <Route element={<ProtectedRoute><StudentAppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<TenantDashboardScreen />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/my-bookings" element={<MyBookingsScreen />} />
        <Route path="/roommates" element={<RoommateFinderScreen />} />
        <Route path="/chats" element={<ChatListScreen />} />
        <Route path="/profile" element={<StudentProfileScreen />} />
      </Route>

      {/* --- Protected Student Routes WITHOUT Bottom Nav Bar --- */}
      <Route path="/wishlist" element={<ProtectedRoute><SavedScreen /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><SearchResultsScreen /></ProtectedRoute>} />
      <Route path="/listing/:id" element={<ProtectedRoute><ListingDetailsScreen /></ProtectedRoute>} />
      <Route path="/listing/:id/photos" element={<ProtectedRoute><PhotoGalleryScreen /></ProtectedRoute>} />
      <Route path="/booking/:id" element={<ProtectedRoute><BookingScreen /></ProtectedRoute>} />
      <Route path="/booking/:bookingId/check-in" element={<ProtectedRoute><CheckInScreen /></ProtectedRoute>} />
      <Route path="/profile/edit" element={<ProtectedRoute><EditStudentProfileScreen /></ProtectedRoute>} />
      <Route path="/roommates/create" element={<ProtectedRoute><CreateRoommatePostScreen /></ProtectedRoute>} />
      <Route path="/roommates/edit/:postId" element={<ProtectedRoute><CreateRoommatePostScreen /></ProtectedRoute>} />
      <Route path="/user/:userId" element={<ProtectedRoute><PublicProfileScreen /></ProtectedRoute>} />
      <Route path="/chat/:connectionId" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
      
      {/* --- Owner Protected Routes --- */}
      <Route element={<ProtectedRoute><OwnerAppLayout /></ProtectedRoute>}>
        <Route path="/owner/dashboard" element={<OwnerDashboardScreen />} />
        <Route path="/owner/my-listings" element={<MyListingsScreen />} />
        <Route path="/owner/requests" element={<BookingRequestsScreen />} />
        <Route path="/owner/profile" element={<OwnerProfileScreen />} />
        <Route path="/owner/rooms" element={<RoomManagementScreen />} /> 
        <Route path="/owner/rooms/:bookingId" element={<RoomDetailScreen />} />
        <Route path="/owner/chats" element={<ChatListScreen />} />
        <Route path="/owner/verify" element={<OwnerVerificationScreen />} />
        
        {/* --- YEH NAYA SCANNER ROUTE HAI --- */}
        <Route path="/owner/scan-qr" element={<QRScannerScreen />} />
      </Route>

      {/* --- Add Listing Flow --- */}
      <Route path="/owner/add-listing" element={<ProtectedRoute><ListingFlowLayout /></ProtectedRoute>}>
        <Route index element={<Step1_BasicInfo />} />
        <Route path="amenities" element={<Step2_Amenities />} />
        <Route path="photos" element={<Step3_Photos />} />
        <Route path="pricing" element={<Step4_Pricing />} />
      </Route>
    </Routes>
  );
}

export default App;