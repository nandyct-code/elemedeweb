
import { EmailTemplateType, NotificationLog, EmailTemplate } from '../types';
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
export const sendNotification = async (
  type: EmailTemplateType,
  recipient: string,
  data: Record<string, string>,
  triggerSource: string = 'System Rule'
) => {
  let templateSubject = `Notificación: ${type}`;
  let templateBody = JSON.stringify(data);

  // 1. Try to fetch real template from DB
  if (supabase) {
      const { data: dbTemplate } = await supabase
          .from('notification_templates')
          .select('*')
          .eq('type', type)
          .single();
      
      if (dbTemplate) {
          templateSubject = dbTemplate.subject;
          templateBody = dbTemplate.body;
      } else {
          // Fallback to constants if DB fetch fails or not found yet
          const localTemplate = MOCK_EMAIL_TEMPLATES.find(t => t.type === type);
          if (localTemplate) {
              templateSubject = localTemplate.subject;
              templateBody = localTemplate.body;
          }
      }
  } else {
      // Offline fallback
      const localTemplate = MOCK_EMAIL_TEMPLATES.find(t => t.type === type);
      if (localTemplate) {
          templateSubject = localTemplate.subject;
          templateBody = localTemplate.body;
      }
  }
  
  // 2. Process variables
  const finalSubject = processTemplate(templateSubject, data);
  const finalBody = processTemplate(templateBody, data);

  // 3. Log to DB (The "Sending" act)
  if (supabase) {
      const { error } = await supabase.from('notification_logs').insert([{
          recipient,
          template_type: type,
          subject_sent: finalSubject,
          status: 'sent', // In a real app with SendGrid, this would be 'queued' then updated
          trigger_source: triggerSource
      }]);
      
      if (error) console.error("Error logging notification:", error);
  }

  const logEntry: NotificationLog = {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toLocaleTimeString(),
    recipient: recipient,
    type: type,
    subject: finalSubject,
    status: 'sent',
    trigger: triggerSource
  };

  console.log(`[MAILER DB] Logged '${type}' to ${recipient}`);
  return logEntry;
};
