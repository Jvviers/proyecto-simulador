import { Memoria } from './models/memoria.js';
import { seleccionarSiguienteSJF } from './schedulers/sjf_temp.js';
import { seleccionarSiguienteRR } from './schedulers/rr_temp.js';

export const estadoSimulador = {
  reloj: 0,
  quantum: 5,
  quantumRestante: 0,
  enEjecucion: false,
  modoMultinivel: false,
  procesos: [],
  colaAlta: [],
  colaBaja: [],
  colaListos: [],
  procesoActual: null,
  procesosTerminados: [],
  memoria: new Memoria(1024),
  historialEjecucion: [],
  algoritmo: 'SJF'
};

export function tickSimulador() {
  const est = estadoSimulador;
  est.reloj++;

  // === 1. Llegada de nuevos procesos ===
  est.procesos.forEach(p => {
    if (p.llegada <= est.reloj && p.estado === 'nuevo') {
      const asignado = est.memoria.asignar(p);
      console.log(`⏰ Proceso ${p.nombre} llegó en t=${est.reloj} | Asignado: ${asignado}`);

      if (!p.enSwap && asignado) {
        if (est.modoMultinivel) {
          if (p.prioridad === 0) {
            est.colaAlta.push(p);
            console.log(`🟢 ${p.nombre} → colaAlta`);
          } else {
            est.colaBaja.push(p);
            console.log(`🔵 ${p.nombre} → colaBaja`);
          }
        } else {
          est.colaListos.push(p);
          console.log(`🟡 ${p.nombre} → colaListos`);
        }
      }
    }
  });

  // === 2. Finalizar proceso actual si terminó ===
  if (est.procesoActual?.burstRestante === 0) {
    est.procesoActual.actualizarEstado('terminado');
    est.procesoActual.marcarFin(est.reloj);
    est.memoria.liberar(est.procesoActual.nombre);
    est.procesosTerminados.push(est.procesoActual);
    est.colaAlta = est.colaAlta.filter(p => p !== est.procesoActual);
    est.colaBaja = est.colaBaja.filter(p => p !== est.procesoActual);
    est.colaListos = est.colaListos.filter(p => p !== est.procesoActual);
    console.log(`✅ ${est.procesoActual.nombre} finalizado en t=${est.reloj}`);
    est.procesoActual = null;
    est.quantumRestante = 0;
  }

  // === 3. Verificar fin de quantum (solo RR) ===
  if (est.procesoActual && est.algoritmo === 'RR' && est.quantumRestante === 0) {
    console.log(`⏱ Quantum agotado para ${est.procesoActual.nombre}`);
    est.procesoActual.actualizarEstado('listo');
    est.colaListos.push(est.procesoActual);
    est.procesoActual = null;
  }

  // === 4. Seleccionar nuevo proceso si no hay uno ===
  if (!est.procesoActual) {
    if (est.modoMultinivel) {
      if (est.colaAlta.length > 0) {
        est.procesoActual = seleccionarSiguienteRR(est.colaAlta);
        est.colaAlta.shift();
        est.quantumRestante = est.quantum;
        console.log(`▶️ Ejecutando ${est.procesoActual.nombre} desde colaAlta`);
      } else if (est.colaBaja.length > 0) {
        est.procesoActual = seleccionarSiguienteSJF(est.colaBaja);
        est.colaBaja = est.colaBaja.filter(p => p !== est.procesoActual);
        est.quantumRestante = 0;
        console.log(`▶️ Ejecutando ${est.procesoActual.nombre} desde colaBaja`);
      }
    } else {
      if (est.algoritmo === 'SJF') {
        est.procesoActual = seleccionarSiguienteSJF(est.colaListos);
        est.colaListos = est.colaListos.filter(p => p !== est.procesoActual);
        est.quantumRestante = 0;
      } else {
        est.procesoActual = seleccionarSiguienteRR(est.colaListos);
        est.colaListos.shift();
        est.quantumRestante = est.quantum;
      }
      if (est.procesoActual)
        console.log(`▶️ Ejecutando ${est.procesoActual.nombre} desde colaListos (${est.algoritmo})`);
    }

    if (est.procesoActual) {
      est.procesoActual.actualizarEstado('ejecutando');
      est.procesoActual.marcarInicio(est.reloj);
    }
  }

  // === 5. Ejecutar proceso actual ===
  if (est.procesoActual) {
    est.procesoActual.tickEjecucion();
    if (est.algoritmo === 'RR') {
      est.quantumRestante--;
    }
  }

  // === 6. Acumular espera ===
  const enEspera = est.modoMultinivel
    ? [...est.colaAlta, ...est.colaBaja]
    : est.colaListos;

  enEspera.forEach(p => {
    if (p !== est.procesoActual && !p.enSwap) {
      p.tEspera++;
    }
  });

  // === 7. Timeline ===
  est.historialEjecucion.push({
    tiempo: est.reloj,
    proceso: est.procesoActual?.nombre || 'IDLE'
  });
}
