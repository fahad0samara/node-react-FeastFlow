import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import { RiGitRepositoryPrivateFill, RiUserFill } from "react-icons/ri";
import { MdAlternateEmail } from "react-icons/md";
import { toast } from "react-toastify";
import AnimatedBackground from "../components/AnimatedBackground";

import { register as registerUser, login } from "../Redux/Auth/authThunks";
import { clearError, googleLogin } from "../Redux/Auth/authSlice";
import { useDarkMode } from "../hook/useDarkMode";
import { AppDispatch, RootState } from "../Redux/store";
import AuthBackground from '../components/AuthBackground';
import AnimatedButton from "../components/AnimatedButton";
import FoodParticles from "../components/FoodParticles";

// Form validation schema
const registerSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .regex(/^[a-zA-Z\s]*$/, 'First name can only contain letters and spaces'),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register = () => {
  const isDarkMode = useDarkMode();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { error, loading, isAuthenticated, isAdmin } = useSelector(
    (state: RootState) => state.auth
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset
  } = useForm<RegisterFormData>({
    mode: "onChange",
    defaultValues: {
      firstName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const password = watch('password');
  const passwordStrength = {
    length: password?.length >= 8,
    uppercase: /[A-Z]/.test(password || ''),
    lowercase: /[a-z]/.test(password || ''),
    number: /[0-9]/.test(password || ''),
    special: /[^A-Za-z0-9]/.test(password || '')
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsSubmitting(true);
      const validatedData = await registerSchema.parseAsync(data);
      
      // Register the user
      await dispatch(registerUser({
        firstName: validatedData.firstName,
        email: validatedData.email.toLowerCase(),
        password: validatedData.password,
        role: "user"
      })).unwrap();

      toast.success('Registration successful! Logging you in...');

      // Log them in automatically
      await dispatch(login({
        email: validatedData.email.toLowerCase(),
        password: validatedData.password
      })).unwrap();

      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <FoodParticles />
      <div className="max-w-md w-full mx-auto p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">Create Account</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">First Name</label>
            <div className="mt-1 relative">
              <input
                type="text"
                {...register('firstName')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="John"
              />
              <RiUserFill className="absolute right-3 top-3 text-gray-400" />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
            <div className="mt-1 relative">
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="john@example.com"
              />
              <MdAlternateEmail className="absolute right-3 top-3 text-gray-400" />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
            <div className="mt-1 relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register('password')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            
            {/* Password strength indicators */}
            <div className="mt-2 space-y-1">
              <div className={`text-sm ${passwordStrength.length ? 'text-green-600' : 'text-gray-500'}`}>
                ✓ At least 8 characters
              </div>
              <div className={`text-sm ${passwordStrength.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
                ✓ One uppercase letter
              </div>
              <div className={`text-sm ${passwordStrength.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
                ✓ One lowercase letter
              </div>
              <div className={`text-sm ${passwordStrength.number ? 'text-green-600' : 'text-gray-500'}`}>
                ✓ One number
              </div>
              <div className={`text-sm ${passwordStrength.special ? 'text-green-600' : 'text-gray-500'}`}>
                ✓ One special character
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Confirm Password</label>
            <div className="mt-1 relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                {...register('confirmPassword')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <AnimatedButton
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </AnimatedButton>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
