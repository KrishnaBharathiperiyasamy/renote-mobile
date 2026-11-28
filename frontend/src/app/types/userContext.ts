export interface UserContextType {
  profileImageUrl: string | null;
  setProfileImageUrl: (url: string | null) => void;
  fullName: string;
  setFullName: (name: string) => void;
  refreshUser: () => void;
  isLoggedIn: boolean;
  userLoading: boolean;
  logout: () => void;
  notificationCount: number;
  fetchNotificationCount: () => void;
  setNotificationCount: (count: number) => void;
}