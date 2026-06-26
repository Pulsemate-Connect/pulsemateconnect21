# Adding Session Management to Clinic Owner Navigation

## Web Frontend Navigation Update

To make the Session Management page easily accessible to clinic owners, add a navigation link to the sidebar/menu.

### Location
Find the clinic owner navigation menu in the DashboardLayout component or sidebar component used for clinic owners.

### Suggested Navigation Item

```jsx
{
  name: 'Sessions',
  href: '/clinic/sessions',
  icon: /* ClockIcon or CalendarIcon */,
  description: 'Manage appointment sessions',
  roles: ['CLINIC_OWNER']
}
```

### Icon Suggestions (if using Heroicons)
- `ClockIcon` - Represents time-based sessions
- `CalendarDaysIcon` - Represents scheduling
- `RectangleGroupIcon` - Represents grouped time blocks

### Example Implementation

```jsx
<nav className="space-y-1">
  {/* Existing menu items */}
  <NavLink
    to="/clinic/dashboard"
    className={navLinkClass}
  >
    <HomeIcon className="w-5 h-5" />
    Dashboard
  </NavLink>
  
  <NavLink
    to="/clinic/profile"
    className={navLinkClass}
  >
    <BuildingOfficeIcon className="w-5 h-5" />
    Clinic Profile
  </NavLink>
  
  {/* NEW: Session Management */}
  <NavLink
    to="/clinic/sessions"
    className={navLinkClass}
  >
    <ClockIcon className="w-5 h-5" />
    Sessions
  </NavLink>
  
  <NavLink
    to="/clinic/doctors"
    className={navLinkClass}
  >
    <UserGroupIcon className="w-5 h-5" />
    Doctors
  </NavLink>
  
  {/* Other menu items */}
</nav>
```

### Placement Recommendation
Place the "Sessions" link between "Clinic Profile" and "Doctors" in the navigation menu, as it's a configuration-level feature.

### Mobile App Note
For the mobile app (React Native), sessions are automatically fetched and displayed in the BookingScreen. No additional navigation item needed.
