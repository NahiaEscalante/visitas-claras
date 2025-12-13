import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: just redirect to dashboard
    navigate('/observaciones');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-sky-400 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-xl text-foreground">ObservaDoc</h1>
              <p className="text-sm text-muted-foreground">Plataforma de Observaciones</p>
            </div>
          </div>

          {/* Card */}
          <div className="card-elevated p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Bienvenido
              </h2>
              <p className="text-muted-foreground">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="director@ejemplo.edu.pe"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-background border-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-background border-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-input" />
                  <span className="text-muted-foreground">Recordarme</span>
                </label>
                <a href="#" className="text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full h-12 btn-primary text-base font-medium"
              >
                Ingresar
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            ¿Necesitas ayuda?{' '}
            <a href="#" className="text-primary hover:underline">
              Contacta soporte
            </a>
          </p>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/10 via-sky-100 to-accent items-center justify-center p-12">
        <div className="max-w-lg text-center animate-slide-up">
          <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary to-sky-400 flex items-center justify-center shadow-elevated">
            <ClipboardList className="w-16 h-16 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Gestiona tus observaciones de manera eficiente
          </h2>
          <p className="text-lg text-muted-foreground">
            Registra visitas, evalúa con rúbricas y programa encuentros con tu equipo docente de forma simple y organizada.
          </p>
        </div>
      </div>
    </div>
  );
}
