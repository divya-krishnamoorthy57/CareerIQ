import { createContext, useState } from "react";
import type { ReactNode } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("careeriq_user");

    if (savedUser) {
      return JSON.parse(savedUser);
    }

    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("careeriq_token");
  });

  const login = (userData: User, accessToken: string) => {
    setUser(userData);
    setToken(accessToken);

    localStorage.setItem(
      "careeriq_user",
      JSON.stringify(userData)
    );

    localStorage.setItem(
      "careeriq_token",
      accessToken
    );
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("careeriq_user");
    localStorage.removeItem("careeriq_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}