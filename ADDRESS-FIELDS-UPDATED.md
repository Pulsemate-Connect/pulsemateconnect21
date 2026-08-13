# ✅ Address Fields Updated

**Date:** August 12, 2026  
**Status:** COMPLETE

---

## 🎯 Changes Made

### **1. Added Manual Coordinate Entry**

In the **Clinic Location Card**, below the map, users can now manually enter coordinates:

```
Enter the co-ordinates
┌────────────────────────────────────────────────────────────┐
│ Enter Latitudinal value  │ Enter Longitudinal value        │
└────────────────────────────────────────────────────────────┘
```

**Features:**
- Two input fields for latitude and longitude
- Users can manually type coordinates
- Updates the map marker when entered
- Validates numeric input
- Shows selected location confirmation below

---

### **2. Restructured Address Fields**

**New Field Structure:**

```
Add more address details

┌────────────────────────────────────────┐
│ Shop no. / building no. (optional)     │ ← Optional
├────────────────────────────────────────┤
│ Floor / tower (optional)               │ ← Optional
├────────────────────────────────────────┤
│ Area / Sector / Locality *             │ ← Required
├────────────────────────────────────────┤
│ City *                                 │ ← Required
├────────────────────────────────────────┤
│ Landmark (Optional)                    │ ← Optional
├────────────────────────────────────────┤
│ Pincode *           │ State *       ▼ │ ← Both required
└────────────────────────────────────────┘
```

---

## 📋 Field Changes

### **Before:**
```
1. Address Line 1 * (Building/street)
2. Address Line 2 * (Area/locality)
3. Landmark (optional)
4. City * | State *
5. Pincode * | Country (India)
```

### **After:**
```
1. Shop no. / building no. (optional)
2. Floor / tower (optional)
3. Area / Sector / Locality *
4. City *
5. Landmark (Optional)
6. Pincode * | State *
```

---

## 🔄 Field Mapping

| Old Field | New Field | Required | Notes |
|-----------|-----------|----------|-------|
| Address Line 1 * | Shop no. / building no. | Optional | Now optional |
| Address Line 2 * | Floor / tower | Optional | Now optional |
| - | Area / Sector / Locality * | **Required** | New field |
| Landmark | Landmark | Optional | Moved position |
| City * | City * | Required | Same |
| State * | State * | Required | Same |
| Pincode * | Pincode * | Required | Same |
| Country (India) | - | - | Removed |

---

## 🗂️ Database Schema Updates Needed

**New field added:** `locality`

```sql
-- You may need to add this field to your database schema
ALTER TABLE clinics ADD COLUMN locality VARCHAR(200);
```

**Form data structure:**
```javascript
{
  addressLine1: "Shop No. 12",      // Optional
  addressLine2: "2nd Floor",         // Optional
  locality: "Koramangala 4th Block", // Required
  city: "Bangalore",                 // Required
  landmark: "Near Sony World",       // Optional
  pincode: "560034",                 // Required
  state: "Karnataka",                // Required
}
```

---

## 📍 Coordinate Entry Features

### **Manual Input Fields:**

```javascript
<FormInput
  name="latitude"
  type="number"
  placeholder="Enter Latitudinal value"
  step="0.000001"
/>

<FormInput
  name="longitude"
  type="number"
  placeholder="Enter Longitudinal value"
  step="0.000001"
/>
```

### **Functionality:**

1. **Manual Entry:**
   - User can type coordinates directly
   - Precision up to 6 decimal places
   - Automatically updates map marker

2. **Map Selection:**
   - Click on map to select location
   - Automatically fills coordinate inputs
   - Drag marker to adjust

3. **Two-way Sync:**
   - Typing coordinates moves map marker
   - Clicking map updates coordinate fields

---

## 🎨 Visual Layout

### **Complete Clinic Location & Address Section:**

```
┌─────────────────────────────────────────────────────────┐
│  Clinic location and address                            │
│  Add your clinic's exact location so patients...        │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │  [INTERACTIVE MAP - 400px height]                 │ │
│  │  • Click to select location                       │ │
│  │  • Drag marker to adjust                          │ │
│  │  📍 Marker                                        │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Enter the co-ordinates                                 │
│  ┌─────────────────────────┬─────────────────────────┐ │
│  │ Enter Latitudinal value │ Enter Longitudinal value│ │
│  └─────────────────────────┴─────────────────────────┘ │
│                                                          │
│  ✓ Clinic location selected                             │
│  Latitude: 28.613900                                    │
│  Longitude: 77.209000                                   │
│                                                          │
│  ℹ️ Why is this important?                              │
│  Your clinic's location will be shown to patients...    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Add more address details                               │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Shop no. / building no. (optional)                │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Floor / tower (optional)                          │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Area / Sector / Locality *                        │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ City *                                            │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Landmark (Optional)                               │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────────────────┬──────────────────────────────┐│
│  │ Pincode *            │ State *                   ▼ ││
│  └──────────────────────┴──────────────────────────────┘│
│                                                          │
│  ⚠️ Please verify your address                          │
│  Make sure your clinic address is accurate...           │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Validation Rules

### **Required Fields:**
- ✅ Area / Sector / Locality
- ✅ City
- ✅ Pincode (6 digits)
- ✅ State

### **Optional Fields:**
- Shop no. / building no.
- Floor / tower
- Landmark

### **Coordinate Validation:**
- Latitude: -90 to 90
- Longitude: -180 to 180
- Precision: 6 decimal places

---

## 🧪 Testing Checklist

### **Map & Coordinates:**
- [ ] Click on map → coordinates auto-fill
- [ ] Type latitude → map marker moves
- [ ] Type longitude → map marker moves
- [ ] Invalid coordinates show error
- [ ] Coordinates display with 6 decimal places

### **Address Fields:**
- [ ] Shop/building (optional) - can be left empty
- [ ] Floor/tower (optional) - can be left empty
- [ ] Area/Locality (required) - shows error if empty
- [ ] City (required) - shows error if empty
- [ ] Landmark (optional) - can be left empty
- [ ] Pincode (required) - validates 6 digits
- [ ] State (required) - dropdown works

### **Form Submission:**
- [ ] Can submit with only required fields
- [ ] Optional fields don't block submission
- [ ] Validation errors display correctly
- [ ] Form saves to localStorage

---

## 📂 Files Modified

```
frontend/src/pages/clinic/onboarding/
├── components/
│   └── sections/
│       ├── ClinicLocationCard.jsx ✅ Added coordinate inputs
│       └── AddressDetailsCard.jsx ✅ Restructured fields
├── steps/
│   └── Step1ClinicInfo.jsx ✅ Added locality default value
└── utils/validation/
    └── clinicOnboardingSchema.js ✅ Updated validation rules
```

---

## 🎯 Benefits

### **Better User Experience:**
- ✅ More specific address structure
- ✅ Optional fields for flexible input
- ✅ Manual coordinate entry for precision
- ✅ Cleaner field organization

### **Improved Data Quality:**
- ✅ Separate locality field for better address parsing
- ✅ Optional building/floor for flexibility
- ✅ Precise coordinates from manual entry

### **Indian Address Format:**
- ✅ Matches standard Indian address structure
- ✅ Shop no./building no. (common in India)
- ✅ Floor/tower (for multi-story buildings)
- ✅ Sector/locality (common in Indian cities)

---

## 📝 Example Address

### **Filled Form:**
```
Shop no. / building no.: Shop No. 12
Floor / tower: 2nd Floor
Area / Sector / Locality: Koramangala 4th Block
City: Bangalore
Landmark: Near Sony World Signal
Pincode: 560034
State: Karnataka
```

### **Map Coordinates:**
```
Latitude: 12.935242
Longitude: 77.627108
```

---

## 🚀 Next Steps

### **Backend Updates Needed:**

1. **Update Database Schema:**
   ```sql
   ALTER TABLE clinics ADD COLUMN locality VARCHAR(200);
   ```

2. **Update API Endpoints:**
   - Accept `locality` field in clinic registration
   - Make `addressLine1` and `addressLine2` optional

3. **Update Validation:**
   - Require `locality` field
   - Make building/floor optional

---

**Update Complete! ✅**

The address collection now follows a more intuitive Indian address format with manual coordinate entry capability!
