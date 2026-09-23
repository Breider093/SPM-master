const API_BASE = 'http://192.168.1.14:8000/api';
const API_CLIENTES = `${API_BASE}/clientes/`;
const API_CLIENTE_DOCUMENTOS = `${API_BASE}/cliente-documentos/`;
const API_OBRAS = `${API_BASE}/obras/`;
const API_KARDEX_MOVIMIENTOS = `${API_BASE}/kardex-movimientos/`;
const API_KARDEX_DETALLES = `${API_BASE}/kardex-detalles/`;
const API_KARDEX_CLIENTE = (clienteId) => `${API_CLIENTES}${clienteId}/kardex/`;

function obtenerCookie(nombre) {
    const cookies = document.cookie ? document.cookie.split(';') : [];
    const cookie = cookies.find((valor) => valor.trim().startsWith(`${nombre}=`));
    return cookie ? decodeURIComponent(cookie.trim().substring(nombre.length + 1)) : '';
}

function obtenerLista(data) {
    return Array.isArray(data) ? data : data.results || [];
}

async function solicitar(url, opciones = {}) {
    const headers = new Headers(opciones.headers || {});
    headers.set('X-CSRFToken', obtenerCookie('csrftoken'));

    const response = await fetch(url, { ...opciones, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(JSON.stringify(data));
    }

    return data;
}

function listarClientes() {
    return solicitar(API_CLIENTES).then(obtenerLista);
}

function listarClientesPagina(url = API_CLIENTES) {
    return solicitar(url).then((data) => ({
        clientes: obtenerLista(data),
        count: data.count || null,
        next: data.next || null,
        previous: data.previous || null
    }));
}

function obtenerCliente(id) {
    return solicitar(`${API_CLIENTES}${id}/`);
}

function listarObrasCliente(clienteId) {
    return solicitar(`${API_OBRAS}?cliente=${encodeURIComponent(clienteId)}`).then(obtenerLista);
}

function crearObra(datos) {
    return solicitar(API_OBRAS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function crearCliente(datos) {
    return solicitar(API_CLIENTES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function actualizarCliente(id, datos, metodo = 'PATCH') {
    return solicitar(`${API_CLIENTES}${id}/`, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function eliminarCliente(id) {
    return solicitar(`${API_CLIENTES}${id}/`, { method: 'DELETE' });
}

function listarDocumentosCliente(clienteId) {
    return solicitar(`${API_CLIENTE_DOCUMENTOS}?cliente=${clienteId}`).then(obtenerLista);
}

function listarKardexMovimientos(clienteId, fechaDesde, fechaHasta) {
    const parametros = new URLSearchParams({ cliente: clienteId });
    if (fechaDesde) parametros.set('fecha_desde', fechaDesde);
    if (fechaHasta) parametros.set('fecha_hasta', fechaHasta);
    return solicitar(`${API_KARDEX_MOVIMIENTOS}?${parametros}`).then(obtenerLista);
}

function listarKardexCliente(clienteId, fechaDesde, fechaHasta, obraId) {
    const parametros = new URLSearchParams();
    if (fechaDesde) parametros.set('desde', fechaDesde);
    if (fechaHasta) parametros.set('hasta', fechaHasta);
    if (obraId) parametros.set('obra', obraId);
    const query = parametros.toString();
    return solicitar(`${API_KARDEX_CLIENTE(clienteId)}${query ? `?${query}` : ''}`);
}

function obtenerSaldoCliente(clienteId) {
    return solicitar(`${API_KARDEX_MOVIMIENTOS}saldo/?cliente=${encodeURIComponent(clienteId)}`);
}

function crearKardexMovimiento(datos) {
    return solicitar(API_KARDEX_MOVIMIENTOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function crearKardexDetalle(datos) {
    return solicitar(API_KARDEX_DETALLES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function listarKardexDetalles() {
    return solicitar(API_KARDEX_DETALLES).then(obtenerLista);
}

function subirDocumento(clienteId, tipo, archivo) {
    const datos = new FormData();
    datos.append('cliente', clienteId);
    datos.append('tipo', tipo);
    datos.append('archivo', archivo);

    return solicitar(API_CLIENTE_DOCUMENTOS, {
        method: 'POST',
        body: datos
    });
}

function obtenerMensajeError(error, mensaje = 'No se pudo completar la operación.') {
    try {
        const errores = JSON.parse(error.message);
        return Object.entries(errores)
            .map(([campo, mensajes]) => `<strong>${campo}:</strong> ${[].concat(mensajes).join(', ')}`)
            .join('<br>');
    } catch (parseError) {
        return mensaje;
    }
}

function mostrarErrorCliente(error, mensaje) {
    console.error(error);
    Swal.fire('Error', obtenerMensajeError(error, mensaje), 'error');
}

function normalizarCliente(cliente) {
    return {
        id: cliente.id,
        documento: cliente.documento || '',
        tipo_documento: cliente.tipo_documento || '',
        razon_social: cliente.razon_social || '',
        direccion: cliente.direccion || '',
        ciudad: cliente.ciudad || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        celular: cliente.celular || '',
        habilitado: Boolean(cliente.habilitado)
    };
}
