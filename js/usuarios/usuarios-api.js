const API_BASE = '/api';
const API_USERS = `${API_BASE}/users/`;

async function apiUsersRequest(url, opciones = {}) {
    const token = localStorage.getItem('rentamax_token');
    const headers = new Headers(opciones.headers || {});

    if (!headers.has('Content-Type') && !(opciones.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Token ${token}`);
    }

    const response = await fetch(url, {
        ...opciones,
        headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(JSON.stringify(data));
    }

    return data;
}

function listarUsuarios() {
    return apiUsersRequest(API_USERS).then((data) => {
        if (Array.isArray(data)) return data;
        return Array.isArray(data?.results) ? data.results : [];
    });
}

function crearUsuario(datos) {
    return apiUsersRequest(API_USERS, {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

function obtenerUsuario(id) {
    return apiUsersRequest(`${API_USERS}${id}/`);
}

function actualizarUsuario(id, datos, metodo = 'PATCH') {
    return apiUsersRequest(`${API_USERS}${id}/`, {
        method: metodo,
        body: JSON.stringify(datos)
    });
}

function eliminarUsuarioApi(id) {
    return apiUsersRequest(`${API_USERS}${id}/`, {
        method: 'DELETE'
    });
}
