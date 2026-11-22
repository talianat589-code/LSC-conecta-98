
export type FotogramaMovimientoGuardado = {
  tiempoMs: number;
  cambioPostura: number;
  desplazamientoMuneca: number;
  caracteristicas: number[];
};

export type SegmentoMovimientoGuardado = {
  id: string;
  inicio: number;
  fin: number;
  fotogramas: number;
  movimientoMaximo: number;
  trayectoria: FotogramaMovimientoGuardado[];
  lado: "Left" | "Right" | "No identificado";
  estado: "experimental";
  estadoValidacion: "no_validado_linguisticamente";
  reviewStatus?: "pendiente" | "revisada" | "descartada";

  validacionLinguistica?:
    | "pendiente"
    | "validada"
    | "requiere-correccion";

  fechaImportacion?: string;
};

const CLAVE_ALMACENAMIENTO = "lsc-conecta-motion-dataset-v1";
const MAX_SEGMENTOS = 200;

function esNumeroFinito(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}

export function validarSegmentoMovimiento(
  valor: unknown
): valor is SegmentoMovimientoGuardado {
  if (!valor || typeof valor !== "object") return false;

  const segmento = valor as SegmentoMovimientoGuardado;

  return (
    typeof segmento.id === "string" &&
    segmento.id.length > 0 &&
    esNumeroFinito(segmento.inicio) &&
    esNumeroFinito(segmento.fin) &&
    esNumeroFinito(segmento.fotogramas) &&
    esNumeroFinito(segmento.movimientoMaximo) &&
    Array.isArray(segmento.trayectoria) &&
    segmento.trayectoria.length > 0 &&
    segmento.trayectoria.every((fotograma) =>
      esNumeroFinito(fotograma.tiempoMs) &&
      esNumeroFinito(fotograma.cambioPostura) &&
      esNumeroFinito(fotograma.desplazamientoMuneca) &&
      Array.isArray(fotograma.caracteristicas) &&
      fotograma.caracteristicas.every(esNumeroFinito)
    ) &&
    ["Left", "Right", "No identificado"].includes(segmento.lado) &&
    segmento.estado === "experimental" &&
    segmento.estadoValidacion === "no_validado_linguisticamente"
  );
}

export function cargarSegmentosMovimiento(): SegmentoMovimientoGuardado[] {
  try {
    const contenido = localStorage.getItem(CLAVE_ALMACENAMIENTO);

    if (!contenido) return [];

    const datos: unknown = JSON.parse(contenido);

    if (!Array.isArray(datos)) return [];

    return datos
      .filter(validarSegmentoMovimiento)
      .slice(0, MAX_SEGMENTOS);
  } catch (error) {
    console.error("No se pudo cargar la biblioteca de movimientos:", error);
    return [];
  }
}

export function guardarSegmentosMovimiento(
  segmentos: SegmentoMovimientoGuardado[]
): boolean {
  try {
    const validos = segmentos
      .filter(validarSegmentoMovimiento)
      .slice(0, MAX_SEGMENTOS);

    localStorage.setItem(
      CLAVE_ALMACENAMIENTO,
      JSON.stringify(validos)
    );

    return true;
  } catch (error) {
    console.error("No se pudo guardar la biblioteca de movimientos:", error);
    return false;
  }
}

export function agregarSegmentoMovimiento(
  actuales: SegmentoMovimientoGuardado[],
  nuevo: SegmentoMovimientoGuardado
): SegmentoMovimientoGuardado[] {
  if (!validarSegmentoMovimiento(nuevo)) return actuales;

  const sinDuplicado = actuales.filter(
    (segmento) => segmento.id !== nuevo.id
  );

  return [nuevo, ...sinDuplicado].slice(0, MAX_SEGMENTOS);
}

export function eliminarSegmentoMovimiento(
  actuales: SegmentoMovimientoGuardado[],
  id: string
): SegmentoMovimientoGuardado[] {
  return actuales.filter((segmento) => segmento.id !== id);
}

export function exportarBibliotecaMovimiento(
  segmentos: SegmentoMovimientoGuardado[]
): string {
  return JSON.stringify(
    {
      proyecto: "LSC Conecta",
      versionFormato: "1.1.0",
      fechaExportacion: new Date().toISOString(),
      tipoDatos: "biblioteca_de_trayectorias_experimentales",
      estadoValidacion: "no_validado_linguisticamente",
      cantidadSegmentos: segmentos.length,
      segmentos,
    },
    null,
    2
  );
}
