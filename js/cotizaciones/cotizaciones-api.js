const API_BASE = 'http://192.168.1.4:8000/api';
const API_COTIZACIONES = `${API_BASE}/cotizaciones/`;
const API_COTIZACION_DETALLES = `${API_BASE}/cotizacion-detalles/`;
const API_CLIENTES_COTIZACION = `${API_BASE}/clientes/`;
const API_PRODUCTOS_COTIZACION = `${API_BASE}/productos/`;

function listaCotizaciones(datos) {
    return Array.isArray(datos) ? datos : datos.results || [];
}

function obtenerCookieCotizacion(nombre) {
    const cookie = (document.cookie || '').split(';').find((valor) => valor.trim().startsWith(`${nombre}=`));
    return cookie ? decodeURIComponent(cookie.trim().substring(nombre.length + 1)) : '';
}

async function solicitarCotizacion(url, opciones = {}) {
    const headers = new Headers(opciones.headers || {});
    headers.set('X-CSRFToken', obtenerCookieCotizacion('csrftoken'));
    const respuesta = await fetch(url, { ...opciones, headers });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(JSON.stringify(datos));
    return datos;
}

function listarCotizaciones(parametros = '') {
    return solicitarCotizacion(`${API_COTIZACIONES}${parametros}`).then(listaCotizaciones);
}

function listarClientesCotizacion() {
    return solicitarCotizacion(API_CLIENTES_COTIZACION).then(listaCotizaciones);
}

function listarProductosCotizacion() {
    return solicitarCotizacion(API_PRODUCTOS_COTIZACION).then(listaCotizaciones);
}

function crearCotizacion(datos) {
    return solicitarCotizacion(API_COTIZACIONES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function crearDetalleCotizacion(datos) {
    return solicitarCotizacion(API_COTIZACION_DETALLES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function eliminarCotizacion(id) {
    return solicitarCotizacion(`${API_COTIZACIONES}${id}/`, { method: 'DELETE' });
}

function cambiarEstadoCotizacion(id, estado) {
    const acciones = {
        APROBADA: 'aprobar',
        RECHAZADA: 'rechazar',
        CANCELADA: 'cancelar'
    };
    return solicitarCotizacion(`${API_COTIZACIONES}${id}/${acciones[estado]}/`, { method: 'POST' });
}

function mensajeErrorCotizacion(error, fallback = 'No se pudo completar la operación.') {
    try {
        const errores = JSON.parse(error.message);
        return Object.entries(errores).map(([campo, mensajes]) =>
            `${campo}: ${[].concat(mensajes).join(', ')}`
        ).join('<br>');
    } catch (parseError) {
        return fallback;
    }
}
