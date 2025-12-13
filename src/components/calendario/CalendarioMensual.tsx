import { useState } from 'react';
import { VisitaProgramada } from '@/types';
import { ChevronLeft, ChevronRight, User, Clock, Building2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarioMensualProps {
  visitas: VisitaProgramada[];
  onSelectVisita: (visita: VisitaProgramada) => void;
}

export function CalendarioMensual({ visitas, onSelectVisita }: CalendarioMensualProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad days to start on Monday
  const startDay = monthStart.getDay();
  const paddingDays = startDay === 0 ? 6 : startDay - 1;

  const getVisitasForDay = (day: Date) => {
    return visitas.filter((v) => isSameDay(new Date(v.fecha), day));
  };

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="card-elevated">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="h-9 w-9"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="h-9 w-9"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {diasSemana.map((dia) => (
            <div key={dia} className="py-2 text-center text-sm font-medium text-muted-foreground">
              {dia}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Padding days */}
          {Array.from({ length: paddingDays }).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square p-1" />
          ))}

          {/* Actual days */}
          {days.map((day) => {
            const dayVisitas = getVisitasForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`aspect-square p-1 rounded-lg transition-colors ${
                  isToday ? 'bg-accent' : 'hover:bg-muted/50'
                }`}
              >
                <div className="h-full flex flex-col">
                  <span
                    className={`text-sm font-medium ${
                      isToday ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  
                  {/* Visit indicators */}
                  {dayVisitas.length > 0 && (
                    <div className="flex-1 mt-1 space-y-0.5 overflow-hidden">
                      {dayVisitas.slice(0, 2).map((visita) => (
                        <button
                          key={visita.id}
                          onClick={() => onSelectVisita(visita)}
                          className={`w-full text-left text-xs p-1 rounded truncate transition-colors ${
                            visita.confirmada
                              ? 'bg-primary/10 text-primary hover:bg-primary/20'
                              : 'bg-warning/10 text-warning hover:bg-warning/20'
                          }`}
                        >
                          {visita.profesorNombre.split(' ')[0]}
                        </button>
                      ))}
                      {dayVisitas.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{dayVisitas.length - 2} más
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 pb-5 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary/30" />
          <span className="text-muted-foreground">Confirmada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning/30" />
          <span className="text-muted-foreground">Pendiente</span>
        </div>
      </div>
    </div>
  );
}
