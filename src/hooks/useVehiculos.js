import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const COLUMNAS_PUBLICAS = `
  id,
  placa,
  marca,
  modelo,
  anio,
  color,
  tipo,
  foto_url,
  foto_fuente_url,
  foto_propietario_url,
  cedula_enmascarada,
  propietario_nombre,
  correo_institucional,
  autorizado
`

export const useVehiculos = () => {
  const [vehiculos, setVehiculos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Extraer: obtiene todos los vehículos con sus propietarios
  const obtenerVehiculos = useCallback(async () => {
    setCargando(true)
    setError('')

    const { data, error: errorSupabase } = await supabase
      .from('vehiculos')
      .select(COLUMNAS_PUBLICAS)
      .order('propietario_nombre', { ascending: true })

    if (errorSupabase) {
      setVehiculos([])
      setError(errorSupabase.message)
    } else {
      setVehiculos(data ?? [])
    }

    setCargando(false)
    return { data, error: errorSupabase }
  }, [])

  // Insertar: crea un nuevo vehículo junto con los datos de su propietario
  const crearVehiculo = useCallback(
    async (nuevoVehiculo) => {
      const { data, error: errorSupabase } = await supabase
        .from('vehiculos')
        .insert([nuevoVehiculo])
        .select(COLUMNAS_PUBLICAS)

      if (!errorSupabase) {
        await obtenerVehiculos()
      }

      return { data, error: errorSupabase }
    },
    [obtenerVehiculos],
  )

  // Actualizar: modifica un vehículo y/o propietario existente por id
  const actualizarVehiculo = useCallback(
    async (id, cambios) => {
      const { data, error: errorSupabase } = await supabase
        .from('vehiculos')
        .update(cambios)
        .eq('id', id)
        .select(COLUMNAS_PUBLICAS)

      if (!errorSupabase) {
        await obtenerVehiculos()
      }

      return { data, error: errorSupabase }
    },
    [obtenerVehiculos],
  )

  // Eliminar: borra un vehículo por id
  const eliminarVehiculo = useCallback(
    async (id) => {
      const { data, error: errorSupabase } = await supabase.from('vehiculos').delete().eq('id', id)

      if (!errorSupabase) {
        await obtenerVehiculos()
      }

      return { data, error: errorSupabase }
    },
    [obtenerVehiculos],
  )

  useEffect(() => {
    obtenerVehiculos()
  }, [obtenerVehiculos])

  return {
    vehiculos,
    cargando,
    error,
    obtenerVehiculos,
    crearVehiculo,
    actualizarVehiculo,
    eliminarVehiculo,
    // se conserva por compatibilidad con código anterior
    recargar: obtenerVehiculos,
  }
}
