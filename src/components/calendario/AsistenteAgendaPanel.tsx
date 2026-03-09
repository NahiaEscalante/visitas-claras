import { useState, useRef, useEffect } from 'react';
import { Sparkles, Paperclip, Send, User, Building2, GraduationCap, Clock, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarChatResponse, CalendarChatAction } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { isApiModeEnabled } from '@/api/config';
import { apiCalendarChatMessage, apiCalendarChatConfirm, apiCalendarChatCancel, apiUploadArchivo } from '@/api/endpoints';
import { useApp } from '@/context/AppContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Tipos internos ────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  /** Datos de propuesta (solo en mensajes tipo proposal) */
  proposal?: {
    proposalId: string;
    actions: CalendarChatAction[];
  };
  /** Resultados de confirmación */
  results?: CalendarChatResponse['results'];
}

interface AsistenteAgendaPanelProps {
  onCambiosAplicados?: () => void;
}

// ─── Componente ────────────────────────────────────────────────────────

export function AsistenteAgendaPanel({ onCambiosAplicados }: AsistenteAgendaPanelProps) {
  const { toast } = useToast();
  const { refreshData } = useApp();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hola 👋 Soy tu asistente de agenda. Dime qué necesitas:\n\n• Crear una visita\n• Reprogramar una visita\n• Cancelar una visita\n\nEjemplo: "Programa una visita a María García el viernes a las 10:00"',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pendingProposalId, setPendingProposalId] = useState<string | null>(null);
  const [pendingArchivoId, setPendingArchivoId] = useState<string | null>(null);

  // Auto-scroll al nuevo mensaje
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Enviar mensaje ──

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userText = inputValue.trim();
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      if (!isApiModeEnabled()) {
        // Fallback mock: responder con un genérico
        await new Promise(r => setTimeout(r, 800));
        addAssistantMessage('Esta funcionalidad requiere la API activa. Configura VITE_API_BASE_URL para usar el asistente de agenda.');
        return;
      }

      const response = await apiCalendarChatMessage({
        text: userText,
        conversationId,
        archivoId: pendingArchivoId,
      });

      // Limpiar archivoId pendiente tras usarlo
      setPendingArchivoId(null);

      handleChatResponse(response);
    } catch (error) {
      addAssistantMessage(`⚠️ Error: ${error instanceof Error ? error.message : 'No se pudo procesar el mensaje'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Procesar respuesta del backend ──

  const handleChatResponse = (data: CalendarChatResponse) => {
    switch (data.type) {
      case 'ask':
        addAssistantMessage(data.message + (data.missingFields?.length
          ? `\n\nNecesito: ${data.missingFields.join(', ')}`
          : ''));
        break;

      case 'info':
        addAssistantMessage(data.message);
        break;

      case 'proposal':
        setPendingProposalId(data.proposalId ?? null);
        setMessages(prev => [...prev, {
          id: `proposal-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          proposal: {
            proposalId: data.proposalId!,
            actions: data.actions || [],
          },
        }]);
        break;

      case 'result':
        setPendingProposalId(null);
        setMessages(prev => [...prev, {
          id: `result-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          results: data.results,
        }]);
        // Refrescar datos del contexto tras cambios exitosos
        refreshData();
        onCambiosAplicados?.();
        break;

      default:
        addAssistantMessage(data.message || 'Respuesta no reconocida.');
    }
  };

  // ── Confirmar propuesta ──

  const handleConfirmar = async () => {
    if (!pendingProposalId || isProcessing) return;

    setIsProcessing(true);
    try {
      const response = await apiCalendarChatConfirm({ proposalId: pendingProposalId });
      handleChatResponse(response);
      toast({
        title: 'Cambios aplicados',
        description: 'Los cambios en la agenda se han confirmado exitosamente.',
      });
    } catch (error) {
      addAssistantMessage(`⚠️ Error al confirmar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Cancelar propuesta ──

  const handleDescartar = async () => {
    if (!pendingProposalId || isProcessing) return;

    setIsProcessing(true);
    try {
      const response = await apiCalendarChatCancel({ proposalId: pendingProposalId });
      setPendingProposalId(null);
      handleChatResponse(response);
    } catch (error) {
      addAssistantMessage('Propuesta descartada.');
      setPendingProposalId(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Subir archivo ──

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isApiModeEnabled()) {
      toast({ title: 'Requiere API', description: 'Configura VITE_API_BASE_URL para usar esta funcionalidad.' });
      return;
    }

    setIsProcessing(true);
    addAssistantMessage(`📎 Procesando archivo: ${file.name}...`);

    try {
      const uploadResult = await apiUploadArchivo(file, 'documento');
      setPendingArchivoId(uploadResult.id);
      addAssistantMessage(`✅ Archivo "${file.name}" subido. Ahora escribe qué quieres hacer con él (ej: "Programa las visitas del archivo").`);
    } catch (error) {
      addAssistantMessage(`⚠️ Error al subir archivo: ${error instanceof Error ? error.message : 'No se pudo subir'}`);
    } finally {
      setIsProcessing(false);
      // Limpiar el input para permitir subir el mismo archivo otra vez
      e.target.value = '';
    }
  };

  // ── Helper ──

  const addAssistantMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
    }]);
  };

  // ── Render helpers ──

  const renderActionCard = (action: CalendarChatAction, index: number) => {
    const actionLabels: Record<string, string> = {
      create: '📅 Crear visita',
      update: '✏️ Modificar visita',
      cancel: '❌ Cancelar visita',
      reschedule: '🔄 Reprogramar visita',
    };

    return (
      <div key={index} className="bg-card rounded-lg p-3 border">
        <div className="space-y-2">
          <span className="text-xs font-medium text-primary">
            {actionLabels[action.actionType] || action.actionType}
          </span>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">{action.profesorNombre || 'Profesor'}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {action.ie && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {action.ie}
                  </span>
                )}
                {action.salon && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    {action.salon}
                  </span>
                )}
              </div>
            </div>
          </div>
          {action.fecha && (
            <div className="flex items-center gap-2 text-xs pt-1 border-t border-border/60">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>
                {format(new Date(action.fecha + 'T12:00:00'), "d 'de' MMMM, yyyy", { locale: es })}
                {action.hora && ` • ${action.hora}`}
              </span>
              {action.duracionMinutos && (
                <span className="text-muted-foreground">({action.duracionMinutos} min)</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResultBadge = (result: { actionType: string; ok: boolean }) => (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
      result.ok ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    }`}>
      {result.ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {result.actionType}
    </span>
  );

  return (
    <div className="flex flex-col bg-card rounded-xl border shadow-sm" style={{ height: 'calc(100vh - 12rem)', maxHeight: '700px', minHeight: '400px' }}>
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Asistente de agenda</h3>
              <p className="text-xs text-muted-foreground">Lenguaje natural, con confirmación.</p>
            </div>
          </div>
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
            <Button variant="outline" size="sm" disabled={isProcessing}>
              <Paperclip className="w-4 h-4 mr-1" />
              <span className="text-xs">Adjuntar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Area — scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              <p className="text-sm whitespace-pre-line">{message.content}</p>

              {/* Acciones propuestas */}
              {message.proposal && message.proposal.actions.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.proposal.actions.map((action, i) => renderActionCard(action, i))}
                </div>
              )}

              {/* Resultados de confirmación */}
              {message.results && message.results.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {message.results.map((r, i) => (
                    <span key={i}>{renderResultBadge(r)}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Procesando...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Botones de propuesta pendiente */}
      {pendingProposalId && (
        <div className="px-4 py-3 border-t border-border bg-muted/30 flex-shrink-0">
          <div className="flex gap-2">
            <Button onClick={handleDescartar} variant="outline" size="sm" className="flex-1" disabled={isProcessing}>
              Descartar
            </Button>
            <Button onClick={handleConfirmar} size="sm" className="flex-1" disabled={isProcessing}>
              {isProcessing ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Confirmando...</>
              ) : (
                'Confirmar cambios'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Predefined Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 py-2 border-t border-border flex-shrink-0 space-y-1.5">
          <p className="text-[11px] text-muted-foreground font-medium">Sugerencias rápidas:</p>
          {[
            'Programa una visita a Luis Alberto Ramírez Soto el 10 de marzo de 2026 a las 9:00',
            'Programa una visita a José Miguel Vargas Quispe y María Fernanda Salazar López el 11 de marzo de 2026 a las 10:00',
            'Programa una visita a Rosario Gómez el 12 de marzo de 2026 a las 14:00',
          ].map((suggestion, i) => (
            <button
              key={i}
              onClick={() => setInputValue(suggestion)}
              className="block w-full text-left border border-border/60 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder='Ej: "Programa a María para el lunes a las 10:00"'
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 text-sm"
            disabled={isProcessing}
          />
          <Button onClick={handleSendMessage} disabled={isProcessing || !inputValue.trim()} size="sm">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
