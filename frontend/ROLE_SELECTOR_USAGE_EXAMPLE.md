# Role Selector Component - Usage Guide

## Overview
The `RoleSelector` component provides a UI for users with multiple roles to switch between them.

---

## Installation

Already created:
- ✅ `frontend/src/components/RoleSelector.jsx` - Main component
- ✅ `frontend/src/hooks/useRoleSwitcher.js` - Hook for API calls

---

## Basic Usage

### 1. In Your Header/Dashboard Component

```jsx
import React, { useState } from 'react';
import { Button, Badge } from '@mui/material';
import { SwapHoriz as SwitchIcon } from '@mui/icons-material';
import RoleSelector from '../components/RoleSelector';
import useRoleSwitcher from '../hooks/useRoleSwitcher';
import { useAuthStore } from '../store/authStore';

const DashboardHeader = () => {
  const [roleSelectorOpen, setRoleSelectorOpen] = useState(false);
  const { user } = useAuthStore();
  const { switchRole, switching } = useRoleSwitcher();

  // Extract multi-role data from user
  const currentRole = user?.activeRole || user?.role || 'PATIENT';
  const availableRoles = user?.roles || [user?.role || 'PATIENT'];
  const roleApprovals = user?.roleApprovals || [];

  // Handle role switch
  const handleSwitchRole = async (newRole) => {
    try {
      const result = await switchRole(newRole);
      
      // Reload page to update dashboard for new role
      window.location.reload();
      
      // Or update auth store and navigate:
      // useAuthStore.getState().setUser({ ...user, activeRole: result.activeRole });
      // navigate('/dashboard');
    } catch (error) {
      console.error('Failed to switch role:', error);
    }
  };

  // Only show button if user has multiple roles
  if (availableRoles.length <= 1) {
    return null;
  }

  return (
    <>
      <Badge 
        badgeContent={availableRoles.length} 
        color="primary"
      >
        <Button
          variant="outlined"
          startIcon={<SwitchIcon />}
          onClick={() => setRoleSelectorOpen(true)}
        >
          Switch Role ({currentRole})
        </Button>
      </Badge>

      <RoleSelector
        open={roleSelectorOpen}
        onClose={() => setRoleSelectorOpen(false)}
        currentRole={currentRole}
        availableRoles={availableRoles}
        roleApprovals={roleApprovals}
        onSwitchRole={handleSwitchRole}
        loading={switching}
      />
    </>
  );
};

export default DashboardHeader;
```

---

## 2. Update AuthStore to Include Multi-Role Fields

```javascript
// frontend/src/store/authStore.js

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      // Update login to store multi-role fields
      login: (user, accessToken) => {
        set({
          user: {
            ...user,
            // Ensure multi-role fields are included
            roles: user.roles || [user.role],
            primaryRole: user.primaryRole || user.role,
            activeRole: user.activeRole || user.primaryRole || user.role,
            roleApprovals: user.roleApprovals || [],
          },
          accessToken,
          isAuthenticated: true,
        });
      },

      // Add method to update active role
      updateActiveRole: (newActiveRole) => {
        set((state) => ({
          user: {
            ...state.user,
            activeRole: newActiveRole,
          },
        }));
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

---

## 3. Update Login API Response Handler

```javascript
// In your login handler

const handleLogin = async (credentials) => {
  try {
    const response = await axios.post('/api/auth/login', credentials);
    
    const { user, accessToken } = response.data.data;

    // IMPORTANT: Include multi-role fields
    useAuthStore.getState().login(
      {
        ...user,
        roles: user.roles || [user.role],
        primaryRole: user.primaryRole || user.role,
        activeRole: user.activeRole || user.primaryRole || user.role,
        roleApprovals: user.roleApprovals || [],
      },
      accessToken
    );

    // Navigate based on active role
    const activeRole = user.activeRole || user.primaryRole || user.role;
    navigateByRole(activeRole);
  } catch (error) {
    // Handle error
  }
};

const navigateByRole = (role) => {
  switch (role) {
    case 'PATIENT':
      navigate('/patient/dashboard');
      break;
    case 'DOCTOR':
      navigate('/doctor/dashboard');
      break;
    case 'CLINIC_OWNER':
      navigate('/clinic/dashboard');
      break;
    case 'RECEPTIONIST':
      navigate('/reception/dashboard');
      break;
    case 'SUPER_ADMIN':
      navigate('/admin/dashboard');
      break;
    default:
      navigate('/dashboard');
  }
};
```

---

## 4. Show Current Role in UI

```jsx
import { Chip } from '@mui/material';
import { useAuthStore } from '../store/authStore';

const RoleBadge = () => {
  const { user } = useAuthStore();
  const activeRole = user?.activeRole || user?.role;

  const roleLabels = {
    PATIENT: 'Patient',
    DOCTOR: 'Doctor',
    CLINIC_OWNER: 'Clinic Owner',
    RECEPTIONIST: 'Receptionist',
    SUPER_ADMIN: 'Admin',
  };

  return (
    <Chip 
      label={roleLabels[activeRole] || activeRole}
      color="primary"
      size="small"
    />
  );
};
```

---

## 5. Backend API Response Format

The backend `/api/auth/switch-role` endpoint returns:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "activeRole": "CLINIC_OWNER",
    "message": "Switched to CLINIC_OWNER role successfully"
  }
}
```

---

## Props Reference

### RoleSelector Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | boolean | Yes | Whether dialog is open |
| `onClose` | function | Yes | Called when dialog closes |
| `currentRole` | string | Yes | Current active role |
| `availableRoles` | array | Yes | All roles user has |
| `roleApprovals` | array | Yes | Approval status for each role |
| `onSwitchRole` | function | Yes | Called when user selects a role |
| `loading` | boolean | No | Whether role switch is in progress |

### useRoleSwitcher Return Values

```javascript
const { 
  switchRole,   // function(newRole) - Switch to new role
  switching,    // boolean - Whether switch is in progress
  error,        // string | null - Error message if failed
  clearError    // function() - Clear error state
} = useRoleSwitcher();
```

---

## Error Handling

The component handles these error cases:

1. **Role not approved:** Shows "Pending Approval" badge, button disabled
2. **Role rejected:** Shows "Rejected" badge, button disabled
3. **API error:** Shows error alert with message
4. **No token:** Throws error and redirects to login

---

## Styling

Component uses Material-UI components:
- `Dialog` for modal
- `List` and `ListItem` for role options
- `Radio` for selection
- `Chip` for status badges
- `Button` for actions

Colors are role-specific:
- Patient: Green (#4CAF50)
- Doctor: Blue (#2196F3)
- Clinic Owner: Orange (#FF9800)
- Receptionist: Purple (#9C27B0)
- Super Admin: Red (#F44336)

---

## Testing

### Test Role Switching:

```javascript
// In browser console:
import useRoleSwitcher from './hooks/useRoleSwitcher';

const { switchRole } = useRoleSwitcher();

// Switch to CLINIC_OWNER
await switchRole('CLINIC_OWNER');

// Check new token
const token = localStorage.getItem('accessToken');
console.log(JSON.parse(atob(token.split('.')[1]))); // Decode JWT
```

---

## Next Steps

1. ✅ Component created
2. ✅ Hook created
3. ⏳ Add to your header/navbar
4. ⏳ Update AuthStore with multi-role fields
5. ⏳ Update login API handler
6. ⏳ Test role switching
7. ⏳ Deploy to production

---

## Questions?

**Q: What happens when user switches role?**
A: New JWT token is generated with updated `activeRole`. Frontend should reload or update UI to show features for new role.

**Q: Can user switch to unapproved role?**
A: No. Component checks `roleApprovals` and only allows switching to VERIFIED roles.

**Q: Does role switching work offline?**
A: No. It requires API call to backend to generate new JWT token.

**Q: What if user has only one role?**
A: You should hide the role switcher button (check `availableRoles.length > 1`).

---

**Component is ready to use!** 🎉
