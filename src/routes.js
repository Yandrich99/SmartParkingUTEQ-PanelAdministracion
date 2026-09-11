/**
 * Application Routes Configuration
 *
 * Rutas del proyecto UTEQ Smart Parking. Solo existen las tres vistas
 * del caso de estudio: vehículos, puestos e historial de estacionamiento.
 *
 * @module routes
 */

import React from 'react'

const ListaVehiculos = React.lazy(() => import('./views/parqueadero/ListaVehiculos'))
const ListaPuestos = React.lazy(() => import('./views/parqueadero/ListaPuestos'))
const HistorialEstacionamiento = React.lazy(
  () => import('./views/parqueadero/HistorialEstacionamiento'),
)
const MonitoreoEntrada = React.lazy(() => import('./views/parqueadero/MonitoreoEntrada'))

export const routes = [
  { path: '/', exact: true, name: 'Home' },
  {
    path: '/parqueadero/vehiculos',
    name: 'Vehículos y propietarios',
    element: ListaVehiculos,
  },
  {
    path: '/parqueadero/monitoreo-entrada',
    name: 'Monitoreo de entrada',
    element: MonitoreoEntrada,
  },
  {
    path: '/parqueadero/puestos',
    name: 'Puestos',
    element: ListaPuestos,
  },
  {
    path: '/parqueadero/historial',
    name: 'Historial de parqueo',
    element: HistorialEstacionamiento,
  },
]

export default routes
