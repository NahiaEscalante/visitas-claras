import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, Calendar, History, HelpCircle, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

const navItems = [
  { to: '/observaciones', label: 'Observaciones', icon: ClipboardList },
  { to: '/calendario', label: 'Calendario', icon: Calendar },
  { to: '/historial', label: 'Historial', icon: History, disabled: true },
  { to: '/ayuda', label: 'Ayuda', icon: HelpCircle, disabled: true },
];

const roleLabels: Record<string, string> = {
  director: 'Director',
  supervisor: 'Supervisor',
  profesor: 'Profesor',
  admin: 'Administrador',
};

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useApp();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada exitosamente');
      navigate('/');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border/60 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <a href="#inicio" className="flex items-center gap-2">
          <img
            src="/logo-criteria.svg"
            alt="Nexo logo"
            className="h-32 w-auto object-contain"
          />
        </a>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon, disabled }) => {
              if (disabled) {
                return (
                  <span
                    key={to}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed opacity-50"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </span>
                );
              }
              const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-accent text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={currentUser.foto} alt={currentUser.nombre} />
                  <AvatarFallback className="bg-accent text-accent-foreground">
                    {currentUser.nombre.charAt(0)}{currentUser.apellido.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {currentUser.nombre} {currentUser.apellido}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {roleLabels[currentUser.rol] || currentUser.rol}
                    {currentUser.ie && ` • ${currentUser.ie}`}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navItems.map(({ to, label, icon: Icon, disabled }) => {
            if (disabled) {
              return (
                <span
                  key={to}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap text-gray-400 cursor-not-allowed opacity-50"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </span>
              );
            }
            const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-accent text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
