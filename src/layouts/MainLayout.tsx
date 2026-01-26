import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/context/authStore';
import { LogOut, Home, FolderOpen, User } from 'lucide-react';
import { NotificacionesDropdown } from '@/components/NotificacionesDropdown';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/procesos', icon: FolderOpen, label: 'Procesos' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-primary-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-text">
                Sistema de Procesos Sumariales
              </h1>
              <nav className="flex space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-100 text-primary-400'
                          : 'text-gray-600 hover:bg-primary-50'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notificaciones - Solo para admin */}
              {user?.role === 'admin' && <NotificacionesDropdown />}

              <div className="flex items-center space-x-2 text-sm">
                <User size={16} className="text-gray-500" />
                <span className="text-gray-700">{user?.email}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-400">
                  {user?.role === 'admin' ? 'Administrador' : user?.role === 'juridica' ? 'Jurídica' : 'Visualizador'}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
