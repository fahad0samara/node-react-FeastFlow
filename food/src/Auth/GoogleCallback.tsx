import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { googleLogin } from '../Redux/Auth/authThunks';
import { AppDispatch } from '../Redux/store';

export const GoogleCallback = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple processing in StrictMode
      if (processed.current) return;
      processed.current = true;

      try {
        // Get parameters from hash only (Google OAuth2 uses hash fragment)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        // Get tokens and error info
        const accessToken = hashParams.get('access_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        const state = hashParams.get('state');
        const storedState = localStorage.getItem('oauth_state');

        console.log('Received OAuth response:', {
          state,
          storedState,
          hasAccessToken: !!accessToken,
          error,
          errorDescription,
        });

        // Check for OAuth errors first
        if (error) {
          throw new Error(`Google OAuth error: ${error} - ${errorDescription}`);
        }

        // Validate state if we have it
        if (state && storedState && state !== storedState) {
          console.error('State validation failed:', { receivedState: state, storedState });
          throw new Error('Invalid state parameter. Please try logging in again.');
        }

        // Clean up stored values
        localStorage.removeItem('oauth_state');

        // Validate we have the access token
        if (!accessToken) {
          console.error('No access token received');
          throw new Error('No access token received from Google');
        }

        console.log('Sending access token to backend...');
        await dispatch(googleLogin({ token: accessToken })).unwrap();
        console.log('Google login success');

        toast.success('Successfully signed in with Google!');
        navigate('/');
      } catch (error) {
        console.error('Google callback error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to sign in with Google');
        navigate('/login');
      } finally {
        // Clean up URL
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    handleCallback();
  }, [dispatch, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );
};
