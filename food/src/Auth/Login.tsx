import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import { MdAlternateEmail } from "react-icons/md";
import { RiGitRepositoryPrivateFill } from "react-icons/ri";
import { toast } from "react-toastify";
import { z } from "zod";
import { login, googleLogin } from "../Redux/Auth/authThunks";
import { clearError } from "../Redux/Auth/authSlice";
import { AppDispatch, RootState } from "../Redux/store";
import { useDarkMode } from "../hook/useDarkMode";
import AnimatedButton from "../components/AnimatedButton";
import FoodParticles from "../components/FoodParticles";

// Form validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login = () => {
  const isDarkMode = useDarkMode();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { error, loading, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  const handleGoogleLogin = () => {
    try {
      // Generate a random state using crypto for better security
      const state = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
      
      // Store state in localStorage
      localStorage.setItem('oauth_state', state);

      // Get configuration from environment variables
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

      if (!googleClientId || !redirectUri) {
        throw new Error('Google OAuth configuration is missing');
      }

      // Construct the Google OAuth URL with specific scopes
      const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      googleAuthUrl.searchParams.append('client_id', googleClientId);
      googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
      googleAuthUrl.searchParams.append('response_type', 'token');
      googleAuthUrl.searchParams.append('scope', 'email profile');
      googleAuthUrl.searchParams.append('state', state);
      googleAuthUrl.searchParams.append('prompt', 'select_account');

      console.log('Initiating Google OAuth with URL:', googleAuthUrl.toString());
      console.log('State stored:', state);

      // Redirect to Google's OAuth page
      window.location.href = googleAuthUrl.toString();
    } catch (error) {
      console.error('Error initiating Google login:', error);
      toast.error('Failed to initiate Google login. Please try again.');
    }
  };

  useEffect(() => {
    // Check for OAuth response in URL hash
    const hash = window.location.hash.substring(1);
    if (hash) {
      const params = new URLSearchParams(hash);
      const state = params.get('state');
      const storedState = localStorage.getItem('oauth_state');
      const accessToken = params.get('access_token');

      if (state === storedState && accessToken) {
        // Clear the stored state
        localStorage.removeItem('oauth_state');
        
        // Send the token to your backend
        dispatch(googleLogin({ accessToken }))
          .unwrap()
          .then(() => {
            toast.success('Successfully signed in with Google!');
            navigate('/');
          })
          .catch((error) => {
            toast.error(error || 'Failed to sign in with Google');
          });
      } else if (state !== storedState) {
        toast.error('Invalid state parameter. Possible CSRF attack.');
      }
      
      // Clear the URL hash
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [dispatch, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      await dispatch(login(data)).unwrap();
      toast.success("Login successful!");
      navigate("/");
    } catch (error: any) {
      toast.error(error || "Login failed");
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

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return (
    <section className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} relative overflow-hidden`}>
      <FoodParticles />
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8 sm:py-16 lg:py-24 relative">
          <div className="xl:w-full xl:max-w-sm 2xl:max-w-md xl:mx-auto">
            <h2 className="text-3xl font-bold leading-tight text-black dark:text-white sm:text-4xl">
              Sign in
            </h2>
            <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-indigo-600 transition-all duration-200 hover:text-indigo-700 hover:underline focus:text-indigo-700"
              >
                Create a free account
              </Link>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div>
                <AnimatedButton
                  type="button"
                  onClick={handleGoogleLogin}
                  variant="secondary"
                  icon={<FaGoogle />}
                  className="w-full"
                >
                  Sign in with Google
                </AnimatedButton>
              </div>

              <div className="relative flex items-center justify-center w-full mt-4 mb-5">
                <div className="absolute w-full border-t border-gray-300"></div>
                <div className="relative bg-white px-4 text-sm text-gray-500">
                  or continue with email
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="text-base font-medium text-gray-900 dark:text-gray-200"
                >
                  Email address
                </label>
                <div className="mt-2.5 relative">
                  <input
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent py-2 px-3 pl-11 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-50 dark:focus:ring-gray-400 dark:focus:ring-offset-gray-900"
                    type="email"
                    placeholder="Enter your email"
                    {...register("email")}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <MdAlternateEmail className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                {errors.email && (
                  <span className="text-red-500 text-sm">
                    {errors.email.message}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-base font-medium text-gray-900 dark:text-gray-200"
                  >
                    Password
                  </label>
                </div>
                <div className="mt-2.5 relative">
                  <input
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent py-2 px-3 pl-11 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-50 dark:focus:ring-gray-400 dark:focus:ring-offset-gray-900"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password")}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <RiGitRepositoryPrivateFill className="h-5 w-5 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FaEye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-red-500 text-sm">
                    {errors.password.message}
                  </span>
                )}
              </div>

              <div>
                <AnimatedButton
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </AnimatedButton>
              </div>
            </form>
          </div>
        </div>
        <div className="h-full w-full">
          <img
            className="mx-auto h-full w-full rounded-md object-cover"
            src="https://images.unsplash.com/photo-1630450202872-e0829c9d6172?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80"
            alt=""
          />
        </div>
      </div>
    </section>
  );
};

export default Login;
