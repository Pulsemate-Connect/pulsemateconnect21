-- ============================================================================
-- NOTIFICATION SYSTEM MIGRATION
-- Complete notification system with scheduling, retries, and delivery tracking
-- ============================================================================

-- ── Notification Table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    sent_at TIMESTAMP,
    delivery_status VARCHAR(50) DEFAULT 'PENDING',
    fcm_message_id VARCHAR(255),
    error_message TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    scheduled_for TIMESTAMP,
    expires_at TIMESTAMP,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_notifications_delivery_status ON notifications(delivery_status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON notifications(reference_type, reference_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_pending_delivery ON notifications(delivery_status, scheduled_for) WHERE delivery_status IN ('PENDING', 'RETRY');

-- ── Notification Templates ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) UNIQUE NOT NULL,
    title_template VARCHAR(255) NOT NULL,
    body_template TEXT NOT NULL,
    default_priority VARCHAR(20) DEFAULT 'NORMAL',
    icon VARCHAR(50),
    sound VARCHAR(50),
    variables JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ── Notification Preferences ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    appointment_reminders BOOLEAN DEFAULT TRUE,
    queue_updates BOOLEAN DEFAULT TRUE,
    prescription_alerts BOOLEAN DEFAULT TRUE,
    payment_alerts BOOLEAN DEFAULT TRUE,
    marketing_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start VARCHAR(5),
    quiet_hours_end VARCHAR(5),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Scheduled Notifications (Reminders) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL,
    reminder_type VARCHAR(50) NOT NULL,
    scheduled_for TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    sent_at TIMESTAMP,
    notification_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE SET NULL,
    UNIQUE(appointment_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_appointment ON scheduled_notifications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status) WHERE status = 'PENDING';

-- ── Notification Delivery Log ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_delivery_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL,
    attempt_number INT NOT NULL,
    delivery_channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    fcm_message_id VARCHAR(255),
    error_message TEXT,
    device_token VARCHAR(500),
    sent_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_delivery_log_notification ON notification_delivery_log(notification_id);
CREATE INDEX IF NOT EXISTS idx_delivery_log_status ON notification_delivery_log(status);

-- ── Admin Broadcast Notifications ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS broadcast_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    target_audience VARCHAR(50) DEFAULT 'ALL',
    target_filter JSONB,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    created_by_admin_id UUID,
    scheduled_for TIMESTAMP,
    status VARCHAR(20) DEFAULT 'DRAFT',
    sent_count INT DEFAULT 0,
    total_targets INT DEFAULT 0,
    sent_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (created_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_broadcast_status ON broadcast_notifications(status);
CREATE INDEX IF NOT EXISTS idx_broadcast_scheduled ON broadcast_notifications(scheduled_for);

-- ── Insert Default Templates ─────────────────────────────────────────────────
INSERT INTO notification_templates (type, title_template, body_template, default_priority, icon, variables) VALUES
('APPOINTMENT_BOOKED', '✅ Appointment Confirmed', 'Your appointment with Dr. {doctorName} has been confirmed for {date} at {time}.', 'NORMAL', '✅', '["doctorName", "date", "time"]'),
('APPOINTMENT_REMINDER_24H', '📅 Appointment Tomorrow', 'Reminder! You have an appointment tomorrow with Dr. {doctorName} at {time}.', 'NORMAL', '📅', '["doctorName", "time"]'),
('APPOINTMENT_REMINDER_2H', '⏰ Appointment in 2 Hours', 'Don''t forget! Your appointment with Dr. {doctorName} starts in 2 hours.', 'HIGH', '⏰', '["doctorName"]'),
('APPOINTMENT_REMINDER_30M', '🚗 Time to Leave', 'Your appointment with Dr. {doctorName} starts in 30 minutes. Time to head to the clinic!', 'HIGH', '🚗', '["doctorName"]'),
('QUEUE_UPDATE', '👥 Queue Updated', 'There are {patientsAhead} patients before you. Estimated wait: {waitTime} minutes.', 'NORMAL', '👥', '["patientsAhead", "waitTime"]'),
('QUEUE_ALMOST_YOUR_TURN', '🔔 You''re Next!', 'Please be ready. You''re next in line for consultation with Dr. {doctorName}.', 'HIGH', '🔔', '["doctorName"]'),
('QUEUE_YOUR_TURN', '🩺 Your Turn', 'Please proceed to Dr. {doctorName}''s consultation room. Your consultation is starting now.', 'URGENT', '🩺', '["doctorName"]'),
('APPOINTMENT_CANCELLED', '❌ Appointment Cancelled', 'Your appointment with Dr. {doctorName} on {date} has been cancelled.', 'HIGH', '❌', '["doctorName", "date"]'),
('APPOINTMENT_RESCHEDULED', '📆 Appointment Rescheduled', 'Your appointment has been moved to {newDate} at {newTime}.', 'HIGH', '📆', '["newDate", "newTime"]'),
('PAYMENT_SUCCESS', '💳 Payment Successful', 'Your booking payment of ₹{amount} has been received successfully.', 'NORMAL', '💳', '["amount"]'),
('PRESCRIPTION_READY', '📄 Prescription Available', 'Your prescription from Dr. {doctorName} is now available. Tap to view.', 'NORMAL', '📄', '["doctorName"]'),
('FOLLOW_UP_REMINDER', '❤️ Time for Your Follow-up', 'Dr. {doctorName} recommended a follow-up. Book your appointment today.', 'NORMAL', '❤️', '["doctorName"]'),
('DOCTOR_NEW_APPOINTMENT', '📅 New Appointment Booked', '{patientName} booked an appointment for {date} at {time}.', 'NORMAL', '📅', '["patientName", "date", "time"]'),
('DOCTOR_APPOINTMENT_CANCELLED', '❌ Appointment Cancelled', '{patientName}''s appointment on {date} has been cancelled.', 'NORMAL', '❌', '["patientName", "date"]'),
('DOCTOR_PATIENT_CHECKED_IN', '👋 Patient Checked In', '{patientName} has checked in and is waiting in the queue.', 'NORMAL', '👋', '["patientName"]'),
('DOCTOR_PRESCRIPTION_VIEWED', '👁️ Prescription Viewed', '{patientName} viewed their prescription.', 'LOW', '👁️', '["patientName"]'),
('RECEPTIONIST_PATIENT_ARRIVED', '🚶 Patient Arrived', '{patientName} has arrived at the clinic.', 'NORMAL', '🚶', '["patientName"]'),
('RECEPTIONIST_WALK_IN_ADDED', '🔔 Walk-in Patient Added', 'A walk-in patient has been added to the queue.', 'NORMAL', '🔔', '[]'),
('OWNER_DAILY_SUMMARY', '📊 Daily Summary', 'Today: {appointments} appointments, ₹{revenue} revenue, {patients} patients.', 'LOW', '📊', '["appointments", "revenue", "patients"]'),
('OWNER_HIGH_QUEUE', '⚠️ High Queue Alert', 'Queue for Dr. {doctorName} has {count} patients waiting.', 'HIGH', '⚠️', '["doctorName", "count"]'),
('ADMIN_EMERGENCY', '🚨 Emergency Notice', '{message}', 'URGENT', '🚨', '["message"]')
ON CONFLICT (type) DO NOTHING;

-- ── Functions ────────────────────────────────────────────────────────────────

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_timestamp
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_timestamp();

CREATE TRIGGER update_notification_templates_timestamp
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_timestamp();

CREATE TRIGGER update_notification_preferences_timestamp
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_timestamp();

CREATE TRIGGER update_broadcast_notifications_timestamp
    BEFORE UPDATE ON broadcast_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_timestamp();

-- Auto-create notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_notification_preferences
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

COMMENT ON TABLE notifications IS 'Central notification table storing all user notifications with delivery tracking';
COMMENT ON TABLE notification_templates IS 'Reusable notification templates with variable substitution';
COMMENT ON TABLE notification_preferences IS 'User notification preferences and quiet hours';
COMMENT ON TABLE scheduled_notifications IS 'Scheduled appointment reminders';
COMMENT ON TABLE notification_delivery_log IS 'Detailed delivery attempt tracking for debugging';
COMMENT ON TABLE broadcast_notifications IS 'Admin-created broadcast messages';
