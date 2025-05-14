import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import axios from 'axios';
import { Input, Spinner } from '@heroui/react';
import { ArrowRightIcon, SparklesIcon, CheckCircle2Icon, XCircleIcon, SearchIcon } from 'lucide-react';
import { Button } from '@heroui/react';
import AnimateComponent from '@/components/elements/AnimateComponent';
import { useFirstMount } from '@/hooks/useFirstMount';
import { useWallet } from '@solana/wallet-adapter-react';
import { useDebounce } from '@uidotdev/usehooks';
import { AnimatePresence, motion } from 'framer-motion';

export default function AppHomePage() {
  const { connected, connecting } = useWallet();
  const { accessToken, me } = useAuth();
  const { isFirstMount, disableMount } = useFirstMount();

  console.log('me', me)

  useEffect(() => {
    const timeout = setTimeout(() => {
      disableMount();
    }, 0);
    return () => clearTimeout(timeout);
  }, [disableMount]);

  if (isFirstMount || connecting) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center pt-[10rem]">
        <Spinner color='black' />
      </div>
    );
  }


  if (!connected) {
    console.log("not connected or signed in");
    return <Navigate to={"/app/login"} replace />;
  }

  return (
    <div className="container max-w-2xl mx-auto z-50 py-14 pt-[10rem] pb-[15rem] px-2 md:px-0">
      {me ? (
        <>{me?.username ? <AppDashboard /> : <Onboarding />}</>
      ) : (
        <div className="flex items-center justify-center">
          <Spinner className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}

const AppDashboard = () => {
  return (
    <div>
      <h1>App Dashboard</h1>
    </div>
  )
}

const Onboarding = () => {
  const { accessToken, fetchMe } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);

  const debouncedUsername = useDebounce(username, 500);

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (!debouncedUsername) {
        setIsAvailable(null);
        return;
      }

      try {
        setIsChecking(true);
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/user/username/check`,
          {
            params: { username: debouncedUsername },
          }
        );
        setIsAvailable(data.isAvailable);
      } catch (error) {
        console.error("Error checking username:", error);
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    };

    checkUsername();
  }, [debouncedUsername]);

  const handleSubmitUsername = async () => {
    try {
      setIsSubmitting(true);
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/user/username/set`,
        { username },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      await fetchMe();
      navigate("/app");
    } catch (error) {
      console.error("Error setting username:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusContent = () => {
    if (!username) {
      return {
        text: "Choose a username",
        icon: <SearchIcon className="w-4 h-4" />,
        color: "bg-gray-100 text-gray-600"
      };
    }
    if (isChecking) {
      return {
        text: "Checking availability...",
        icon: <Spinner size="sm" color='secondary' />,
        color: "bg-secondary-50 text-secondary-600"
      };
    }
    if (isAvailable === null) {
      return {
        text: "Checking availability...",
        icon: <Spinner size="sm" color='secondary' />,
        color: "bg-secondary-50 text-secondary-600"
      };
    }
    if (isAvailable) {
      return {
        text: "Username is available!",
        icon: <CheckCircle2Icon className="w-4 h-4" />,
        color: "bg-success-50 text-success-600"
      };
    }
    return {
      text: "Username is not available",
      icon: <XCircleIcon className="w-4 h-4" />,
      color: "bg-danger-100 text-danger-600"
    };
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 w-full min-h-[80vh] z-20 relative">
      <AnimateComponent>
        <div className="flex flex-col items-center justify-center gap-8 text-center z-10 relative p-8 px-12 max-w-xl w-full nice-card">
          <AnimateComponent delay={100}>
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-8 h-8 text-primary-500" />
              <h1 className="text-3xl font-bold tracking-tight">Welcome to Pivy! 👋</h1>
            </div>
          </AnimateComponent>

          <AnimateComponent delay={200}>
            <p className="text-gray-600 max-w-md">
              To get started, you&apos;ll need to set up your username.
              <br />
              This will help others find and pay you easily.
            </p>
          </AnimateComponent>

          <AnimateComponent delay={300}>
            <div className="flex flex-col w-full gap-3">
              <Input
                title="Username"
                placeholder="Enter your username"
                name="username"
                size="lg"
                type="text"
                value={username}
                onValueChange={setUsername}
                endContent={
                  <span className="p-2 mt-1 rounded-xl bg-primary font-medium text-sm -mr-1">
                    .pivy.me
                  </span>
                }
                className="w-full"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              <div className="flex justify-center w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isChecking || isAvailable === null ? 'checking' : (username ? (isAvailable ? 'available' : 'unavailable') : 'empty')}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusContent().color}`}
                  >
                    {getStatusContent().icon}
                    {getStatusContent().text}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </AnimateComponent>

          <AnimateComponent delay={400}>
            <Button
              className="w-full font-semibold tracking-tight px-8 py-6 text-lg"
              radius="full"
              size="lg"
              color="primary"
              onPress={handleSubmitUsername}
              isLoading={isSubmitting}
              isDisabled={!username || !isAvailable || isChecking}
              endContent={<ArrowRightIcon className="w-5 h-5" />}
            >
              Set Up Your Username
            </Button>
          </AnimateComponent>
        </div>
      </AnimateComponent>
    </div>
  );
};

