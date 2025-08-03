export type Notification = {
  id: string;
  message: string;
  priority?: string;
  notificationSource?: string;
  slug?: string | null;
  createdBy?: string;
  read: boolean;
  createdAt?: number;
};