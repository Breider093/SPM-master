const API_BASE = '/api';
const API_PRODUCTOS = `${API_BASE}/productos/`;
const API_PROVEEDORES = `${API_BASE}/proveedores/`;
const API_PRODUCTO_PROVEEDORES = `${API_BASE}/producto-proveedores/`;

$(document).ready(function() {
    $('body').bootstrapMaterialDesign();
    cargarProductos();
    cargarProveedores();

    $('#formVincularProducto').on('submit', vincularProducto);
});

function cargarProductos() {
    fetch(API_PRODUCTOS)
        .then((response) => {
            if (!response.ok) {
                throw new Error('No se pudieron cargar los productos.');
            }
            return response.json();
        })
        .then((data) => {
            const productos = Array.isArray(data) ? data : data.results || [];
            const select = document.getElementById('producto');

            select.replaceChildren(new Option('Seleccionar *', ''));
            productos.forEach((producto) => {
                select.add(new Option(producto.descripcion, producto.id));
            });
        })
        .catch((error) => console.error('Error al cargar productos:', error));
}

function cargarProveedores() {
    fetch(API_PROVEEDORES)
        .then((response) => {
            if (!response.ok) {
                throw new Error('No se pudieron cargar los proveedores.');
            }
            return response.json();
        })
        .then((data) => {
            const proveedores = Array.isArray(data) ? data : data.results || [];
            const select = document.getElementById('proveedor');

            select.replaceChildren(new Option('Seleccionar *', ''));
            proveedores.forEach((proveedor) => {
                select.add(new Option(proveedor.nombre, proveedor.id));
            });
        })
        .catch((error) => {
            console.error('Error al cargar proveedores:', error);
            Swal.fire('Error', error.message, 'error');
        });
}

function vincularProducto(evento) {
    evento.preventDefault();

    const payload = {
        producto: Number(document.getElementById('producto').value),
        proveedor: Number(document.getElementById('proveedor').value),
        costo_subarriendo: document.getElementById('costo_subarriendo').value || '0',
        vinculo_habilitado: document.getElementById('vinculo_habilitado').checked
    };

    if (!payload.producto || !payload.proveedor) {
        Swal.fire('Campos incompletos', 'Selecciona un producto y un proveedor.', 'warning');
        return;
    }

    fetch(API_PRODUCTO_PROVEEDORES, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': obtenerCookie('csrftoken')
        },
        body: JSON.stringify(payload)
    })
        .then(async (response) => {
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(JSON.stringify(data));
            }
            return data;
        })
        .then(() => {
            Swal.fire('Vinculado', 'El producto fue vinculado al proveedor.', 'success');
            document.getElementById('formVincularProducto').reset();
        })
        .catch((error) => {
            console.error('Error al vincular producto:', error);
            Swal.fire('Error', obtenerMensajeError(error), 'error');
        });
}

function obtenerCookie(nombre) {
    const cookies = document.cookie ? document.cookie.split(';') : [];
    const cookie = cookies.find((valor) => valor.trim().startsWith(`${nombre}=`));
    return cookie ? decodeURIComponent(cookie.trim().substring(nombre.length + 1)) : '';
}

function obtenerMensajeError(error) {
    try {
        const errores = JSON.parse(error.message);
        return Object.entries(errores)
            .map(([campo, mensajes]) => `${campo}: ${[].concat(mensajes).join(', ')}`)
            .join('\n');
    } catch (parseError) {
        return 'No se pudo completar la vinculación.';
    }
}

window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});
