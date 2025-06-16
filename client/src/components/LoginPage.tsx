import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from './AuthContext';

export function LoginPage() {
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