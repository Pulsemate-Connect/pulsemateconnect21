import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  List, 
  ListItem, 
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Radio,
  Chip,
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Person as PatientIcon,
  LocalHospital as DoctorIcon,
  Business as ClinicOwnerIcon,
  ReceiptLong as ReceptionistIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';

/**
 * Role Selector Component
 * 
 * Displays user's available roles and allows switching between them
 * 
 * Props:
 * - open: boolean - Whether dialog is open
 * - onClose: function - Called when dialog closes
 * - currentRole: string - Current active role
 * - availableRoles: array - All roles user has
 * - roleApprovals: array - Approval status for each role
 * - onSwitchRole: function(newRole) - Called when user selects a role
 * - loading: boolean - Whether role switch is in progress
 */
const RoleSelector = ({
  open,
  onClose,
  currentRole,
  availableRoles = [],
  roleApprovals = [],
  onSwitchRole,
  loading = false,
}) => {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [error, setError] = useState(null);

  // Role configuration
  const roleConfig = {
    PATIENT: {
      label: 'Patient',
      icon: <PatientIcon />,
      color: '#4CAF50',
      description: 'Book appointments, view medical records',
    },
    DOCTOR: {
      label: 'Doctor',
      icon: <DoctorIcon />,
      color: '#2196F3',
      description: 'Manage patients, appointments, and consultations',
    },
    CLINIC_OWNER: {
      label: 'Clinic Owner',
      icon: <ClinicOwnerIcon />,
      color: '#FF9800',
      description: 'Manage clinic, staff, and operations',
    },
    RECEPTIONIST: {
      label: 'Receptionist',
      icon: <ReceptionistIcon />,
      color: '#9C27B0',
      description: 'Manage appointments and patient check-ins',
    },
    SUPER_ADMIN: {
      label: 'Super Admin',
      icon: <AdminIcon />,
      color: '#F44336',
      description: 'Full system administration access',
    },
  };

  // Get approval status for a role
  const getRoleApprovalStatus = (role) => {
    const approval = roleApprovals.find(a => a.role === role);
    return approval?.approvalStatus || 'UNKNOWN';
  };

  // Check if role can be selected
  const canSelectRole = (role) => {
    const status = getRoleApprovalStatus(role);
    return status === 'VERIFIED';
  };

  // Get status chip for role
  const getStatusChip = (role) => {
    const status = getRoleApprovalStatus(role);
    
    const statusConfig = {
      VERIFIED: { label: 'Active', color: 'success' },
      PENDING: { label: 'Pending Approval', color: 'warning' },
      UNDER_REVIEW: { label: 'Under Review', color: 'info' },
      REJECTED: { label: 'Rejected', color: 'error' },
      CHANGES_REQUIRED: { label: 'Changes Required', color: 'warning' },
    };

    const config = statusConfig[status] || { label: status, color: 'default' };
    
    return (
      <Chip 
        label={config.label} 
        color={config.color} 
        size="small"
        sx={{ ml: 1 }}
      />
    );
  };

  // Handle role selection
  const handleRoleClick = (role) => {
    if (canSelectRole(role)) {
      setSelectedRole(role);
      setError(null);
    }
  };

  // Handle confirm button
  const handleConfirm = async () => {
    if (selectedRole === currentRole) {
      onClose();
      return;
    }

    if (!canSelectRole(selectedRole)) {
      setError(`Cannot switch to ${roleConfig[selectedRole]?.label || selectedRole}. Role is not verified.`);
      return;
    }

    try {
      setError(null);
      await onSwitchRole(selectedRole);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to switch role. Please try again.');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1,
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div" fontWeight="600">
          Select Your Role
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Choose which role you want to use right now
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <List sx={{ pt: 0 }}>
          {availableRoles.map((role) => {
            const config = roleConfig[role] || {
              label: role,
              icon: <PatientIcon />,
              color: '#757575',
              description: 'Role description',
            };

            const isSelected = selectedRole === role;
            const isCurrent = currentRole === role;
            const isEnabled = canSelectRole(role);
            const status = getRoleApprovalStatus(role);

            return (
              <ListItem 
                key={role} 
                disablePadding
                sx={{ mb: 1 }}
              >
                <ListItemButton
                  onClick={() => handleRoleClick(role)}
                  disabled={!isEnabled || loading}
                  selected={isSelected}
                  sx={{
                    borderRadius: 2,
                    border: isSelected ? `2px solid ${config.color}` : '1px solid #e0e0e0',
                    '&.Mui-selected': {
                      backgroundColor: `${config.color}10`,
                    },
                    '&.Mui-disabled': {
                      opacity: 0.5,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box
                      sx={{
                        color: isEnabled ? config.color : '#9e9e9e',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {config.icon}
                    </Box>
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="500">
                          {config.label}
                        </Typography>
                        {isCurrent && (
                          <Chip 
                            label="Current" 
                            size="small" 
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                        {getStatusChip(role)}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {config.description}
                        </Typography>
                        {!isEnabled && status === 'PENDING' && (
                          <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                            ⏳ Waiting for admin approval
                          </Typography>
                        )}
                        {!isEnabled && status === 'REJECTED' && (
                          <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>
                            ❌ This role was rejected
                          </Typography>
                        )}
                      </>
                    }
                  />

                  <Radio
                    checked={isSelected}
                    disabled={!isEnabled}
                    sx={{
                      color: config.color,
                      '&.Mui-checked': {
                        color: config.color,
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            onClick={onClose}
            fullWidth
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            fullWidth
            disabled={loading || selectedRole === currentRole}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Switching...' : selectedRole === currentRole ? 'Current Role' : 'Switch Role'}
          </Button>
        </Box>

        {selectedRole !== currentRole && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Switching to <strong>{roleConfig[selectedRole]?.label || selectedRole}</strong> will reload your dashboard with different permissions and features.
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelector;
