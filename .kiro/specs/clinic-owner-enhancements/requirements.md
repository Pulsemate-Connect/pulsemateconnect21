# Requirements Document

## Introduction

PulseMate Connect is a healthcare platform connecting patients with clinics and doctors. The clinic owner dashboard currently provides basic revenue tracking, clinic management, and quick access to key features. This enhancement aims to transform the dashboard into a comprehensive business intelligence tool that provides clinic owners with actionable insights, advanced analytics, real-time monitoring, and customizable reporting capabilities to make data-driven decisions and improve clinic operations.

## Glossary

- **Dashboard**: The main clinic owner interface displaying metrics, analytics, and quick actions
- **KPI**: Key Performance Indicator - a measurable value demonstrating clinic performance
- **Widget**: A modular dashboard component displaying specific data or functionality
- **Revenue_Tracker**: Component displaying financial metrics and payment analytics
- **Chart_Engine**: System rendering visual data representations (graphs, charts, trends)
- **Filter_System**: Component allowing users to narrow data by criteria (date, doctor, status)
- **Export_Service**: System generating downloadable reports in PDF or Excel format
- **Alert_Engine**: System analyzing data and generating actionable notifications
- **Comparison_Module**: Component showing period-over-period performance changes
- **Real_Time_Sync**: Socket.io-based live data synchronization system
- **Widget_Customizer**: Interface allowing users to show/hide and arrange dashboard widgets
- **Clinic_Owner**: User with role CLINIC_OWNER and approvalStatus VERIFIED
- **Metric_Card**: UI component displaying a single KPI value with icon and label
- **Transaction**: A payment record with method (CASH/ONLINE), amount, and timestamp
- **Appointment**: A scheduled or completed patient visit with doctor and payment status
- **Date_Range**: A start and end date defining a time period for data filtering
- **Session**: A time block when a doctor is available at a clinic
- **Patient_Visit**: A completed appointment with payment and clinical outcome
- **Staff_Member**: A doctor or receptionist associated with a clinic

## Requirements

### Requirement 1: Enhanced Metrics and KPIs

**User Story:** As a clinic owner, I want to see comprehensive performance metrics on my dashboard, so that I can understand my clinic's operational and financial health at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL display total patient count for the selected time period
2. THE Dashboard SHALL display new patient count (first-time visitors) for the selected time period
3. THE Dashboard SHALL display returning patient count for the selected time period
4. THE Dashboard SHALL display total appointment count for the selected time period
5. THE Dashboard SHALL display completed appointment count for the selected time period
6. THE Dashboard SHALL display cancelled appointment count for the selected time period
7. THE Dashboard SHALL display no-show appointment count for the selected time period
8. THE Dashboard SHALL display appointment completion rate as a percentage
9. THE Dashboard SHALL display average appointment duration in minutes
10. THE Dashboard SHALL display average wait time in minutes for completed appointments
11. THE Dashboard SHALL display active staff count (doctors and receptionists)
12. THE Dashboard SHALL display total doctor count
13. THE Dashboard SHALL display total receptionist count
14. THE Dashboard SHALL display staff utilization rate as a percentage
15. THE Dashboard SHALL display average daily appointment count
16. THE Dashboard SHALL display peak appointment hour
17. THE Dashboard SHALL display current month revenue growth rate as a percentage compared to previous month
18. THE Dashboard SHALL display current week patient growth rate as a percentage compared to previous week
19. WHEN a Clinic_Owner views metrics, THE Dashboard SHALL display each metric in a Metric_Card with icon, value, and label
20. WHEN metrics data is loading, THE Dashboard SHALL display skeleton loading states for each Metric_Card

### Requirement 2: Visual Analytics with Charts and Graphs

**User Story:** As a clinic owner, I want to see visual representations of my clinic data, so that I can quickly identify trends and patterns without analyzing raw numbers.

#### Acceptance Criteria

1. THE Chart_Engine SHALL render a revenue trend line chart showing daily revenue for the selected period
2. THE Chart_Engine SHALL render a revenue trend line chart showing weekly revenue for periods longer than 14 days
3. THE Chart_Engine SHALL render a revenue breakdown pie chart showing cash vs online payment proportions
4. THE Chart_Engine SHALL render an appointment status breakdown pie chart showing completed, cancelled, and no-show proportions
5. THE Chart_Engine SHALL render an appointments trend line chart showing daily appointment counts
6. THE Chart_Engine SHALL render a patient demographics bar chart showing age group distribution
7. THE Chart_Engine SHALL render a doctor performance bar chart showing appointments per doctor
8. THE Chart_Engine SHALL render a revenue by payment method bar chart comparing cash and online revenue
9. THE Chart_Engine SHALL render a peak hours heatmap showing appointment distribution by hour of day
10. THE Chart_Engine SHALL render a day of week bar chart showing appointment distribution across weekdays
11. WHEN a chart is loading, THE Chart_Engine SHALL display a loading spinner with chart skeleton
12. WHEN a chart has no data, THE Chart_Engine SHALL display an empty state message with an icon
13. WHEN a user hovers over a chart data point, THE Chart_Engine SHALL display a tooltip with detailed values
14. THE Chart_Engine SHALL use a consistent color scheme matching the PulseMate blue primary brand color
15. THE Chart_Engine SHALL render all charts responsive to screen size (mobile, tablet, desktop)
16. THE Chart_Engine SHALL use Recharts library for all chart rendering
17. WHEN a Clinic_Owner selects a different time period, THE Chart_Engine SHALL re-render all charts with updated data

### Requirement 3: Time Period Comparisons

**User Story:** As a clinic owner, I want to compare current performance against previous periods, so that I can understand if my clinic is growing or declining.

#### Acceptance Criteria

1. THE Comparison_Module SHALL calculate revenue difference between current period and previous equivalent period
2. THE Comparison_Module SHALL calculate percentage change between current period and previous equivalent period
3. THE Comparison_Module SHALL display percentage change as positive (green with up arrow) when current period is higher
4. THE Comparison_Module SHALL display percentage change as negative (red with down arrow) when current period is lower
5. THE Comparison_Module SHALL display percentage change as neutral (gray) when values are equal
6. WHEN period is "today", THE Comparison_Module SHALL compare against yesterday
7. WHEN period is "week", THE Comparison_Module SHALL compare against previous week (7 days prior)
8. WHEN period is "month", THE Comparison_Module SHALL compare against previous month (30 days prior)
9. THE Comparison_Module SHALL compare patient count between current and previous periods
10. THE Comparison_Module SHALL compare appointment count between current and previous periods
11. THE Comparison_Module SHALL compare completion rate between current and previous periods
12. THE Comparison_Module SHALL compare average revenue per appointment between current and previous periods
13. THE Comparison_Module SHALL display comparison data next to each relevant Metric_Card
14. THE Comparison_Module SHALL display comparison text as "vs. last [period]" (e.g., "vs. last week")
15. WHEN comparison data is loading, THE Comparison_Module SHALL display a subtle loading indicator
16. WHEN previous period has no data, THE Comparison_Module SHALL display "No previous data" instead of percentage
17. THE Comparison_Module SHALL calculate comparisons using completed appointments only, excluding cancelled and no-show

### Requirement 4: Advanced Filtering System

**User Story:** As a clinic owner, I want to filter dashboard data by various criteria, so that I can analyze specific segments of my clinic operations.

#### Acceptance Criteria

1. THE Filter_System SHALL provide a date range picker allowing custom start and end dates
2. THE Filter_System SHALL provide quick period buttons for Today, This Week, This Month, Last 7 Days, Last 30 Days, and All Time
3. THE Filter_System SHALL provide a doctor dropdown filter showing all doctors associated with the clinic
4. THE Filter_System SHALL provide a payment method filter with options: All, Cash, Online
5. THE Filter_System SHALL provide an appointment status filter with options: All, Completed, Cancelled, No-Show
6. WHEN a Clinic_Owner applies a date range filter, THE Dashboard SHALL refresh all metrics, charts, and data tables
7. WHEN a Clinic_Owner applies a doctor filter, THE Dashboard SHALL show only data for that specific doctor
8. WHEN a Clinic_Owner applies a payment method filter, THE Revenue_Tracker SHALL show only transactions matching that method
9. WHEN a Clinic_Owner applies an appointment status filter, THE Dashboard SHALL show only appointments matching that status
10. THE Filter_System SHALL allow multiple filters to be applied simultaneously
11. THE Filter_System SHALL display active filters with removable badges
12. THE Filter_System SHALL provide a "Clear All Filters" button when any filter is active
13. THE Filter_System SHALL persist filter selections in browser localStorage
14. WHEN a Clinic_Owner returns to the dashboard, THE Filter_System SHALL restore previously selected filters from localStorage
15. THE Filter_System SHALL display the count of results matching current filters
16. WHEN filters result in no data, THE Dashboard SHALL display an empty state message with suggestions
17. THE Filter_System SHALL disable invalid date range selections (end date before start date)
18. THE Filter_System SHALL validate that custom date ranges do not exceed 1 year
19. WHEN a filter is loading data, THE Filter_System SHALL display a loading indicator on the apply button

### Requirement 5: Alerts and Actionable Insights

**User Story:** As a clinic owner, I want to receive intelligent alerts and insights about my clinic operations, so that I can take action on important trends and issues.

#### Acceptance Criteria

1. THE Alert_Engine SHALL analyze dashboard data and generate actionable alerts
2. THE Alert_Engine SHALL display alerts in a dedicated "Insights" widget at the top of the dashboard
3. WHEN revenue drops by more than 20% compared to previous period, THE Alert_Engine SHALL generate a "Revenue Drop" alert with severity HIGH
4. WHEN appointment cancellation rate exceeds 15%, THE Alert_Engine SHALL generate a "High Cancellation Rate" alert with severity MEDIUM
5. WHEN no-show rate exceeds 10%, THE Alert_Engine SHALL generate a "High No-Show Rate" alert with severity MEDIUM
6. WHEN average wait time exceeds 30 minutes, THE Alert_Engine SHALL generate a "Long Wait Times" alert with severity HIGH
7. WHEN appointment completion rate falls below 75%, THE Alert_Engine SHALL generate a "Low Completion Rate" alert with severity MEDIUM
8. WHEN a doctor has zero appointments in the current week, THE Alert_Engine SHALL generate an "Inactive Doctor" alert with severity LOW
9. WHEN revenue growth exceeds 25% compared to previous period, THE Alert_Engine SHALL generate a "Strong Growth" alert with severity POSITIVE
10. WHEN patient count increases by more than 30% compared to previous period, THE Alert_Engine SHALL generate a "Patient Growth" alert with severity POSITIVE
11. WHEN there are no active doctors for today's sessions, THE Alert_Engine SHALL generate a "No Doctors Available" alert with severity HIGH
12. THE Alert_Engine SHALL display up to 5 most important alerts based on severity ranking
13. THE Alert_Engine SHALL display alert severity with color coding: HIGH (red), MEDIUM (orange), LOW (yellow), POSITIVE (green)
14. THE Alert_Engine SHALL provide a dismiss button for each alert
15. WHEN a Clinic_Owner dismisses an alert, THE Alert_Engine SHALL hide it for 24 hours
16. THE Alert_Engine SHALL display an icon and title for each alert type
17. THE Alert_Engine SHALL display a brief description and suggested action for each alert
18. THE Alert_Engine SHALL provide a "View Details" link navigating to the relevant section (e.g., appointments page for cancellation alerts)
19. WHEN no alerts are present, THE Alert_Engine SHALL display an "All Good" message with a positive icon
20. THE Alert_Engine SHALL re-calculate alerts whenever dashboard data is refreshed

### Requirement 6: Export and Download Reports

**User Story:** As a clinic owner, I want to export dashboard data and reports, so that I can share financial information with accountants or analyze data offline.

#### Acceptance Criteria

1. THE Export_Service SHALL provide an "Export" button in the dashboard header
2. THE Export_Service SHALL provide export format options: PDF and Excel (XLSX)
3. WHEN a Clinic_Owner clicks "Export as PDF", THE Export_Service SHALL generate a PDF report containing all visible dashboard data
4. WHEN a Clinic_Owner clicks "Export as Excel", THE Export_Service SHALL generate an XLSX file containing all visible dashboard data
5. THE Export_Service SHALL include clinic name, address, and logo in PDF reports
6. THE Export_Service SHALL include report generation date and time in exports
7. THE Export_Service SHALL include applied filters description in exports (e.g., "Data for: Last 30 Days, Doctor: Dr. Smith")
8. THE Export_Service SHALL include all visible metrics in the export (revenue, patients, appointments, staff stats)
9. THE Export_Service SHALL include revenue breakdown table (by doctor, by payment method) in exports
10. THE Export_Service SHALL include recent transactions table in exports
11. THE Export_Service SHALL include appointment statistics table in exports
12. THE Export_Service SHALL embed chart images in PDF exports
13. THE Export_Service SHALL create separate Excel sheets for: Summary, Revenue, Appointments, Transactions
14. THE Export_Service SHALL format currency values with INR symbol and proper number formatting in exports
15. THE Export_Service SHALL format dates consistently in DD-MM-YYYY format in exports
16. WHEN export is in progress, THE Export_Service SHALL display a loading spinner with "Generating report..." message
17. WHEN export is complete, THE Export_Service SHALL trigger browser download automatically
18. WHEN export fails, THE Export_Service SHALL display an error toast notification with retry option
19. THE Export_Service SHALL use jsPDF library for PDF generation
20. THE Export_Service SHALL use xlsx (SheetJS) library for Excel generation
21. THE Export_Service SHALL limit exports to 1000 transactions maximum, with a warning message if data is truncated

### Requirement 7: Customizable Dashboard Widgets

**User Story:** As a clinic owner, I want to customize which widgets appear on my dashboard, so that I can focus on the metrics and information most relevant to my clinic.

#### Acceptance Criteria

1. THE Widget_Customizer SHALL provide a "Customize Dashboard" button in the dashboard header
2. WHEN a Clinic_Owner clicks "Customize Dashboard", THE Widget_Customizer SHALL open a customization modal
3. THE Widget_Customizer SHALL display a list of all available widgets with checkboxes
4. THE Widget_Customizer SHALL provide widget options: Revenue Metrics, Patient Metrics, Appointment Metrics, Staff Metrics, Revenue Chart, Appointment Chart, Revenue by Doctor, Recent Transactions, Alerts & Insights, Quick Actions
5. THE Widget_Customizer SHALL display each widget with a preview thumbnail and description
6. WHEN a Clinic_Owner unchecks a widget, THE Dashboard SHALL hide that widget
7. WHEN a Clinic_Owner checks a widget, THE Dashboard SHALL show that widget
8. THE Widget_Customizer SHALL provide drag-and-drop functionality to reorder widgets
9. THE Widget_Customizer SHALL save widget preferences to the backend API
10. THE Widget_Customizer SHALL save widget preferences associated with the Clinic_Owner user ID
11. WHEN a Clinic_Owner logs in, THE Dashboard SHALL load and apply their saved widget preferences
12. THE Widget_Customizer SHALL provide a "Reset to Default" button restoring original widget layout
13. THE Widget_Customizer SHALL provide a "Save" button committing customization changes
14. THE Widget_Customizer SHALL provide a "Cancel" button discarding uncommitted changes
15. WHEN widget preferences are saving, THE Widget_Customizer SHALL display a loading state on the Save button
16. WHEN widget preferences save successfully, THE Widget_Customizer SHALL display a success toast notification
17. WHEN widget preferences fail to save, THE Widget_Customizer SHALL display an error toast notification
18. THE Widget_Customizer SHALL ensure at least one widget remains visible (prevent hiding all widgets)
19. THE Dashboard SHALL animate widget transitions when showing, hiding, or reordering
20. THE Widget_Customizer SHALL be responsive and work on mobile, tablet, and desktop devices

### Requirement 8: Real-Time Dashboard Updates

**User Story:** As a clinic owner, I want the dashboard to update automatically with live data, so that I always see current information without manually refreshing.

#### Acceptance Criteria

1. THE Real_Time_Sync SHALL establish a Socket.io connection when the Dashboard loads
2. THE Real_Time_Sync SHALL join a room named "clinic-{clinicId}" for clinic-specific updates
3. WHEN a new appointment is created for the clinic, THE Real_Time_Sync SHALL receive a "new-appointment" event
4. WHEN a new appointment is received, THE Dashboard SHALL increment the appointment count metric
5. WHEN a new appointment is received, THE Dashboard SHALL refresh the appointments chart
6. WHEN an appointment status changes to COMPLETED, THE Real_Time_Sync SHALL receive an "appointment-completed" event
7. WHEN an appointment is completed, THE Dashboard SHALL increment the completed appointment count
8. WHEN an appointment is completed, THE Dashboard SHALL update the completion rate percentage
9. WHEN a payment is recorded, THE Real_Time_Sync SHALL receive a "new-payment" event
10. WHEN a new payment is received, THE Dashboard SHALL update the revenue metrics (total, cash, online)
11. WHEN a new payment is received, THE Dashboard SHALL add the transaction to the recent transactions table
12. WHEN a new payment is received, THE Dashboard SHALL refresh the revenue chart
13. WHEN a patient joins the queue, THE Real_Time_Sync SHALL receive a "queue-updated" event
14. WHEN queue is updated, THE Dashboard SHALL update the current queue length metric (if widget is visible)
15. THE Real_Time_Sync SHALL display a connection status indicator (connected/disconnected)
16. WHEN Socket.io connection is lost, THE Real_Time_Sync SHALL display a "Reconnecting..." message
17. WHEN Socket.io connection is restored, THE Real_Time_Sync SHALL display a "Connected" confirmation
18. THE Real_Time_Sync SHALL automatically attempt to reconnect with exponential backoff when disconnected
19. THE Real_Time_Sync SHALL disconnect the socket when the Clinic_Owner navigates away from the dashboard
20. THE Real_Time_Sync SHALL animate metric updates with a subtle highlight effect when values change
21. THE Real_Time_Sync SHALL throttle chart updates to maximum once per 5 seconds to prevent excessive re-renders
22. WHEN real-time data conflicts with currently applied filters, THE Dashboard SHALL only update if data matches active filters

### Requirement 9: Mobile Responsive Dashboard

**User Story:** As a clinic owner, I want to access the enhanced dashboard on my mobile device, so that I can monitor my clinic while away from my computer.

#### Acceptance Criteria

1. THE Dashboard SHALL render all widgets in a single-column layout on mobile devices (viewport width < 768px)
2. THE Dashboard SHALL render widgets in a two-column grid on tablet devices (viewport width 768px - 1024px)
3. THE Dashboard SHALL render widgets in a three-column grid on desktop devices (viewport width > 1024px)
4. THE Dashboard SHALL make all charts responsive and readable on mobile screens
5. THE Filter_System SHALL collapse into a slide-out drawer on mobile devices
6. THE Filter_System SHALL provide a "Filters" button opening the drawer on mobile
7. THE Export_Service SHALL adapt export button to an icon-only button on mobile to save space
8. THE Widget_Customizer SHALL provide a mobile-optimized interface with vertical scrolling
9. THE Metric_Card SHALL use smaller font sizes on mobile while maintaining readability
10. THE Dashboard SHALL use horizontal scrolling for the recent transactions table on mobile when needed
11. THE Dashboard SHALL display abbreviated labels on mobile (e.g., "Appts" instead of "Appointments")
12. THE Chart_Engine SHALL hide chart legends on mobile and display them in tooltips instead
13. THE Alert_Engine SHALL display alerts as a vertical list on mobile instead of horizontal cards
14. THE Dashboard SHALL load critical widgets first on mobile for faster perceived performance
15. THE Dashboard SHALL use touch-friendly tap targets (minimum 44x44px) on mobile
16. THE Dashboard SHALL prevent horizontal scrolling of the main dashboard container on all devices

### Requirement 10: Performance and Optimization

**User Story:** As a clinic owner, I want the enhanced dashboard to load quickly and perform smoothly, so that I can access information without delays.

#### Acceptance Criteria

1. THE Dashboard SHALL load and display initial metrics within 2 seconds on a standard 4G connection
2. THE Dashboard SHALL display skeleton loading states while fetching data
3. THE Dashboard SHALL implement lazy loading for chart components below the fold
4. THE Dashboard SHALL cache dashboard data in memory for 30 seconds to reduce redundant API calls
5. THE Dashboard SHALL debounce filter changes by 500ms before triggering data refresh
6. THE Dashboard SHALL use React.memo for Metric_Card components to prevent unnecessary re-renders
7. THE Dashboard SHALL use React.useMemo for expensive calculations (percentages, aggregations)
8. THE Dashboard SHALL paginate the recent transactions table (20 transactions per page)
9. THE Dashboard SHALL implement virtual scrolling for transaction lists exceeding 100 items
10. THE Dashboard SHALL compress API responses using gzip compression
11. THE Backend SHALL create a database index on appointment.clinicId and appointment.createdAt for faster queries
12. THE Backend SHALL create a database index on payment.clinicId and payment.paidAt for faster revenue queries
13. THE Backend SHALL implement query result caching with Redis for frequently accessed dashboard data
14. THE Backend SHALL set cache TTL to 60 seconds for dashboard aggregate queries
15. THE Dashboard SHALL implement error boundaries to prevent entire dashboard crash on widget errors
16. THE Dashboard SHALL log performance metrics (load time, API response time) to analytics
17. THE Dashboard SHALL display a warning when API response time exceeds 3 seconds
18. THE Backend SHALL optimize database queries using Prisma query optimization (select only required fields)
19. THE Backend SHALL use database transactions for multi-table aggregate queries to ensure consistency
20. THE Dashboard SHALL prefetch next page of transactions when user scrolls to 80% of current page
