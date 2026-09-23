const API_INVENTARIO_BASE = 'http://192.168.1.14:8000/api/';
const API_ENTRADAS = `${API_INVENTARIO_BASE}entradas/`;
const API_ENTRADA_DETALLES = `${API_INVENTARIO_BASE}entrada-detalles/`;
const API_SALIDAS = `${API_INVENTARIO_BASE}salidas/`;
const API_SALIDA_DETALLES = `${API_INVENTARIO_BASE}salida-detalles/`;
const API_MOVIMIENTOS_INVENTARIO = `${API_INVENTARIO_BASE}movimientos-inventario/`;
const API_LOTES = `${API_INVENTARIO_BASE}lotes/`;
const API_INVENTARIO = `${API_INVENTARIO_BASE}inventario/`;
const API_PROVEEDORES_INVENTARIO = `${API_INVENTARIO_BASE}proveedores/`;
const API_CLIENTES_INVENTARIO = `${API_INVENTARIO_BASE}clientes/`;
const API_PRODUCTOS_INVENTARIO = `${API_INVENTARIO_BASE}productos/`;

function normalizarListaInventario(datos) {
    if (Array.isArray(datos)) return datos;
    return Array.isArray(datos?.results) ? datos.results : [];
}

async function solicitarInventario(url, opciones = {}) {
    const respuesta = await fetch(url, {
        ...opciones,
        mode: 'cors',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(opciones.headers || {})
        }
    });
    const texto = await respuesta.text();
    let datos = {};
    try {
        datos = texto ? JSON.parse(texto) : {};
    } catch (error) {
        datos = { raw: texto };
    }
    if (!respuesta.ok) throw new Error(JSON.stringify(datos));
    return datos;
}

function listarEntradas() { return solicitarInventario(API_ENTRADAS).then(normalizarListaInventario); }
function listarSalidas() { return solicitarInventario(API_SALIDAS).then(normalizarListaInventario); }
function listarProveedoresInventario() { return solicitarInventario(API_PROVEEDORES_INVENTARIO).then(normalizarListaInventario); }
function listarClientesInventario() { return solicitarInventario(API_CLIENTES_INVENTARIO).then(normalizarListaInventario); }
function listarProductosInventario() { return solicitarInventario(API_PRODUCTOS_INVENTARIO).then(normalizarListaInventario); }
function listarEntradaDetalles() { return solicitarInventario(API_ENTRADA_DETALLES).then(normalizarListaInventario); }
function listarSalidaDetalles() { return solicitarInventario(API_SALIDA_DETALLES).then(normalizarListaInventario); }

function crearEntrada(datos) {
    return solicitarInventario(API_ENTRADAS, { method: 'POST', body: JSON.stringify(datos) });
}

function crearEntradaDetalle(datos) {
    return solicitarInventario(API_ENTRADA_DETALLES, { method: 'POST', body: JSON.stringify(datos) });
}

function confirmarEntrada(id) {
    return solicitarInventario(`${API_ENTRADAS}${id}/confirmar/`, { method: 'POST' });
}

function crearSalida(datos) {
    return solicitarInventario(API_SALIDAS, { method: 'POST', body: JSON.stringify(datos) });
}

function crearSalidaDetalle(datos) {
    return solicitarInventario(API_SALIDA_DETALLES, { method: 'POST', body: JSON.stringify(datos) });
}

function completarSalida(id) {
    return solicitarInventario(`${API_SALIDAS}${id}/completar/`, { method: 'POST' });
}

function mensajeErrorInventario(error, fallback) {
    try {
        const errores = JSON.parse(error.message);
        return Object.entries(errores).map(([campo, mensajes]) => `${campo}: ${[].concat(mensajes).join(', ')}`).join('<br>');
    } catch (parseError) {
        return fallback;
    }
}
