import { Outlet, Link } from 'react-router-dom';
import ReceiveWalletProvider from '../providers/ReceiveWalletProvider';
import PolkadotBackground from '../components/shared/PolkadotBackground';
import CreateOwnLinkBadge from '@/components/app/receive/CreateOwnLinkBadge';

export default function ReceiveLayout() {
  console.log('receive layout')
  return (
    <div className="light relative">
      <ReceiveWalletProvider>
        <PolkadotBackground />
        <Outlet />
      </ReceiveWalletProvider>
    </div>
  );
}
