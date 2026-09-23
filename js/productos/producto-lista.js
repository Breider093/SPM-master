const API_ORIGIN = 'http://192.168.1.4:8000';
const API_BASE = `${API_ORIGIN}/api`;
const API_PRODUCTOS = `${API_BASE}/productos/`;
const API_TIPOS_PRODUCTO = `${API_BASE}/tipos-producto/`;
const API_PRODUCTO_PROVEEDORES = `${API_BASE}/producto-proveedores/`;
const API_PROVEEDORES = `${API_BASE}/proveedores/`;

$(document).ready(function() {
    $('body').bootstrapMaterialDesign();

    cargarProductos();

    $('#btnExportarPdfProductos').on('click', exportarProductosPdf);

    $('#tablaProductos').on('click', '[data-eliminar-producto]', function() {
        eliminarProducto($(this).data('eliminar-producto'));
    });
});

function exportarProductosPdf() {
    const url = `${API_PRODUCTOS}exportar-pdf/`;
    window.open(url, '_blank');
}

function cargarProductos() {
    Promise.all([fetch(API_PRODUCTOS), fetch(API_TIPOS_PRODUCTO), fetch(API_PRODUCTO_PROVEEDORES), fetch(API_PROVEEDORES)])
        .then(async ([productosResponse, tiposResponse, relacionesResponse, proveedoresResponse]) => {
            if (!productosResponse.ok) {
                throw new Error('No se pudieron cargar los productos.');
            }
            if (!tiposResponse.ok) {
                throw new Error('No se pudieron cargar los tipos de producto.');
            }
            if (!relacionesResponse.ok || !proveedoresResponse.ok) {
                throw new Error('No se pudieron cargar los proveedores vinculados.');
            }

            const [productosData, tiposData, relacionesData, proveedoresData] = await Promise.all([
                productosResponse.json(),
                tiposResponse.json(),
                relacionesResponse.json(),
                proveedoresResponse.json()
            ]);
            const tipos = Array.isArray(tiposData) ? tiposData : tiposData.results || [];
            const nombresTipos = Object.fromEntries(
                tipos.map((tipo) => [String(tipo.id), tipo.nombre])
            );
            const relaciones = Array.isArray(relacionesData) ? relacionesData : relacionesData.results || [];
            const proveedores = Array.isArray(proveedoresData) ? proveedoresData : proveedoresData.results || [];
            const nombresProveedores = Object.fromEntries(
                proveedores.map((proveedor) => [String(proveedor.id), proveedor.nombre])
            );
            const proveedoresPorProducto = agruparProveedores(relaciones, nombresProveedores);
            const productos = Array.isArray(productosData) ? productosData : productosData.results || [];
            const filas = productos.map((producto) => `
                <tr>
                    <td>${producto.id}</td>
                    <td>${obtenerNombreTipo(producto, nombresTipos)}</td>
                    <td>${producto.descripcion || ''}</td>
                    <td>${producto.peso_kg || 0} Kgr</td>
                    <td>$${producto.precio_alquiler || '0.00'}</td>
                    <td>$${producto.precio_reposicion || '0.00'}</td>
                    <td>${obtenerProveedores(producto.id, proveedoresPorProducto)}</td>
                    <td>${crearEnlaceArchivo(producto.manual, 'Ver manual')}</td>
                    <td>${crearEnlaceArchivo(producto.ficha_tecnica, 'Ver ficha')}</td>
                    <td>${producto.fecha_creacion ? new Date(producto.fecha_creacion).toLocaleDateString() : ''}</td>
                    <td>
                        <div class="btn-group">
                            <a class="btn btn-info btn-sm" href="producto-editar.html?id=${producto.id}">
                                <i class="fas fa-edit"></i> Editar
                            </a>
                            <button class="btn btn-danger btn-sm" type="button" data-eliminar-producto="${producto.id}">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

            $('#tablaProductos').html(filas || '<tr><td colspan="11">No hay productos registrados.</td></tr>');
        })
        .catch((error) => {
            console.error(error);
            Swal.fire('Error', error.message, 'error');
        });
}

function agruparProveedores(relaciones, nombresProveedores) {
    return relaciones.reduce((agrupados, relacion) => {
        const producto = relacion.producto ?? relacion.producto_id;
        const proveedor = relacion.proveedor ?? relacion.proveedor_id;
        const productoId = String(producto && typeof producto === 'object' ? producto.id : producto);
        const proveedorId = String(proveedor && typeof proveedor === 'object' ? proveedor.id : proveedor);
        const nombre = proveedor && typeof proveedor === 'object'
            ? proveedor.nombre
            : nombresProveedores[proveedorId];

        if (productoId && nombre) {
            agrupados[productoId] = agrupados[productoId] || [];
            agrupados[productoId].push(nombre);
        }
        return agrupados;
    }, {});
}

function obtenerProveedores(id, proveedoresPorProducto) {
    return proveedoresPorProducto[String(id)]?.join(', ') || 'Sin proveedor';
}

function obtenerNombreTipo(producto, nombresTipos) {
    if (producto.tipo_producto_nombre) {
        return producto.tipo_producto_nombre;
    }

    if (producto.tipo_producto && typeof producto.tipo_producto === 'object') {
        return producto.tipo_producto.nombre || '';
    }

    return nombresTipos[String(producto.tipo_producto)] || '';
}

function crearEnlaceArchivo(url, texto) {
    if (!url) {
        return 'No disponible';
    }

    const urlCompleta = url.startsWith('http') ? url : `${API_ORIGIN}${url}`;
    return `<a href="${urlCompleta}" target="_blank" rel="noopener">${texto}</a>`;
}

function eliminarProducto(id) {
    Swal.fire({
        title: '¿Eliminar producto?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (!result.isConfirmed) {
            return;
        }

        fetch(`${API_PRODUCTOS}${id}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('No se pudo eliminar el producto.');
                }
                return cargarProductos();
            })
            .then(() => Swal.fire('Eliminado', 'El producto fue eliminado.', 'success'))
            .catch((error) => Swal.fire('Error', error.message, 'error'));
    });
}

function getCookie(name) {
    const cookies = document.cookie ? document.cookie.split(';') : [];
    const cookie = cookies.find((value) => value.trim().startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.trim().substring(name.length + 1)) : '';
}

window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});
