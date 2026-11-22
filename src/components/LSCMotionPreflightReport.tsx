
import {
  movimientosLSC,
  type RegistroMovimientoLSC,
} from "../data/lscMotionResources";

import {
  validarSecuenciaMovimiento,
} from "../data/lscMotionPlayer";

type EstadoChequeo = "correcto" | "pendiente" | "error";

type Chequeo = {
  titulo: string;
  estado: EstadoChequeo;
  detalles: string[];
};

type Props = {
  nombresHuesosDisponibles: string[];
  emaCargado: boolean;
};

function evaluarMovimiento(
  movimiento: RegistroMovimientoLSC,
  nombresHuesosDisponibles: string[],
  emaCargado: boolean
): Chequeo[] {
  const fuentePendiente: string[] = [];
  const fuenteErrores: string[] = [];

  if (!movimiento.fuente?.nombre?.trim()) {
    fuentePendiente.push("Falta identificar la fuente.");
  }

  if (!movimiento.fuente?.url?.trim()) {
    fuentePendiente.push("Falta el enlace de la fuente.");
  }

  if (!movimiento.fuente?.licencia?.trim()) {
    fuentePendiente.push("Falta documentar la licencia.");
  }

  if (movimiento.fuente?.permisoUso === "no-permitido") {
    fuenteErrores.push("La fuente no permite este uso.");
  } else if (movimiento.fuente?.permisoUso !== "permitido") {
    fuentePendiente.push("El permiso de uso no está confirmado.");
  }

  if (!movimiento.fuente?.evidenciaPermiso?.trim()) {
    fuentePendiente.push("Falta evidencia del permiso.");
  }

  if (
    movimiento.formato !== "video-referencia" &&
    !movimiento.archivoUrl?.trim()
  ) {
    fuentePendiente.push("Falta la ubicación del archivo.");
  }

  const capturaPendiente: string[] = [];
  const capturaErrores: string[] = [];

  if (!movimiento.captura?.dispositivo?.trim()) {
    capturaPendiente.push("Falta identificar el dispositivo.");
  }

  if (!movimiento.captura?.modeloEsqueleto?.trim()) {
    capturaPendiente.push("Falta identificar el esqueleto de captura.");
  }

  if (
    !Number.isInteger(movimiento.captura?.cantidadFotogramas) ||
    movimiento.captura.cantidadFotogramas <= 0
  ) {
    capturaPendiente.push("La cantidad de fotogramas no es válida.");
  }

  if (!movimiento.captura?.incluyeManos) {
    capturaErrores.push("La captura no declara las manos.");
  }

  if (
    !Number.isFinite(movimiento.captura?.frecuenciaFps) ||
    movimiento.captura.frecuenciaFps <= 0
  ) {
    capturaPendiente.push("La frecuencia FPS no es válida.");
  }

  if (
    movimiento.secuencia &&
    Array.isArray(movimiento.secuencia.fotogramas) &&
    movimiento.captura.cantidadFotogramas !==
      movimiento.secuencia.fotogramas.length
  ) {
    capturaErrores.push(
      "La cantidad declarada no coincide con los fotogramas reales."
    );
  }

  const estructuraPendiente: string[] = [];
  const estructuraErrores: string[] = [];

  if (!movimiento.secuencia) {
    estructuraPendiente.push("No hay una secuencia de movimiento registrada.");
  } else {
    if (movimiento.secuencia.senaId !== movimiento.senaId) {
      estructuraErrores.push(
        "La secuencia no corresponde al concepto del registro."
      );
    }

    const validacion = validarSecuenciaMovimiento(
      movimiento.secuencia
    );

    estructuraErrores.push(...validacion.errores);
  }

  const emaPendiente: string[] = [];
  const emaErrores: string[] = [];

  if (!movimiento.secuencia) {
    emaPendiente.push("No existe una secuencia para comparar.");
  } else if (!emaCargado || nombresHuesosDisponibles.length === 0) {
    emaPendiente.push("EMA todavía no está disponible para la comparación.");
  } else {
    const validacionEMA = validarSecuenciaMovimiento(
      movimiento.secuencia,
      nombresHuesosDisponibles
    );

    emaErrores.push(
      ...validacionEMA.errores.filter((error) =>
        error.includes("no existe en EMA")
      )
    );
  }

  const revisionPendiente: string[] = [];

  if (!movimiento.revision?.responsableLingüistico?.trim()) {
    revisionPendiente.push("Falta registrar al responsable lingüístico.");
  }

  if (!movimiento.revision?.responsableTecnico?.trim()) {
    revisionPendiente.push("Falta registrar al responsable técnico.");
  }

  if (!movimiento.revision?.fecha?.trim()) {
    revisionPendiente.push("Falta la fecha de revisión.");
  }

  if (movimiento.revision?.estado !== "apto-para-pruebas") {
    revisionPendiente.push(
      "El registro todavía no está habilitado para pruebas."
    );
  }

  const crearChequeo = (
    titulo: string,
    pendientes: string[],
    errores: string[] = []
  ): Chequeo => ({
    titulo,
    estado: errores.length > 0
      ? "error"
      : pendientes.length > 0
        ? "pendiente"
        : "correcto",
    detalles: [...errores, ...pendientes],
  });

  return [
    crearChequeo("Fuente y permisos", fuentePendiente, fuenteErrores),
    crearChequeo("Metadatos de captura", capturaPendiente, capturaErrores),
    crearChequeo("Integridad de la secuencia", estructuraPendiente, estructuraErrores),
    crearChequeo("Compatibilidad con EMA", emaPendiente, emaErrores),
    crearChequeo("Documentación de revisión", revisionPendiente),
  ];
}

function etiquetaEstado(estado: EstadoChequeo): string {
  if (estado === "correcto") return "Cumplido";
  if (estado === "error") return "Error";
  return "Pendiente";
}

export default function LSCMotionPreflightReport({
  nombresHuesosDisponibles,
  emaCargado,
}: Props) {
  if (movimientosLSC.length === 0) {
    return (
      <section className="lsc-motion-preflight">
        <h4>Informe de prevalidación de movimientos</h4>

        <p>
          Actualmente no hay movimientos registrados para evaluar.
        </p>

        <p>
          El informe se activará cuando se incorporen secuencias
          documentadas y autorizadas.
        </p>

        <small>
          No se generan señas ni movimientos artificiales para
          completar este catálogo.
        </small>
      </section>
    );
  }

  return (
    <section className="lsc-motion-preflight">
      <h4>Informe de prevalidación de movimientos</h4>

      <p>
        Comprobación independiente de los requisitos técnicos,
        documentales y de compatibilidad del avatar.
      </p>

      {movimientosLSC.map((movimiento) => {
        const chequeos = evaluarMovimiento(
          movimiento,
          nombresHuesosDisponibles,
          emaCargado
        );

        const errores = chequeos.some(
          (chequeo) => chequeo.estado === "error"
        );

        const pendientes = chequeos.some(
          (chequeo) => chequeo.estado === "pendiente"
        );

        const estadoGeneral = errores
          ? "Con errores"
          : pendientes
            ? "Pendiente"
            : "Prevalidación técnica completa";

        return (
          <article
            className="lsc-motion-preflight-item"
            key={movimiento.id}
          >
            <h5>{movimiento.nombre}</h5>

            <p>
              <strong>Concepto:</strong> {movimiento.senaId}
            </p>

            <p>
              <strong>Resultado:</strong> {estadoGeneral}
            </p>

            {chequeos.map((chequeo) => (
              <div
                className="lsc-motion-preflight-check"
                key={chequeo.titulo}
              >
                <strong>
                  {chequeo.titulo}: {etiquetaEstado(chequeo.estado)}
                </strong>

                {chequeo.detalles.length > 0 && (
                  <ul>
                    {chequeo.detalles.map((detalle, indice) => (
                      <li key={`${chequeo.titulo}-${indice}`}>
                        {detalle}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </article>
        );
      })}

      <p className="lsc-motion-preflight-note">
        Este informe comprueba requisitos técnicos y documentación.
        No certifica la corrección lingüística de una seña ni sustituye
        la revisión de personas competentes en LSC.
      </p>
    </section>
  );
}
