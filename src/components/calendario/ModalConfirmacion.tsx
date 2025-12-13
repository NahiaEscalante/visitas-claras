import { useState } from 'react';
import { VisitaProgramada } from '@/types';
import { X, Send, Check, Mail, MessageCircle, Calendar, Clock, Building2, GraduationCap, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface ModalConfirmacionProps {
  visita: VisitaProgramada;
  onClose: () => void;
  onConfirmar: () => void;
}

export function ModalConfirmacion({ visita, onClose, onConfirmar }: ModalConfirmacionProps) {
  const { toast } = useToast();
  const [enviado, setEnviado] = useState(false);

  const mensaje = `Estimado/a ${visita.profesorNombre}, su visita ha sido programada para el día ${format(new Date(visita.fecha), "d 'de' MMMM 'de' yyyy", { locale: es })} a las ${visita.hora}, en la ${visita.ie} – salón ${visita.salon}. Mensaje enviado a usted y a su director responsable.`;

  const handleEnviar = () => {
    setEnviado(true);
    onConfirmar();
    toast({
      title: 'Notificación enviada',
      description: 'El mensaje ha sido enviado por correo y WhatsApp.',
    });
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(mensaje);
    toast({
      title: 'Copiado',
      description: 'El mensaje ha sido copiado al portapapeles.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-elevated animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-semibold text-lg text-foreground">
            {enviado ? 'Notificación enviada' : 'Confirmar visita programada'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Visit details */}
          <div className="p-4 bg-muted/50 rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <span className="font-semibold text-accent-foreground">
                  {visita.profesorNombre.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium text-foreground">{visita.profesorNombre}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {visita.ie}
                  </span>
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {visita.salon}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2 border-t border-border">
              <span className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                {format(new Date(visita.fecha), "d 'de' MMMM, yyyy", { locale: es })}
              </span>
              <span className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                {visita.hora}
              </span>
            </div>
          </div>

          {/* Message preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">Mensaje a enviar:</p>
              <button
                onClick={handleCopiar}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar
              </button>
            </div>
            <div className="p-4 bg-accent/50 rounded-lg text-sm text-foreground leading-relaxed">
              {mensaje}
            </div>
          </div>

          {/* Send channels */}
          {!enviado && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Correo electrónico
              </span>
              <span className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </span>
            </div>
          )}

          {/* Success state */}
          {enviado && (
            <div className="flex items-center gap-3 p-4 bg-success/10 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center">
                <Check className="w-5 h-5 text-success-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Mensaje enviado exitosamente</p>
                <p className="text-sm text-muted-foreground">
                  Se notificó al profesor y al director responsable.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 pt-0">
          {!enviado ? (
            <div className="flex gap-3">
              <Button onClick={onClose} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleEnviar} className="btn-primary flex-1">
                <Send className="w-4 h-4 mr-2" />
                Enviar notificación
              </Button>
            </div>
          ) : (
            <Button onClick={onClose} className="w-full btn-primary">
              Cerrar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
