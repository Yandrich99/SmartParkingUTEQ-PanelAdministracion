const REGEX_PLACA = /^[A-Z]{3}-\d{4}$/
const REGEX_CORREO_UTEQ = /^[\w.+-]+@uteq\.edu\.ec$/i
const REGEX_CEDULA = /^\d{10}$/

export const validarPlaca = (placa) => REGEX_PLACA.test((placa ?? '').trim().toUpperCase())

export const validarCorreoInstitucional = (correo) => REGEX_CORREO_UTEQ.test((correo ?? '').trim())

export const validarAnio = (anio) => {
  const numero = Number(anio)
  const anioActual = new Date().getFullYear()
  return Number.isInteger(numero) && numero >= 1990 && numero <= anioActual + 1
}

export const validarCedula = (cedula) => REGEX_CEDULA.test((cedula ?? '').trim())

// Convierte una cédula completa (10 dígitos) en su versión enmascarada,
// dejando visibles únicamente los últimos 4 dígitos. Ej: 1234567890 -> ******7890
export const enmascararCedula = (cedula) => {
  const limpia = (cedula ?? '').trim()
  if (limpia.length <= 4) return limpia
  return '*'.repeat(limpia.length - 4) + limpia.slice(-4)
}
