'use client';

import { useState } from 'react';
import MathInput from './EntradaMatematica';

// Interfaz que define la estructura de datos para un tramo individual de la funcion.
// Almacena el identificador unico, la condicion de limite (dominio) y las expresiones matematicas.
export interface TramoFuncion {
  id: string;
  condicion: string; // ej: "-1 <= x <= 0"
  expresion: string; // Formato ascii-math para ser procesado por mathjs
  expresionLatex?: string; // Formato visual renderizado en el input de MathLive
}

// Interfaz que define las propiedades esperadas por el editor de tramos.
interface PropiedadesEditorTramos {
  tramos: TramoFuncion[];
  alCambiarTramos: (tramos: TramoFuncion[]) => void;
}

// Componente interactivo que permite al usuario construir una funcion definida a trozos.
// Maneja la adicion, eliminacion y modificacion dinamica de cada intervalo del dominio.
export default function EditorFuncionTrozos({
  tramos,
  alCambiarTramos,
}: PropiedadesEditorTramos) {
  
  // Estado local para alternar entre la vista detallada de edicion y el resumen colapsado.
  const [editorExpandido, setEditorExpandido] = useState(false);

  // Crea un nuevo tramo con valores por defecto y un identificador unico basado en el tiempo actual.
  // Lo concatena al arreglo de estado inmutable existente.
  const agregarTramo = () => {
    const nuevoTramo: TramoFuncion = {
      id: Date.now().toString(),
      condicion: '-1 <= x < 0',
      expresion: 'x',
      expresionLatex: 'x',
    };
    alCambiarTramos([...tramos, nuevoTramo]);
  };

  // Filtra el arreglo de tramos eliminando aquel cuyo identificador coincida con el parametro proporcionado.
  const eliminarTramo = (idTramo: string) => {
    alCambiarTramos(tramos.filter((tramo) => tramo.id !== idTramo));
  };

  // Actualiza unicamente la logica del intervalo (dominio) para un tramo especifico iterando sobre el estado.
  const actualizarCondicion = (idTramo: string, nuevoValor: string) => {
    alCambiarTramos(tramos.map((tramo) => (tramo.id === idTramo ? { ...tramo, condicion: nuevoValor } : tramo)));
  };

  // Actualiza simultaneamente la representacion visual (LaTeX) y la evaluable (ASCII) de la expresion de un tramo.
  const actualizarExpresion = (idTramo: string, latex: string, ascii: string) => {
    alCambiarTramos(
      tramos.map((tramo) => (tramo.id === idTramo ? { ...tramo, expresion: ascii, expresionLatex: latex } : tramo))
    );
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Función a Trozos</h3>
        <button
          onClick={() => setEditorExpandido(!editorExpandido)}
          className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded transition shadow"
        >
          {editorExpandido ? 'Contraer Editor' : 'Expandir Editor'}
        </button>
      </div>

      {editorExpandido ? (
        <div className="space-y-4">
          {tramos.map((tramo, indice) => (
            <div key={tramo.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-600">
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm font-semibold text-slate-300">Tramo {indice + 1}</p>
                {tramos.length > 1 && (
                  <button
                    onClick={() => eliminarTramo(tramo.id)}
                    className="text-red-400 hover:text-red-300 text-xs font-semibold transition bg-red-400/10 px-2 py-1 rounded"
                  >
                    ✕ Eliminar
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-blue-300 mb-1 uppercase tracking-wider">
                    Condición (Intervalo)
                  </label>
                  <input
                    type="text"
                    value={tramo.condicion}
                    onFocus={(evento) => evento.target.select()} // Permite seleccionar todo al hacer clic
                    onChange={(evento) => actualizarCondicion(tramo.id, evento.target.value)}
                    placeholder="Ej: 0 <= x <= 1"
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500 transition text-sm shadow-inner"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Operadores válidos: &lt; o &lt;=
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-300 mb-1 uppercase tracking-wider">
                    Expresión f(x)
                  </label>
                  <MathInput
                    valorLatex={tramo.expresionLatex || tramo.expresion}
                    alCambiarMatematica={(latex, ascii) => actualizarExpresion(tramo.id, latex, ascii)}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={agregarTramo}
            className="w-full py-3 border border-dashed border-blue-500 text-blue-400 hover:bg-blue-500/10 rounded-lg font-semibold transition text-sm"
          >
            + Agregar Tramo
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-600 max-h-40 overflow-y-auto space-y-2">
          {tramos.map((tramo, indice) => (
            <p key={tramo.id} className="text-sm text-slate-300 font-mono">
              <span className="text-blue-400 font-bold">{indice + 1}.</span> f(x) = {tramo.expresion}, cuando {tramo.condicion}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}