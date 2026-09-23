const API_BASE = 'http://192.168.1.14:8000/api';
const API_PRODUCTOS = `${API_BASE}/productos/`;
const API_TIPOS_PRODUCTO = `${API_BASE}/tipos-producto/`;
const API_PRODUCTO_PROVEEDORES = `${API_BASE}/producto-proveedores/`;
const API_PROVEEDORES = `${API_BASE}/proveedores/`;

$(document).ready(function() {
    $('body').bootstrapMaterialDesign();

    const id = new URLSearchParams(window.location.search).get('id');
    $('#producto_id').val(id);
    cargarTiposProducto().then(() => {
        if (id) {
            cargarProducto(id);
            cargarProveedoresVinculados(id);
        }
    });
    if (!id) {
        mostrarError(new Error('Falta el ID del producto en la URL.'), 'cargar');
    }

    $('.custom-file-input').on('change', function() {
        const fileName = $(this).val().split('\\').pop();
        $(this).next('.custom-file-label').html(fileName || 'Seleccionar archivo');
    });

    $('#formEditarProducto').on('submit', function(e) {
        e.preventDefault();

        const productId = $('#producto_id').val();
        if (!productId || !/^\d+$/.test(productId)) {
            mostrarError(new Error('Falta el ID del producto en la URL.'), 'actualizar');
            return;
        }

        const formData = new FormData(this);
        formData.delete('producto_id');
        formData.append('habilitado', 'true');

        ['manual', 'ficha_tecnica'].forEach((field) => {
            if (!document.getElementById(field).files.length) {
                formData.delete(field);
            }
        });

        fetch(`${API_PRODUCTOS}${productId}/`, {
            method: 'PATCH',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: formData
        })
            .then(async (response) => {
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(JSON.stringify(data));
                }
                return data;
            })
            .then(() => sincronizarProveedores(productId))
            .then(() => Swal.fire('Actualizado', 'El producto y sus proveedores fueron actualizados.', 'success'))
            .catch((error) => mostrarError(error, 'actualizar'));
    });
});

function cargarProducto(id) {
    fetch(`${API_PRODUCTOS}${id}/`)
        .then((response) => {
            if (!response.ok) {
                throw new Error('No se pudo cargar el producto.');
            }
            return response.json();
        })
        .then((producto) => {
            $('#descripcion').val(producto.descripcion || '');
            const tipoProducto = producto.tipo_producto?.id || producto.tipo_producto;
            $('#tipo_producto').val(tipoProducto || '');
            $('#peso').val(producto.peso_kg || 0);
            $('#precio_alquiler').val(producto.precio_alquiler || 0);
            $('#precio_reposicion').val(producto.precio_reposicion || 0);
        })
        .catch((error) => mostrarError(error, 'cargar'));
}

function cargarTiposProducto() {
    return fetch(API_TIPOS_PRODUCTO)
        .then((response) => {
            if (!response.ok) {
                throw new Error('No se pudieron cargar los tipos de producto.');
            }
            return response.json();
        })
        .then((data) => {
            const tipos = Array.isArray(data) ? data : data.results || [];
            const select = document.getElementById('tipo_producto');
            tipos.forEach((tipo) => select.add(new Option(tipo.nombre, tipo.id)));
        })
        .catch((error) => {
            mostrarError(error, 'cargar tipos de producto');
            throw error;
        });
}

function cargarProveedoresVinculados(productoId) {
    Promise.all([fetch(API_PRODUCTO_PROVEEDORES), fetch(API_PROVEEDORES)])
        .then(async ([relacionesResponse, proveedoresResponse]) => {
            if (!relacionesResponse.ok || !proveedoresResponse.ok) {
                throw new Error('No se pudieron cargar los proveedores vinculados.');
            }

            const [relacionesData, proveedoresData] = await Promise.all([
                relacionesResponse.json(),
                proveedoresResponse.json()
            ]);
            const relaciones = Array.isArray(relacionesData) ? relacionesData : relacionesData.results || [];
            const proveedores = Array.isArray(proveedoresData) ? proveedoresData : proveedoresData.results || [];
            const relacionesProducto = relaciones.filter((relacion) =>
                obtenerId(relacion.producto ?? relacion.producto_id) === String(productoId)
            );
            const select = document.getElementById('proveedoresVinculados');
            select.replaceChildren();
            proveedores.forEach((proveedor) => {
                const opcion = new Option(proveedor.nombre, proveedor.id);
                if (relacionesProducto.some((relacion) =>
                    obtenerId(relacion.proveedor ?? relacion.proveedor_id) === String(proveedor.id)
                )) {
                    opcion.selected = true;
                }
                select.add(opcion);
            });
            select.dataset.relaciones = JSON.stringify(relacionesProducto);
        })
        .catch((error) => {
            $('#proveedoresVinculados').replaceChildren(new Option('No disponible', ''));
            console.error('Error al cargar proveedores vinculados:', error);
        });
}

async function sincronizarProveedores(productoId) {
    const select = document.getElementById('proveedoresVinculados');
    const relacionesActuales = JSON.parse(select.dataset.relaciones || '[]');
    const proveedoresSeleccionados = Array.from(select.selectedOptions).map((opcion) => String(opcion.value));
    const relacionesAEliminar = relacionesActuales.filter((relacion) => {
        const proveedorId = obtenerId(relacion.proveedor ?? relacion.proveedor_id);
        return !proveedoresSeleccionados.includes(proveedorId);
    });
    const proveedoresAAgregar = proveedoresSeleccionados.filter((proveedorId) =>
        !relacionesActuales.some((relacion) =>
            obtenerId(relacion.proveedor ?? relacion.proveedor_id) === proveedorId
        )
    );

    await Promise.all(relacionesAEliminar.map((relacion) => {
        const relacionId = relacion.id;
        return fetch(`${API_PRODUCTO_PROVEEDORES}${relacionId}/`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': getCookie('csrftoken') }
        }).then((response) => {
            if (!response.ok) throw new Error('No se pudo quitar un proveedor.');
        });
    }));

    await Promise.all(proveedoresAAgregar.map((proveedorId) =>
        fetch(API_PRODUCTO_PROVEEDORES, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                producto: Number(productoId),
                proveedor: Number(proveedorId),
                costo_subarriendo: '0',
                vinculo_habilitado: true
            })
        }).then(async (response) => {
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(JSON.stringify(data));
            }
        })
    ));
}

function obtenerId(valor) {
    return String(valor && typeof valor === 'object' ? valor.id : valor);
}

function actualizarProductoParcial(id, cambios) {
    return fetch(`${API_PRODUCTOS}${id}/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(cambios)
    }).then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(JSON.stringify(data));
        }
        return data;
    });
}

function mostrarError(error, accion) {
    console.error(`Error al ${accion} producto:`, error);
    Swal.fire('Error', error.message, 'error');
}

function getCookie(name) {
    const cookies = document.cookie ? document.cookie.split(';') : [];
    const cookie = cookies.find((value) => value.trim().startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.trim().substring(name.length + 1)) : '';
}

window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});
