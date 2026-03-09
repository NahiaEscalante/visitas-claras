import { useState } from 'react';
import { X, Save, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast as sonnerToast } from 'sonner';
import { apiCreateProfesor } from '@/api/endpoints';
import { isApiModeEnabled } from '@/api/config';
import { Profesor } from '@/types';

interface FormularioProfesorProps {
  onCreado: (profesor: Profesor) => void;
  onCancelar: () => void;
}

export function FormularioProfesor({ onCreado, onCancelar }: FormularioProfesorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    ie: '',
    salon: '',
    foto: '',
    dni: '',
    especialidad: '',
    cargoLaboral: '',
    nivelEducativo: '',
    grado: '',
    seccion: '',
    areasCurriculares: '',
    celular: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación local
    if (!form.nombre.trim() || !form.apellido.trim() || !form.ie.trim() || !form.salon.trim()) {
      sonnerToast.error('Campos obligatorios', {
        description: 'Nombre, Apellido, I.E. y Salón son requeridos.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        foto: form.foto.trim() || null,
        ie: form.ie.trim(),
        salon: form.salon.trim(),
        dni: form.dni.trim() || null,
        especialidad: form.especialidad.trim() || null,
        cargoLaboral: form.cargoLaboral.trim() || null,
        nivelEducativo: form.nivelEducativo.trim() || null,
        grado: form.grado.trim() || null,
        seccion: form.seccion.trim() || null,
        areasCurriculares: form.areasCurriculares.trim() || null,
        celular: form.celular.trim() || null,
      };

      const profesor = await apiCreateProfesor(payload);
      sonnerToast.success('Profesor creado exitosamente');
      onCreado(profesor);
    } catch (error) {
      console.error('Error al crear profesor:', error);
      sonnerToast.error('Error al crear profesor', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="card-elevated p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Nuevo profesor</h3>
              <p className="text-sm text-muted-foreground">Registra un nuevo profesor en el sistema</p>
            </div>
          </div>
          <button
            onClick={onCancelar}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campos obligatorios */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">*</span>
              Datos obligatorios
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  placeholder="María"
                  required
                />
              </div>
              <div>
                <Label htmlFor="apellido">Apellido</Label>
                <Input
                  id="apellido"
                  value={form.apellido}
                  onChange={(e) => handleChange('apellido', e.target.value)}
                  placeholder="García López"
                  required
                />
              </div>
              <div>
                <Label htmlFor="ie">Institución Educativa</Label>
                <Input
                  id="ie"
                  value={form.ie}
                  onChange={(e) => handleChange('ie', e.target.value)}
                  placeholder="IE San Martín"
                  required
                />
              </div>
              <div>
                <Label htmlFor="salon">Salón</Label>
                <Input
                  id="salon"
                  value={form.salon}
                  onChange={(e) => handleChange('salon', e.target.value)}
                  placeholder="3ro A"
                  required
                />
              </div>
            </div>
          </div>

          {/* Campos opcionales */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Datos adicionales (opcionales)</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  value={form.dni}
                  onChange={(e) => handleChange('dni', e.target.value)}
                  placeholder="12345678"
                />
              </div>
              <div>
                <Label htmlFor="especialidad">Especialidad</Label>
                <Input
                  id="especialidad"
                  value={form.especialidad}
                  onChange={(e) => handleChange('especialidad', e.target.value)}
                  placeholder="Comunicación"
                />
              </div>
              <div>
                <Label htmlFor="cargoLaboral">Cargo laboral</Label>
                <Input
                  id="cargoLaboral"
                  value={form.cargoLaboral}
                  onChange={(e) => handleChange('cargoLaboral', e.target.value)}
                  placeholder="Docente"
                />
              </div>
              <div>
                <Label htmlFor="nivelEducativo">Nivel educativo</Label>
                <Input
                  id="nivelEducativo"
                  value={form.nivelEducativo}
                  onChange={(e) => handleChange('nivelEducativo', e.target.value)}
                  placeholder="Primaria"
                />
              </div>
              <div>
                <Label htmlFor="grado">Grado</Label>
                <Input
                  id="grado"
                  value={form.grado}
                  onChange={(e) => handleChange('grado', e.target.value)}
                  placeholder="3ro"
                />
              </div>
              <div>
                <Label htmlFor="seccion">Sección</Label>
                <Input
                  id="seccion"
                  value={form.seccion}
                  onChange={(e) => handleChange('seccion', e.target.value)}
                  placeholder="A"
                />
              </div>
              <div>
                <Label htmlFor="areasCurriculares">Áreas curriculares</Label>
                <Input
                  id="areasCurriculares"
                  value={form.areasCurriculares}
                  onChange={(e) => handleChange('areasCurriculares', e.target.value)}
                  placeholder="Comunicación, Matemáticas"
                />
              </div>
              <div>
                <Label htmlFor="celular">Celular</Label>
                <Input
                  id="celular"
                  value={form.celular}
                  onChange={(e) => handleChange('celular', e.target.value)}
                  placeholder="987654321"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="foto">URL de foto (opcional)</Label>
                <Input
                  id="foto"
                  value={form.foto}
                  onChange={(e) => handleChange('foto', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancelar}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !form.nombre.trim() || !form.apellido.trim() || !form.ie.trim() || !form.salon.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear profesor
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
