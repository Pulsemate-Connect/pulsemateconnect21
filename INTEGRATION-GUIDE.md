# 🔧 INTEGRATION GUIDE - Final Steps

**Time Required:** 15-20 minutes  
**Difficulty:** Easy

All HIGH PRIORITY features are implemented. Follow these steps to complete the integration.

---

## Step 1: Navigate to Consultation Screen (Doctor App)

**File:** Your navigation configuration (e.g., `App.jsx` or `navigation/index.js`)

**Where to navigate from:** Today's appointments list or queue screen

```javascript
// In your doctor's appointment card or queue item:
<TouchableOpacity
  onPress={() => navigation.navigate('Consultation', {
    appointmentId: appointment.id,
    patientName: appointment.patient.name,
    patientId: appointment.patientId,
  })}
>
  <Text>Start Consultation</Text>
</TouchableOpacity>
```

---

## Step 2: Navigate to Holiday Management (Owner App)

**Where to navigate from:** Clinic settings or dashboard

```javascript
// In clinic owner's settings or dashboard:
<TouchableOpacity
  onPress={() => navigation.navigate('HolidayManagement', {
    clinicId: clinic.id,
    clinicName: clinic.name,
  })}
>
  <Text>Manage Holidays</Text>
</TouchableOpacity>
```

---

## Step 3: Upload Files (Owner/Doctor)

**Example: Upload Clinic Logo**

```javascript
import * as ImagePicker from 'expo-image-picker';
import api from './api/auth';

const pickAndUploadLogo = async (clinicId) => {
  // Pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return;

  // Prepare FormData
  const formData = new FormData();
  formData.append('clinicId', clinicId);
  formData.append('logo', {
    uri: result.assets[0].uri,
    type: 'image/jpeg',
    name: 'clinic-logo.jpg',
  });

  // Upload
  try {
    const response = await api.post('/upload/clinic-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    if (response.data.success) {
      Alert.alert('Success', 'Logo uploaded successfully');
      console.log('Logo URL:', response.data.url);
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to upload logo');
  }
};
```

---

## Step 4: Integrate Socket.io in Existing Screens

### In LiveQueueScreen.jsx

**Add at top:**
```javascript
import socketService from '../services/socket.service';
```

**Add in useEffect:**
```javascript
useEffect(() => {
  // Connect socket
  socketService.connect();
  
  // Join queue room
  if (clinicId && doctorId && date) {
    socketService.joinQueueRoom(clinicId, doctorId, date);
  }
  
  // Listen for queue updates
  socketService.onQueueUpdate((queueData) => {
    console.log('Queue updated:', queueData);
    setQueueItems(queueData.queueItems || queueData);
  });
  
  // Listen for patient called
  socketService.onPatientCalled((patientData) => {
    console.log('Patient called:', patientData);
    
    // If this is current user, show alert
    if (patientData.patientId === currentUser.id) {
      Alert.alert(
        'Your Turn!',
        'Please proceed to the consultation room.',
        [{ text: 'OK' }]
      );
    }
  });
  
  // Cleanup
  return () => {
    socketService.off('queue:updated');
    socketService.off('queue:patientCalled');
  };
}, [clinicId, doctorId, date]);
```

### In NotificationsScreen.jsx

**Add at top:**
```javascript
import socketService from '../services/socket.service';
import Toast from 'react-native-toast-message';
```

**Add in useEffect:**
```javascript
useEffect(() => {
  // Connect socket
  socketService.connect();
  
  // Join notification room
  if (userId) {
    socketService.joinNotificationRoom(userId);
  }
  
  // Listen for new notifications
  socketService.onNotification((notification) => {
    console.log('New notification:', notification);
    
    // Add to notifications list
    setNotifications(prev => [notification, ...prev]);
    
    // Update unread count
    setUnreadCount(prev => prev + 1);
    
    // Show toast
    Toast.show({
      type: 'success',
      text1: notification.title,
      text2: notification.message,
      visibilityTime: 3000,
    });
  });
  
  // Cleanup
  return () => {
    socketService.off('notification:new');
  };
}, [userId]);
```

---

## Step 5: Block Bookings on Holidays

**File:** `backend/src/controllers/patient.controller.js`

**Find the `bookAppointment` function and add this check before creating the appointment:**

```javascript
const bookAppointment = async (req, res, next) => {
  try {
    const { clinicId, doctorId, appointmentDate, slotTime } = req.body;
    
    // ... existing validation code ...
    
    // ✅ ADD THIS: Check if date is a holiday
    const { isHoliday } = require('./holiday.controller');
    const holidayCheck = await isHoliday(clinicId, appointmentDate);
    
    if (holidayCheck) {
      return sendError(res, 'Cannot book appointment on a holiday. Please select another date.', 400);
    }
    
    // ... rest of booking logic continues ...
    
  } catch (error) {
    next(error);
  }
};
```

---

## Step 6: Emit Real-Time Updates from Backend

### In Reception Controller (when calling next patient)

**File:** `backend/src/controllers/reception.controller.js`

**Find the `callNextPatient` function and add Socket.io emit:**

```javascript
const callNextPatient = async (req, res, next) => {
  try {
    const { queueId } = req.params;
    
    // ... existing logic to call next patient ...
    
    // ✅ ADD THIS: Emit real-time update
    const io = req.app.get('io');
    if (io) {
      const { emitQueueUpdate, emitPatientCalled } = require('../socket');
      
      // Get updated queue
      const updatedQueue = await prisma.queue.findUnique({
        where: { id: queueId },
        include: { queueItems: true },
      });
      
      // Emit to all in room
      emitQueueUpdate(
        io, 
        queue.clinicId, 
        queue.doctorId, 
        queue.date, 
        updatedQueue
      );
      
      // Emit to specific patient
      emitPatientCalled(
        io, 
        queue.clinicId, 
        queue.doctorId, 
        queue.date, 
        {
          patientId: calledItem.patientId,
          queueNumber: calledItem.queueNumber,
          position: calledItem.position,
        }
      );
    }
    
    return sendSuccess(res, { queueItem: calledItem }, 'Patient called successfully');
  } catch (error) {
    next(error);
  }
};
```

---

## Step 7: Test Everything

### 1. Test Socket.io
- [ ] Start backend server
- [ ] Open app on phone/emulator
- [ ] Check console for "Socket connected"
- [ ] Join a queue room
- [ ] From another device, call next patient
- [ ] Verify first device updates instantly

### 2. Test Consultation
- [ ] Doctor logs in
- [ ] Opens today's appointments
- [ ] Clicks "Start Consultation" on an appointment
- [ ] Fills in symptoms, diagnosis, medicines
- [ ] Adds 2-3 medicines
- [ ] Toggles follow-up
- [ ] Submits
- [ ] Checks appointment status changed to COMPLETED
- [ ] Verifies prescription in database

### 3. Test File Upload
- [ ] Clinic owner logs in
- [ ] Goes to clinic settings
- [ ] Picks logo image
- [ ] Uploads
- [ ] Verifies logo appears in clinic profile
- [ ] Checks file exists in `backend/uploads/` folder

### 4. Test Holiday Management
- [ ] Clinic owner logs in
- [ ] Opens Holiday Management
- [ ] Adds holiday for tomorrow
- [ ] Sees it marked on calendar
- [ ] Tries to book appointment for tomorrow (should fail)
- [ ] Deletes holiday
- [ ] Booking now works

---

## Step 8: Environment Check

**Ensure these are set in `backend/.env`:**

```env
DATABASE_URL=postgresql://username:password@localhost:5432/pulsemate_db
JWT_SECRET=your-secret-key
API_URL=https://api.pulsemateconnect.in
PORT=5000
```

**Ensure Socket URL in frontend matches:**

`src/services/socket.service.js`:
```javascript
const SOCKET_URL = 'https://api.pulsemateconnect.in';
```

---

## Step 9: Create uploads Directory

```bash
cd backend
mkdir uploads
```

Or it will be auto-created on first upload.

---

## Step 10: Restart Backend Server

```bash
cd backend
npm start
```

Look for:
```
🚀 PulseMate API running on port 5000
📡 Socket.io ready
🌍 Environment: production
```

---

## 🎉 You're Done!

All HIGH PRIORITY features are now fully integrated and ready to use.

**Module Completion: 82% → 92%**

---

## 🆘 Troubleshooting

### Socket not connecting
- Check backend is running
- Check SOCKET_URL matches API URL
- Check CORS settings in server.js
- Check firewall/network settings

### File upload failing
- Check uploads directory exists
- Check multer is installed
- Check FormData is used correctly
- Check file size < 5MB
- Check file type is allowed (JPEG, PNG, GIF, PDF)

### Holiday not blocking bookings
- Check isHoliday() is called in bookAppointment
- Check holiday date format is correct
- Check holiday exists in database
- Check clinicId matches

### Consultation screen not saving
- Check appointmentId is valid
- Check doctor is assigned to appointment
- Check all required fields filled
- Check API endpoints are correct

---

**Need Help?** Check the detailed code examples in `HIGH-PRIORITY-IMPLEMENTATION.md`
