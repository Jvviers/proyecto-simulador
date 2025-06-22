let indiceRR = -1;
let quantumRestante = 0;
let ultimoProceso = null;

export function seleccionarSiguienteRR(colaListos, quantum) {
  if (colaListos.length === 0) return null;

  if (!ultimoProceso || quantumRestante === 0 || ultimoProceso.burstRestante === 0 || !colaListos.includes(ultimoProceso)) {
    // Si hay uno ejecutando, volverlo al final si no terminó
    if (ultimoProceso && colaListos.includes(ultimoProceso) && ultimoProceso.burstRestante > 0) {
      colaListos.push(colaListos.splice(colaListos.indexOf(ultimoProceso), 1)[0]);
    }

    // Elegir nuevo proceso (FIFO)
    ultimoProceso = colaListos[0];
    quantumRestante = quantum;
    console.log(`🔁 Cambio RR → ${ultimoProceso.nombre}, Quantum: ${quantum}`);
  }

  quantumRestante--;
  return ultimoProceso;
}

export function resetRR() {
  indiceRR = -1;
  quantumRestante = 0;
  ultimoProceso = null;
}
