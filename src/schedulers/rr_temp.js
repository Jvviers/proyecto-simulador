export function seleccionarSiguienteRR(colaListos) {
  if (colaListos.length === 0) return null;
  
  // Simplemente devolver el primer proceso de la cola (FIFO)
  const procesoSeleccionado = colaListos[0];
  console.log(`🔁 RR selecciona → ${procesoSeleccionado.nombre}`);
  
  return procesoSeleccionado;
}

export function resetRR() {
  // Reset si es necesario para reiniciar simulación
  console.log('🔄 RR reset');
}