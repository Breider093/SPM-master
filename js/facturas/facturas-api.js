const API_FACTURAS_FRONT = 'http://localhost:8000/api/facturas/';
const API_FACTURA_DETALLES_FRONT = 'http://localhost:8000/api/factura-detalles/';
const API_FACTURA_PAGOS_FRONT = 'http://localhost:8000/api/factura-pagos/';
const API_CLIENTES_FACTURA = 'http://localhost:8000/api/clientes/';
const API_PRODUCTOS_FACTURA = 'http://localhost:8000/api/productos/';

function listaFacturas(datos) {
    return Array.isArray(datos) ? datos : datos.results || [];
}

function cookieFactura(nombre) {
    const cookie = (document.cookie || '').split(';').find((valor) => valor.trim().startsWith(`${nombre}=`));
    return cookie ? decodeURIComponent(cookie.trim().substring(nombre.length + 1)) : '';
}

function parametrosFactura(parametros = {}) {
    const query = new URLSearchParams();
    Object.entries(parametros).forEach(([clave, valor]) => {
        if (valor !== undefined && valor !== null && valor !== '') query.set(clave, valor);
    });
    return query.toString() ? `?${query}` : '';
}

async function solicitarFactura(url, opciones = {}) {
    const headers = new Headers(opciones.headers || {});
    headers.set('X-CSRFToken', cookieFactura('csrftoken'));
    const respuesta = await fetch(url, { ...opciones, headers });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(JSON.stringify(datos));
    return datos;
}

function listarFacturasApi(parametros = {}) {
    return solicitarFactura(`${API_FACTURAS_FRONT}${parametrosFactura(parametros)}`).then(listaFacturas);
}

function listarClientesFactura() {
    return solicitarFactura(API_CLIENTES_FACTURA).then(listaFacturas);
}

function listarProductosFactura() {
    return solicitarFactura(API_PRODUCTOS_FACTURA).then(listaFacturas);
}

function crearFacturaApi(datos) {
    return solicitarFactura(API_FACTURAS_FRONT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
}

function crearDetalleFacturaApi(datos) {
    return solicitarFactura(API_FACTURA_DETALLES_FRONT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) });
}

function pagarFacturaApi(id, datos) {
    return solicitarFactura(`${API_FACTURAS_FRONT}${id}/pagar/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos || {}) });
}

function anularFacturaApi(id) {
    return solicitarFactura(`${API_FACTURAS_FRONT}${id}/anular/`, { method: 'POST' });
}

function mensajeErrorFactura(error, fallback = 'No se pudo completar la operación.') {
    try {
        const errores = JSON.parse(error.message);
        return Object.entries(errores).map(([campo, mensajes]) => `${campo}: ${[].concat(mensajes).join(', ')}`).join('<br>');
    } catch (parseError) {
        return fallback;
    }
}
