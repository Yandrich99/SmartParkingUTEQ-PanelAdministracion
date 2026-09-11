import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const COLUMNAS_REGISTROS = `
  id,
  codigo_registro,
  vehiculo_id,
  puesto_id,
  placa_detectada,
  sensor_id_rtdb,
  fecha_entrada,
  fecha_salida,
  duracion_minutos,
  distancia_cm_entrada,
  estado,
  observacion,
  created_at,
  vehiculos ( placa, marca, modelo ),
  puestos ( codigo, columna, numero )
`

export const useRegistrosEstacionamiento = () => {
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Extraer: obtiene todos los registros del historial, con el vehículo
  // y el puesto relacionados, ordenados del más reciente al más antiguo
  const obtenerRegistros = useCallback(async () => {
    setCargando(true)
    setError('')

    const { data, error: errorSupabase } = await supabase
      .from('registros_estacionamiento')
      .select(COLUMNAS_REGISTROS)
      .order('fecha_entrada', { ascending: false })

    if (errorSupabase) {
      setRegistros([])
      setError(errorSupabase.message)
    } else {
      setRegistros(data ?? [])
    }

    setCargando(false)
    return { data, error: errorSupabase }
  }, [])

  // Insertar: crea un nuevo registro de entrada/salida
  const crearRegistro = useCallback(
    async (nuevoRegistro) => {
      const { data, error: errorSupabase } = await supabase
        .from('registros_estacionamiento')
        .insert([nuevoRegistro])
        .select(COLUMNAS_REGISTROS)

      if (!errorSupabase) {
        await obtenerRegistros()
      }

      return { data, error: errorSupabase }
    },
    [obtenerRegistros],
  )

  // Actualizar: modifica un registro existente por id
  // (por ejemplo, para cerrar un registro con fecha_salida y duracion_minutos)
  const actualizarRegistro = useCallback(
    async (id, cambios) => {
      const { data, error: errorSupabase } = await supabase
        .from('registros_estacionamiento')
        .update(cambios)
        .eq('id', id)
        .select(COLUMNAS_REGISTROS)

      if (!errorSupabase) {
        await obtenerRegistros()
      }

      return { data, error: errorSupabase }
    },
    [obtenerRegistros],
  )

  // Eliminar: borra un registro del historial por id
  const eliminarRegistro = useCallback(
    async (id) => {
      const { data, error: errorSupabase } = await supabase
        .from('registros_estacionamiento')
        .delete()
        .eq('id', id)

      if (!errorSupabase) {
        await obtenerRegistros()
      }

      return { data, error: errorSupabase }
    },
    [obtenerRegistros],
  )

  useEffect(() => {
    obtenerRegistros()
  }, [obtenerRegistros])

  return {
    registros,
    cargando,
    error,
    obtenerRegistros,
    crearRegistro,
    actualizarRegistro,
    eliminarRegistro,
  }
}
