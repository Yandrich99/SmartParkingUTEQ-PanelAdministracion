import { useCallback, useState } from 'react'
import { detectarPlaca as enviarADetectar } from '../lib/ocr'

// Encapsula el llamado al endpoint REST de reconocimiento de placas y el
// estado de procesamiento/resultado/error asociado a esa consulta.
export const useDeteccionPlaca = () => {
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [errorApi, setErrorApi] = useState('')

  const detectarPlaca = useCallback(async (archivo) => {
    setProcesando(true)
    setErrorApi('')
    setResultado(null)

    const { data, error } = await enviarADetectar(archivo)

    if (error) {
      setErrorApi(error.mensaje)
      setResultado(null)
    } else {
      setResultado(data)
    }

    setProcesando(false)
    return { data, error }
  }, [])

  const reiniciarResultado = useCallback(() => {
    setResultado(null)
    setErrorApi('')
  }, [])

  return { procesando, resultado, errorApi, detectarPlaca, reiniciarResultado }
}
