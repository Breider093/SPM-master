const API_BASE = 'http://192.168.1.4:8000/api';
const API_PROVEEDORES = `${API_BASE}/proveedores/`;

function obtenerCookie(nombre) {
    const cookies = document.cookie ? document.cookie.split(';') : [];
    const cookie = cookies.find((valor) => valor.trim().startsWith(`${nombre}=`));
    return cookie ? decodeURIComponent(cookie.trim().substring(nombre.length + 1)) : '';
}

async function respuestaJson(respuesta) {
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
        throw new Error(JSON.stringify(datos));
    }
    return datos;
}

function mostrarErrorProveedor(error, accion) {
    console.error(`Error al ${accion} proveedor:`, error);
    let mensaje = `No se pudo ${accion} el proveedor.`;
    try {
        const errores = JSON.parse(error.message);
        mensaje = Object.entries(errores)
            .map(([campo, mensajes]) => `<strong>${campo}:</strong> ${[].concat(mensajes).join(', ')}`)
            .join('<br>');
    } catch (parseError) {
        console.error('Respuesta de error no válida:', parseError);
    }
    Swal.fire({ icon: 'error', title: 'Error', html: mensaje });
}
