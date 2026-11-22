
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type FotogramaTrayectoria = {
  tiempoMs: number;
  cambioPostura: number;
  desplazamientoMuneca: number;
  caracteristicas: number[];
};

type Props = {
  trayectoria: FotogramaTrayectoria[];
};

const CONEXIONES_MANO: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

type Punto3D = {
  x: number;
  y: number;
  z: number;
};

function Mano3D({ puntos }: { puntos: Punto3D[] }) {
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor || puntos.length !== 21) return;

    const escena = new THREE.Scene();
    escena.background = new THREE.Color("#f1f5f9");

    const camara = new THREE.PerspectiveCamera(
      45,
      1,
      0.1,
      100
    );

    camara.position.set(2.8, 2.2, 3.2);

    const renderizador = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });

    renderizador.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 2)
    );

    renderizador.setSize(
      contenedor.clientWidth,
      contenedor.clientHeight
    );

    renderizador.outputColorSpace = THREE.SRGBColorSpace;
    contenedor.appendChild(renderizador.domElement);

    const controles = new OrbitControls(
      camara,
      renderizador.domElement
    );

    controles.enableDamping = true;
    controles.dampingFactor = 0.08;
    controles.enableZoom = true;
    controles.minDistance = 1.5;
    controles.maxDistance = 8;
    controles.target.set(0, -0.25, 0);
    controles.update();

    escena.add(
      new THREE.AmbientLight(0xffffff, 1.8)
    );

    const luzPrincipal = new THREE.DirectionalLight(
      0xffffff,
      2.2
    );

    luzPrincipal.position.set(3, 5, 4);
    escena.add(luzPrincipal);

    const luzSecundaria = new THREE.DirectionalLight(
      0xffffff,
      0.8
    );

    luzSecundaria.position.set(-3, 1, -3);
    escena.add(luzSecundaria);

    // Ejes de referencia X, Y y Z.
    const ejes = new THREE.AxesHelper(1.5);
    escena.add(ejes);

    // Cuadrícula de referencia en el suelo.
    const cuadricula = new THREE.GridHelper(
      4,
      12,
      0x94a3b8,
      0xdbe4ed
    );

    cuadricula.position.y = -1.15;
    escena.add(cuadricula);

    // Conversión de las características normalizadas
    // a coordenadas tridimensionales relativas.
    const posiciones = puntos.map(
      (punto) =>
        new THREE.Vector3(
          punto.x * 0.85,
          -punto.y * 0.85,
          punto.z * 0.85
        )
    );

    // Conexiones entre los 21 puntos.
    const materialLineas = new THREE.LineBasicMaterial({
      color: 0x168bca,
      linewidth: 2,
    });

    const lineas: THREE.Line[] = [];

    CONEXIONES_MANO.forEach(([origen, destino]) => {
      const geometria = new THREE.BufferGeometry()
        .setFromPoints([
          posiciones[origen],
          posiciones[destino],
        ]);

      const linea = new THREE.Line(
        geometria,
        materialLineas
      );

      escena.add(linea);
      lineas.push(linea);
    });

    // Esferas para representar las articulaciones.
    const geometriaPunto = new THREE.SphereGeometry(
      0.035,
      16,
      12
    );

    const materialPunto = new THREE.MeshStandardMaterial({
      color: 0x168bca,
      roughness: 0.45,
    });

    const materialMuneca = new THREE.MeshStandardMaterial({
      color: 0xe49a36,
      roughness: 0.4,
    });

    const esferas: THREE.Mesh[] = [];

    posiciones.forEach((posicion, indice) => {
      const esfera = new THREE.Mesh(
        geometriaPunto,
        indice === 0 ? materialMuneca : materialPunto
      );

      esfera.position.copy(posicion);
      escena.add(esfera);
      esferas.push(esfera);
    });

    let animacion = 0;

    const dibujar = () => {
      animacion = requestAnimationFrame(dibujar);
      controles.update();
      renderizador.render(escena, camara);
    };

    dibujar();

    const ajustarTamano = () => {
      if (!contenedor) return;

      const ancho = contenedor.clientWidth;
      const alto = contenedor.clientHeight;

      if (ancho <= 0 || alto <= 0) return;

      camara.aspect = ancho / alto;
      camara.updateProjectionMatrix();
      renderizador.setSize(ancho, alto);
    };

    const observador = new ResizeObserver(ajustarTamano);
    observador.observe(contenedor);

    return () => {
      cancelAnimationFrame(animacion);
      observador.disconnect();
      controles.dispose();

      lineas.forEach((linea) => {
        linea.geometry.dispose();
      });

      esferas.forEach((esfera) => {
        escena.remove(esfera);
      });

      geometriaPunto.dispose();
      materialLineas.dispose();
      materialPunto.dispose();
      materialMuneca.dispose();

      cuadricula.geometry.dispose();
      (cuadricula.material as THREE.Material).dispose();

      ejes.geometry.dispose();
      (ejes.material as THREE.Material).dispose();

      renderizador.dispose();

      if (renderizador.domElement.parentElement === contenedor) {
        contenedor.removeChild(renderizador.domElement);
      }
    };
  }, [puntos]);

  return (
    <div
      ref={contenedorRef}
      style={{
        width: "100%",
        height: "320px",
        overflow: "hidden",
        borderRadius: "12px",
        border: "1px solid #cbd5e1",
        touchAction: "pan-y",
      }}
      role="img"
      aria-label="Modelo tridimensional de los 21 puntos de la mano"
    />
  );
}

export default function LSCMotionTrajectoryPlayer({
  trayectoria,
}: Props) {
  const [indice, setIndice] = useState(0);

  if (!trayectoria.length) {
    return <p>No hay fotogramas para reproducir.</p>;
  }

  const indiceSeguro = Math.min(
    indice,
    trayectoria.length - 1
  );

  const actual = trayectoria[indiceSeguro];

  const puntosValidos =
    Array.isArray(actual.caracteristicas) &&
    actual.caracteristicas.length >= 63 &&
    actual.caracteristicas
      .slice(0, 63)
      .every(Number.isFinite);

  const puntosMano: Punto3D[] = puntosValidos
    ? Array.from({ length: 21 }, (_, i) => ({
        x: actual.caracteristicas[i * 3],
        y: actual.caracteristicas[i * 3 + 1],
        z: actual.caracteristicas[i * 3 + 2],
      }))
    : [];

  const maximo = Math.max(
    0.000001,
    ...trayectoria.map((f) =>
      Math.max(
        f.cambioPostura,
        f.desplazamientoMuneca
      )
    )
  );

  const obtenerPuntos = (
    campo: "cambioPostura" | "desplazamientoMuneca"
  ) =>
    trayectoria
      .map((f, i) => {
        const x =
          trayectoria.length === 1
            ? 150
            : 12 + (i / (trayectoria.length - 1)) * 276;

        const y = 88 - (f[campo] / maximo) * 70;

        return `${x},${y}`;
      })
      .join(" ");

  const puntoActualX =
    trayectoria.length === 1
      ? 150
      : 12 +
        (indiceSeguro / (trayectoria.length - 1)) * 276;

  const puntoActualY =
    88 - (actual.cambioPostura / maximo) * 70;

  return (
    <div className="motion-player">
      <h5>Reproducción de trayectoria</h5>

      <h6>Reconstrucción tridimensional de la mano</h6>

      {puntosValidos ? (
        <Mano3D
          key={indiceSeguro}
          puntos={puntosMano}
        />
      ) : (
        <p>
          Este fotograma no contiene las 63 características
          válidas necesarias para reconstruir la mano.
        </p>
      )}

      <p>
        Puntos de referencia disponibles:{" "}
        {puntosValidos ? 21 : 0} de 21
      </p>

      <p>
        Arrastra sobre la representación para girarla.
        Utiliza el gesto de ampliar o reducir para cambiar el zoom.
      </p>

      <p>
        Ejes de referencia: X (rojo), Y (verde), Z (azul).
        La muñeca está resaltada en naranja.
      </p>

      <h6>Evolución del movimiento</h6>

      <svg
        viewBox="0 0 300 110"
        width="100%"
        role="img"
        aria-label="Evolución de las métricas del movimiento"
      >
        <line
          x1="12"
          y1="18"
          x2="288"
          y2="18"
          stroke="#dce8e3"
        />

        <line
          x1="12"
          y1="53"
          x2="288"
          y2="53"
          stroke="#dce8e3"
        />

        <line
          x1="12"
          y1="88"
          x2="288"
          y2="88"
          stroke="#dce8e3"
        />

        <polyline
          points={obtenerPuntos("cambioPostura")}
          fill="none"
          stroke="#168bca"
          strokeWidth="2.5"
        />

        <polyline
          points={obtenerPuntos("desplazamientoMuneca")}
          fill="none"
          stroke="#e49a36"
          strokeWidth="2.5"
        />

        <line
          x1={puntoActualX}
          y1="10"
          x2={puntoActualX}
          y2="95"
          stroke="#64748b"
          strokeDasharray="3 3"
        />

        <circle
          cx={puntoActualX}
          cy={puntoActualY}
          r="5"
          fill="#168bca"
          stroke="white"
          strokeWidth="2"
        />
      </svg>

      <p>
        Fotograma {indiceSeguro + 1} de {trayectoria.length}
      </p>

      <input
        type="range"
        min={0}
        max={trayectoria.length - 1}
        value={indiceSeguro}
        onChange={(event) =>
          setIndice(Number(event.target.value))
        }
        aria-label="Seleccionar fotograma"
      />

      <div className="motion-player-controls">
        <button
          type="button"
          disabled={indiceSeguro === 0}
          onClick={() =>
            setIndice((actual) => Math.max(0, actual - 1))
          }
        >
          ← Anterior
        </button>

        <button
          type="button"
          onClick={() => setIndice(0)}
        >
          Reiniciar
        </button>

        <button
          type="button"
          disabled={indiceSeguro === trayectoria.length - 1}
          onClick={() =>
            setIndice((actual) =>
              Math.min(trayectoria.length - 1, actual + 1)
            )
          }
        >
          Siguiente →
        </button>
      </div>

      <p>
        Tiempo: {actual.tiempoMs.toFixed(0)} ms
      </p>

      <p>
        Cambio de postura: {actual.cambioPostura.toFixed(4)}
      </p>

      <p>
        Desplazamiento de muñeca:{" "}
        {actual.desplazamientoMuneca.toFixed(4)}
      </p>

      <small>
        Visualización tridimensional relativa de características
        normalizadas. No representa una medición anatómica
        calibrada ni una traducción lingüística LSC validada.
      </small>
    </div>
  );
}
