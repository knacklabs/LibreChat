import { useState, useEffect } from 'react';
import { useAuthContext } from './AuthContext';

export interface UserData {
  user_id: string;
  user_email: string;
  user_role: string;
  key?: string;
}

export const useUser = () => {
  // Use LibreChat's existing authentication context
  const { user, token, isAuthenticated, logout: authLogout, login: authLogin } = useAuthContext();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Extract custom user data from LibreChat's user object
  useEffect(() => {
    if (user && isAuthenticated) {
      // Map LibreChat's user object to your UserData interface
      const userInfo: UserData = {
        user_id: user.id || '',
        user_email: user.email || '',
        user_role: user.role || '',
        // If you have a custom key field, extract it here
        // key: user.key || undefined,
      };
      setUserData(userInfo);
      setIsLoading(false);
    } else if (!isAuthenticated) {
      setUserData(null);
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  // Wrapper for logout to include custom cleanup if needed
  const logout = (redirect?: string) => {
    setUserData(null);
    authLogout(redirect);
  };

  // Wrapper for login - pass through to AuthContext
  const login = authLogin;

  return {
    userData,
    token,
    isLoading,
    isAuthenticated,
    logout,
    login,
    // Also expose the original user object in case it's needed
    user,
  };
};
