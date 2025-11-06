import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface RevisionSession {
  id: string;
  subject: string;
  start_time: string;
  end_time: string;
  difficulty: string | null;
}

export class NotificationService {
  private static instance: NotificationService;
  private initialized = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    // Check if running on native platform
    if (!Capacitor.isNativePlatform()) {
      console.log('Notifications only work on native platforms');
      return false;
    }

    try {
      // Request permissions
      const permission = await LocalNotifications.requestPermissions();
      
      if (permission.display !== 'granted') {
        console.log('Notification permission not granted');
        return false;
      }

      // Listen to notification events
      await LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('Notification received:', notification);
      });

      await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        console.log('Notification action performed:', action);
        // Could navigate to planning page when tapped
      });

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  async scheduleSessionReminders(sessions: RevisionSession[]): Promise<void> {
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) return;
    }

    try {
      // Cancel all existing notifications first
      await LocalNotifications.cancel({ notifications: await this.getPendingNotifications() });

      const notifications = sessions
        .map((session, index) => {
          const startTime = new Date(session.start_time);
          const reminderTime = new Date(startTime.getTime() - 15 * 60 * 1000); // 15 minutes before

          // Don't schedule notifications in the past
          if (reminderTime <= new Date()) {
            return null;
          }

          const difficultyEmoji = session.difficulty === 'difficile' ? '🔴' : 
                                 session.difficulty === 'moyen' ? '🟡' : '🟢';

          return {
            id: index + 1,
            title: `📚 Session de révision dans 15 min`,
            body: `${difficultyEmoji} ${session.subject} - ${startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
            schedule: { at: reminderTime },
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            extra: {
              sessionId: session.id,
              subject: session.subject,
            }
          };
        })
        .filter(notif => notif !== null);

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications: notifications as any });
        console.log(`Scheduled ${notifications.length} notification reminders`);
      }
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
    }
  }

  async getPendingNotifications() {
    try {
      const pending = await LocalNotifications.getPending();
      return pending.notifications;
    } catch (error) {
      console.error('Failed to get pending notifications:', error);
      return [];
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      const pending = await this.getPendingNotifications();
      if (pending.length > 0) {
        await LocalNotifications.cancel({ notifications: pending });
        console.log('All notifications cancelled');
      }
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  async checkPermissions(): Promise<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'> {
    try {
      const status = await LocalNotifications.checkPermissions();
      return status.display;
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return 'denied';
    }
  }
}

export const notificationService = NotificationService.getInstance();
