import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

import {
    getCurrentUser,
    loginUser,
    registerUser,
    updateCurrentUser,
    type AuthUser,
    type RegisterPayload,
    type UpdateProfilePayload,
} from '../../api/client';

const AUTH_TOKEN_KEY = 'auth-token';

type AuthContextValue = {
    user: AuthUser | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<AuthUser>;
    register: (payload: RegisterPayload) => Promise<AuthUser>;
    updateProfile: (payload: UpdateProfilePayload) => Promise<AuthUser>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
    children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
    const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY));
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(Boolean(token));

    useEffect(() => {
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        let isActive = true;

        setIsLoading(true);

        getCurrentUser(token)
            .then((currentUser) => {
                if (isActive) {
                    setUser(currentUser);
                }
            })
            .catch(() => {
                localStorage.removeItem(AUTH_TOKEN_KEY);

                if (isActive) {
                    setToken(null);
                    setUser(null);
                }
            })
            .finally(() => {
                if (isActive) {
                    setIsLoading(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [token]);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            token,
            isLoading,

            login: async (email, password) => {
                const tokenResponse = await loginUser(email, password);
                const currentUser = await getCurrentUser(tokenResponse.access_token);

                localStorage.setItem(AUTH_TOKEN_KEY, tokenResponse.access_token);
                setToken(tokenResponse.access_token);
                setUser(currentUser);

                return currentUser;
            },

            register: async (payload) => {
                await registerUser(payload);
                const tokenResponse = await loginUser(payload.email, payload.password);
                const currentUser = await getCurrentUser(tokenResponse.access_token);

                localStorage.setItem(AUTH_TOKEN_KEY, tokenResponse.access_token);
                setToken(tokenResponse.access_token);
                setUser(currentUser);

                return currentUser;
            },

            updateProfile: async (payload) => {
                if (!token) {
                    throw new Error('Нужно войти в аккаунт');
                }

                const updatedUser = await updateCurrentUser(token, payload);
                setUser(updatedUser);

                return updatedUser;
            },

            logout: () => {
                localStorage.removeItem(AUTH_TOKEN_KEY);
                setToken(null);
                setUser(null);
            },
        }),
        [isLoading, token, user],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }

    return context;
}
