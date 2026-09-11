import React, { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormCheck,
  CFormFeedback,
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

import { useVehiculos } from '../../hooks/useVehiculos'
import {
  enmascararCedula,
  validarAnio,
  validarCedula,
  validarCorreoInstitucional,
  validarPlaca,
} from '../../lib/validaciones'

const VEHICULO_VACIO = {
  placa: '',
  marca: '',
  modelo: '',
  anio: '',
  color: '',
  tipo: 'AUTOMOVIL',
  foto_url: '',
  foto_fuente_url: '',
  foto_propietario_url: '',
  cedula: '',
  propietario_nombre: '',
  correo_institucional: '',
  autorizado: true,
}

const ListaVehiculos = () => {
  const {
    vehiculos,
    cargando,
    error,
    obtenerVehiculos,
    crearVehiculo,
    actualizarVehiculo,
    eliminarVehiculo,
  } = useVehiculos()

  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const vehiculosPorPagina = 10

  const [modalVisible, setModalVisible] = useState(false)
  const [vehiculoEnEdicion, setVehiculoEnEdicion] = useState(null)
  const [formulario, setFormulario] = useState(VEHICULO_VACIO)
  const [erroresFormulario, setErroresFormulario] = useState({})
  const [errorGuardado, setErrorGuardado] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensajeExito, setMensajeExito] = useState('')

  useEffect(() => {
    setPagina(1)
  }, [busqueda])

  useEffect(() => {
    if (!mensajeExito) return undefined
    const temporizador = setTimeout(() => setMensajeExito(''), 4000)
    return () => clearTimeout(temporizador)
  }, [mensajeExito])

  const vehiculosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    if (!texto) return vehiculos

    return vehiculos.filter((vehiculo) =>
      [
        vehiculo.placa,
        vehiculo.marca,
        vehiculo.modelo,
        vehiculo.color,
        vehiculo.propietario_nombre,
        vehiculo.correo_institucional,
      ].some((valor) => valor?.toLowerCase().includes(texto)),
    )
  }, [vehiculos, busqueda])

  const totalPaginas = Math.max(1, Math.ceil(vehiculosFiltrados.length / vehiculosPorPagina))
  const paginaActual = Math.min(pagina, totalPaginas)

  const vehiculosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * vehiculosPorPagina
    return vehiculosFiltrados.slice(inicio, inicio + vehiculosPorPagina)
  }, [vehiculosFiltrados, paginaActual])

  const abrirModalNuevo = () => {
    setVehiculoEnEdicion(null)
    setFormulario(VEHICULO_VACIO)
    setErroresFormulario({})
    setErrorGuardado('')
    setModalVisible(true)
  }

  const abrirModalEdicion = (vehiculo) => {
    setVehiculoEnEdicion(vehiculo)
    setFormulario({
      placa: vehiculo.placa ?? '',
      marca: vehiculo.marca ?? '',
      modelo: vehiculo.modelo ?? '',
      anio: vehiculo.anio ?? '',
      color: vehiculo.color ?? '',
      tipo: vehiculo.tipo ?? 'AUTOMOVIL',
      foto_url: vehiculo.foto_url ?? '',
      foto_fuente_url: vehiculo.foto_fuente_url ?? '',
      foto_propietario_url: vehiculo.foto_propietario_url ?? '',
      // Al editar no se pide la cédula de nuevo; solo se reemplaza si se escribe una nueva
      cedula: '',
      propietario_nombre: vehiculo.propietario_nombre ?? '',
      correo_institucional: vehiculo.correo_institucional ?? '',
      autorizado: Boolean(vehiculo.autorizado),
    })
    setErroresFormulario({})
    setErrorGuardado('')
    setModalVisible(true)
  }

  const cerrarModal = () => {
    setModalVisible(false)
    setVehiculoEnEdicion(null)
  }

  const cambiarCampo = (campo) => (evento) => {
    const valor = evento.target.type === 'checkbox' ? evento.target.checked : evento.target.value
    setFormulario((valores) => ({ ...valores, [campo]: valor }))
  }

  const validarFormulario = () => {
    const errores = {}

    if (!validarPlaca(formulario.placa)) {
      errores.placa = 'La placa debe tener el formato AAA-1234.'
    }
    if (!formulario.marca.trim()) {
      errores.marca = 'La marca es obligatoria.'
    }
    if (!formulario.modelo.trim()) {
      errores.modelo = 'El modelo es obligatorio.'
    }
    if (!validarAnio(formulario.anio)) {
      errores.anio = 'Ingrese un año válido (1990 en adelante).'
    }
    if (!formulario.color.trim()) {
      errores.color = 'El color es obligatorio.'
    }
    if (!formulario.propietario_nombre.trim()) {
      errores.propietario_nombre = 'El nombre del propietario es obligatorio.'
    }
    if (!validarCorreoInstitucional(formulario.correo_institucional)) {
      errores.correo_institucional = 'Debe ser un correo institucional @uteq.edu.ec.'
    }
    // La cédula solo es obligatoria al crear un vehículo nuevo
    if (!vehiculoEnEdicion && !validarCedula(formulario.cedula)) {
      errores.cedula = 'La cédula debe tener 10 dígitos.'
    }
    if (vehiculoEnEdicion && formulario.cedula && !validarCedula(formulario.cedula)) {
      errores.cedula = 'La cédula debe tener 10 dígitos.'
    }

    setErroresFormulario(errores)
    return Object.keys(errores).length === 0
  }

  const guardarVehiculo = async (evento) => {
    evento.preventDefault()
    setErrorGuardado('')

    if (!validarFormulario()) return

    setGuardando(true)

    const datos = {
      placa: formulario.placa.trim().toUpperCase(),
      marca: formulario.marca.trim(),
      modelo: formulario.modelo.trim(),
      anio: Number(formulario.anio),
      color: formulario.color.trim(),
      tipo: formulario.tipo,
      foto_url: formulario.foto_url.trim(),
      foto_fuente_url: formulario.foto_fuente_url.trim(),
      foto_propietario_url: formulario.foto_propietario_url.trim(),
      propietario_nombre: formulario.propietario_nombre.trim(),
      correo_institucional: formulario.correo_institucional.trim(),
      autorizado: formulario.autorizado,
    }

    // cedula_enmascarada se calcula sola en la base de datos a partir de
    // cedula_propietario (columna GENERATED ALWAYS); por eso solo enviamos
    // la cédula completa cuando el usuario escribió una nueva
    if (formulario.cedula) {
      datos.cedula_propietario = formulario.cedula.trim()
    }

    const { error: errorSupabase } = vehiculoEnEdicion
      ? await actualizarVehiculo(vehiculoEnEdicion.id, datos)
      : await crearVehiculo(datos)

    setGuardando(false)

    if (errorSupabase) {
      setErrorGuardado(errorSupabase.message)
      return
    }

    setMensajeExito(
      vehiculoEnEdicion
        ? `Vehículo ${datos.placa} actualizado correctamente.`
        : `Vehículo ${datos.placa} agregado correctamente.`,
    )
    cerrarModal()
  }

  const eliminar = async (vehiculo) => {
    const confirmar = window.confirm(
      `¿Eliminar el vehículo ${vehiculo.placa} de ${vehiculo.propietario_nombre}? Esta acción no se puede deshacer.`,
    )
    if (!confirmar) return

    const { error: errorSupabase } = await eliminarVehiculo(vehiculo.id)

    if (errorSupabase) {
      window.alert(`No se pudo eliminar: ${errorSupabase.message}`)
      return
    }

    setMensajeExito(`Vehículo ${vehiculo.placa} eliminado correctamente.`)
  }

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <div>
          <strong>Vehículos y propietarios</strong>
          <div className="small text-body-secondary">
            Vehículos autorizados en UTEQ Smart Parking
          </div>
        </div>

        <div className="d-flex gap-2">
          <CButton color="primary" onClick={abrirModalNuevo}>
            Nuevo vehículo
          </CButton>
          <CButton color="success" variant="outline" onClick={obtenerVehiculos} disabled={cargando}>
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
            placeholder="Buscar placa, vehículo o propietario..."
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            style={{ maxWidth: '420px' }}
          />

          <span className="text-body-secondary">{vehiculosFiltrados.length} vehículos</span>
        </div>

        {cargando && (
          <div className="text-center py-5">
            <CSpinner color="success" />
            <p className="mt-3">Cargando vehículos...</p>
          </div>
        )}

        {!cargando && error && (
          <CAlert color="danger">No se pudieron cargar los vehículos: {error}</CAlert>
        )}

        {!cargando && !error && (
          <>
            <CTable align="middle" bordered hover responsive striped>
              <CTableHead color="dark">
                <CTableRow>
                  <CTableHeaderCell>Foto del vehículo</CTableHeaderCell>
                  <CTableHeaderCell>Placa</CTableHeaderCell>
                  <CTableHeaderCell>Vehículo</CTableHeaderCell>
                  <CTableHeaderCell>Año / color</CTableHeaderCell>
                  <CTableHeaderCell>Foto del propietario</CTableHeaderCell>
                  <CTableHeaderCell>Propietario</CTableHeaderCell>
                  <CTableHeaderCell>Cédula</CTableHeaderCell>
                  <CTableHeaderCell>Correo</CTableHeaderCell>
                  <CTableHeaderCell>Estado</CTableHeaderCell>
                  <CTableHeaderCell>Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {vehiculosPaginados.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={10} className="text-center py-4">
                      No se encontraron vehículos.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  vehiculosPaginados.map((vehiculo) => (
                    <CTableRow key={vehiculo.id}>
                      <CTableDataCell>
                        <a
                          href={vehiculo.foto_fuente_url}
                          target="_blank"
                          rel="noreferrer"
                          title="Abrir fuente de la imagen"
                        >
                          <img
                            src={vehiculo.foto_url}
                            alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                            width="100"
                            height="65"
                            style={{ objectFit: 'cover', borderRadius: '8px' }}
                          />
                        </a>
                      </CTableDataCell>

                      <CTableDataCell>
                        <CBadge color="dark" className="fs-6">
                          {vehiculo.placa}
                        </CBadge>
                      </CTableDataCell>

                      <CTableDataCell>
                        <strong>{vehiculo.marca}</strong>
                        <div className="small text-body-secondary">{vehiculo.modelo}</div>
                      </CTableDataCell>

                      <CTableDataCell>
                        {vehiculo.anio}
                        <div className="small text-body-secondary">{vehiculo.color}</div>
                      </CTableDataCell>

                      <CTableDataCell className="text-center">
                        <img
                          src={vehiculo.foto_propietario_url}
                          alt={`Fotografía de ${vehiculo.propietario_nombre}`}
                          width="60"
                          height="60"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          style={{
                            objectFit: 'cover',
                            borderRadius: '50%',
                            border: '2px solid var(--cui-border-color)',
                          }}
                        />
                      </CTableDataCell>

                      <CTableDataCell>{vehiculo.propietario_nombre}</CTableDataCell>

                      <CTableDataCell>{vehiculo.cedula_enmascarada}</CTableDataCell>

                      <CTableDataCell>
                        <a href={`mailto:${vehiculo.correo_institucional}`}>
                          {vehiculo.correo_institucional}
                        </a>
                      </CTableDataCell>

                      <CTableDataCell>
                        <CBadge color={vehiculo.autorizado ? 'success' : 'danger'}>
                          {vehiculo.autorizado ? 'Autorizado' : 'No autorizado'}
                        </CBadge>
                      </CTableDataCell>

                      <CTableDataCell>
                        <div className="d-flex gap-2">
                          <CButton
                            color="info"
                            variant="outline"
                            size="sm"
                            onClick={() => abrirModalEdicion(vehiculo)}
                          >
                            Editar
                          </CButton>
                          <CButton
                            color="danger"
                            variant="outline"
                            size="sm"
                            onClick={() => eliminar(vehiculo)}
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
          <CModalTitle>
            {vehiculoEnEdicion ? 'Editar vehículo y propietario' : 'Nuevo vehículo y propietario'}
          </CModalTitle>
        </CModalHeader>

        <CForm noValidate onSubmit={guardarVehiculo}>
          <CModalBody>
            {errorGuardado && <CAlert color="danger">{errorGuardado}</CAlert>}

            <h6 className="mb-3">Datos del vehículo</h6>
            <div className="row">
              <div className="col-md-4 mb-3">
                <CFormLabel>Placa</CFormLabel>
                <CFormInput
                  value={formulario.placa}
                  onChange={cambiarCampo('placa')}
                  placeholder="RAA-1001"
                  invalid={Boolean(erroresFormulario.placa)}
                  feedbackInvalid={erroresFormulario.placa}
                />
              </div>

              <div className="col-md-4 mb-3">
                <CFormLabel>Marca</CFormLabel>
                <CFormInput
                  value={formulario.marca}
                  onChange={cambiarCampo('marca')}
                  invalid={Boolean(erroresFormulario.marca)}
                  feedbackInvalid={erroresFormulario.marca}
                />
              </div>

              <div className="col-md-4 mb-3">
                <CFormLabel>Modelo</CFormLabel>
                <CFormInput
                  value={formulario.modelo}
                  onChange={cambiarCampo('modelo')}
                  invalid={Boolean(erroresFormulario.modelo)}
                  feedbackInvalid={erroresFormulario.modelo}
                />
              </div>

              <div className="col-md-4 mb-3">
                <CFormLabel>Año</CFormLabel>
                <CFormInput
                  type="number"
                  value={formulario.anio}
                  onChange={cambiarCampo('anio')}
                  invalid={Boolean(erroresFormulario.anio)}
                  feedbackInvalid={erroresFormulario.anio}
                />
              </div>

              <div className="col-md-4 mb-3">
                <CFormLabel>Color</CFormLabel>
                <CFormInput
                  value={formulario.color}
                  onChange={cambiarCampo('color')}
                  invalid={Boolean(erroresFormulario.color)}
                  feedbackInvalid={erroresFormulario.color}
                />
              </div>

              <div className="col-md-4 mb-3">
                <CFormLabel>Tipo</CFormLabel>
                <CFormSelect value={formulario.tipo} onChange={cambiarCampo('tipo')}>
                  <option value="AUTOMOVIL">Automóvil</option>
                  <option value="CAMIONETA">Camioneta</option>
                  <option value="SUV">SUV</option>
                  <option value="MOTOCICLETA">Motocicleta</option>
                </CFormSelect>
              </div>

              <div className="col-md-6 mb-3">
                <CFormLabel>URL foto del vehículo</CFormLabel>
                <CFormInput
                  type="url"
                  value={formulario.foto_url}
                  onChange={cambiarCampo('foto_url')}
                  placeholder="https://..."
                />
              </div>

              <div className="col-md-6 mb-3">
                <CFormLabel>URL fuente de la foto</CFormLabel>
                <CFormInput
                  type="url"
                  value={formulario.foto_fuente_url}
                  onChange={cambiarCampo('foto_fuente_url')}
                  placeholder="https://..."
                />
              </div>
            </div>

            <hr />
            <h6 className="mb-3">Datos del propietario</h6>
            <div className="row">
              <div className="col-md-6 mb-3">
                <CFormLabel>Nombre del propietario</CFormLabel>
                <CFormInput
                  value={formulario.propietario_nombre}
                  onChange={cambiarCampo('propietario_nombre')}
                  invalid={Boolean(erroresFormulario.propietario_nombre)}
                  feedbackInvalid={erroresFormulario.propietario_nombre}
                />
              </div>

              <div className="col-md-6 mb-3">
                <CFormLabel>Correo institucional</CFormLabel>
                <CFormInput
                  type="email"
                  value={formulario.correo_institucional}
                  onChange={cambiarCampo('correo_institucional')}
                  placeholder="usuario@uteq.edu.ec"
                  invalid={Boolean(erroresFormulario.correo_institucional)}
                  feedbackInvalid={erroresFormulario.correo_institucional}
                />
              </div>

              <div className="col-md-6 mb-3">
                <CFormLabel>
                  Cédula {vehiculoEnEdicion && '(dejar en blanco para no cambiarla)'}
                </CFormLabel>
                <CFormInput
                  value={formulario.cedula}
                  onChange={cambiarCampo('cedula')}
                  placeholder="10 dígitos"
                  maxLength={10}
                  invalid={Boolean(erroresFormulario.cedula)}
                  feedbackInvalid={erroresFormulario.cedula}
                />
                {!erroresFormulario.cedula && (
                  <CFormFeedback className="d-block text-body-secondary">
                    {formulario.cedula && formulario.cedula.length === 10
                      ? `Se guardará como: ${enmascararCedula(formulario.cedula)}`
                      : 'Se guardará enmascarada, mostrando solo los últimos 4 dígitos.'}
                  </CFormFeedback>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <CFormLabel>URL foto del propietario</CFormLabel>
                <CFormInput
                  type="url"
                  value={formulario.foto_propietario_url}
                  onChange={cambiarCampo('foto_propietario_url')}
                  placeholder="https://..."
                />
              </div>

              <div className="col-12">
                <CFormCheck
                  id="autorizado"
                  label="Vehículo autorizado"
                  checked={formulario.autorizado}
                  onChange={cambiarCampo('autorizado')}
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

export default ListaVehiculos
