
import { EmailTemplateType, NotificationLog } from '../types';
import { MOCK_EMAIL_TEMPLATES } from '../constants';

// In-memory store for notification logs (for demo purposes)
export const notificationLogs: NotificationLog[] = [];

// Helper to replace variables in template body
const processTemplate = (templateBody: string, data: Record<string, string>) => {
  let processed = templateBody;
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, data[key]);
  });
  return processed;
};

// Main function to trigger an email
export const sendNotification = (
  type: EmailTemplateType,
  recipient: string,
  data: Record<string, string>,
  triggerSource: string = 'System Rule'
) => {
  // Find the template
  const template = MOCK_EMAIL_TEMPLATES.find(t => t.type === type);
  
  // Default fallback if specific template not found (though constants.ts should cover it)
  const finalSubject = template ? processTemplate(template.subject, data) : `Notificación: ${type}`;
  const finalBody = template ? processTemplate(template.body, data) : JSON.stringify(data);

  // Simulate network delay and logging
  const logEntry: NotificationLog = {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toLocaleTimeString(),
    recipient: recipient,
    type: type,
    subject: finalSubject,
    status: 'sent', // Assume success for demo
    trigger: triggerSource
  };

  // Add to logs
  notificationLogs.unshift(logEntry);
  if (notificationLogs.length > 50) notificationLogs.pop(); // Keep last 50

  console.log(`[MAILER SERVICE] Sent '${type}' to ${recipient}: ${finalSubject}`);
  return logEntry;
};

export const getNotificationLogs = () => {
  return notificationLogs;
};
