const API_AUTH_URL = '/api-token-auth/';

function guardarToken(token) {
    localStorage.setItem('rentamax_token', token);
}

function obtenerToken() {
    return localStorage.getItem('rentamax_token') || '';
}

function limpiarSesion() {
    localStorage.removeItem('rentamax_token');
    localStorage.removeItem('rentamax_user');
}

async function loguear() {
    const user = document.getElementById('UserName').value.trim();
    const pass = document.getElementById('UserPassword').value;

    if (!user || !pass) {
        alert('Por favor, complete todos los campos.');
        return false;
    }

    try {
        const response = await fetch(API_AUTH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: user,
                password: pass
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const detalle = data.non_field_errors || data.detail || 'Usuario o contraseña incorrectos.';
            alert(Array.isArray(detalle) ? detalle.join(', ') : detalle);
            return false;
        }

        const token = data.token;
        if (!token) {
            alert('No se recibió el token de autenticación.');
            return false;
        }

        guardarToken(token);
        localStorage.setItem('rentamax_user', user);
        alert('Bienvenido, ' + user + '.');
        window.location.href = 'home.html';
        return true;
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        alert('No se pudo conectar con la API. Verifique que Nginx y el backend estén levantados.');
        return false;
    }
}

const btnLogin = document.getElementById('btnLogin');
if (btnLogin) {
    btnLogin.addEventListener('click', function (event) {
        event.preventDefault();
        loguear();
    });
}

if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
    if (obtenerToken()) {
        window.location.href = 'home.html';
    }
}