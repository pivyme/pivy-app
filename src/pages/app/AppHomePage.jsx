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
import FundsCard from '@/components/app/FundsCard';
import ReceiveCard from '@/components/app/ReceiveCard';
import { RESTRICTED_USERNAME } from '@/config';
import ActivityCard from '@/components/app/ActivityCard';
import Onboarding from '@/components/app/Onboarding';
import GenerateMetaButton from '@/components/app/GenerateMetaButton';
import GenerateMetaKey from '@/components/app/GenerateMetaKey';

export default function AppHomePage() {
  const { isConnected } = useAuth();
  const { accessToken, me, walletChain, hasMetaKeys } = useAuth();
  const { isFirstMount, disableMount } = useFirstMount();

  useEffect(() => {
    const timeout = setTimeout(() => {
      disableMount();
    }, 0);
    return () => clearTimeout(timeout);
  }, [disableMount]);

  if (isFirstMount) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center pt-[10rem]">
        <Spinner color='black' />
      </div>
    );
  }

  if (!isConnected) {
    console.log("not connected or signed in");
    return <Navigate to={"/login"} replace />;
  }

  console.log('me', me);

  return (
    <div className="container max-w-2xl mx-auto z-50 py-14 pt-[10rem] pb-[15rem] px-2 md:px-0">
      {me ? (
        <>
          {!me?.username ? (
            <Onboarding />
          ) : walletChain === 'SUI' && !hasMetaKeys ? (
            <GenerateMetaKey />
          ) : (
            <AppDashboard />
          )}
        </>
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
    <div className='flex flex-col gap-12'>
      {/* Funds */}
      <AnimateComponent>
        <div>
          {/* <h1 className='font-bold tracking-tight text-2xl mb-2'>Funds</h1> */}
          <FundsCard />
        </div>
      </AnimateComponent>

      {/* Receive */}
      <AnimateComponent delay={200}>
        <div>
          <h1 className='font-bold tracking-tight text-2xl mb-2'>Receive</h1>
          <ReceiveCard />
        </div>
      </AnimateComponent>

      {/* Activity */}
      <AnimateComponent delay={400}>
        <div>
          <h1 className='font-bold tracking-tight text-2xl mb-2'>Activity</h1>
          <ActivityCard />
        </div>
      </AnimateComponent>

      <GenerateMetaButton />

    </div>
  )
}

