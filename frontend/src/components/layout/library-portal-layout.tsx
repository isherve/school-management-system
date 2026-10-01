import { Outlet } from 'react-router-dom';
import { LibraryPortalSidebar } from './library-portal-sidebar';
import { Header } from './header';
import { useSidebarStore } from '@/stores';
import { cn } from '@/lib/utils';

export function LibraryPortalLayout() {
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-muted/30">
      <LibraryPortalSidebar />
      <div className={cn('transition-all duration-300', isCollapsed ? 'lg:ml-16' : 'lg:ml-64')}>
        <Header />
        <main className="p-4 lg:p-6" id="main-content" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
