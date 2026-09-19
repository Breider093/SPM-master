const API_DEVOLUCIONES = 'http://localhost:8000/api/devoluciones/';
const API_DEVOLUCION_DETALLES = 'http://localhost:8000/api/devolucion-detalles/';
const API_CLIENTES_DEVOLUCION = 'http://localhost:8000/api/clientes/';
const API_OBRAS_DEVOLUCION = 'http://localhost:8000/api/obras/';
const API_TRANSPORTADORES_DEVOLUCION = 'http://localhost:8000/api/transportadores/';
const API_PRODUCTOS_DEVOLUCION = 'http://localhost:8000/api/productos/';

function listaDevoluciones(datos) { return Array.isArray(datos) ? datos : datos.results || []; }
function cookieDevolucion(nombre) {
    const cookie = (document.cookie || '').split(';').find((valor) => valor.trim().startsWith(`${nombre}=`));
    return cookie ? decodeURIComponent(cookie.trim().substring(nombre.length + 1)) : '';
}
function parametrosDevolucion(parametros = {}) {
    const query = new URLSearchParams();
    Object.entries(parametros).forEach(([clave, valor]) => { if (valor !== undefined && valor !== null && valor !== '') query.set(clave, valor); });
    return query.toString() ? `?${query}` : '';
}
async function solicitarDevolucion(url, opciones = {}) {
    const headers = new Headers(opciones.headers || {});
    headers.set('X-CSRFToken', cookieDevolucion('csrftoken'));
    const respuesta = await fetch(url, { ...opciones, headers });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(JSON.stringify(datos));
    return datos;
}
function listarDevoluciones(parametros = {}) { return solicitarDevolucion(`${API_DEVOLUCIONES}${parametrosDevolucion(parametros)}`).then(listaDevoluciones); }
function listarClientesDevolucion() { return solicitarDevolucion(API_CLIENTES_DEVOLUCION).then(listaDevoluciones); }
function listarObrasDevolucion(cliente) { return solicitarDevolucion(`${API_OBRAS_DEVOLUCION}${parametrosDevolucion(cliente ? { cliente } : {})}`).then(listaDevoluciones); }
function listarTransportadoresDevolucion() { return solicitarDevolucion(`${API_TRANSPORTADORES_DEVOLUCION}?estado=ACTIVO`).then(listaDevoluciones); }
function listarProductosDevolucion() { return solicitarDevolucion(API_PRODUCTOS_DEVOLUCION).then(listaDevoluciones); }
function crearDevolucion(datos) { return solicitarDevolucion(API_DEVOLUCIONES, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) }); }
function crearDetalleDevolucion(datos) { return solicitarDevolucion(API_DEVOLUCION_DETALLES, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) }); }
function cambiarEstadoDevolucion(id, estado) { return solicitarDevolucion(`${API_DEVOLUCIONES}${id}/${{ PROCESADA: 'procesar', RECHAZADA: 'rechazar', CANCELADA: 'cancelar' }[estado]}/`, { method: 'POST' }); }
function mensajeErrorDevolucion(error, fallback = 'No se pudo completar la operación.') {
    try { const errores = JSON.parse(error.message); return Object.entries(errores).map(([campo, mensajes]) => `${campo}: ${[].concat(mensajes).join(', ')}`).join('<br>'); } catch (parseError) { return fallback; }
}
