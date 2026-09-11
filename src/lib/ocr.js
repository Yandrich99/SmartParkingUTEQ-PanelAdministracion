// Servicio de reconocimiento de placas (OCR)
//
// Consume el endpoint REST proporcionado por el docente. La URL completa
// (con su código de acceso) se toma de la variable de entorno
// VITE_OCR_ENDPOINT y nunca se escribe directamente en el código ni se
// publica en el repositorio.

const OCR_ENDPOINT = import.meta.env.VITE_OCR_ENDPOINT

const TIPOS_ADMITIDOS = ['image/jpeg', 'image/png']
const TAMANO_MAXIMO_BYTES = 4 * 1024 * 1024 // 4 MiB

// Mensajes para los códigos HTTP que el endpoint puede devolver
const MENSAJES_HTTP = {
  400: 'La imagen está vacía, es inválida o tiene dimensiones no permitidas.',
  413: 'La imagen supera el tamaño máximo permitido (4 MiB).',
  415: 'El formato de la imagen no es admitido. Use JPG o PNG.',
  502: 'Falló el servicio de reconocimiento (OCR) o la consulta a Supabase. Intente nuevamente.',
  504: 'Se agotó el tiempo de espera de la solicitud. Intente nuevamente.',
}

// Valida el tamaño y formato de una imagen antes de enviarla al endpoint
export const validarImagen = (archivo) => {
  if (!archivo) {
    return { valido: false, mensaje: 'Debe capturar o seleccionar una imagen.' }
  }
  if (!TIPOS_ADMITIDOS.includes(archivo.type)) {
    return { valido: false, mensaje: 'El formato de la imagen no es admitido. Use JPG o PNG.' }
  }
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return { valido: false, mensaje: 'La imagen supera el tamaño máximo permitido (4 MiB).' }
  }
  return { valido: true, mensaje: '' }
}

// Envía la imagen (Blob/File) como cuerpo binario al endpoint de detección
// de placas y devuelve el resultado ya interpretado en { data, error }
export const detectarPlaca = async (archivo) => {
  if (!OCR_ENDPOINT) {
    return {
      data: null,
      error: {
        mensaje:
          'No se configuró VITE_OCR_ENDPOINT. Defina la variable de entorno con la URL del servicio de reconocimiento.',
      },
    }
  }

  const { valido, mensaje } = validarImagen(archivo)
  if (!valido) {
    return { data: null, error: { mensaje } }
  }

  let respuesta
  try {
    respuesta = await fetch(OCR_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': archivo.type || 'application/octet-stream',
      },
      body: archivo,
    })
  } catch {
    return {
      data: null,
      error: { mensaje: 'No se pudo contactar al servicio de reconocimiento. Verifique su conexión.' },
    }
  }

  if (!respuesta.ok) {
    let mensajeError = MENSAJES_HTTP[respuesta.status] ?? `Error del servicio (HTTP ${respuesta.status}).`
    try {
      const cuerpo = await respuesta.json()
      mensajeError = cuerpo?.mensaje ?? cuerpo?.error ?? mensajeError
    } catch {
      // El cuerpo del error no es JSON; se conserva el mensaje por defecto
    }
    return { data: null, error: { mensaje: mensajeError, status: respuesta.status } }
  }

  try {
    const resultado = await respuesta.json()
    return { data: resultado, error: null }
  } catch {
    return {
      data: null,
      error: { mensaje: 'La respuesta del servicio no tiene un formato válido.' },
    }
  }
}
