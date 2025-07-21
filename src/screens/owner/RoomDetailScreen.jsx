import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs, Timestamp, serverTimestamp, updateDoc, onSnapshot, runTransaction } from 'firebase/firestore';
import { 
    Box, Container, Typography, CircularProgress, Paper, Tabs, Tab, Button, Stack, TextField, 
    Divider, List, ListItem, ListItemText, ListItemAvatar, Avatar, IconButton, Chip, Select, MenuItem, FormControl, InputAdornment, Alert,
    Dialog, DialogActions, DialogContent, DialogTitle, ListItemButton
} from '@mui/material';
import { 
    Person, Event, Home, MeetingRoom, ReceiptLong, Bolt, 
    FileUpload, Description, Link as LinkIcon, ReportProblem, Edit, Save, Logout, ThumbDown, ThumbUp
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext.jsx';
import { format } from 'date-fns';

// Cloudinary details
const CLOUDINARY_CLOUD_NAME = "dr0nc9xqj";
const CLOUDINARY_UPLOAD_PRESET = "easynest_preset";

// Helper component for Tab Panels
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>}
        </div>
    );
}

// Helper to get color for complaint/bill status chip
const getStatusColor = (status, type = 'bill') => {
    const statusUpper = status ? status.toUpperCase() : '';
    if (type === 'complaint') {
        switch (statusUpper) {
            case 'NEW': return 'error';
            case 'IN_PROGRESS': return 'warning';
            case 'RESOLVED': return 'success';
            default: return 'default';
        }
    } else { // Bill status
         switch (statusUpper) {
            case 'DUE': return 'warning';
            case 'OVERDUE': return 'error';
            case 'PAID': return 'success';
            case 'PAID_REQUESTED': return 'info';
            default: return 'default';
         }
    }
};

// Helper function to safely format Firestore Timestamps
const formatTimestamp = (timestamp, options = { dateStyle: 'long', timeStyle: 'short' }) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleString('en-IN', options);
    }
    return "Not available";
};


const RoomDetailScreen = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const [booking, setBooking] = useState(null);
    const [bills, setBills] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const [formData, setFormData] = useState({
        roomId: '', rentAmount: '', securityDeposit: '', rentDueDateDay: ''
    });
    const [ratePerUnit, setRatePerUnit] = useState(10);
    const [previousReading, setPreviousReading] = useState('');
    const [currentReading, setCurrentReading] = useState('');
    const [fileToUpload, setFileToUpload] = useState(null);
    const [documentName, setDocumentName] = useState('');
    const fileInputRef = useRef(null);

    const [paidModalOpen, setPaidModalOpen] = useState(false);
    const [billDetailModalOpen, setBillDetailModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [newDueDate, setNewDueDate] = useState('');


    useEffect(() => {
        if (!bookingId) {
            showNotification("Invalid Booking ID.", "error");
            navigate('/owner/dashboard');
            return;
        }

        setLoading(true);

        const fetchAssociatedData = async () => {
            const billsQuery = query(collection(db, 'bills'), where('bookingId', '==', bookingId));
            const docsQuery = query(collection(db, 'documents'), where('bookingId', '==', bookingId));
            const complaintsQuery = query(collection(db, 'complaints'), where('bookingId', '==', bookingId));

            const [billsSnapshot, docsSnapshot, complaintsSnapshot] = await Promise.all([
                getDocs(billsQuery), getDocs(docsQuery), getDocs(complaintsQuery)
            ]);

            setBills(billsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.createdAt.seconds - a.createdAt.seconds));
            setDocuments(docsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.uploadedAt.seconds - a.uploadedAt.seconds));
            setComplaints(complaintsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.createdAt.seconds - a.createdAt.seconds));
        };
        
        const bookingRef = doc(db, 'bookings', bookingId);
        const unsubscribe = onSnapshot(bookingRef, (docSnap) => {
            if (docSnap.exists()) {
                const bookingData = { id: docSnap.id, ...docSnap.data() };
                setBooking(bookingData);
                setFormData({
                    roomId: bookingData.roomId || '',
                    rentAmount: bookingData.rentAmount || '',
                    securityDeposit: bookingData.securityDeposit || '',
                    rentDueDateDay: bookingData.rentDueDateDay || 1,
                });
                if (bookingData.ratePerUnit) setRatePerUnit(bookingData.ratePerUnit);
                fetchAssociatedData().finally(() => setLoading(false));
            } else {
                showNotification("Booking not found", "error");
                setLoading(false);
                navigate('/owner/rooms');
            }
        }, (error) => {
            console.error("Error fetching booking:", error);
            showNotification("Failed to fetch booking details.", "error");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [bookingId, navigate, showNotification]);

    const handleTabChange = (event, newValue) => setTabValue(newValue);
    
    const handleFormChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSaveDetails = async () => {
        setIsSaving(true);
        const bookingRef = doc(db, 'bookings', bookingId);
        try {
            const dataToUpdate = {
                roomId: formData.roomId,
                rentAmount: Number(formData.rentAmount),
                securityDeposit: Number(formData.securityDeposit),
                rentDueDateDay: Number(formData.rentDueDateDay),
                ratePerUnit: Number(ratePerUnit)
            };
            await updateDoc(bookingRef, dataToUpdate);
            setEditMode(false);
            showNotification("Details updated successfully!", "success");
        } catch (error) {
            console.error("Error updating details:", error);
            showNotification("Failed to update details.", "error");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleGenerateBill = async () => {
        const lastBill = bills[0];
        const initialReading = booking.initialMeterReading || 0;
        const prevReading = lastBill ? lastBill.billDetails.currentReading : parseFloat(previousReading || initialReading);
        const currReading = parseFloat(currentReading);

        if (isNaN(currReading) || (bills.length === 0 && isNaN(prevReading) && !booking.initialMeterReading)) {
            return showNotification("Please enter a valid initial and current meter reading.", "error");
        }
        if (currReading <= prevReading) {
            return showNotification("Current reading must be greater than the previous reading.", "error");
        }

        setIsSaving(true);
        try {
            const prevReadingDate = lastBill ? lastBill.createdAt.toDate() : booking.checkInDate.toDate();
            const today = new Date();
            const timeDiff = today.getTime() - prevReadingDate.getTime();
            const dayDifference = Math.max(1, Math.round(timeDiff / (1000 * 3600 * 24)));

            const unitsConsumed = currReading - prevReading;
            const totalAmount = unitsConsumed * ratePerUnit;

            const billData = {
                bookingId: booking.id, billType: 'ELECTRICITY', amount: totalAmount, status: 'DUE',
                dueDate: Timestamp.fromDate(new Date(new Date().setDate(new Date().getDate() + 10))),
                createdAt: serverTimestamp(),
                billDetails: {
                    previousReading: prevReading, currentReading: currReading,
                    unitsConsumed: unitsConsumed, ratePerUnit: ratePerUnit,
                    previousReadingDate: Timestamp.fromDate(prevReadingDate),
                    dayDifference: dayDifference
                }
            };
            
            const newBillRef = await addDoc(collection(db, 'bills'), billData);
            setBills(prev => [{ id: newBillRef.id, ...billData, createdAt: Timestamp.now() }, ...prev]);
            
            setCurrentReading(''); setPreviousReading('');
            showNotification(`Bill for ${dayDifference} days generated successfully!`, "success");

        } catch (error) {
            console.error("Error generating bill: ", error);
            showNotification("Failed to generate bill.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileSelected = (e) => {
        if (e.target.files[0]) {
            setFileToUpload(e.target.files[0]);
            if (!documentName) {
                setDocumentName(e.target.files[0].name.split('.').slice(0, -1).join('.'));
            }
        }
    };
    
    const handleUploadDocument = async () => {
        if (!fileToUpload) { return showNotification("Please select a file.", "error"); }
        if (!documentName) { return showNotification("Please enter a document name.", "error"); }

        setIsUploading(true);
        const cloudFormData = new FormData();
        cloudFormData.append('file', fileToUpload);
        cloudFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        try {
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
                method: 'POST', body: cloudFormData,
            });
            const data = await response.json();
            if (!data.secure_url) { throw new Error(data.error.message || "Cloudinary upload failed."); }
            
            const docData = {
                bookingId: booking.id, documentName: documentName,
                fileURL: data.secure_url, uploadedAt: serverTimestamp(),
            };
            const newDocRef = await addDoc(collection(db, 'documents'), docData);
            
            setDocuments(prev => [{ id: newDocRef.id, ...docData, uploadedAt: Timestamp.now() }, ...prev]);
            showNotification("Document uploaded successfully!", "success");

            setFileToUpload(null); setDocumentName('');
            if(fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            showNotification(error.message || "Failed to upload document.", "error");
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleComplaintStatusChange = async (complaintId, newStatus) => {
        const complaintRef = doc(db, 'complaints', complaintId);
        try {
            await updateDoc(complaintRef, { status: newStatus });
            setComplaints(prev => prev.map(c => c.id === complaintId ? { ...c, status: newStatus } : c));
            showNotification("Complaint status updated.", "success");
        } catch (error) {
            showNotification("Failed to update status.", "error");
        }
    };

    const openPaidModal = (bill) => { setSelectedBill(bill); setPaidModalOpen(true); };
    const closePaidModal = () => { setSelectedBill(null); setRemarks(''); setPaidModalOpen(false); };
    
    const handleMarkAsPaid = async () => {
        if (!selectedBill) return;
        
        setIsSaving(true);
        const billRef = doc(db, 'bills', selectedBill.id);
        try {
            const finalRemarks = remarks || 'Payment Confirmed';
            await updateDoc(billRef, {
                status: 'PAID',
                remarks: finalRemarks,
                paidOnDate: serverTimestamp()
            });
            showNotification("Bill marked as paid successfully!", "success");
            closePaidModal();
            closeBillDetailModal();
        } catch (error) {
            console.error("Error marking bill as paid:", error);
            showNotification("Failed to update bill status.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const openBillDetailModal = (bill) => {
        setSelectedBill(bill);
        const dueDate = bill.dueDate.toDate();
        const formattedDate = dueDate.toISOString().split('T')[0];
        setNewDueDate(formattedDate);
        setBillDetailModalOpen(true);
    };

    const closeBillDetailModal = () => {
        setSelectedBill(null);
        setNewDueDate('');
        setBillDetailModalOpen(false);
    };

    const handleUpdateDueDate = async () => {
        if (!selectedBill || !newDueDate) return;
        
        setIsSaving(true);
        const billRef = doc(db, 'bills', selectedBill.id);
        try {
            const updatedDueDate = Timestamp.fromDate(new Date(newDueDate));
            await updateDoc(billRef, { dueDate: updatedDueDate });
            showNotification("Due date updated successfully!", "success");
            closeBillDetailModal();
        } catch (error) {
            console.error("Error updating due date:", error);
            showNotification("Failed to update due date.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRejectPayment = async () => {
        if (!selectedBill) return;
        setIsSaving(true);
        const billRef = doc(db, 'bills', selectedBill.id);
        try {
            await updateDoc(billRef, {
                status: 'DUE',
                remarks: 'Owner rejected payment proof. Please contact.'
            });
            showNotification("Payment request rejected.", "info");
            closeBillDetailModal();
        } catch (error) {
            showNotification("Failed to reject payment.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEndTenancy = async () => {
        if (!window.confirm("Are you sure you want to end this tenancy? This will mark the booking as 'completed' and make the room available again.")) {
            return;
        }

        setIsSaving(true);
        try {
            await runTransaction(db, async (transaction) => {
                if (!booking || !booking.listingId) {
                    throw new Error("Booking or Listing ID is missing.");
                }

                const bookingRef = doc(db, 'bookings', bookingId);
                const listingRef = doc(db, 'listings', booking.listingId);

                const listingSnap = await transaction.get(listingRef);

                if (!listingSnap.exists()) {
                    throw new Error("Original listing for this booking could not be found.");
                }
                
                transaction.update(bookingRef, {
                    status: 'COMPLETED',
                    isActive: false,
                    checkOutDate: serverTimestamp()
                });

                const listingData = listingSnap.data();
                const newAvailableUnits = (listingData.availableUnits || 0) + 1;
                
                transaction.update(listingRef, {
                    availableUnits: newAvailableUnits,
                    status: 'live'
                });
            });

            showNotification("Tenancy ended successfully. Listing is updated and live again!", "success");
            navigate('/owner/dashboard');

        } catch (error) {
            console.error("Error during check-out:", error);
            showNotification(error.message || "Failed to end tenancy.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    if (!booking) return <Typography sx={{textAlign: 'center', mt: 4}}>Booking details could not be loaded.</Typography>;
    
    const lastBillReading = bills[0]?.billDetails.currentReading;

    return (
        <Box sx={{ flexGrow: 1, backgroundColor: '#F8F9FA', py: {xs: 2, md: 4}, minHeight: '100vh' }}>
            <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
                 <Stack 
                    direction={{xs: 'column', sm: 'row'}} 
                    justifyContent="space-between" 
                    alignItems={{xs: 'flex-start', sm: 'center'}} 
                    mb={2}
                 >
                      <Typography variant="h4" fontWeight="bold">
                          Room {editMode ? formData.roomId : (booking.roomId || '(Not Set)')}
                      </Typography>
                      <Button 
                          variant="contained" 
                          startIcon={editMode ? <Save /> : <Edit />}
                          onClick={editMode ? handleSaveDetails : () => setEditMode(true)}
                          disabled={isSaving}
                          sx={{ mt: { xs: 1, sm: 0 } }}
                      >
                          {editMode ? (isSaving ? 'Saving...' : 'Save Details') : 'Edit Details'}
                      </Button>
                 </Stack>
                 {editMode && (
                       <Button size="small" onClick={() => setEditMode(false)} sx={{mb: 2}}>Cancel</Button>
                 )}

                 <Paper sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                           <Tabs 
                                value={tabValue} 
                                onChange={handleTabChange} 
                                variant="scrollable" 
                                scrollButtons 
                                allowScrollButtonsMobile
                                aria-label="booking detail tabs"
                           >
                              <Tab label="Overview" />
                              <Tab label="Billing" />
                              <Tab label="Documents" />
                              <Tab label="Complaints" />
                          </Tabs>
                      </Box>

                      <TabPanel value={tabValue} index={0}>
                          <Typography variant="h6" sx={{ mb: 2 }}>Booking Overview</Typography>
                          <Stack spacing={2}>
                               <TextField label="Room No. / Name" name="roomId" value={formData.roomId} onChange={handleFormChange} disabled={!editMode} variant={editMode ? "outlined" : "standard"} />
                               <TextField label="Monthly Rent" name="rentAmount" type="number" value={formData.rentAmount} onChange={handleFormChange} disabled={!editMode} variant={editMode ? "outlined" : "standard"} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                               <TextField label="Security Deposit" name="securityDeposit" type="number" value={formData.securityDeposit} onChange={handleFormChange} disabled={!editMode} variant={editMode ? "outlined" : "standard"} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                               <TextField label="Rent Due Day of Month" name="rentDueDateDay" type="number" value={formData.rentDueDateDay} onChange={handleFormChange} disabled={!editMode} variant={editMode ? "outlined" : "standard"} />
                               <Divider/>
                               <Box sx={{ display: 'flex', alignItems: 'center' }}> <Person sx={{ mr: 1.5, color: 'text.secondary' }} /> <Typography>Primary Tenant: <strong>{booking.studentName}</strong></Typography> </Box>
                               <Box sx={{ display: 'flex', alignItems: 'center' }}> <Event sx={{ mr: 1.5, color: 'text.secondary' }} /> <Typography>Check-in Date: {formatTimestamp(booking.checkInDate)}</Typography> </Box>
                          </Stack>
                          
                          {booking.status === 'ACTIVE' && (
                            <>
                                <Divider sx={{ my: 3 }} />
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    Ending the tenancy will mark this booking as 'completed' and make the associated room/unit available again in your listing.
                                </Alert>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="error"
                                    startIcon={<Logout />}
                                    onClick={handleEndTenancy}
                                    disabled={isSaving}
                                >
                                    {isSaving ? <CircularProgress size={24} color="inherit"/> : "End Tenancy & Mark Room as Vacant"}
                                </Button>
                            </>
                          )}
                      </TabPanel>

                      <TabPanel value={tabValue} index={1}>
                          <Typography variant="h6" sx={{ mb: 2 }}>Billing Settings</Typography>
                          <TextField label="Rate Per Unit (₹)" type="number" value={ratePerUnit} onChange={(e) => setRatePerUnit(e.target.value)} disabled={!editMode} variant="outlined" sx={{width: '200px', mb: 3}} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}/>
                          <Divider/>
                          <Typography variant="h6" sx={{ mb: 2, mt: 3 }}>Generate New Bill</Typography>
                          <Stack spacing={2} direction={{xs: 'column', sm: 'row'}} alignItems="center">
                              {!lastBillReading && !booking.initialMeterReading && (
                                   <TextField label="Initial Meter Reading (kWh)" type="number" value={previousReading} onChange={(e) => setPreviousReading(e.target.value)} variant="outlined" fullWidth />
                              )}
                               {lastBillReading && (
                                  <TextField label="Previous Reading (kWh)" type="number" value={lastBillReading} disabled variant="outlined" fullWidth />
                              )}
                               {!lastBillReading && booking.initialMeterReading && (
                                  <TextField label="Initial Meter Reading (kWh)" type="number" value={booking.initialMeterReading} disabled variant="outlined" fullWidth />
                              )}
                              <TextField label="Current Meter Reading (kWh)" type="number" value={currentReading} onChange={(e) => setCurrentReading(e.target.value)} variant="outlined" fullWidth />
                              <Button variant="contained" startIcon={<Bolt />} onClick={handleGenerateBill} disabled={isSaving} sx={{minWidth: '180px'}}>
                                  {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Generate Bill'}
                              </Button>
                          </Stack>
                          <Divider sx={{ my: 3 }} />
                          <Typography variant="h6" sx={{ mb: 2 }}>Payment History</Typography>
                          {bills.length > 0 ? ( 
                              <List> 
                                  {bills.map(bill => ( 
                                      <ListItemButton key={bill.id} onClick={() => openBillDetailModal(bill)} divider>
                                          <ListItemText 
                                              primary={<Typography fontWeight="bold">Electricity Bill - ₹{bill.amount.toFixed(2)}</Typography>} 
                                              secondary={
                                                  <>
                                                   <Typography component="span" display="block" variant="body2"> {`For ${bill.billDetails.dayDifference} days. Units: ${bill.billDetails.unitsConsumed}.`} </Typography> 
                                                   {bill.status === 'PAID_REQUESTED' && <Typography component="span" variant="caption" color="primary.main" fontWeight="bold"> Tenant has requested to mark as paid. </Typography>}
                                                   {bill.status === 'PAID' && bill.remarks && ( <Typography component="span" variant="caption" color="text.secondary"> Note: {bill.remarks} </Typography> )}
                                                  </>
                                              } 
                                          /> 
                                          <Chip label={bill.status.replace(/_/g, ' ')} color={getStatusColor(bill.status)} sx={{ml: 2, textTransform: 'capitalize'}}/> 
                                      </ListItemButton> 
                                  ))} 
                              </List>
                          ) : ( <Alert severity="info">No bills have been generated yet. Generate the first bill by entering the initial and current meter readings.</Alert> )}
                      </TabPanel>

                      <TabPanel value={tabValue} index={2}>
                          <Typography variant="h6" sx={{ mb: 2 }}>Upload New Document</Typography>
                          <Stack spacing={2} sx={{ maxWidth: '600px' }}>
                              <TextField label="Document Name (e.g., Rent Agreement)" value={documentName} onChange={(e) => setDocumentName(e.target.value)} fullWidth />
                              <Button variant="outlined" component="label" startIcon={<FileUpload />}>
                                  {fileToUpload ? `Selected: ${fileToUpload.name}` : "Select File"}
                                  <input type="file" hidden onChange={handleFileSelected} ref={fileInputRef}/>
                              </Button>
                              <Button variant="contained" onClick={handleUploadDocument} disabled={isUploading}>
                                  {isUploading ? <CircularProgress size={24} color="inherit" /> : 'Upload Document'}
                              </Button>
                          </Stack>
                          <Divider sx={{ my: 3 }} />
                          <Typography variant="h6" sx={{ mb: 2 }}>Uploaded Documents</Typography>
                          {documents.length > 0 ? ( <List> {documents.map(doc => ( <ListItem key={doc.id} secondaryAction={ <IconButton edge="end" href={doc.fileURL} target="_blank" rel="noopener noreferrer" title="Open document"> <LinkIcon /> </IconButton> }> <ListItemAvatar><Avatar><Description /></Avatar></ListItemAvatar> <ListItemText primary={doc.documentName} secondary={`Uploaded on ${formatTimestamp(doc.uploadedAt)}`} /> </ListItem> ))} </List>
                          ) : (<Typography color="text.secondary">No documents have been uploaded for this booking yet.</Typography>)}
                      </TabPanel>
                      
                      <TabPanel value={tabValue} index={3}>
                          <Typography variant="h6" sx={{ mb: 2 }}>Manage Complaints</Typography>
                          {complaints.length > 0 ? ( <List> {complaints.map((complaint) => ( <ListItem key={complaint.id} sx={{ flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'flex-start' }} divider> <ListItemAvatar sx={{mt: 1}}> <Avatar><ReportProblem /></Avatar> </ListItemAvatar> <ListItemText primary={<Typography fontWeight="bold">{complaint.title}</Typography>} secondary={ <> <Typography component="span" variant="body2" color="text.primary">{complaint.description}</Typography> <br /> <Typography component="span" variant="caption" color="text.secondary"> Raised on: {formatTimestamp(complaint.createdAt)} </Typography> </> } sx={{ flexGrow: 1, mb: { xs: 2, sm: 0 }, mr: { sm: 2 } }} /> <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '180px' }}> <Chip label={complaint.status.replace('_', ' ')} color={getStatusColor(complaint.status)} size="small" sx={{ mr: 2, textTransform: 'capitalize' }} /> <FormControl size="small" variant="outlined"> <Select value={complaint.status} onChange={(e) => handleComplaintStatusChange(complaint.id, e.target.value)} > <MenuItem value="NEW">New</MenuItem> <MenuItem value="IN_PROGRESS">In Progress</MenuItem> <MenuItem value="RESOLVED">Resolved</MenuItem> </Select> </FormControl> </Box> </ListItem> ))} </List>
                          ) : ( <Typography color="text.secondary">No complaints have been raised for this booking yet.</Typography> )}
                      </TabPanel>
                 </Paper>
            </Container>

            {/* Mark as Paid Modal */}
            <Dialog open={paidModalOpen} onClose={closePaidModal}>
                <DialogTitle>Mark Bill as Paid</DialogTitle>
                <DialogContent>
                    <Typography> You are marking the bill of ₹{selectedBill?.amount.toFixed(2)} as paid. </Typography>
                    <TextField autoFocus margin="dense" id="remarks" label="Remarks (Optional)" type="text" fullWidth variant="outlined" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closePaidModal}>Cancel</Button>
                    <Button onClick={handleMarkAsPaid} variant="contained" color="success" disabled={isSaving}>
                        {isSaving ? <CircularProgress size={24} /> : "Confirm Payment"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bill Detail Dialog */}
            <Dialog open={billDetailModalOpen} onClose={closeBillDetailModal} fullWidth maxWidth="xs">
                <DialogTitle>Bill Details</DialogTitle>
                <DialogContent>
                    {selectedBill && (
                        <Stack spacing={1.5}>
                            <Typography variant="h5" fontWeight="bold">₹{selectedBill.amount.toFixed(2)}</Typography>
                            <Chip label={selectedBill.status.replace(/_/g, ' ')} color={getStatusColor(selectedBill.status, 'bill')} sx={{width: 'fit-content', textTransform: 'capitalize'}} />
                            <Divider/>
                            <Typography><b>Generated On:</b> {formatTimestamp(selectedBill.createdAt)}</Typography>
                            {selectedBill.status === 'PAID' ? (
                                <Typography><b>Paid On:</b> {formatTimestamp(selectedBill.paidOnDate)}</Typography>
                            ) : (
                                <Typography><b>Due Date:</b> {formatTimestamp(selectedBill.dueDate, {dateStyle: 'long'})}</Typography>
                            )}
                            <Typography><b>Remarks:</b> {selectedBill.remarks || 'None'}</Typography>
                            <Divider/>
                            <Typography variant="body2">
                                {`Reading: ${selectedBill.billDetails.previousReading} to ${selectedBill.billDetails.currentReading} (${selectedBill.billDetails.unitsConsumed} units)`}
                            </Typography>
                             <Typography variant="body2">
                                {`Billing Period: ${selectedBill.billDetails.dayDifference} days`}
                            </Typography>
                            
                            {selectedBill.status === 'DUE' && (
                                <Stack spacing={1} mt={2}>
                                    <Typography fontWeight="bold">Adjust Due Date</Typography>
                                    <TextField type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} fullWidth/>
                                </Stack>
                            )}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{justifyContent: 'space-between', p: 2}}>
                    <Button onClick={closeBillDetailModal}>Close</Button>
                    <Stack direction="row" spacing={1}>
                        {selectedBill?.status === 'DUE' && (
                             <Button onClick={() => { closeBillDetailModal(); openPaidModal(selectedBill); }} variant="outlined">Mark as Paid</Button>
                        )}
                        {selectedBill?.status === 'PAID_REQUESTED' && (
                            <>
                                <Button onClick={handleRejectPayment} variant="outlined" color="error" startIcon={<ThumbDown/>} disabled={isSaving}>Reject</Button>
                                <Button onClick={() => { closeBillDetailModal(); openPaidModal(selectedBill); }} variant="contained" color="success" startIcon={<ThumbUp/>} disabled={isSaving}>Confirm</Button>
                            </>
                        )}
                        {selectedBill?.status === 'DUE' && (
                            <Button onClick={handleUpdateDueDate} variant="contained" disabled={isSaving}>
                                {isSaving ? <CircularProgress size={24} /> : "Save Date"}
                            </Button>
                        )}
                    </Stack>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RoomDetailScreen;
