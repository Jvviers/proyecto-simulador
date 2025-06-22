//src/ui/controls.js
import { estadoSimulador, tickSimulador } from '../simulador.js';
import Proceso from '../models/proceso.js';
import { dibujarMemoria } from './memoriaCanvas.js';
import { mostrarMetricas } from '../utils/metrics.js';
import { mostrarTimeline } from '../utils/timeline_temp.js';
import { compararAlgoritmos, graficarComparacion } from '../utils/comparacion.js';

let intervalo = null;

// === Manejo del toggle de planificación multinivel ===
const toggle = document.getElementById('multilevel-checkbox');
const priorityContainer = document.getElementById('priority-container');

if (toggle && priorityContainer) {
    estadoSimulador.modoMultinivel = toggle.checked;

    toggle.addEventListener('change', (e) => {
        const activado = e.target.checked;
        priorityContainer.style.display = activado ? 'block' : 'none';
        estadoSimulador.modoMultinivel = activado;
        console.log('🔀 Modo multinivel:', activado);
    });

    // Al cargar la página
    priorityContainer.style.display = toggle.checked ? 'block' : 'none';
}

document.getElementById('process-form').addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('✅ Evento submit disparado');

    const nombre = document.getElementById('name').value;
    const llegada = parseInt(document.getElementById('arrival').value);
    const burst = parseInt(document.getElementById('burst').value);
    const memoria = parseInt(document.getElementById('memory').value);
    const prioridad = parseInt(document.getElementById('priority').value);

    const nuevo = new Proceso(nombre, llegada, burst, memoria, prioridad);
    estadoSimulador.procesos.push(nuevo);
    renderizarProcesos();
    dibujarMemoria(estadoSimulador.memoria);

    console.log('🧠 Proceso creado:', nuevo);
    console.log('📋 Lista actual:', estadoSimulador.procesos.map(p => p.nombre));

    document.getElementById('process-form').reset();
});

document.getElementById('algo').addEventListener('change', (e) => {
    estadoSimulador.algoritmo = e.target.value;
    document.getElementById('quantum-container').style.display =
        estadoSimulador.algoritmo === 'RR' ? 'block' : 'none';
    actualizarStatusBar();
});

document.getElementById('quantum').addEventListener('input', (e) => {
    estadoSimulador.quantum = parseInt(e.target.value);
});

document.getElementById('start-btn').addEventListener('click', () => {
    if (intervalo) return;
    estadoSimulador.enEjecucion = true;
    intervalo = setInterval(() => {
        tickSimulador();
        actualizarStatusBar();
    }, 500);
    actualizarStatusBar();
});

document.getElementById('step-btn').addEventListener('click', () => {
    tickSimulador();
    actualizarStatusBar();
});

document.getElementById('stop-btn').addEventListener('click', () => {
    estadoSimulador.enEjecucion = false;
    clearInterval(intervalo);
    intervalo = null;
    actualizarStatusBar();
});

document.getElementById('reset-btn').addEventListener('click', () => {
    location.reload();
});

function actualizarStatusBar() {
    document.getElementById('current-time').textContent = estadoSimulador.reloj;
    document.getElementById('current-algo').textContent = estadoSimulador.algoritmo;
    document.getElementById('sim-status').textContent = estadoSimulador.enEjecucion ? 'En ejecución' : 'Detenido';
    renderizarProcesos();
    dibujarMemoria(estadoSimulador.memoria);
}

export function renderizarProcesos() {
    const ramList = document.getElementById('process-list');
    const swapList = document.getElementById('swap-ul');

    ramList.innerHTML = '';
    swapList.innerHTML = '';

    estadoSimulador.procesos.forEach(p => {
        const li = document.createElement('li');
        li.textContent = `${p.nombre} (${p.estado})`;
        li.classList.add(`estado-${p.estado}`);
        if (p.enSwap) {
            swapList.appendChild(li);
        } else {
            ramList.appendChild(li);
        }
    });
}

document.getElementById('recover-btn').addEventListener('click', () => {
    const memoria = estadoSimulador.memoria;
    console.log('Intentando recuperar. En swap:', memoria.swap.map(p => p.nombre));
    if (memoria.swap.length === 0) {
        alert('No hay procesos en swap.');
        return;
    }

    const proceso = memoria.swap[0];
    const asignado = memoria.asignar(proceso);

    if (asignado) {
        memoria.swap.shift();
        proceso.enSwap = false;
        proceso.actualizarEstado('listo');

        if (estadoSimulador.modoMultinivel) {
            if (proceso.prioridad === 0) {
                estadoSimulador.colaAlta.push(proceso);
            } else {
                estadoSimulador.colaBaja.push(proceso);
            }
        } else {
            estadoSimulador.colaListos.push(proceso);
        }

        renderizarProcesos();
        dibujarMemoria(memoria);
    } else {
        alert('No hay suficiente espacio en memoria para recuperar el proceso.');
    }
});

document.getElementById('show-metrics-btn').addEventListener('click', () => {
    mostrarMetricas();
});

document.querySelector('.tab[data-tab="timeline"]').addEventListener('click', () => {
    mostrarTimeline();
});

document.getElementById('compare-runs-btn').addEventListener('click', () => {
    estadoSimulador.procesos.forEach(p => delete p.quantumUsado);
    const procesos = estadoSimulador.procesos.map(p => ({
        nombre: p.nombre,
        llegada: p.llegada,
        burst: p.burst,
        memoria: p.memoria
    }));

    const resultados = compararAlgoritmos(procesos);
    graficarComparacion(resultados);

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('.tab[data-tab="metrics"]').classList.add('active');
    document.getElementById('metrics').classList.add('active');
});