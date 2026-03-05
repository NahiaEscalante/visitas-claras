import { useState } from 'react';
import { Sparkles, Paperclip, Send, User, Building2, GraduationCap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VisitaProgramada } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

interface CambioPropuesto {
  id: string;
  profesorNombre: string;
  ie: string;
  salon: string;
  fecha: string;
  hora: string;
  tipo: 'crear' | 'reprogramar' | 'cancelar';
}

interface AsistenteAgendaPanelProps {
  onConfirmarCambio: (cambio: CambioPropuesto) => void;
}

export function AsistenteAgendaPanel({ onConfirmarCambio }: AsistenteAgendaPanelProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Dime qué necesitas: reprogramar, cancelar o crear visitas.\nEjemplo: "Reprograma a Roberto para 2026-03-21 10:30"',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [cambioPropuesto, setCambioPropuesto] = useState<CambioPropuesto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Simular procesamiento del mensaje
    setTimeout(() => {
      const respuesta = procesarMensaje(inputValue);
      setMessages(prev => [...prev, respuesta.assistantMessage]);
      
      if (respuesta.cambioPropuesto) {
        setCambioPropuesto(respuesta.cambioPropuesto);
      }
      
      setIsProcessing(false);
    }, 1000);
  };

  const procesarMensaje = (mensaje: string): {
    assistantMessage: ChatMessage;
    cambioPropuesto?: CambioPropuesto;
  } => {
    const lowerMensaje = mensaje.toLowerCase();
    
    // Simular extracción de información
    let cambio: CambioPropuesto | null = null;
    let respuesta = '';

    if (lowerMensaje.includes('reprograma') || lowerMensaje.includes('reprogramar')) {
      // Extraer nombre y fecha/hora (simulado)
      cambio = {
        id: Date.now().toString(),
        profesorNombre: 'Juan Pérez',
        ie: 'IE San Martin',
        salon: 'Salón A',
        fecha: '2026-03-21',
        hora: '10:30',
        tipo: 'reprogramar'
      };
      respuesta = 'Listo. Propuse reprogramar a Juan Pérez para 21 de marzo a las 10:30.\nConfirma el borrador.';
    } else if (lowerMensaje.includes('cancela') || lowerMensaje.includes('cancelar')) {
      cambio = {
        id: Date.now().toString(),
        profesorNombre: 'Juan Pérez',
        ie: 'IE San Martin',
        salon: 'Salón A',
        fecha: '2026-03-15',
        hora: '10:00',
        tipo: 'cancelar'
      };
      respuesta = 'Entendido. Propuse cancelar la visita de Juan Pérez del 15 de marzo.\nConfirma el borrador.';
    } else if (lowerMensaje.includes('crea') || lowerMensaje.includes('crear') || lowerMensaje.includes('agenda')) {
      cambio = {
        id: Date.now().toString(),
        profesorNombre: 'María González',
        ie: 'IE Los Pinos',
        salon: 'Salón B',
        fecha: '2026-03-25',
        hora: '14:00',
        tipo: 'crear'
      };
      respuesta = 'Perfecto. Propuse crear una nueva visita para María González el 25 de marzo a las 14:00.\nConfirma el borrador.';
    } else {
      respuesta = 'No entendí la solicitud. Por favor, dime si quieres:\n• Reprogramar una visita existente\n• Cancelar una visita\n• Crear una nueva visita\n\nEjemplo: "Reprograma a Roberto para 2026-03-21 10:30"';
    }

    return {
      assistantMessage: {
        id: Date.now().toString(),
        role: 'assistant',
        content: respuesta,
        timestamp: new Date()
      },
      cambioPropuesto: cambio || undefined
    };
  };

  const handleConfirmarCambio = () => {
    if (!cambioPropuesto) return;

    onConfirmarCambio(cambioPropuesto);
    
    toast({
      title: 'Cambio confirmado',
      description: `Se ha ${cambioPropuesto.tipo}do la visita exitosamente.`,
    });

    // Limpiar el borrador y añadir mensaje de confirmación
    setCambioPropuesto(null);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: `✅ Cambio confirmado: ${cambioPropuesto.tipo === 'crear' ? 'Creada' : cambioPropuesto.tipo === 'reprogramar' ? 'Reprogramada' : 'Cancelada'} la visita de ${cambioPropuesto.profesorNombre}.`,
      timestamp: new Date()
    }]);
  };

  const handleDescartarCambio = () => {
    setCambioPropuesto(null);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Borrador descartado. Si necesitas hacer otro cambio, dímelo.',
      timestamp: new Date()
    }]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast({
        title: 'Archivo recibido',
        description: `Procesando ${file.name} para extraer fechas...`,
      });
      
      // Simular procesamiento de archivo
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `He analizado ${file.name} y encontré 3 fechas posibles. ¿Cuál te gustaría procesar?\n\n1. Juan Pérez - 15 de marzo, 10:00\n2. María González - 20 de marzo, 14:30\n3. Roberto López - 25 de marzo, 09:00`,
          timestamp: new Date()
        }]);
      }, 1500);
    }
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-xl border shadow-sm">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Asistente de agenda</h3>
              <p className="text-sm text-muted-foreground">Reagenda en lenguaje natural, con confirmación.</p>
            </div>
          </div>
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" size="sm">
              <Paperclip className="w-4 h-4 mr-2" />
              Adjuntar
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              <p className="text-sm whitespace-pre-line">{message.content}</p>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-3 py-2">
              <p className="text-sm text-muted-foreground">Procesando...</p>
            </div>
          </div>
        )}
      </div>

      {/* Cambio Propuesto Card */}
      {cambioPropuesto && (
        <div className="p-5 border-t border-border bg-muted/30">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">✨ Cambio propuesto — Borrador listo</span>
            </div>
            
            <div className="bg-card rounded-lg p-4 border">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                    <User className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{cambioPropuesto.profesorNombre}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {cambioPropuesto.ie}
                      </span>
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {cambioPropuesto.salon}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 pt-2 border-t border-border">
                  <span className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    {format(new Date(cambioPropuesto.fecha), "d 'de' MMMM, yyyy", { locale: es })} • {cambioPropuesto.hora}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-warning/10 text-warning">
                    Pendiente de confirmar
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleDescartarCambio} variant="outline" className="flex-1">
                Descartar
              </Button>
              <Button onClick={handleConfirmarCambio} className="flex-1">
                Confirmar cambios
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-5 border-t border-border">
        <div className="flex gap-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ej: Reprograma a Roberto para 2026-03-21 10:30"
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={isProcessing}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
