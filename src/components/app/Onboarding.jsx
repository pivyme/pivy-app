import { RESTRICTED_USERNAME } from "@/config";
import { Button, Input, Spinner } from "@heroui/react";
import axios from "axios";
import { ArrowRightIcon, SearchIcon, SparklesIcon, XCircleIcon } from "lucide-react";
import AnimateComponent from "../elements/AnimateComponent";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from '@/providers/AuthProvider'
import { useDebounce } from '@uidotdev/usehooks'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { CheckCircle2Icon } from 'lucide-react'

export default function Onboarding() {
  const { accessToken, fetchMe } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [validationError, setValidationError] = useState(null);

  // Force lowercase and validate input
  const handleUsernameChange = (value) => {
    const lowercaseValue = value.toLowerCase();
    // Only allow alphanumeric characters
    if (lowercaseValue !== '' && !/^[a-z0-9]+$/.test(lowercaseValue)) {
      setValidationError("Only letters and numbers are allowed");
      return;
    }
    setValidationError(null);
    setUsername(lowercaseValue);
  };

  const debouncedUsername = useDebounce(username, 500);

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (!debouncedUsername) {
        setIsAvailable(null);
        return;
      }

      // Check against restricted usernames first
      if (RESTRICTED_USERNAME.includes(debouncedUsername)) {
        setIsAvailable(false);
        return;
      }

      try {
        setIsChecking(true);
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/user/username/check`,
          {
            params: {
              username: debouncedUsername
            },
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
      navigate("/");
    } catch (error) {
      console.error("Error setting username:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusContent = () => {
    if (validationError) {
      return {
        text: validationError,
        icon: <XCircleIcon className="w-4 h-4" />,
        color: "bg-danger-100 text-danger-600"
      };
    }
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
    if (RESTRICTED_USERNAME.includes(username)) {
      return {
        text: "This username is not allowed",
        icon: <XCircleIcon className="w-4 h-4" />,
        color: "bg-danger-100 text-danger-600"
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
    <div className="flex flex-col items-center justify-center px-4 w-full min-h-[60vh] z-20 relative">
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
                onValueChange={handleUsernameChange}
                startContent={
                  <span className="px-2 py-1 mt-1 font-medium text-sm bg-primary text-black rounded-md">
                    pivy.me/
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

