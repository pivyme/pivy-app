import { useAuth } from '@/providers/AuthProvider';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Tab, Tabs } from '@heroui/react';
import { WalletIcon, ArrowDownLeftIcon, ArrowUpRightIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ActivityItem from './ActivityItem';

export default function ActivityCard() {
  const { accessToken } = useAuth();
  const [activities, setActivities] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [expandedItems, setExpandedItems] = useState(new Set());

  const TABS = [
    {
      id: 'all',
      label: 'All',
      icon: <WalletIcon className='w-3.5 h-3.5' />
    },
    {
      id: 'incoming',
      label: 'Incoming',
      icon: <ArrowDownLeftIcon className='w-3.5 h-3.5' />
    },
    {
      id: 'outgoing',
      label: 'Outgoing',
      icon: <ArrowUpRightIcon className='w-3.5 h-3.5' />
    }
  ];

  const handleFetchActivities = async () => {
    const activities = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/user/activities`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    setActivities(activities.data);
  };

  useEffect(() => {
    handleFetchActivities();
  }, []);

  const filteredActivities = activities?.filter(activity => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'incoming') return activity.type === 'PAYMENT';
    if (selectedTab === 'outgoing') return activity.type === 'WITHDRAWAL';
    return true;
  });

  const toggleItem = (id) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className='nice-card p-4 w-full'>
      <div className='w-fit'>
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={setSelectedTab}
          radius='full'
          classNames={{
            base: "w-fit",
            tabList: "gap-1 p-1 bg-gray-100/80 rounded-full",
            tab: "px-3 h-8 data-[selected=true]:bg-white data-[selected=true]:shadow-sm",
            tabContent: "group-data-[selected=true]:text-gray-800 text-sm font-medium",
            cursor: "hidden"
          }}
          size='sm'
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.id}
              title={
                <div className='flex flex-row items-center gap-1.5'>
                  {tab.icon}
                  <p className='text-sm font-medium'>{tab.label}</p>
                </div>
              }
            />
          ))}
        </Tabs>
      </div>

      <div className='mt-4'>
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2"
          >
            {filteredActivities?.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                isExpanded={expandedItems.has(activity.id)}
                onToggle={() => toggleItem(activity.id)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
