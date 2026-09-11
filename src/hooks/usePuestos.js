import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const COLUMNAS_PUESTOS = `
  id,
  codigo,
  columna,
  numero,
  sensor_id_rtdb,
  ruta_firebase,
  estado,
  distancia_cm,
  ultima_actualizacion,
  created_at
`

export const usePuestos = () => {
  const [puestos, setPuestos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Extraer: obtiene todos los puestos ordenados por código
  const obtenerPuestos = useCallback(async () => {
    setCargando(true)
    setError('')

    const { data, error: errorSupabase } = await supabase
      .from('puestos')
      .select(COLUMNAS_PUESTOS)
      .order('codigo', { ascending: true })

    if (errorSupabase) {
      setPuestos([])
      setError(errorSupabase.message)
    } else {
      setPuestos(data ?? [])
    }

    setCargando(false)
    return { data, error: errorSupabase }
  }, [])

  // Insertar: crea un nuevo puesto
  const crearPuesto = useCallback(
    async (nuevoPuesto) => {
      const { data, error: errorSupabase } = await supabase
        .from('puestos')
        .insert([nuevoPuesto])
        .select(COLUMNAS_PUESTOS)

      if (!errorSupabase) {
        await obtenerPuestos()
      }

      return { data, error: errorSupabase }
    },
    [obtenerPuestos],
  )

  // Actualizar: modifica un puesto existente por id
  const actualizarPuesto = useCallback(
    async (id, cambios) => {
      const { data, error: errorSupabase } = await supabase
        .from('puestos')
        .update(cambios)
        .eq('id', id)
        .select(COLUMNAS_PUESTOS)

      if (!errorSupabase) {
        await obtenerPuestos()
      }

      return { data, error: errorSupabase }
    },
    [obtenerPuestos],
  )

  // Eliminar: borra un puesto por id
  const eliminarPuesto = useCallback(
    async (id) => {
      const { data, error: errorSupabase } = await supabase.from('puestos').delete().eq('id', id)

      if (!errorSupabase) {
        await obtenerPuestos()
      }

      return { data, error: errorSupabase }
    },
    [obtenerPuestos],
  )

  useEffect(() => {
    obtenerPuestos()
  }, [obtenerPuestos])

  return {
    puestos,
    cargando,
    error,
    obtenerPuestos,
    crearPuesto,
    actualizarPuesto,
    eliminarPuesto,
  }
}
