import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Eye, EyeOff, Pill, Stethoscope, Activity, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      toast.error('Email/Username and password are required');
      return;
    }

    setIsSubmitting(true);
    const result = await login(identifier.trim(), password.trim());
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Login successful!');
      navigate(from, { replace: true });
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left Panel - Branding (Hidden on Mobile) */}
      <div className="hidden w-1/2 flex-col justify-between bg-pharmacy-600 p-12 text-white lg:flex relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-pharmacy-500 opacity-50 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-pharmacy-700 opacity-50 blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-pharmacy-600 shadow-lg">
              <Pill size={28} className="stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Suhaim Soft ERP</h1>
          </div>
          
          <div className="mt-24 max-w-lg">
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-white mb-6">
              Wholesale Pharmacy ERP
            </h2>
            <p className="text-lg text-pharmacy-100 leading-relaxed mb-8">
              Streamline your supply chain, manage inventory efficiently, and operate your pharmacy business with confidence using Suhaim Soft ERP.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pharmacy-500/50 backdrop-blur-sm">
                  <Activity size={20} />
                </div>
                <span className="font-medium text-pharmacy-50">Real-time Tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pharmacy-500/50 backdrop-blur-sm">
                  <Stethoscope size={20} />
                </div>
                <span className="font-medium text-pharmacy-50">Compliance Ready</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm font-medium text-pharmacy-200">
          &copy; {new Date().getFullYear()} Suhaim Soft ERP. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-24 xl:px-32 relative">
        
        {/* Mobile Logo */}
        <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pharmacy-600 text-white shadow-lg">
            <Pill size={28} className="stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Suhaim Soft ERP</h1>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600">
              Please enter your details to sign in to your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="identifier">
                Email or Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pl-10 text-gray-900 focus:border-pharmacy-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pharmacy-500/20 transition-colors"
                  placeholder="admin@pharmacy.com"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pl-10 pr-10 text-gray-900 focus:border-pharmacy-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pharmacy-500/20 transition-colors"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-pharmacy-600 focus:outline-none"
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-pharmacy-600 focus:ring-pharmacy-500"
                  disabled={isSubmitting}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center items-center gap-2 rounded-lg bg-pharmacy-600 p-3 text-sm font-semibold text-white shadow-sm hover:bg-pharmacy-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pharmacy-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-5 w-5 animate-spin text-white" xmlns="http://w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in to account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
