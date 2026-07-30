/**
 * Calculador de colas dinámico para el comedor de la UNSAAC.
 * Implementa el cálculo de capacidad por franjas horarias y la estimación
 * de retraso usando la tasa de servicio adaptativa.
 */

export class ComedorQueueManager {
  constructor(config = {}) {
    this.lanes = config.lanes || 3;             // Líneas de servido activas
    this.targetUtilization = config.target || 0.85; // Factor de utilización objetivo (seguridad)
    this.baseServiceTime = config.baseTime || 4.5; // Tiempo de servicio normal en minutos (promedio de 3-6)
    
    // Estado dinámico
    this.currentServiceTime = this.baseServiceTime;
    this.recentServiceTimes = []; // Registro de los últimos N alumnos atendidos para calcular media móvil
  }

  /**
   * Registra el tiempo real que tomó atender a un alumno para actualizar dinámicamente la tasa de servicio
   * @param {number} minutes 
   */
  recordServiceTime(minutes) {
    this.recentServiceTimes.push(minutes);
    if (this.recentServiceTimes.length > 10) {
      this.recentServiceTimes.shift(); // Mantener solo los últimos 10
    }
    // Calcular el nuevo promedio móvil de servicio
    const sum = this.recentServiceTimes.reduce((a, b) => a + b, 0);
    this.currentServiceTime = sum / this.recentServiceTimes.length;
  }

  /**
   * Simula una perturbación o retraso manual (ej. falta de comida)
   * @param {number} delayMinutes minutos extras por servicio
   */
  setDelayPerturbation(delayMinutes) {
    this.currentServiceTime = this.baseServiceTime + delayMinutes;
  }

  /**
   * Resetea el tiempo de servicio al valor base
   */
  clearPerturbation() {
    this.currentServiceTime = this.baseServiceTime;
    this.recentServiceTimes = [];
  }

  /**
   * Calcula cuántos estudiantes pueden ingresar en una franja horaria sin generar colas.
   * @param {number} slotDurationMin duración de la franja (ej. 10 o 15 minutos)
   */
  calculateSlotCapacity(slotDurationMin = 10) {
    const rawCapacity = this.lanes * (slotDurationMin / this.currentServiceTime) * this.targetUtilization;
    return Math.floor(rawCapacity);
  }

  /**
   * Estima el tiempo de espera en cola para un nuevo estudiante basado en el estado actual.
   * @param {number} currentQueueSize cantidad de estudiantes esperando actualmente
   */
  estimateWaitTime(currentQueueSize) {
    if (currentQueueSize === 0) return 0;
    
    // Tiempo de espera estimado basado en workload: (personas en cola * tiempo de servicio) / líneas activas
    const estimatedMin = (currentQueueSize * this.currentServiceTime) / this.lanes;
    return Math.round(estimatedMin * 10) / 10; // Redondeado a 1 decimal
  }
}
