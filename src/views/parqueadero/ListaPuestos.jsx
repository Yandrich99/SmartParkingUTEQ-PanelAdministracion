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

import { usePuestos } from '../../hooks/usePuestos'

const PUESTO_VACIO = {
  codigo: '',
  columna: '',
  numero: '',
  sensor_id_rtdb: '',
  ruta_firebase: '',
  estado: 'DISPONIBLE',
  distancia_cm: '',
}

const ListaPuestos = () => {
  const {
    puestos,
    cargando,
    error,
    obtenerPuestos,
    crearPuesto,
    actualizarPuesto,
    eliminarPuesto,
  } = usePuestos()

  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const puestosPorPagina = 10

  const [modalVisible, setModalVisible] = useState(false)
  const [puestoEnEdicion, setPuestoEnEdicion] = useState(null)
  const [formulario, setFormulario] = useState(PUESTO_VACIO)
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

  const puestosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return puestos

    return puestos.filter((puesto) =>
      [puesto.codigo, puesto.columna, puesto.estado, puesto.sensor_id_rtdb].some((valor) =>
        valor?.toLowerCase().includes(texto),
      ),
    )
  }, [puestos, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(puestosFiltrados.length / puestosPorPagina))
  const paginaActual = Math.min(pagina, totalPaginas)

  const puestosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * puestosPorPagina
    return puestosFiltrados.slice(inicio, inicio + puestosPorPagina)
  }, [puestosFiltrados, paginaActual])

  const abrirModalNuevo = () => {
    setPuestoEnEdicion(null)
    setFormulario(PUESTO_VACIO)
    setErrorFormulario('')
    setModalVisible(true)
  }

  const abrirModalEdicion = (puesto) => {
    setPuestoEnEdicion(puesto)
    setFormulario({
      codigo: puesto.codigo ?? '',
      columna: puesto.columna ?? '',
      numero: puesto.numero ?? '',
      sensor_id_rtdb: puesto.sensor_id_rtdb ?? '',
      ruta_firebase: puesto.ruta_firebase ?? '',
      estado: puesto.estado ?? 'DISPONIBLE',
      distancia_cm: puesto.distancia_cm ?? '',
    })
    setErrorFormulario('')
    setModalVisible(true)
  }

  const cerrarModal = () => {
    setModalVisible(false)
    setPuestoEnEdicion(null)
  }

  const cambiarCampo = (campo) => (evento) => {
    setFormulario((valores) => ({ ...valores, [campo]: evento.target.value }))
  }

  const guardarPuesto = async (evento) => {
    evento.preventDefault()
    setGuardando(true)
    setErrorFormulario('')

    const datos = {
      codigo: formulario.codigo,
      columna: formulario.columna,
      numero: formulario.numero === '' ? null : Number(formulario.numero),
      sensor_id_rtdb: formulario.sensor_id_rtdb,
      ruta_firebase: formulario.ruta_firebase,
      estado: formulario.estado,
      distancia_cm: formulario.distancia_cm === '' ? null : Number(formulario.distancia_cm),
    }

    const { error: errorGuardado } = puestoEnEdicion
      ? await actualizarPuesto(puestoEnEdicion.id, datos)
      : await crearPuesto(datos)

    setGuardando(false)

    if (errorGuardado) {
      setErrorFormulario(errorGuardado.message)
      return
    }

    setMensajeExito(
      puestoEnEdicion
        ? `Puesto ${datos.codigo} actualizado correctamente.`
        : `Puesto ${datos.codigo} agregado correctamente.`,
    )
    cerrarModal()
  }

  const eliminar = async (puesto) => {
    const confirmar = window.confirm(`¿Eliminar el puesto ${puesto.codigo}?`)
    if (!confirmar) return
    const { error: errorEliminar } = await eliminarPuesto(puesto.id)
    if (errorEliminar) {
      window.alert(`No se pudo eliminar: ${errorEliminar.message}`)
      return
    }
    setMensajeExito(`Puesto ${puesto.codigo} eliminado correctamente.`)
  }

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <div>
          <strong>Puestos</strong>
          <div className="small text-body-secondary">
            Puestos de estacionamiento de UTEQ Smart Parking
          </div>
        </div>

        <div className="d-flex gap-2">
          <CButton color="primary" onClick={abrirModalNuevo}>
            Nuevo puesto
          </CButton>
          <CButton color="success" variant="outline" onClick={obtenerPuestos} disabled={cargando}>
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
            placeholder="Buscar código, columna, estado o sensor..."
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            style={{ maxWidth: '420px' }}
          />

          <span className="text-body-secondary">{puestosFiltrados.length} puestos</span>
        </div>

        {cargando && (
          <div className="text-center py-5">
            <CSpinner color="success" />
            <p className="mt-3">Cargando puestos...</p>
          </div>
        )}

        {!cargando && error && (
          <CAlert color="danger">No se pudieron cargar los puestos: {error}</CAlert>
        )}

        {!cargando && !error && (
          <>
            <CTable align="middle" bordered hover responsive striped>
              <CTableHead color="dark">
                <CTableRow>
                  <CTableHeaderCell>Código</CTableHeaderCell>
                  <CTableHeaderCell>Columna</CTableHeaderCell>
                  <CTableHeaderCell>Número</CTableHeaderCell>
                  <CTableHeaderCell>Estado</CTableHeaderCell>
                  <CTableHeaderCell>Distancia (cm)</CTableHeaderCell>
                  <CTableHeaderCell>Sensor RTDB</CTableHeaderCell>
                  <CTableHeaderCell>Última actualización</CTableHeaderCell>
                  <CTableHeaderCell>Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {puestosPaginados.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={8} className="text-center py-4">
                      No se encontraron puestos.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  puestosPaginados.map((puesto) => (
                    <CTableRow key={puesto.id}>
                      <CTableDataCell>
                        <CBadge color="dark" className="fs-6">
                          {puesto.codigo}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>{puesto.columna}</CTableDataCell>
                      <CTableDataCell>{puesto.numero}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={puesto.estado === 'DISPONIBLE' ? 'success' : 'danger'}>
                          {puesto.estado}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>{puesto.distancia_cm}</CTableDataCell>
                      <CTableDataCell className="small text-body-secondary">
                        {puesto.sensor_id_rtdb}
                      </CTableDataCell>
                      <CTableDataCell className="small text-body-secondary">
                        {puesto.ultima_actualizacion
                          ? new Date(puesto.ultima_actualizacion).toLocaleString()
                          : '—'}
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex gap-2">
                          <CButton
                            color="info"
                            variant="outline"
                            size="sm"
                            onClick={() => abrirModalEdicion(puesto)}
                          >
                            Editar
                          </CButton>
                          <CButton
                            color="danger"
                            variant="outline"
                            size="sm"
                            onClick={() => eliminar(puesto)}
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

      <CModal visible={modalVisible} onClose={cerrarModal}>
        <CModalHeader>
          <CModalTitle>{puestoEnEdicion ? 'Editar puesto' : 'Nuevo puesto'}</CModalTitle>
        </CModalHeader>

        <CForm onSubmit={guardarPuesto}>
          <CModalBody>
            {errorFormulario && <CAlert color="danger">{errorFormulario}</CAlert>}

            <div className="mb-3">
              <CFormLabel>Código</CFormLabel>
              <CFormInput
                value={formulario.codigo}
                onChange={cambiarCampo('codigo')}
                placeholder="A01"
                required
              />
            </div>

            <div className="mb-3">
              <CFormLabel>Columna</CFormLabel>
              <CFormInput
                value={formulario.columna}
                onChange={cambiarCampo('columna')}
                placeholder="A"
                maxLength={1}
                required
              />
            </div>

            <div className="mb-3">
              <CFormLabel>Número</CFormLabel>
              <CFormInput
                type="number"
                value={formulario.numero}
                onChange={cambiarCampo('numero')}
                required
              />
            </div>

            <div className="mb-3">
              <CFormLabel>Estado</CFormLabel>
              <CFormSelect value={formulario.estado} onChange={cambiarCampo('estado')}>
                <option value="DISPONIBLE">DISPONIBLE</option>
                <option value="OCUPADO">OCUPADO</option>
              </CFormSelect>
            </div>

            <div className="mb-3">
              <CFormLabel>Distancia (cm)</CFormLabel>
              <CFormInput
                type="number"
                step="0.01"
                value={formulario.distancia_cm}
                onChange={cambiarCampo('distancia_cm')}
              />
            </div>

            <div className="mb-3">
              <CFormLabel>Sensor RTDB</CFormLabel>
              <CFormInput
                value={formulario.sensor_id_rtdb}
                onChange={cambiarCampo('sensor_id_rtdb')}
                placeholder="parking_A_01"
              />
            </div>

            <div className="mb-3">
              <CFormLabel>Ruta Firebase</CFormLabel>
              <CFormInput
                value={formulario.ruta_firebase}
                onChange={cambiarCampo('ruta_firebase')}
                placeholder="/parqueadero/sensores/parking_A_01"
              />
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

export default ListaPuestos
