/**
 * Calculador de colas dinámico — Comedor UNSAAC
 *
 * CONFIGURACIÓN FÍSICA DEL COMEDOR:
 *   - 1 fila por defecto (Piso 1 único activo)
 *   - Máximo 2 filas (al habilitar el Piso 2)
 *
 * ANÁLISIS DE CAPACIDAD (2500 alumnos, 11 AM–3 PM = 240 min):
 *   - Con 1 fila sola: COLAPSA — no es posible atender 2500 en 240 min
 *   - Con 2 filas y escáner de 10 seg/alumno: ρ ≈ 86.8% ⚠️  (límite seguro)
 *   - Con 2 filas y escáner de  6 seg/alumno: ρ ≈ 52.1% ✅ (seguro con margen)
 *
 * → Para 2500 alumnos SE REQUIEREN OBLIGATORIAMENTE LAS 2 FILAS ACTIVAS.
 * → minsPerPerson normal:  0.1 min (6 seg)  — escáner digital ágil
 * → minsPerPerson retraso: 1.0 min (60 seg) — validación manual / fallo del sistema
 */

export class ComedorQueueManager {
  constructor(config = {}) {
    this.lanes             = config.lanes  || 1;    // Por defecto: 1 fila (Piso 1)
    this.targetUtilization = config.target || 0.85; // Margen de seguridad del 15%

    // Tiempo de escaneo en la entrada (cuello de botella real del sistema)
    // Normal: 6 seg con escáner digital / Retraso: 15 seg con validación prudente
    this.normalMins  = 0.1;  // 6 segundos
    this.delayedMins = 0.25; // 15 segundos
    this.currentMins = this.normalMins;

    // Tiempo base del sistema (desde que entra hasta que se sienta)
    this.normalBaseMins  = 4.0; // 4 minutos
    this.delayedBaseMins = 5.0; // 5 minutos
    this.currentBaseMins = this.normalBaseMins;
  }

  get minsPerPerson() { return this.currentMins; }
  get baseMins()      { return this.currentBaseMins; }

  setDelayPerturbation() { 
    this.currentMins     = this.delayedMins; 
    this.currentBaseMins = this.delayedBaseMins;
  }
  
  clearPerturbation() { 
    this.currentMins     = this.normalMins;  
    this.currentBaseMins = this.normalBaseMins;
  }

  /** Alumnos máximos en una franja de [slotMin] minutos */
  calculateSlotCapacity(slotMin = 10) {
    return Math.floor(this.lanes * (slotMin / this.currentMins) * this.targetUtilization);
  }

  /** Minutos de espera estimados para el alumno en posición [pos] */
  estimateWaitTime(pos) {
    if (pos <= 1) return this.currentBaseMins;
    return Math.round((this.currentBaseMins + (pos - 1) * this.currentMins) * 10) / 10;
  }

  /**
   * Diagnóstico de capacidad para [totalStudents] en [windowMins] minutos.
   * Usado para la alerta de capacidad en el Panel Admin.
   */
  checkCapacity(totalStudents = 2500, windowMins = 240) {
    const lambda = totalStudents / windowMins;
    const mu     = this.lanes * (1 / this.currentMins);
    const rho    = lambda / mu;
    return {
      rho:           +(rho * 100).toFixed(1),
      isSafe:        rho < this.targetUtilization,
      isFeasible:    rho < 1.0,
      minLanes:      Math.ceil(lambda / ((1 / this.normalMins) * this.targetUtilization)),
    };
  }
}
