import { useAuth } from '@/providers/AuthProvider';
import React, { useState } from 'react';
import { Tab, Tabs } from '@heroui/react';
import { WalletIcon, ArrowDownLeftIcon, ArrowUpRightIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ActivityItem from './ActivityItem';
import { useDashboard } from '@/contexts/DashboardContext';

const EmptyState = ({ type }) => {
  const states = {
    all: {
      icon: '✨',
      title: 'No Transactions Yet',
      description: 'Your transaction history will appear here'
    },
    incoming: {
      icon: '💫',
      title: 'No Incoming Transactions',
      description: 'Share your payment link to receive funds'
    },
    outgoing: {
      icon: '🌟',
      title: 'No Outgoing Transactions',
      description: 'Send funds to get started'
    }
  };

  const { icon, title, description } = states[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col items-center justify-center py-8 px-4"
    >
      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-gray-900 font-semibold mb-1">{title}</h3>
      <p className="text-gray-500 text-sm text-center">{description}</p>
    </motion.div>
  );
};

export default function ActivityCard() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const { activities } = useDashboard();

  console.log('activities', activities)

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
      <div className='flex items-center justify-between'>
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

        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full"
        >
          <span className="text-sm font-medium text-gray-900">
            {filteredActivities?.length || 0}
          </span>
          <span className="text-sm text-gray-500">
            {selectedTab === 'incoming' ? 'payments received' :
              selectedTab === 'outgoing' ? 'withdrawals made' :
                'transactions total'}
          </span>
          <span className="text-base">
            {selectedTab === 'incoming' ? '🎁' :
              selectedTab === 'outgoing' ? '💸' :
                '✨'}
          </span>
        </motion.div>
      </div>

      <div className='mt-4 h-full min-h-[10vh] max-h-[28vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300 pr-2'>
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2"
          >
            {filteredActivities?.length > 0 ? (
              filteredActivities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  isExpanded={expandedItems.has(activity.id)}
                  onToggle={() => toggleItem(activity.id)}
                />
              ))
            ) : (
              <EmptyState type={selectedTab} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
