import { Layout } from '@/components/layout/Layout';
import { HelpCircle, BookOpen, MessageCircle, Mail, Phone, ChevronRight } from 'lucide-react';

const faqs = [
  {
    pregunta: '¿Cómo registro una nueva observación?',
    respuesta: 'Ve a la sección "Observaciones", busca al profesor, sube el documento de observación y completa el formulario con las rúbricas correspondientes.',
  },
  {
    pregunta: '¿Cómo programo una visita?',
    respuesta: 'En "Calendario", sube el archivo con las fechas programadas y confirma la agenda. El sistema enviará notificaciones automáticas.',
  },
  {
    pregunta: '¿Cómo se calcula el nivel de logro total?',
    respuesta: 'El nivel de logro total es el promedio de los niveles seleccionados en cada una de las 5 rúbricas obligatorias.',
  },
  {
    pregunta: '¿Puedo modificar una visita ya registrada?',
    respuesta: 'Por el momento, las visitas registradas no pueden ser editadas. Contacta al administrador si necesitas hacer cambios.',
  },
  {
    pregunta: '¿Cómo exporto el historial de un profesor?',
    respuesta: 'Esta funcionalidad estará disponible próximamente. Mientras tanto, puedes ver todo el historial en la sección correspondiente.',
  },
];

export default function Ayuda() {
  return (
    <Layout>
      <div className="animate-fade-in max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Centro de Ayuda
            </h1>
          </div>
          <p className="text-muted-foreground">
            Encuentra respuestas a tus preguntas y contacta con soporte.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* FAQ */}
          <div className="md:col-span-2">
            <h2 className="font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Preguntas frecuentes
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <details
                  key={index}
                  className="group card-flat overflow-hidden"
                >
                  <summary className="p-4 cursor-pointer list-none flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <span className="font-medium text-foreground">{faq.pregunta}</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-4 pb-4 text-muted-foreground">
                    {faq.respuesta}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* Contact cards */}
          <div className="card-elevated p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Chat en vivo</h3>
                <p className="text-sm text-muted-foreground">Respuesta inmediata</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Nuestro equipo está disponible de lunes a viernes de 8:00 a 18:00.
            </p>
            <button className="btn-primary w-full">
              Iniciar chat
            </button>
          </div>

          <div className="card-elevated p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Correo electrónico</h3>
                <p className="text-sm text-muted-foreground">Respuesta en 24h</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Envíanos un correo detallando tu consulta o problema.
            </p>
            <a
              href="mailto:soporte@observadoc.edu.pe"
              className="btn-secondary w-full inline-block text-center"
            >
              soporte@observadoc.edu.pe
            </a>
          </div>

          <div className="md:col-span-2 card-flat p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Phone className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Línea de soporte</h3>
              <p className="text-muted-foreground">
                (01) 555-0123 • Lunes a Viernes 8:00 - 18:00
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
