import React, { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'

import { useRegistrosEstacionamiento } from '../../hooks/useRegistrosEstacionamiento'
import { useVehiculos } from '../../hooks/useVehiculos'
import { usePuestos } from '../../hooks/usePuestos'

const REGISTRO_VACIO = {
  codigo_registro: '',
  vehiculo_id: '',
  puesto_id: '',
  placa_detectada: '',
  sensor_id_rtdb: '',
  fecha_entrada: '',
  fecha_salida: '',
  duracion_minutos: '',
  distancia_cm_entrada: '',
  estado: 'ACTIVO',
  observacion: '',
}

const formatearFecha = (valor) => (valor ? new Date(valor).toLocaleString() : '—')

const HistorialEstacionamiento = () => {
  const {
    registros,
    cargando,
    error,
    obtenerRegistros,
    crearRegistro,
    actualizarRegistro,
    eliminarRegistro,
  } = useRegistrosEstacionamiento()

  const { vehiculos } = useVehiculos()
  const { puestos } = usePuestos()

  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const registrosPorPagina = 10

  const [modalVisible, setModalVisible] = useState(false)
  const [registroEnEdicion, setRegistroEnEdicion] = useState(null)
  const [formulario, setFormulario] = useState(REGISTRO_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [errorFormulario, setErrorFormulario] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')

  useEffect(() => {
    setPagina(1)
  }, [busqueda])

  useEffect(() => {
    if (!mensajeExito) return undefined
    const temporizador = setTimeout(() => setMensajeExito(''), 4000)
    return () => clearTimeout(temporizador)
  }, [mensajeExito])

  const registrosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return registros

    return registros.filter((registro) =>
      [
        registro.codigo_registro,
        registro.placa_detectada,
        registro.estado,
        registro.vehiculos?.placa,
        registro.puestos?.codigo,
      ].some((valor) => valor?.toLowerCase().includes(texto)),
    )
  }, [registros, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(registrosFiltrados.length / registrosPorPagina))
  const paginaActual = Math.min(pagina, totalPaginas)

  const registrosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina
    return registrosFiltrados.slice(inicio, inicio + registrosPorPagina)
  }, [registrosFiltrados, paginaActual])

  const abrirModalNuevo = () => {
    setRegistroEnEdicion(null)
    setFormulario(REGISTRO_VACIO)
    setErrorFormulario('')
    setModalVisible(true)
  }

  const abrirModalEdicion = (registro) => {
    setRegistroEnEdicion(registro)
    setFormulario({
      codigo_registro: registro.codigo_registro ?? '',
      vehiculo_id: registro.vehiculo_id ?? '',
      puesto_id: registro.puesto_id ?? '',
      placa_detectada: registro.placa_detectada ?? '',
      sensor_id_rtdb: registro.sensor_id_rtdb ?? '',
      fecha_entrada: registro.fecha_entrada ? registro.fecha_entrada.slice(0, 16) : '',
      fecha_salida: registro.fecha_salida ? registro.fecha_salida.slice(0, 16) : '',
      duracion_minutos: registro.duracion_minutos ?? '',
      distancia_cm_entrada: registro.distancia_cm_entrada ?? '',
      estado: registro.estado ?? 'ACTIVO',
      observacion: registro.observacion ?? '',
    })
    setErrorFormulario('')
    setModalVisible(true)
  }

  const cerrarModal = () => {
    setModalVisible(false)
    setRegistroEnEdicion(null)
  }

  const cambiarCampo = (campo) => (evento) => {
    setFormulario((valores) => ({ ...valores, [campo]: evento.target.value }))
  }

  const guardarRegistro = async (evento) => {
    evento.preventDefault()
    setGuardando(true)
    setErrorFormulario('')

    const datos = {
      codigo_registro: formulario.codigo_registro,
      vehiculo_id: formulario.vehiculo_id === '' ? null : Number(formulario.vehiculo_id),
      puesto_id: formulario.puesto_id === '' ? null : Number(formulario.puesto_id),
      placa_detectada: formulario.placa_detectada,
      sensor_id_rtdb: formulario.sensor_id_rtdb,
      fecha_entrada: formulario.fecha_entrada
        ? new Date(formulario.fecha_entrada).toISOString()
        : null,
      fecha_salida: formulario.fecha_salida
        ? new Date(formulario.fecha_salida).toISOString()
        : null,
      duracion_minutos:
        formulario.duracion_minutos === '' ? null : Number(formulario.duracion_minutos),
      distancia_cm_entrada:
        formulario.distancia_cm_entrada === '' ? null : Number(formulario.distancia_cm_entrada),
      estado: formulario.estado,
      observacion: formulario.observacion,
    }

    const { error: errorGuardado } = registroEnEdicion
      ? await actualizarRegistro(registroEnEdicion.id, datos)
      : await crearRegistro(datos)

    setGuardando(false)

    if (errorGuardado) {
      setErrorFormulario(errorGuardado.message)
      return
    }

    setMensajeExito(
      registroEnEdicion
        ? `Registro ${datos.codigo_registro} actualizado correctamente.`
        : `Registro ${datos.codigo_registro} agregado correctamente.`,
    )
    cerrarModal()
  }

  const eliminar = async (registro) => {
    const confirmar = window.confirm(`¿Eliminar el registro ${registro.codigo_registro}?`)
    if (!confirmar) return
    const { error: errorEliminar } = await eliminarRegistro(registro.id)
    if (errorEliminar) {
      window.alert(`No se pudo eliminar: ${errorEliminar.message}`)
      return
    }
    setMensajeExito(`Registro ${registro.codigo_registro} eliminado correctamente.`)
  }

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <div>
          <strong>Historial de parqueo</strong>
          <div className="small text-body-secondary">
            Registros de entrada y salida de UTEQ Smart Parking
          </div>
        </div>

        <div className="d-flex gap-2">
          <CButton color="primary" onClick={abrirModalNuevo}>
            Nuevo registro
          </CButton>
          <CButton color="success" variant="outline" onClick={obtenerRegistros} disabled={cargando}>
            Actualizar
          </CButton>
        </div>
      </CCardHeader>

      <CCardBody>
        {mensajeExito && (
          <CAlert color="success" dismissible onClose={() => setMensajeExito('')}>
            {mensajeExito}
          </CAlert>
        )}

        <div className="d-flex justify-content-between align-items-center mb-3 gap-3">
          <CFormInput
            type="search"
            placeholder="Buscar código, placa, puesto o estado..."
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            style={{ maxWidth: '420px' }}
          />

          <span className="text-body-secondary">{registrosFiltrados.length} registros</span>
        </div>

        {cargando && (
          <div className="text-center py-5">
            <CSpinner color="success" />
            <p className="mt-3">Cargando historial...</p>
          </div>
        )}

        {!cargando && error && (
          <CAlert color="danger">No se pudo cargar el historial: {error}</CAlert>
        )}

        {!cargando && !error && (
          <>
            <CTable align="middle" bordered hover responsive striped>
              <CTableHead color="dark">
                <CTableRow>
                  <CTableHeaderCell>Código</CTableHeaderCell>
                  <CTableHeaderCell>Vehículo</CTableHeaderCell>
                  <CTableHeaderCell>Puesto</CTableHeaderCell>
                  <CTableHeaderCell>Entrada</CTableHeaderCell>
                  <CTableHeaderCell>Salida</CTableHeaderCell>
                  <CTableHeaderCell>Duración (min)</CTableHeaderCell>
                  <CTableHeaderCell>Estado</CTableHeaderCell>
                  <CTableHeaderCell>Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {registrosPaginados.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={8} className="text-center py-4">
                      No se encontraron registros.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  registrosPaginados.map((registro) => (
                    <CTableRow key={registro.id}>
                      <CTableDataCell>
                        <CBadge color="dark" className="fs-6">
                          {registro.codigo_registro}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <strong>{registro.placa_detectada}</strong>
                        <div className="small text-body-secondary">
                          {registro.vehiculos
                            ? `${registro.vehiculos.marca} ${registro.vehiculos.modelo}`
                            : '—'}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>{registro.puestos?.codigo ?? '—'}</CTableDataCell>
                      <CTableDataCell className="small">
                        {formatearFecha(registro.fecha_entrada)}
                      </CTableDataCell>
                      <CTableDataCell className="small">
                        {formatearFecha(registro.fecha_salida)}
                      </CTableDataCell>
                      <CTableDataCell>{registro.duracion_minutos ?? '—'}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={registro.estado === 'ACTIVO' ? 'success' : 'secondary'}>
                          {registro.estado}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex gap-2">
                          <CButton
                            color="info"
                            variant="outline"
                            size="sm"
                            onClick={() => abrirModalEdicion(registro)}
                          >
                            Editar
                          </CButton>
                          <CButton
                            color="danger"
                            variant="outline"
                            size="sm"
                            onClick={() => eliminar(registro)}
                          >
                            Eliminar
                          </CButton>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>

            <div className="d-flex justify-content-between align-items-center">
              <small className="text-body-secondary">
                Página {paginaActual} de {totalPaginas}
              </small>

              <div className="d-flex gap-2">
                <CButton
                  color="secondary"
                  variant="outline"
                  disabled={paginaActual === 1}
                  onClick={() => setPagina((valor) => Math.max(1, valor - 1))}
                >
                  Anterior
                </CButton>

                <CButton
                  color="success"
                  variant="outline"
                  disabled={paginaActual === totalPaginas}
                  onClick={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))}
                >
                  Siguiente
                </CButton>
              </div>
            </div>
          </>
        )}
      </CCardBody>

      <CModal visible={modalVisible} onClose={cerrarModal} size="lg">
        <CModalHeader>
          <CModalTitle>{registroEnEdicion ? 'Editar registro' : 'Nuevo registro'}</CModalTitle>
        </CModalHeader>

        <CForm onSubmit={guardarRegistro}>
          <CModalBody>
            {errorFormulario && <CAlert color="danger">{errorFormulario}</CAlert>}

            <div className="row">
              <div className="col-md-6 mb-3">
                <CFormLabel>Código de registro</CFormLabel>
                <CFormInput
                  value={formulario.codigo_registro}
                  onChange={cambiarCampo('codigo_registro')}
                  placeholder="REG-039"
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <CFormLabel>Placa detectada</CFormLabel>
                <CFormInput
                  value={formulario.placa_detectada}
                  onChange={cambiarCampo('placa_detectada')}
                  placeholder="RAA-1001"
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <CFormLabel>Vehículo</CFormLabel>
                <CFormSelect
                  value={formulario.vehiculo_id}
                  onChange={cambiarCampo('vehiculo_id')}
                  required
                >
                  <option value="">Seleccione un vehículo</option>
                  {vehiculos.map((vehiculo) => (
                    <option key={vehiculo.id} value={vehiculo.id}>
                      {vehiculo.placa} — {vehiculo.marca} {vehiculo.modelo}
                    </option>
                  ))}
                </CFormSelect>
              </div>

              <div className="col-md-6 mb-3">
                <CFormLabel>Puesto</CFormLabel>
                <CFormSelect
                  value={formulario.puesto_id}
                  onChange={cambiarCampo('puesto_id')}
                  required
                >
                  <option value="">Seleccione un puesto</option>
                  {puestos.map((puesto) => (
                    <option key={puesto.id} value={puesto.id}>
                      {puesto.codigo}
                    </option>
                  ))}
                </CFormSelect>
              </div>

              <div className="col-md-6 mb-3">
                <CFormLabel>Fecha y hora de entrada</CFormLabel>
                <CFormInput
                  type="datetime-local"
                  value={formulario.fecha_entrada}
                  onChange={cambiarCampo('fecha_entrada')}
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <CFormLabel>Fecha y hora de salida</CFormLabel>
                <CFormInput
                  type="datetime-local"
                  value={formulario.fecha_salida}
                  onChange={cambiarCampo('fecha_salida')}
                />
              </div>

              <div className="col-md-4 mb-3">
                <CFormLabel>Duración (min)</CFormLabel>
                <CFormInput
                  type="number"
                  value={formulario.duracion_minutos}
                  onChange={cambiarCampo('duracion_minutos')}
                />
              </div>

              <div className="col-md-4 mb-3">
                <CFormLabel>Distancia entrada (cm)</CFormLabel>
                <CFormInput
                  type="number"
                  step="0.01"
                  value={formulario.distancia_cm_entrada}
                  onChange={cambiarCampo('distancia_cm_entrada')}
                />
              </div>

              <div className="col-md-4 mb-3">
                <CFormLabel>Estado</CFormLabel>
                <CFormSelect value={formulario.estado} onChange={cambiarCampo('estado')}>
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="FINALIZADO">FINALIZADO</option>
                </CFormSelect>
              </div>

              <div className="col-md-6 mb-3">
                <CFormLabel>Sensor RTDB</CFormLabel>
                <CFormInput
                  value={formulario.sensor_id_rtdb}
                  onChange={cambiarCampo('sensor_id_rtdb')}
                  placeholder="parking_A_01"
                />
              </div>

              <div className="col-12 mb-3">
                <CFormLabel>Observación</CFormLabel>
                <CFormTextarea
                  rows={2}
                  value={formulario.observacion}
                  onChange={cambiarCampo('observacion')}
                />
              </div>
            </div>
          </CModalBody>

          <CModalFooter>
            <CButton color="secondary" variant="outline" onClick={cerrarModal}>
              Cancelar
            </CButton>
            <CButton color="primary" type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </CCard>
  )
}

export default HistorialEstacionamiento
