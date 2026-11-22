
import { obtenerFuenteLSC } from "./lscSources";

export type TipoMediaLSC =
  | "video"
  | "imagen"
  | "landmarks"
  | "animacion";

export type EstadoMediaLSC =
  | "pendiente-revision"
  | "revisado"
  | "aprobado"
  | "no-utilizable";

export type MediaLSC = {
  id: string;
  senaId: string;
  tipo: TipoMediaLSC;
  url: string | null;
  titulo: string;
  descripcion: string;
  fuenteId: string | null;
  licencia: string;
  requiereAtribucion: boolean;
  textoAtribucion?: string;
  estado: EstadoMediaLSC;
  region: string | null;
  variante: string | null;
  validacionLingüistica: boolean;
  permiteUsoComercial: boolean;
  permiteModificacion: boolean;
  permiteRedistribucion: boolean;
  permiteEntrenamientoIA: boolean;
  observaciones: string;
};

// No agregamos recursos hasta verificar su procedencia y permisos.
export const mediosLSC: MediaLSC[] = [];

export type DiagnosticoMediaLSC = {
  aptoComoReferencia: boolean;
  comprobacionesPendientes: string[];
};

function puedeMostrarseComoReferencia(
  media: MediaLSC
): boolean {
  const fuente = media.fuenteId
    ? obtenerFuenteLSC(media.fuenteId)
    : undefined;

  return (
    media.estado === "aprobado" &&
    media.validacionLingüistica === true &&
    media.permiteUsoComercial === true &&
    media.permiteRedistribucion === true &&
    Boolean(media.url?.trim()) &&
    Boolean(media.licencia?.trim()) &&
    Boolean(media.fuenteId?.trim()) &&
    Boolean(fuente) &&
    fuente?.estado === "aprobada" &&
    fuente?.usoComercial === "permitido" &&
    fuente?.redistribucion === "permitido" &&
    
    fuente?.licencia !== "por-verificar" &&
fuente?.licencia.trim() === media.licencia.trim() &&

    (
      !media.requiereAtribucion ||
      Boolean(media.textoAtribucion?.trim())
    )
  );
}

/**
 * Comprueba la procedencia, licencia, permisos
 * y validación lingüística de un recurso.
 */
export function diagnosticarMediaLSC(
  media: MediaLSC
): DiagnosticoMediaLSC {
  const pendientes: string[] = [];

  const fuente = media.fuenteId
    ? obtenerFuenteLSC(media.fuenteId)
    : undefined;

  if (!media.url?.trim()) {
    pendientes.push("Falta la URL del recurso.");
  }

  if (!media.fuenteId?.trim()) {
    pendientes.push("Falta identificar la fuente.");
  } else if (!fuente) {
    pendientes.push(
      "La fuente indicada no existe en el registro de LSC Conecta."
    );
  }

  if (fuente) {
    if (fuente.estado !== "aprobada") {
      pendientes.push(
        "La fuente todavía no está aprobada."
      );
    }

    if (
      media.permiteUsoComercial &&
      fuente.usoComercial !== "permitido"
    ) {
      pendientes.push(
        "La fuente no confirma el permiso de uso comercial."
      );
    }

    if (
      media.permiteModificacion &&
      fuente.modificacion !== "permitido"
    ) {
      pendientes.push(
        "La fuente no confirma el permiso de modificación."
      );
    }

    if (
      media.permiteRedistribucion &&
      fuente.redistribucion !== "permitido"
    ) {
      pendientes.push(
        "La fuente no confirma el permiso de redistribución."
      );
    }

    if (
      media.permiteEntrenamientoIA &&
      fuente.entrenamientoIA !== "permitido"
    ) {
      pendientes.push(
        "La fuente no confirma el permiso de entrenamiento de IA."
      );
    }

    if (fuente.licencia === "por-verificar") {
      pendientes.push(
        "La licencia de la fuente todavía no está verificada."
      );
    } else if (
      media.licencia.trim() !== fuente.licencia.trim()
    ) {
      pendientes.push(
        "La licencia del recurso no coincide con la registrada para su fuente. Verifica las condiciones del archivo concreto."
      );
    }
  }

  if (!media.licencia?.trim()) {
    pendientes.push("Falta registrar la licencia.");
  }

  if (media.estado !== "aprobado") {
    pendientes.push("El recurso no está aprobado.");
  }

  if (media.validacionLingüistica !== true) {
    pendientes.push(
      "Falta validar lingüísticamente la seña."
    );
  }

  if (media.permiteUsoComercial !== true) {
    pendientes.push(
      "El uso comercial no está confirmado."
    );
  }

  if (media.permiteRedistribucion !== true) {
    pendientes.push(
      "La redistribución no está confirmada."
    );
  }

  if (
    media.requiereAtribucion &&
    !media.textoAtribucion?.trim()
  ) {
    pendientes.push(
      "Falta registrar el texto de atribución requerido."
    );
  }

  return {
    aptoComoReferencia:
      puedeMostrarseComoReferencia(media) &&
      pendientes.length === 0,
    comprobacionesPendientes: [
      ...new Set(pendientes),
    ],
  };
}

/**
 * Obtiene todos los recursos asociados a una seña.
 */
export function obtenerMediosPorSena(
  senaId: string
): MediaLSC[] {
  return mediosLSC.filter(
    (media) => media.senaId === senaId
  );
}

/**
 * Devuelve únicamente recursos que superan
 * las comprobaciones de procedencia y permisos.
 */
export function obtenerMediosAprobadosPorSena(
  senaId: string
): MediaLSC[] {
  return mediosLSC.filter(
    (media) =>
      media.senaId === senaId &&
      diagnosticarMediaLSC(media).aptoComoReferencia
  );
}

export function obtenerVideosPorSena(
  senaId: string
): MediaLSC[] {
  return obtenerMediosAprobadosPorSena(
    senaId
  ).filter(
    (media) => media.tipo === "video"
  );
}
export type DiagnosticoEntrenamientoIA = {
  aptoParaEntrenamientoIA: boolean;
  comprobacionesPendientes: string[];
};

/**
 * Comprueba si un recurso tiene autorización específica
 * para utilizarse en entrenamiento de inteligencia artificial.
 *
 * Este diagnóstico es independiente de la autorización
 * para mostrar un recurso como referencia.
 */
export function diagnosticarMediaParaEntrenamientoIA(
  media: MediaLSC
): DiagnosticoEntrenamientoIA {
  const pendientes: string[] = [];

  const fuente = media.fuenteId
    ? obtenerFuenteLSC(media.fuenteId)
    : undefined;

  if (!media.url?.trim()) {
    pendientes.push("Falta la URL del recurso.");
  }

  if (!fuente) {
    pendientes.push(
      "No existe una fuente registrada y verificable."
    );
  } else {
    if (fuente.estado !== "aprobada") {
      pendientes.push(
        "La fuente todavía no está aprobada."
      );
    }

    if (fuente.licencia === "por-verificar") {
      pendientes.push(
        "La licencia de la fuente todavía está pendiente de verificación."
      );
    } else if (
      fuente.licencia.trim() !== media.licencia.trim()
    ) {
      pendientes.push(
        "La licencia del recurso no coincide con la de su fuente."
      );
    }

    if (fuente.entrenamientoIA !== "permitido") {
      pendientes.push(
        "La fuente no autoriza expresamente el entrenamiento de IA."
      );
    }

    if (fuente.modificacion !== "permitido") {
      pendientes.push(
        "La fuente no confirma el permiso para modificar o procesar el material."
      );
    }

    if (fuente.usoComercial !== "permitido") {
      pendientes.push(
        "La fuente no confirma el permiso de uso comercial."
      );
    }
  }

  if (media.estado !== "aprobado") {
    pendientes.push(
      "El recurso no está aprobado."
    );
  }

  if (media.validacionLingüistica !== true) {
    pendientes.push(
      "La seña todavía no cuenta con validación lingüística."
    );
  }

  if (media.permiteEntrenamientoIA !== true) {
    pendientes.push(
      "El recurso no tiene autorización específica para entrenamiento de IA."
    );
  }

  if (media.permiteModificacion !== true) {
    pendientes.push(
      "El recurso no tiene autorización específica para modificar o procesar el material."
    );
  }

  if (media.permiteUsoComercial !== true) {
    pendientes.push(
      "El recurso no tiene confirmado el permiso de uso comercial."
    );
  }

  if (
    media.requiereAtribucion &&
    !media.textoAtribucion?.trim()
  ) {
    pendientes.push(
      "Falta registrar la atribución requerida."
    );
  }

  const comprobacionesPendientes = [
    ...new Set(pendientes),
  ];

  return {
    aptoParaEntrenamientoIA:
      comprobacionesPendientes.length === 0,
    comprobacionesPendientes,
  };
}

/**
 * Devuelve únicamente recursos autorizados
 * para entrenamiento de inteligencia artificial.
 */
export function obtenerMediosAprobadosParaEntrenamientoIA():
  MediaLSC[] {
  return mediosLSC.filter(
    (media) =>
      diagnosticarMediaParaEntrenamientoIA(media)
        .aptoParaEntrenamientoIA
  );
}