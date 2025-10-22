import {
  useRef,
  useMemo,
  useState,
  useEffect,
  ReactNode,
  useContext,
  useCallback,
  createContext,
} from 'react';
import { debounce } from 'lodash';
import { useRecoilState } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { QueryKeys, setTokenHeader, SystemRoles } from 'librechat-data-provider';
import type * as t from 'librechat-data-provider';
import {
  useGetRole,
  useGetUserQuery,
  useLoginUserMutation,
  useLogoutUserMutation,
  useRefreshTokenMutation,
} from '~/data-provider';
import { TAuthConfig, TUserContext, TAuthContext, TResError } from '~/common';
import useTimeout from './useTimeout';
import store from '~/store';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext<TAuthContext | undefined>(undefined);

const AuthContextProvider = ({
  authConfig,
  children,
}: {
  authConfig?: TAuthConfig;
  children: ReactNode;
}) => {  
  const [user, setUser] = useRecoilState(store.user);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  // const [logoutInProgress, setLogoutInProgress] = useState<boolean>(false);
  const logoutRedirectRef = useRef<string | undefined>(undefined);
  const logoutInProgressRef = useRef<boolean>(false);
  const queryClient = useQueryClient();

  const { data: userRole = null } = useGetRole(SystemRoles.USER, {
    enabled: !!(isAuthenticated && (user?.role ?? '')),
  });
  const { data: adminRole = null } = useGetRole(SystemRoles.ADMIN, {
    enabled: !!(isAuthenticated && user?.role === SystemRoles.ADMIN),
  });

  const navigate = useNavigate();

  const setUserContext = useMemo(
    () =>
      debounce((userContext: TUserContext) => {
        const { token, isAuthenticated, user, redirect } = userContext;
        setUser(user);
        setToken(token);
        //@ts-ignore - ok for token to be undefined initially
        setTokenHeader(token);
        setIsAuthenticated(isAuthenticated);

        // Use a custom redirect if set
        const finalRedirect = logoutRedirectRef.current || redirect;
        // Clear the stored redirect
        logoutRedirectRef.current = undefined;

        if (finalRedirect == null) {
          return;
        }

        if (finalRedirect.startsWith('http://') || finalRedirect.startsWith('https://')) {
          window.location.href = finalRedirect;
        } else {
          navigate(finalRedirect, { replace: true });
        }
      }, 50),
    [navigate, setUser],
  );
  const doSetError = useTimeout({ callback: (error) => setError(error as string | undefined) });

  const loginUser = useLoginUserMutation({
    onSuccess: (data: t.TLoginResponse) => {
      const { user, token, twoFAPending, tempToken } = data;
      if (twoFAPending) {
        // Redirect to the two-factor authentication route.
        navigate(`/login/2fa?tempToken=${tempToken}`, { replace: true });
        return;
      }
      setError(undefined);
      setUserContext({ token, isAuthenticated: true, user, redirect: '/c/new' });
    },
    onError: (error: TResError | unknown) => {
      const resError = error as TResError;
      doSetError(resError.message);
      navigate('/login', { replace: true });
    },
  });
  const logoutUser = useLogoutUserMutation({
    onMutate: () => {
      
      logoutInProgressRef.current = true;
      (window as any).logoutInProgress = true;
      queryClient.cancelQueries();
    },
    onSuccess: (data) => {
      
      // Keep logout flag true until user actually logs in again
      setUserContext({
        token: undefined,
        isAuthenticated: false,
        user: undefined,
        redirect: data.redirect ?? '/login',
      });
    },
    onError: (error) => {
      
      doSetError((error as Error).message);
      // Keep logout flag true until user actually logs in again
      setUserContext({
        token: undefined,
        isAuthenticated: false,
        user: undefined,
        redirect: '/login',
      });
    },
  });
  const refreshToken = useRefreshTokenMutation();

  const logout = useCallback(
    (redirect?: string) => {
      
      if (redirect) {
        logoutRedirectRef.current = redirect;
      }
      
      // Set logout flag IMMEDIATELY to prevent any refresh calls during OAuth logout
      logoutInProgressRef.current = true;
      (window as any).logoutInProgress = true;
      
      
      
      // Cancel all queries immediately to stop SSE and other API calls
      queryClient.cancelQueries();
      queryClient.clear();
      
      // The onMutate callback will handle additional cleanup
      logoutUser.mutate(undefined);

    },
    [logoutUser, queryClient],
  );

  const userQuery = useGetUserQuery({ enabled: !!(token ?? '') });

  const login = (data: t.TLoginUser) => {
    // Reset logout flag when user actually logs in (not just lands on login page)
    logoutInProgressRef.current = false;
    
    // Reset global flag for HTTP client
    (window as any).logoutInProgress = false;
    
    loginUser.mutate(data);
  };

  const silentRefresh = useCallback(() => {
    
    if (authConfig?.test === true) {
      console.log('Test mode. Skipping silent refresh.');
      return;
    }
    
    // Check BOTH ref and window flag
    if (logoutInProgressRef.current) {
      console.log('⛔ Logout in progress. Skipping silent refresh.');
      return;
    }
    
    if (window.location.pathname.startsWith('/login')) {
      console.log('⛔ On login page. Skipping silent refresh.');
      return;
    }
    
    console.log('✅ Proceeding with token refresh');
  
    refreshToken.mutate(undefined, {
      onSuccess: (data: t.TRefreshTokenResponse | undefined) => {
        const { user, token = '' } = data ?? {};
        if (token) {
          setUserContext({ token, isAuthenticated: true, user });
        } else {
          console.log('Token is not present. User is not authenticated.');
          if (authConfig?.test === true) {
            return;
          }
          navigate('/login');
        }
      },
      onError: (error) => {
        console.log('refreshToken mutation error:', error);
        if (authConfig?.test === true) {
          return;
        }
        navigate('/login');
      },
    });
  }, []);

  useEffect(() => {
    
    
    if (userQuery.data) {
      setUser(userQuery.data);
    } else if (userQuery.isError) {
      doSetError((userQuery.error as Error).message);
      navigate('/login', { replace: true });
    }
    if (error != null && error && isAuthenticated) {
      doSetError(undefined);
    }
    
    // Don't call silentRefresh if we're on the login page (check both /login and redirect_uri)
    const isOnLoginPage = window.location.pathname.startsWith('/login');
  
  // CRITICAL: Check ref AND window flag before state
  if (logoutInProgressRef.current) {
    console.log('⛔ Logout in progress (checked ref), skipping silentRefresh');
    return;
  }
  
  // Don't call silentRefresh if we're on login page
  if (isOnLoginPage) {
    console.log('⛔ On login page, skipping silentRefresh');
    return;
  }
  
  if (!logoutInProgressRef.current && (token == null || !token || !isAuthenticated)) {
    console.log('🚨 AuthContext: Calling silentRefresh()');
    silentRefresh();
  }
}, [
  token,
  isAuthenticated,
  // Remove logoutInProgress from dependencies if possible, or keep it but check ref first
  userQuery.data,
  userQuery.isError,
  userQuery.error,
  error,
  setUser,
  navigate,
  silentRefresh,
]);


  useEffect(() => {
    const handleTokenUpdate = (event) => {
      console.log('tokenUpdated event received event');
      const newToken = event.detail;
      setUserContext({
        token: newToken,
        isAuthenticated: true,
        user: user,
      });
    };

    window.addEventListener('tokenUpdated', handleTokenUpdate);

    return () => {
      window.removeEventListener('tokenUpdated', handleTokenUpdate);
    };
  }, [setUserContext, user]);

  // Make the provider update only when it should
  const memoedValue = useMemo(
    () => ({
      user,
      token,
      error,
      login,
      logout,
      setError,
      roles: {
        [SystemRoles.USER]: userRole,
        [SystemRoles.ADMIN]: adminRole,
      },
      isAuthenticated,
      logoutInProgress: logoutInProgressRef.current,
    }),

    [user, error, isAuthenticated, token, userRole, adminRole, logoutInProgressRef.current],
  );

  return <AuthContext.Provider value={memoedValue}>{children}</AuthContext.Provider>;
};

const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext should be used inside AuthProvider');
  }

  return context;
};

export { AuthContextProvider, useAuthContext, AuthContext };
