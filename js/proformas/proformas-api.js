const API_BASE = '/api';
const API_PROFORMAS = `${API_BASE}/proformas/`;
const API_PROFORMA_ITEMS = `${API_BASE}/proforma-items/`;
const API_COTIZACIONES = `${API_BASE}/cotizaciones/`;
const API_COTIZACION_DETALLES = `${API_BASE}/cotizacion-detalles/`;
const API_CLIENTES = `${API_BASE}/clientes/`;
const API_PRODUCTOS = `${API_BASE}/productos/`;

function normalizarLista(datos) {
    if (Array.isArray(datos)) return datos;
    if (datos && Array.isArray(datos.results)) return datos.results;
    return [];
}

function obtenerCookieProforma(nombre) {
    const cookie = (document.cookie || '').split(';').find((valor) => valor.trim().startsWith(`${nombre}=`));
    return cookie ? decodeURIComponent(cookie.trim().substring(nombre.length + 1)) : '';
}

async function solicitarProforma(url, opciones = {}) {
    const headers = new Headers(opciones.headers || {});
    const csrfToken = obtenerCookieProforma('csrftoken');
    if (csrfToken) {
        headers.set('X-CSRFToken', csrfToken);
    }

    const respuesta = await fetch(url, {
        ...opciones,
        credentials: 'include',
        mode: 'cors',
        headers
    });

    const texto = await respuesta.text();
    let datos = {};
    try {
        datos = texto ? JSON.parse(texto) : {};
    } catch (error) {
        datos = { raw: texto };
    }

    if (!respuesta.ok) {
        throw new Error(JSON.stringify(datos));
    }

    return datos;
}

async function fetchConFallback(urlPrimario, urlAlternativo, opciones = {}) {
    try {
        return await solicitarProforma(urlPrimario, opciones);
    } catch (error) {
        if (!urlAlternativo || urlAlternativo === urlPrimario) {
            throw error;
        }
        return solicitarProforma(urlAlternativo, opciones);
    }
}

function listarClientesProforma() {
    return fetchConFallback(API_CLIENTES, API_CLIENTES).then(normalizarLista);
}

function listarProductosProforma() {
    return fetchConFallback(API_PRODUCTOS, API_PRODUCTOS).then(normalizarLista);
}

function listarProformas() {
    return fetchConFallback(API_PROFORMAS, API_COTIZACIONES).then(normalizarLista);
}

function listarItemsProforma() {
    return fetchConFallback(API_PROFORMA_ITEMS, API_COTIZACION_DETALLES).then(normalizarLista);
}

function crearProforma(datos) {
    return fetchConFallback(API_PROFORMAS, API_COTIZACIONES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function crearDetalleProforma(datos) {
    return fetchConFallback(API_PROFORMA_ITEMS, API_COTIZACION_DETALLES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function convertirProformaAFactura(id) {
    const urlPrimario = `${API_PROFORMAS}${id}/convertir-factura/`;
    const urlAlternativo = `${API_COTIZACIONES}${id}/convertir-factura/`;
    return fetchConFallback(urlPrimario, urlAlternativo, { method: 'POST' });
}

function mensajeErrorProforma(error, fallback = 'No se pudo completar la operación.') {
    try {
        const errores = JSON.parse(error.message);
        return Object.entries(errores).map(([campo, mensajes]) =>
            `${campo}: ${[].concat(mensajes).join(', ')}`
        ).join('<br>');
    } catch (parseError) {
        return fallback;
    }
}
