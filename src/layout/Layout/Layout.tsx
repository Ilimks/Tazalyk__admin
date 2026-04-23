import styles from './Layout.module.scss';
import { Sidebar } from '../Sidebar/Sidebar';
import { Header } from '../Header/Header';
import type { ActiveTab } from '@/types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  availableTabs: ActiveTab[];
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  availableTabs,
}) => {
  return (
    <div className={styles.layout}>
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={onTabChange}
        availableTabs={availableTabs}
      />
      <div className={styles.mainContent}>
        <Header />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};