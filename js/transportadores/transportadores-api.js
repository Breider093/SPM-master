const API_URL_TRANSPORTADORES = 'http://localhost:8000';
const API_TRANSPORTADORES = `${API_URL_TRANSPORTADORES}/api/transportadores/`;
const API_VEHICULOS = `${API_URL_TRANSPORTADORES}/api/vehiculos/`;
const API_TRANSPORTADOR_VEHICULOS = `${API_URL_TRANSPORTADORES}/api/transportador-vehiculos/`;
const API_VIAJES = `${API_URL_TRANSPORTADORES}/api/viajes/`;
const API_VIAJE_REMISIONES = `${API_URL_TRANSPORTADORES}/api/viaje-remisiones/`;
const API_REMISIONES = `${API_URL_TRANSPORTADORES}/api/remisiones/`;
const API_REMISION_DETALLES = `${API_URL_TRANSPORTADORES}/api/remision-detalles/`;
const API_REMISION_RESERVAS = `${API_URL_TRANSPORTADORES}/api/remision-reservas/`;
const API_REMISION_ALARMAS = `${API_URL_TRANSPORTADORES}/api/remision-alarmas/`;
const API_FACTURAS = `${API_URL_TRANSPORTADORES}/api/facturas/`;
const API_PRODUCTOS_TRANSPORTADORES = `${API_URL_TRANSPORTADORES}/api/productos/`;

function obtenerCookieTransportadores(nombre) {
    const cookies = document.cookie ? document.cookie.split(';') : [];
    const cookie = cookies.find((valor) => valor.trim().startsWith(`${nombre}=`));
    return cookie ? decodeURIComponent(cookie.trim().substring(nombre.length + 1)) : '';
}

function obtenerListaTransportadores(data) {
    return Array.isArray(data) ? data : data.results || [];
}

async function solicitarTransportadores(url, opciones = {}) {
    const headers = new Headers(opciones.headers || {});
    headers.set('X-CSRFToken', obtenerCookieTransportadores('csrftoken'));
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), 10000);
    const response = await fetch(url, { ...opciones, headers, signal: controlador.signal });
    clearTimeout(temporizador);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(JSON.stringify(data));
    return data;
}

function parametrosTransportadores(parametros = {}) {
    const query = new URLSearchParams();
    Object.entries(parametros).forEach(([clave, valor]) => {
        if (valor !== undefined && valor !== null && valor !== '') query.set(clave, valor);
    });
    return query.toString() ? `?${query}` : '';
}

function listarTransportadores(parametros = {}) {
    return solicitarTransportadores(`${API_TRANSPORTADORES}${parametrosTransportadores(parametros)}`).then(obtenerListaTransportadores);
}

function guardarTransportador(datos, id = null) {
    return solicitarTransportadores(id ? `${API_TRANSPORTADORES}${id}/` : API_TRANSPORTADORES, {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function eliminarTransportador(id) {
    return solicitarTransportadores(`${API_TRANSPORTADORES}${id}/`, { method: 'DELETE' });
}

function listarVehiculos(parametros = {}) {
    return solicitarTransportadores(`${API_VEHICULOS}${parametrosTransportadores(parametros)}`).then(obtenerListaTransportadores);
}

function guardarVehiculo(datos, id = null) {
    return solicitarTransportadores(id ? `${API_VEHICULOS}${id}/` : API_VEHICULOS, {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function asignarVehiculoTransportador(datos) {
    return solicitarTransportadores(API_TRANSPORTADOR_VEHICULOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function listarViajes(parametros = {}) {
    return solicitarTransportadores(`${API_VIAJES}${parametrosTransportadores(parametros)}`).then(obtenerListaTransportadores);
}

function obtenerViaje(id) {
    return solicitarTransportadores(`${API_VIAJES}${id}/`);
}

function crearViaje(datos) {
    return solicitarTransportadores(API_VIAJES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function actualizarViaje(id, datos) {
    return solicitarTransportadores(`${API_VIAJES}${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function eliminarViaje(id) {
    return solicitarTransportadores(`${API_VIAJES}${id}/`, { method: 'DELETE' });
}

function ejecutarAccionViaje(id, accion) {
    return solicitarTransportadores(`${API_VIAJES}${id}/${accion}/`, { method: 'POST' });
}

function listarViajeRemisiones(parametros = {}) {
    return solicitarTransportadores(`${API_VIAJE_REMISIONES}${parametrosTransportadores(parametros)}`).then(obtenerListaTransportadores);
}

function guardarViajeRemision(datos, id = null) {
    return solicitarTransportadores(id ? `${API_VIAJE_REMISIONES}${id}/` : API_VIAJE_REMISIONES, {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function listarRemisionesTransportadores(parametros = {}) {
    return solicitarTransportadores(`${API_REMISIONES}${parametrosTransportadores(parametros)}`).then(obtenerListaTransportadores);
}

function guardarRemisionTransportadores(datos, id = null) {
    return solicitarTransportadores(id ? `${API_REMISIONES}${id}/` : API_REMISIONES, {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function eliminarRemisionTransportadores(id) {
    return solicitarTransportadores(`${API_REMISIONES}${id}/`, { method: 'DELETE' });
}

function listarFacturasTransportadores(parametros = {}) {
    return solicitarTransportadores(`${API_FACTURAS}${parametrosTransportadores(parametros)}`).then(obtenerListaTransportadores);
}

function crearFacturaRemision(datos) {
    return solicitarTransportadores(API_FACTURAS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function ejecutarAccionRemision(id, accion) {
    return solicitarTransportadores(`${API_REMISIONES}${id}/${accion}/`, { method: 'POST' });
}

function generarAlarmasRemision() {
    return solicitarTransportadores(`${API_REMISIONES}generar_alarmas/`, { method: 'POST' });
}

function listarDetallesRemision(parametros = {}) {
    return solicitarTransportadores(`${API_REMISION_DETALLES}${parametrosTransportadores(parametros)}`).then(obtenerListaTransportadores);
}

function guardarDetalleRemision(datos, id = null) {
    return solicitarTransportadores(id ? `${API_REMISION_DETALLES}${id}/` : API_REMISION_DETALLES, {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function eliminarDetalleRemision(id) {
    return solicitarTransportadores(`${API_REMISION_DETALLES}${id}/`, { method: 'DELETE' });
}

function listarReservasRemision(parametros = {}) {
    return solicitarTransportadores(`${API_REMISION_RESERVAS}${parametrosTransportadores(parametros)}`).then(obtenerListaTransportadores);
}

function guardarReservaRemision(datos, id = null) {
    return solicitarTransportadores(id ? `${API_REMISION_RESERVAS}${id}/` : API_REMISION_RESERVAS, {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function eliminarReservaRemision(id) {
    return solicitarTransportadores(`${API_REMISION_RESERVAS}${id}/`, { method: 'DELETE' });
}

function listarAlarmasRemision(parametros = {}) {
    return solicitarTransportadores(`${API_REMISION_ALARMAS}${parametrosTransportadores(parametros)}`).then(obtenerListaTransportadores);
}

function resolverAlarmaRemision(id) {
    return solicitarTransportadores(`${API_REMISION_ALARMAS}${id}/resolver/`, { method: 'POST' });
}

function listarProductosTransportadores() {
    return solicitarTransportadores(API_PRODUCTOS_TRANSPORTADORES).then(obtenerListaTransportadores);
}
