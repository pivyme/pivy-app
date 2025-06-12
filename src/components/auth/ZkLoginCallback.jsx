import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useZkLogin } from '@/providers/ZkLoginProvider';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from '@heroui/react';

export default function ZkLoginCallback() {
  const { signIn } = useAuth();
  const { handleZkLoginCallback } = useZkLogin();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasProcessed = useRef(false);
  const [currentStep, setCurrentStep] = useState('processing');
  const processingRef = useRef(false);
  const authInProgress = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode and concurrent processing
    if (hasProcessed.current || processingRef.current || authInProgress.current) {
      console.log('ZkLogin callback already processed or processing, skipping...');
      return;
    }

    const handleCallback = async () => {
      try {
        // Mark as processing immediately
        processingRef.current = true;
        authInProgress.current = true;
        
        // Step 1: Processing authentication and wallet
        setCurrentStep('processing');
        
        // Wait for the page to fully load and give users time to see the step
        await new Promise(resolve => setTimeout(resolve, 700));
        
        const fragment = window.location.hash.substring(1);
        console.log('Full fragment:', fragment || '(empty)');
        
        let idToken = null;
        
        // Enhanced token extraction with multiple fallback methods
        if (fragment) {
          // Method 1: Try URLSearchParams
          try {
            const params = new URLSearchParams(fragment);
            idToken = params.get('id_token');
            console.log('Token from URLSearchParams:', idToken ? 'Found' : 'Not found');
          } catch (e) {
            console.log('URLSearchParams failed:', e);
          }
          
          // Method 2: Manual extraction for long tokens
          if (!idToken) {
            const match = fragment.match(/id_token=([^&]+)/);
            if (match) {
              idToken = decodeURIComponent(match[1]);
              console.log('Token from manual extraction:', idToken ? 'Found' : 'Not found');
            }
          }
          
          // Method 3: Split by ampersand and find id_token
          if (!idToken) {
            const parts = fragment.split('&');
            for (const part of parts) {
              if (part.startsWith('id_token=')) {
                idToken = decodeURIComponent(part.substring(9));
                console.log('Token from split method:', idToken ? 'Found' : 'Not found');
                break;
              }
            }
          }
        }

        // Check if we're already signed in (maybe from a previous successful attempt)
        if (!idToken) {
          const existingToken = localStorage.getItem('pivy-zklogin-jwt');
          const existingAddress = localStorage.getItem('pivy-zklogin-user-address');
          
          if (existingToken && existingAddress) {
            console.log('🔄 Found existing zkLogin session, redirecting to home...');
            hasProcessed.current = true;
            authInProgress.current = false;
            navigate('/', { replace: true });
            return;
          }
        }

        if (!idToken) {
          console.error('Fragment content:', fragment || '(empty)');
          console.error('Unable to extract ID token from URL');
          throw new Error('No ID token found in callback');
        }

        console.log('✅ Extracted JWT token (first 50 chars):', idToken.substring(0, 50) + '...');

        // Clear the hash to prevent issues with back/forward navigation
        window.history.replaceState(null, '', window.location.pathname);

        console.log('🔐 Starting zkLogin callback process...');
        
        // Step 2: Signing in
        setCurrentStep('signin');
        console.log('🎯 JWT token received, processing sign-in...');
        
        // Give users time to see the signin step
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Process zkLogin callback and then sign in
        const zkLoginData = await handleZkLoginCallback(idToken);
        // Fix the walletChain field to match backend expectations
        zkLoginData.walletChain = 'SUI_ZKLOGIN';
        
        // Important: Don't proceed if already processed by another instance
        if (hasProcessed.current) {
          console.log('⚠️ Already processed by another instance, aborting...');
          return;
        }
        
        await signIn(zkLoginData);
        
        // Step 3: Complete
        setCurrentStep('complete');
        console.log('✅ zkLogin sign-in completed successfully');
        
        // Give users time to enjoy the success moment
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mark as processed only after successful sign-in
        hasProcessed.current = true;
        
      } catch (error) {
        console.error('❌ ZkLogin callback error:', error);
        console.error('Error stack:', error.stack);
        setCurrentStep('error');
        hasProcessed.current = true; // Mark as processed even on error
        
        // Add a small delay before redirecting to let user see the error
        setTimeout(() => {
          navigate('/login?error=zklogin_failed', { replace: true });
        }, 2000);
      } finally {
        processingRef.current = false;
        authInProgress.current = false;
      }
    };

    handleCallback();
  }, []); // Remove dependencies to prevent re-runs

  const getStepData = () => {
    switch (currentStep) {
      case 'processing':
        return {
          emoji: '🪄',
          title: 'Creating your zkLogin wallet...',
          subtitle: 'Reading your pass & crafting magic ✨',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      case 'signin':
        return {
          emoji: '🚀',
          title: 'Launching you into Pivy...',
          subtitle: 'Ready for takeoff!',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'complete':
        return {
          emoji: '🎉',
          title: 'Welcome to Pivy!',
          subtitle: 'You\'re all set and ready to go',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'error':
        return {
          emoji: '😅',
          title: 'Oops, something hiccupped',
          subtitle: 'Taking you back to try again...',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          emoji: '⏳',
          title: 'Working on it...',
          subtitle: 'Hang tight while we set things up',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const stepData = getStepData();

    return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 400,
          damping: 25,
          mass: 0.8
        }}
        className="nice-card p-8 max-w-sm w-full text-center"
      >
        {/* Spinner for loading states */}
        {currentStep !== 'complete' && currentStep !== 'error' && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8 flex justify-center"
          >
            <div className='rounded-full bg-primary-50 aspect-square p-3 flex items-center justify-center'>
              <Spinner size='lg' color='primary' />
            </div>
          </motion.div>
        )}

        {/* Animated Emoji */}
        <motion.div
          key={currentStep}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.3, opacity: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 600,
            damping: 20
          }}
          className="mb-6"
        >
          <motion.div
            className="text-7xl mb-2"
            animate={currentStep !== 'complete' && currentStep !== 'error' ? {
              rotate: [0, 8, -8, 5, -5, 0],
              scale: [1, 1.05, 1.1, 1.05, 1],
              y: [0, -3, 0, -2, 0]
            } : currentStep === 'complete' ? {
              scale: [1, 1.4, 1.1, 1.3, 1],
              rotate: [0, 15, -10, 12, 0]
            } : {}}
            transition={{
              duration: currentStep === 'complete' ? 0.8 : 3.5,
              repeat: currentStep !== 'complete' && currentStep !== 'error' ? Infinity : 0,
              ease: currentStep === 'complete' ? [0.175, 0.885, 0.32, 1.4] : "easeInOut",
              repeatType: "reverse"
            }}
          >
            {stepData.emoji}
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Title & Subtitle */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {stepData.title}
              </h1>
              <p className="text-gray-600 text-base leading-relaxed">
                {stepData.subtitle}
              </p>
            </div>

            {/* Status Card */}
            {(currentStep === 'processing' || currentStep === 'signin') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className={`p-4 rounded-xl ${stepData.bgColor} border ${stepData.borderColor} mt-6`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {currentStep === 'processing' ? '🔐' : '✨'}
                  </div>
                  <div className="text-left">
                    <p className={`font-semibold ${stepData.color} text-sm`}>
                      {currentStep === 'processing' 
                        ? 'zkLogin Magic in Progress' 
                        : 'Setting up your session'
                      }
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {currentStep === 'processing' 
                        ? 'Reading credentials & deriving your secure address' 
                        : 'Almost there! Just putting the finishing touches'
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Success State */}
            {currentStep === 'complete' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                className={`p-6 rounded-xl ${stepData.bgColor} border ${stepData.borderColor} mt-6`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="text-3xl">🌟</div>
                  <div className="text-center">
                    <p className={`font-bold ${stepData.color} text-lg`}>
                      You're all set!
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      zkLogin authentication completed successfully
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {currentStep === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 rounded-xl ${stepData.bgColor} border ${stepData.borderColor} mt-6`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="text-3xl">🔄</div>
                  <div className="text-center">
                    <p className={`font-semibold ${stepData.color} text-lg`}>
                      No worries, let's try again
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Redirecting you back to the login page...
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
} 