const API_BASE = 'http://192.168.1.4:8000/api';
const API_RESPONSABLES = `${API_BASE}/responsables/`;

async function apiResponsableRequest(url, opciones = {}) {
    const token = localStorage.getItem('rentamax_token');
    const headers = new Headers(opciones.headers || {});

    if (!headers.has('Content-Type') && !(opciones.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Token ${token}`);
    }

    const respuesta = await fetch(url, {
        ...opciones,
        headers
    });

    const data = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        throw new Error(JSON.stringify(data));
    }

    return data;
}

function listarResponsables(parametros = {}) {
    const query = new URLSearchParams();
    Object.entries(parametros).forEach(([clave, valor]) => {
        if (valor !== undefined && valor !== null && valor !== '') {
            query.append(clave, valor);
        }
    });

    const url = query.toString() ? `${API_RESPONSABLES}?${query.toString()}` : API_RESPONSABLES;
    return apiResponsableRequest(url).then((data) => {
        if (Array.isArray(data)) return data;
        return Array.isArray(data?.results) ? data.results : [];
    });
}

function obtenerResponsable(id) {
    return apiResponsableRequest(`${API_RESPONSABLES}${id}/`);
}

function crearResponsable(datos) {
    return apiResponsableRequest(API_RESPONSABLES, {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

function actualizarResponsable(id, datos, metodo = 'PATCH') {
    return apiResponsableRequest(`${API_RESPONSABLES}${id}/`, {
        method: metodo,
        body: JSON.stringify(datos)
    });
}

function eliminarResponsableApi(id) {
    return apiResponsableRequest(`${API_RESPONSABLES}${id}/`, {
        method: 'DELETE'
    });
}
