import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PatientManagement } from '@/components/PatientManagement';
import { PrescriptionManagement } from '@/components/PrescriptionManagement';
import { InvoiceManagement } from '@/components/InvoiceManagement';
import { Stethoscope, FileText, Receipt, Users, LogOut, User } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import type { User as UserType } from '../../server/src/schema';

// Auth Context (inline since we can't create separate files)
interface AuthContextType {
  user: UserType | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  registerAdmin: (username: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};

interface AuthContextProviderProps {
  children: ReactNode;
}

const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await trpc.auth.login.mutate({ username, password });
      
      setToken(response.token);
      setUser(response.user);
      setIsLoggedIn(true);
      
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const registerAdmin = async (username: string, password: string) => {
    try {
      await trpc.auth.register.mutate({ 
        username, 
        password, 
        role: 'admin' 
      });
    } catch (error) {
      console.error('Admin registration failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoggedIn,
    login,
    logout,
    registerAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Component (inline)
function LoginPage() {
  const { login, registerAdmin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdminRegister, setShowAdminRegister] = useState(true);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(username, password);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterAdmin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await registerAdmin('admin', 'admin');
      setError(null);
      setShowAdminRegister(false);
      setUsername('admin');
      setPassword('admin');
      alert('Admin user created successfully! You can now login with username: admin, password: admin');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Admin registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">🏥 Medical Software</CardTitle>
          <CardDescription className="text-gray-600">
            Electronic Prescriptions & Invoices for Vietnamese Clinics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {showAdminRegister && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3 text-center">
                First time setup? Create admin account:
              </p>
              <Button 
                onClick={handleRegisterAdmin}
                variant="outline"
                className="w-full border-green-200 text-green-700 hover:bg-green-50"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Admin...' : '👤 Create Admin Account (admin/admin)'}
              </Button>
            </div>
          )}

          <div className="text-xs text-gray-500 text-center pt-4 border-t border-gray-100">
            <p>💊 Prescription Management</p>
            <p>🧾 Electronic Invoicing</p>
            <p>👥 Patient Records</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main App Content
function AppContent() {
  const { isLoggedIn, user, logout } = useAuth();

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto p-6">
        {/* Header with User Info */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-full">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800">MediCare Pro</h1>
                <p className="text-gray-600">
                  Phần mềm quản lý phòng khám - Medical Clinic Management System
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{user?.username}</span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {user?.role}
                </span>
              </div>
              <Button 
                onClick={logout}
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </Button>
            </div>
          </div>
          
          <p className="text-gray-500 text-center">
            Quản lý bệnh nhân, đơn thuốc điện tử và hóa đơn điện tử
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="patients" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 h-14">
            <TabsTrigger value="patients" className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5" />
              Quản lý bệnh nhân
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              Đơn thuốc điện tử
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2 text-base">
              <Receipt className="h-5 w-5" />
              Hóa đơn điện tử
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patients">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  Quản lý thông tin bệnh nhân
                </CardTitle>
                <CardDescription>
                  Quản lý hồ sơ bệnh nhân, thông tin cá nhân và liên kết với đơn thuốc, hóa đォン
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PatientManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-green-600" />
                  Quản lý đơn thuốc điện tử
                </CardTitle>
                <CardDescription>
                  Tạo và quản lý đơn thuốc điện tử theo mẫu chuẩn của Bộ Y tế Việt Nam
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PrescriptionManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-6 w-6 text-orange-600" />
                  Quản lý hóa đơn điện tử
                </CardTitle>
                <CardDescription>
                  Tạo và quản lý hóa đơn điện tử tuân thủ quy định pháp luật Việt Nam
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvoiceManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthContextProvider>
      <AppContent />
    </AuthContextProvider>
  );
}

export default App;