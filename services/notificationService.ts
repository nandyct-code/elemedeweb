
import { EmailTemplateType, NotificationLog } from '../types';
import { MOCK_EMAIL_TEMPLATES } from '../constants';
import { supabase } from './supabase';

// Helper to replace variables in template body
const processTemplate = (templateBody: string, data: Record<string, string>) => {
  let processed = templateBody;
  Object.keys(data).forEach(key => {
    // Replace {{variable}} globally
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, data[key]);
  });
  return processed;
};

// --- REAL DB SERVICE ---

// Fetch logs from DB
export const getNotificationLogs = async (): Promise<NotificationLog[]> => {
    if (!supabase) return [];
    
    const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error("Error fetching logs:", error);
        return [];
    }

    return data.map((log: any) => ({
        id: log.id,
        timestamp: new Date(log.created_at).toLocaleTimeString(),
        recipient: log.recipient,
        type: log.template_type as EmailTemplateType,
        subject: log.subject_sent,
        status: log.status,
        trigger: log.trigger_source
    }));
};

// Main function to trigger an email (Persists to DB)
// NOTE: In Supabase, you should set up a Database Trigger or Edge Function
// that listens to INSERTs on 'notification_logs' and actually sends the email via Resend/SendGrid.
export const sendNotification = async (
  type: EmailTemplateType,
  recipient: string,
  data: Record<string, string>,
  triggerSource: string = 'System Rule'
) => {
  let templateSubject = `Notificación: ${type}`;
  let templateBody = JSON.stringify(data);

  // 1. Resolve Template (Mock or DB if you implemented a templates table)
  // For production speed, we use constants, but you can fetch from 'email_templates' table.
  const localTemplate = MOCK_EMAIL_TEMPLATES.find(t => t.type === type);
  if (localTemplate) {
      templateSubject = localTemplate.subject;
      templateBody = localTemplate.body;
  }
  
  // 2. Process variables
  const finalSubject = processTemplate(templateSubject, data);

  // 3. Log to DB (The "Sending" act trigger)
  if (supabase) {
      const { error } = await supabase.from('notification_logs').insert([{
          recipient,
          template_type: type,
          subject_sent: finalSubject,
          status: 'queued', // 'queued' tells the backend worker to pick this up
          trigger_source: triggerSource
      }]);
      
      if (error) {
          console.error("Error logging notification:", error);
      } else {
          console.log(`[MAILER DB] Queued '${type}' to ${recipient}`);
      }
  } else {
      console.warn("[MAILER] Supabase offline. Email not queued.");
  }

  // Return a mock log entry for immediate UI feedback if needed
  const logEntry: NotificationLog = {
    id: 'temp_' + Date.now(),
    timestamp: new Date().toLocaleTimeString(),
    recipient: recipient,
    type: type,
    subject: finalSubject,
    status: 'queued',
    trigger: triggerSource
  };

  return logEntry;
};
