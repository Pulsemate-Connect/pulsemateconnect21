# Frontend Multi-Role Implementation TODO

## Current Status
- ✅ JWT already contains `roles[]` and `activeRole`
- ✅ Backend `/api/auth/switch-role` endpoint exists
- ✅ Backend middleware validates `activeRole`
- ⏳ Frontend needs role switcher UI

---

## Tasks

### 1. Update `authStore.js` Token Validation

**File:** `frontend/src/store/authStore.js`

**Current Issue:**
Token validation might fail if it expects single role but receives array.

**Fix:**
```javascript
// In validateToken function
const validateToken = (decoded) => {
  // ✅ Check if activeRole is in roles array
  if (decoded.roles && Array.isArray(decoded.roles)) {
    if (!decoded.roles.includes(decoded.activeRole)) {
      return false; // activeRole must be in roles array
    }
  }
  
  // ✅ Support both old single role and new multi-role
  const userRole = decoded.activeRole || decoded.role;
  
  return {
    ...decoded,
    role: userRole,
    roles: decoded.roles || [decoded.role],
    activeRole: decoded.activeRole || decoded.role
  };
};
```

### 2. Create `RoleSwitcher.jsx` Component

**File:** `frontend/src/components/RoleSwitcher.jsx`

```jsx
import React, { useState } from 'react';
import { useAuth } from '../store/authStore';
import api from '../services/api';

const RoleSwitcher = () => {
  const { user, updateUser } = useAuth();
  const [switching, setSwitching] = useState(false);
  
  // Only show if user has multiple roles
  if (!user.roles || user.roles.length <= 1) {
    return null;
  }
  
  const handleRoleSwitch = async (newRole) => {
    if (newRole === user.activeRole) return;
    
    try {
      setSwitching(true);
      
      const response = await api.post('/auth/switch-role', {
        newRole
      });
      
      // Update auth store with new tokens
      updateUser(response.data.user);
      
      // Redirect to appropriate dashboard
      switch (newRole) {
        case 'PATIENT':
          window.location.href = '/patient/dashboard';
          break;
        case 'DOCTOR':
          window.location.href = '/doctor/dashboard';
          break;
        case 'CLINIC_OWNER':
          window.location.href = '/clinic/dashboard';
          break;
        case 'SUPER_ADMIN':
          window.location.href = '/admin/dashboard';
          break;
      }
    } catch (error) {
      console.error('Role switch failed:', error);
      alert('Failed to switch role. Please try again.');
    } finally {
      setSwitching(false);
    }
  };
  
  return (
    <div className="role-switcher">
      <label>Continue as:</label>
      <div className="role-buttons">
        {user.roles.map(role => (
          <button
            key={role}
            onClick={() => handleRoleSwitch(role)}
            disabled={switching || role === user.activeRole}
            className={role === user.activeRole ? 'active' : ''}
          >
            {role === 'PATIENT' && '🏥 Patient'}
            {role === 'DOCTOR' && '👨‍⚕️ Doctor'}
            {role === 'CLINIC_OWNER' && '🏢 Clinic Owner'}
            {role === 'SUPER_ADMIN' && '⚡ Admin'}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoleSwitcher;
```

### 3. Add RoleSwitcher to Login Flow

**File:** `frontend/src/pages/LoginPage.jsx` (or wherever login success is handled)

```jsx
import RoleSwitcher from '../components/RoleSwitcher';

// After successful login
{user && user.roles && user.roles.length > 1 && (
  <RoleSwitcher />
)}

// Or automatically redirect if single role
{user && user.roles && user.roles.length === 1 && (
  <Navigate to={getDashboardRoute(user.roles[0])} />
)}
```

### 4. Add Role Badge to Header

**File:** `frontend/src/components/Header.jsx`

```jsx
const Header = () => {
  const { user } = useAuth();
  
  return (
    <header>
      {/* ... other header content ... */}
      
      {user && user.roles && user.roles.length > 1 && (
        <div className="active-role-badge">
          <span>Acting as: </span>
          <strong>{user.activeRole}</strong>
          <button onClick={openRoleSwitcher}>
            Switch Role
          </button>
        </div>
      )}
    </header>
  );
};
```

### 5. Update Route Guards

**File:** `frontend/src/routes/ProtectedRoute.jsx`

```jsx
// Update to check activeRole instead of role
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // ✅ Check activeRole (current role user is acting as)
  const userRole = user.activeRole || user.role;
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};
```

### 6. Add CSS Styling

**File:** `frontend/src/styles/RoleSwitcher.css`

```css
.role-switcher {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
}

.role-switcher label {
  display: block;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.role-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.role-buttons button {
  padding: 12px 24px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.role-buttons button:hover:not(:disabled) {
  border-color: #2196F3;
  background: #E3F2FD;
  transform: translateY(-2px);
}

.role-buttons button.active {
  border-color: #2196F3;
  background: #2196F3;
  color: white;
}

.role-buttons button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.active-role-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #E3F2FD;
  border-radius: 20px;
  font-size: 14px;
}

.active-role-badge strong {
  color: #2196F3;
}

.active-role-badge button {
  padding: 4px 12px;
  border: 1px solid #2196F3;
  border-radius: 12px;
  background: white;
  color: #2196F3;
  font-size: 12px;
  cursor: pointer;
}

.active-role-badge button:hover {
  background: #2196F3;
  color: white;
}
```

---

## Testing Checklist

### Test Case 1: Single Role User
- [ ] User with one role logs in
- [ ] No role switcher shown
- [ ] Automatically redirects to their dashboard
- [ ] Header shows no role badge

### Test Case 2: Multi-Role User
- [ ] User with PATIENT + DOCTOR logs in
- [ ] Role switcher appears
- [ ] Shows both role options
- [ ] Active role is highlighted
- [ ] Switching updates JWT
- [ ] Dashboard changes on switch
- [ ] Header shows current role

### Test Case 3: Role Switching
- [ ] Click DOCTOR role
- [ ] New JWT received with `activeRole: DOCTOR`
- [ ] Redirects to `/doctor/dashboard`
- [ ] Header updates to show "Acting as: DOCTOR"
- [ ] Can switch back to PATIENT
- [ ] All role-specific features work

### Test Case 4: Protected Routes
- [ ] PATIENT trying to access `/doctor/*` → blocked
- [ ] After switching to DOCTOR → allowed
- [ ] Middleware validates activeRole correctly

### Test Case 5: API Requests
- [ ] All API requests include JWT with activeRole
- [ ] Backend receives correct activeRole
- [ ] Authorization works per active role
- [ ] No permission errors

---

## API Endpoint Reference

### Switch Role
**POST** `/api/auth/switch-role`

**Request:**
```json
{
  "newRole": "DOCTOR"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "name": "Dr. John",
      "mobile": "9999999999",
      "roles": ["PATIENT", "DOCTOR"],
      "activeRole": "DOCTOR",
      "primaryRole": "PATIENT"
    }
  },
  "message": "Role switched successfully"
}
```

**Errors:**
- `400` - Invalid role
- `403` - Role not in user's roles array
- `401` - Unauthorized

---

## Migration from Single-Role

### Old Code (Single Role)
```javascript
// ❌ Old way
if (user.role === 'DOCTOR') {
  // doctor logic
}
```

### New Code (Multi-Role)
```javascript
// ✅ New way
if (user.activeRole === 'DOCTOR') {
  // doctor logic
}

// Or check if user has role
if (user.roles.includes('DOCTOR')) {
  // has doctor role
}
```

---

## Deployment Steps

1. ✅ Backend deployed with multi-role support
2. ⏳ Deploy frontend with role switcher
3. ⏳ Test with internal users (1 week)
4. ⏳ Beta rollout (select users, 2 weeks)
5. ⏳ Full rollout
6. ⏳ Monitor for 2 weeks
7. ⏳ Remove feature flag

---

## Support

**Issues?**
- Check console for JWT structure
- Verify `user.roles` is array
- Verify `user.activeRole` matches one in `roles[]`
- Check backend logs for authorization errors

**Questions?**
- Review backend implementation
- Check `MULTI_ROLE_MIGRATION_COMPLETE.md`
- Test with curl/Postman first

---

✨ **Frontend multi-role support ready to implement!**
