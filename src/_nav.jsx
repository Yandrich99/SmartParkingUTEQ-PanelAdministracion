/**
 * Sidebar Navigation Configuration
 *
 * Menú del proyecto UTEQ Smart Parking. Contiene únicamente las tres
 * entidades del caso de estudio: vehículos, puestos e historial de
 * estacionamiento.
 *
 * @module _nav
 */

import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilCamera, cilCarAlt, cilGrid, cilHistory } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavTitle,
    name: 'Parqueadero',
  },
  {
    component: CNavItem,
    name: 'Vehículos y propietarios',
    to: '/parqueadero/vehiculos',
    icon: <CIcon icon={cilCarAlt} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Monitoreo de entrada',
    to: '/parqueadero/monitoreo-entrada',
    icon: <CIcon icon={cilCamera} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Puestos',
    to: '/parqueadero/puestos',
    icon: <CIcon icon={cilGrid} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Historial de parqueo',
    to: '/parqueadero/historial',
    icon: <CIcon icon={cilHistory} customClassName="nav-icon" />,
  },
]

export default _nav
