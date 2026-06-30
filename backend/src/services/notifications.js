const db = require('../config/database');

// Check config each time (not just at module load)
function isEmailConfigured() {
  return !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function isSmsConfigured() {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
}

function isSimulationMode() {
  return !(isEmailConfigured() || isSmsConfigured());
}

// Debug logs on startup
console.log('\n📋 Notification Service Configuration:');
console.log(`   - Email configured?`, isEmailConfigured() ? '✅ Yes' : '❌ No');
console.log(`   - SMS configured?`, isSmsConfigured() ? '✅ Yes' : '❌ No');
console.log(`   - Simulation mode?`, isSimulationMode() ? '✅ Active' : '❌ Disabled');
if (isSmsConfigured()) {
  console.log(`   - Twilio From: ${process.env.TWILIO_FROM_NUMBER}`);
}
console.log('');


/**
 * Send email notification
 */
async function sendEmail(to, subject, content) {
  if (isSimulationMode() || !isEmailConfigured()) {
    console.log(`📧 [SIMULATED] Email sent to ${to}: ${subject}`);
    console.log(`   Content: ${content.substring(0, 100)}...`);
    return { success: true, simulated: true };
  }

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"ECG Platform" <noreply@ecgplatform.cm>',
      to: to,
      subject: subject,
      html: content
    });

    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send SMS notification
 */
async function sendSMS(to, content) {
  console.log(`\n📱 Attempting to send SMS...`);
  console.log(`   To: ${to}`);
  console.log(`   Simulation mode: ${isSimulationMode()}`);
  console.log(`   SMS configured: ${isSmsConfigured()}`);
  
  if (isSimulationMode() || !isSmsConfigured()) {
    console.log(`📱 [SIMULATED] SMS would be sent to ${to}: ${content.substring(0, 50)}...`);
    return { success: true, simulated: true };
  }

  try {
    console.log(`   Loading twilio library...`);
    const twilio = require('twilio');
    
    console.log(`   Creating Twilio client...`);
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    console.log(`   Sending message via Twilio...`);
    const message = await client.messages.create({
      body: content,
      from: process.env.TWILIO_FROM_NUMBER,
      to: to
    });

    console.log(`✅ SMS sent successfully!`);
    console.log(`   To: ${to}`);
    console.log(`   SID: ${message.sid}`);
    console.log(`   Status: ${message.status}`);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('❌ Error sending SMS:');
    console.error(`   Code: ${error.code}`);
    console.error(`   Message: ${error.message}`);
    console.error(`   More info: ${error.moreInfo}`);
    return { success: false, error: error.message };
  }
}

/**
 * Send notifications to patient when an alert occurs
 */
async function sendPatientAlertNotifications(patientId, alertData) {
  console.log(`\n🔔 sendPatientAlertNotifications called for patient ID: ${patientId}`);
  
  const patient = db.findById('patients', patientId);
  if (!patient) {
    console.error('❌ Patient not found!');
    return { success: false, error: 'Patient not found' };
  }

  console.log(`   Patient found: ${patient.first_name} ${patient.last_name}`);
  console.log(`   Patient phone: ${patient.phone || 'NOT SET'}`);

  const user = db.findById('users', patient.user_id);
  let settings = db.findOne('settings', { user_id: patient.user_id });
  
  // Create default settings if not found
  if (!settings) {
    console.log('   Creating default settings for patient...');
    settings = db.insert('settings', {
      user_id: patient.user_id,
      email_notifications: true,
      sms_notifications: true,
      dark_mode: false,
      language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  console.log(`   SMS notifications enabled: ${settings?.sms_notifications !== false}`);

  const results = { email: null, sms: null };

  // Get patient's doctor info
  let doctorName = 'your doctor';
  if (patient.doctor_id) {
    const doctor = db.findById('doctors', patient.doctor_id);
    if (doctor) {
      const doctorUser = db.findById('users', doctor.user_id);
      doctorName = doctorUser ? `Dr. ${doctorUser.last_name}` : 'your doctor';
    }
  }

  const alertMessage = `⚠️ High Cardiovascular Risk Detected: ${alertData.rhythm_class} (Risk Score: ${alertData.cvd_risk_score}/100). ${doctorName} has been notified. Please contact your doctor immediately.`;

  // Send email if enabled
  if (user?.email && settings?.email_notifications !== false) {
    console.log(`   Sending email to ${user.email}...`);
    try {
      results.email = await sendEmail(
        user.email,
        '⚠️ High Cardiovascular Risk Alert',
        `
          <h2>High Risk Alert</h2>
          <p>Dear ${patient.first_name},</p>
          <p>Your recent ECG has detected a potential cardiovascular health issue:</p>
          <ul>
            <li><strong>Rhythm:</strong> ${alertData.rhythm_class}</li>
            <li><strong>Risk Score:</strong> ${alertData.cvd_risk_score}/100</li>
            <li><strong>Risk Level:</strong> ${alertData.risk_level}</li>
          </ul>
          <p>${doctorName} has been notified and will be reviewing your results.</p>
          <p><strong>Please contact your doctor immediately to discuss these results.</strong></p>
          <hr>
          <p style="color: #666; font-size: 12px;">This is an automated message. Do not reply.</p>
        `
      );
      console.log(`   Email result:`, results.email);
    } catch (error) {
      console.error('❌ Error sending email:', error);
      results.email = { success: false, error: error.message };
    }
  }

  // Send SMS if enabled
  if (patient.phone && settings?.sms_notifications !== false) {
    console.log(`   Sending SMS to ${patient.phone}...`);
    try {
      results.sms = await sendSMS(patient.phone, alertMessage);
      console.log(`   SMS result:`, results.sms);
    } catch (error) {
      console.error('❌ Error sending SMS:', error);
      results.sms = { success: false, error: error.message };
    }
  } else {
    console.log(`   SMS NOT sent:`, !patient.phone ? 'No phone number' : 'SMS notifications disabled');
  }

  console.log(`\n✅ Notification process complete`);
  return { success: true, results };
}

module.exports = { sendEmail, sendSMS, sendPatientAlertNotifications };
