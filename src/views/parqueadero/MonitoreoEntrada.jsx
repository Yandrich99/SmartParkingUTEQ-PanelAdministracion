import React, { useCallback, useEffect, useRef, useState } from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBan,
  cilCamera,
  cilCheckCircle,
  cilCloudUpload,
  cilImage,
  cilReload,
  cilWarning,
  cilXCircle,
} from '@coreui/icons'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableRow,
} from '@coreui/react'

import { useDeteccionPlaca } from '../../hooks/useDeteccionPlaca'
import { validarImagen } from '../../lib/ocr'

// Configuración visual por cada "estado" que puede devolver el endpoint de
// reconocimiento. No se inventan datos: solo se define cómo presentar cada
// estado posible descrito en la práctica.
const CONFIGURACION_ESTADOS = {
  encontrado: {
    color: 'success',
    icono: cilCheckCircle,
    titulo: 'VEHÍCULO REGISTRADO',
  },
  no_registrado: {
    color: 'danger',
    icono: cilXCircle,
    titulo: 'VEHÍCULO NO REGISTRADO',
    mensaje: 'La placa no existe en la base de datos de Supabase.',
  },
  sin_placa: {
    color: 'warning',
    icono: cilWarning,
    titulo: 'PLACA NO DETECTADA',
    mensaje: 'No se detectó ninguna placa en la imagen. Intente con mejor iluminación y encuadre.',
  },
  baja_confianza: {
    color: 'warning',
    icono: cilWarning,
    titulo: 'CONFIANZA BAJA',
    mensaje: 'El nivel de confianza del reconocimiento es bajo. Capture la imagen nuevamente.',
  },
  multiples_placas: {
    color: 'warning',
    icono: cilWarning,
    titulo: 'MÚLTIPLES PLACAS DETECTADAS',
    mensaje: 'Se detectaron varias placas en la imagen. Capture un solo vehículo a la vez.',
  },
}

const obtenerConfiguracionEstado = (estado) =>
  CONFIGURACION_ESTADOS[estado] ?? {
    color: 'secondary',
    icono: cilWarning,
    titulo: 'ESTADO DESCONOCIDO',
    mensaje: `El servicio devolvió un estado no reconocido: ${estado ?? 'sin estado'}.`,
  }

// La confianza puede llegar como fracción (0-1) o como porcentaje (0-100)
const formatearConfianza = (valor) => {
  if (valor === null || valor === undefined || valor === '') return '—'
  const numero = Number(valor)
  if (Number.isNaN(numero)) return '—'
  const porcentaje = numero <= 1 ? numero * 100 : numero
  return `${porcentaje.toFixed(1).replace('.', ',')} %`
}

const obtenerImagenMarcadaSrc = (resultado) => {
  const marcada = resultado?.imagen_marcada
  if (!marcada?.base64 || !marcada?.mime_type) return null
  return `data:${marcada.mime_type};base64,${marcada.base64}`
}

const MonitoreoEntrada = () => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)
  const previewUrlRef = useRef('')

  const [camaraActiva, setCamaraActiva] = useState(false)
  const [errorCamara, setErrorCamara] = useState('')
  const [archivoImagen, setArchivoImagen] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [errorImagen, setErrorImagen] = useState('')

  const { procesando, resultado, errorApi, detectarPlaca, reiniciarResultado } =
    useDeteccionPlaca()

  // Libera la cámara: detiene todas las pistas del stream activo
  const detenerCamara = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((pista) => pista.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCamaraActiva(false)
  }, [])

  // Libera la cámara al desmontar la vista (por ejemplo, al navegar a otra página)
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((pista) => pista.stop())
      }
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  const iniciarCamara = async () => {
    setErrorCamara('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCamaraActiva(true)
    } catch {
      setErrorCamara(
        'No se pudo acceder a la cámara. Verifique los permisos del navegador o use "Subir imagen".',
      )
    }
  }

  // Aplica una nueva imagen (capturada o subida): valida y genera la vista previa
  const seleccionarImagen = useCallback((archivo) => {
    const { valido, mensaje } = validarImagen(archivo)
    if (!valido) {
      setErrorImagen(mensaje)
      return
    }

    setErrorImagen('')
    reiniciarResultado()

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }
    const url = URL.createObjectURL(archivo)
    previewUrlRef.current = url
    setPreviewUrl(url)
    setArchivoImagen(archivo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const capturarFoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const contexto = canvas.getContext('2d')
    contexto.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (blob) seleccionarImagen(blob)
      },
      'image/jpeg',
      0.92,
    )
  }

  const manejarSeleccionArchivo = (evento) => {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (archivo) seleccionarImagen(archivo)
  }

  const abrirSelectorArchivo = () => fileInputRef.current?.click()

  // Reinicia la vista de captura para procesar una nueva imagen
  const reiniciarTodo = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = ''
    }
    setPreviewUrl('')
    setArchivoImagen(null)
    setErrorImagen('')
    reiniciarResultado()
  }

  const ejecutarDeteccion = () => {
    if (!archivoImagen || procesando) return
    detectarPlaca(archivoImagen)
  }

  const imagenMarcadaSrc = obtenerImagenMarcadaSrc(resultado)
  const configuracionEstado = resultado ? obtenerConfiguracionEstado(resultado.estado) : null
  const placa = resultado?.placa ?? resultado?.placa_detectada ?? null
  const confianza = resultado?.confianza ?? resultado?.confianza_ocr ?? null
  const vehiculo = resultado?.vehiculo ?? null
  const vehiculoEncontrado = Boolean(resultado?.vehiculo_encontrado)

  return (
    <>
      <div className="mb-4 d-flex align-items-center">
        <div className="border-start border-success border-4 ps-3">
          <h4 className="mb-0">Monitoreo de entrada</h4>
          <div className="text-body-secondary">Reconocimiento automático de placas en tiempo real</div>
        </div>
      </div>

      <CRow>
        {/* Columna izquierda: captura del vehículo */}
        <CCol lg={6} className="mb-4">
          <CCard className="h-100">
            <CCardHeader>
              <CIcon icon={imagenMarcadaSrc ? cilImage : cilCamera} className="me-2" />
              <strong>{imagenMarcadaSrc ? 'Imagen procesada' : 'Captura del vehículo'}</strong>
            </CCardHeader>
            <CCardBody className="d-flex flex-column">
              {errorCamara && <CAlert color="danger">{errorCamara}</CAlert>}
              {errorImagen && <CAlert color="danger">{errorImagen}</CAlert>}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="d-none"
                onChange={manejarSeleccionArchivo}
              />
              <canvas ref={canvasRef} className="d-none" />

              {imagenMarcadaSrc ? (
                <>
                  <img
                    src={imagenMarcadaSrc}
                    alt="Vehículo con placa detectada"
                    className="img-fluid rounded border mb-3"
                  />
                  <div className="d-flex gap-2 mt-auto">
                    <CButton color="success" onClick={reiniciarTodo}>
                      <CIcon icon={cilCamera} className="me-1" />
                      Nueva captura
                    </CButton>
                    <CButton
                      color="secondary"
                      variant="outline"
                      onClick={() => {
                        reiniciarTodo()
                        abrirSelectorArchivo()
                      }}
                    >
                      <CIcon icon={cilCloudUpload} className="me-1" />
                      Subir otra imagen
                    </CButton>
                  </div>
                </>
              ) : previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Vista previa de la imagen seleccionada"
                    className="img-fluid rounded border mb-3"
                  />
                  <div className="d-flex gap-2 mt-auto">
                    <CButton color="primary" onClick={ejecutarDeteccion} disabled={procesando}>
                      {procesando ? (
                        <>
                          <CSpinner size="sm" className="me-2" />
                          Procesando...
                        </>
                      ) : (
                        'Detectar placa'
                      )}
                    </CButton>
                    <CButton
                      color="secondary"
                      variant="outline"
                      onClick={reiniciarTodo}
                      disabled={procesando}
                    >
                      Cambiar imagen
                    </CButton>
                  </div>
                </>
              ) : camaraActiva ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="img-fluid rounded border mb-3 bg-dark"
                  />
                  <div className="d-flex gap-2 mt-auto">
                    <CButton color="primary" onClick={capturarFoto}>
                      <CIcon icon={cilCamera} className="me-1" />
                      Capturar foto
                    </CButton>
                    <CButton color="danger" variant="outline" onClick={detenerCamara}>
                      Detener cámara
                    </CButton>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="d-flex align-items-center justify-content-center rounded border bg-body-tertiary mb-3 flex-grow-1"
                    style={{ minHeight: '260px' }}
                  >
                    <div className="text-center text-body-secondary">
                      <CIcon icon={cilCamera} size="xxl" />
                      <p className="mt-2 mb-0">Active la cámara o suba una imagen</p>
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-auto">
                    <CButton color="primary" onClick={iniciarCamara}>
                      <CIcon icon={cilCamera} className="me-1" />
                      Activar cámara
                    </CButton>
                    <CButton color="secondary" variant="outline" onClick={abrirSelectorArchivo}>
                      <CIcon icon={cilCloudUpload} className="me-1" />
                      Subir imagen
                    </CButton>
                  </div>
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        {/* Columna derecha: resultados */}
        <CCol lg={6} className="mb-4">
          <CCard className="h-100">
            <CCardHeader>
              <strong>Resultado del reconocimiento</strong>
            </CCardHeader>
            <CCardBody>
              {procesando && (
                <div className="text-center py-5">
                  <CSpinner color="primary" />
                  <p className="mt-3 mb-0">Analizando imagen...</p>
                </div>
              )}

              {!procesando && errorApi && (
                <>
                  <CAlert color="danger">{errorApi}</CAlert>
                  {archivoImagen && (
                    <CButton color="primary" variant="outline" onClick={ejecutarDeteccion}>
                      <CIcon icon={cilReload} className="me-1" />
                      Reintentar
                    </CButton>
                  )}
                </>
              )}

              {!procesando && !errorApi && !resultado && (
                <p className="text-body-secondary mb-0">
                  Capture o suba una imagen y presione «Detectar placa» para ver aquí el
                  resultado del reconocimiento.
                </p>
              )}

              {!procesando && !errorApi && resultado && (
                <>
                  <CAlert color={configuracionEstado.color} className="d-flex align-items-center">
                    <CIcon icon={configuracionEstado.icono} size="xl" className="flex-shrink-0 me-2" />
                    <strong>{configuracionEstado.titulo}</strong>
                  </CAlert>

                  <CTable borderless small className="mb-3">
                    <CTableBody>
                      <CTableRow>
                        <CTableDataCell className="text-body-secondary">
                          Placa detectada
                        </CTableDataCell>
                        <CTableDataCell>
                          <strong>{placa ?? '—'}</strong>
                        </CTableDataCell>
                      </CTableRow>
                      <CTableRow>
                        <CTableDataCell className="text-body-secondary">
                          Confianza OCR
                        </CTableDataCell>
                        <CTableDataCell>{formatearConfianza(confianza)}</CTableDataCell>
                      </CTableRow>
                      <CTableRow>
                        <CTableDataCell className="text-body-secondary">Estado</CTableDataCell>
                        <CTableDataCell>
                          <code>{resultado.estado ?? '—'}</code>
                        </CTableDataCell>
                      </CTableRow>
                      <CTableRow>
                        <CTableDataCell className="text-body-secondary">
                          Vehículo encontrado
                        </CTableDataCell>
                        <CTableDataCell>{vehiculoEncontrado ? 'Sí' : 'No'}</CTableDataCell>
                      </CTableRow>
                    </CTableBody>
                  </CTable>

                  {resultado.estado === 'encontrado' && vehiculo && (
                    <>
                      <hr />
                      <div className="row g-3 mb-3">
                        {vehiculo.foto_url && (
                          <div className="col-6">
                            <img
                              src={vehiculo.foto_url}
                              alt="Vehículo registrado"
                              className="img-fluid rounded border"
                            />
                          </div>
                        )}
                        {vehiculo.foto_propietario_url && (
                          <div className="col-6">
                            <img
                              src={vehiculo.foto_propietario_url}
                              alt="Propietario"
                              className="img-fluid rounded border"
                            />
                          </div>
                        )}
                      </div>

                      <CTable borderless small className="mb-3">
                        <CTableBody>
                          <CTableRow>
                            <CTableDataCell className="text-body-secondary">Marca</CTableDataCell>
                            <CTableDataCell>{vehiculo.marca ?? '—'}</CTableDataCell>
                          </CTableRow>
                          <CTableRow>
                            <CTableDataCell className="text-body-secondary">
                              Modelo
                            </CTableDataCell>
                            <CTableDataCell>{vehiculo.modelo ?? '—'}</CTableDataCell>
                          </CTableRow>
                          <CTableRow>
                            <CTableDataCell className="text-body-secondary">Año</CTableDataCell>
                            <CTableDataCell>{vehiculo.anio ?? '—'}</CTableDataCell>
                          </CTableRow>
                          <CTableRow>
                            <CTableDataCell className="text-body-secondary">Color</CTableDataCell>
                            <CTableDataCell>{vehiculo.color ?? '—'}</CTableDataCell>
                          </CTableRow>
                          <CTableRow>
                            <CTableDataCell className="text-body-secondary">Tipo</CTableDataCell>
                            <CTableDataCell>{vehiculo.tipo ?? '—'}</CTableDataCell>
                          </CTableRow>
                          <CTableRow>
                            <CTableDataCell className="text-body-secondary">
                              Propietario
                            </CTableDataCell>
                            <CTableDataCell>{vehiculo.propietario_nombre ?? '—'}</CTableDataCell>
                          </CTableRow>
                          <CTableRow>
                            <CTableDataCell className="text-body-secondary">
                              Cédula
                            </CTableDataCell>
                            <CTableDataCell>{vehiculo.cedula_enmascarada ?? '—'}</CTableDataCell>
                          </CTableRow>
                          <CTableRow>
                            <CTableDataCell className="text-body-secondary">
                              Autorización
                            </CTableDataCell>
                            <CTableDataCell>
                              <CBadge color={vehiculo.autorizado ? 'success' : 'danger'}>
                                {vehiculo.autorizado ? 'Autorizado' : 'No autorizado'}
                              </CBadge>
                            </CTableDataCell>
                          </CTableRow>
                        </CTableBody>
                      </CTable>

                      <CAlert color={vehiculo.autorizado ? 'success' : 'danger'}>
                        <CIcon
                          icon={vehiculo.autorizado ? cilCheckCircle : cilBan}
                          className="me-2"
                        />
                        {vehiculo.autorizado
                          ? 'Ingreso autorizado.'
                          : 'Vehículo registrado, pero sin autorización de ingreso.'}
                      </CAlert>
                    </>
                  )}

                  {resultado.estado !== 'encontrado' && configuracionEstado.mensaje && (
                    <CAlert color={configuracionEstado.color}>
                      {configuracionEstado.mensaje}
                      {resultado.estado === 'no_registrado' && (
                        <div className="fw-semibold mt-1">No se autoriza el ingreso.</div>
                      )}
                    </CAlert>
                  )}

                  <CButton color="secondary" variant="outline" onClick={reiniciarTodo}>
                    <CIcon icon={cilReload} className="me-1" />
                    Procesar otra imagen
                  </CButton>
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default MonitoreoEntrada
