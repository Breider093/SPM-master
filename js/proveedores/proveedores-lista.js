$(document).ready(function() {
    $('body').bootstrapMaterialDesign();
    cargarProveedores();

    $('#tablaProveedores').on('click', '[data-eliminar-proveedor]', function() {
        eliminarProveedor($(this).data('eliminar-proveedor'));
    });

    $('#buscarProveedor').on('input', filtrarProveedores);
});

let proveedores = [];

async function cargarProveedores() {
    try {
        proveedores = await respuestaJson(await fetch(API_PROVEEDORES));
        proveedores = Array.isArray(proveedores) ? proveedores : proveedores.results || [];
        renderizarProveedores(proveedores);
    } catch (error) {
        mostrarErrorProveedor(error, 'cargar');
    }
}

function renderizarProveedores(registros) {
    const filas = registros.map((proveedor) => `
        <tr>
            <td>${proveedor.id}</td>
            <td>${proveedor.nombre || ''}</td>
            <td>${proveedor.nit || ''}</td>
            <td>${proveedor.direccion || ''}</td>
            <td>${proveedor.telefono || ''}</td>
            <td>${proveedor.email || ''}</td>
            <td>
                <a class="btn btn-info btn-sm" href="proveedores-editar.html?id=${proveedor.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </a>
                <button class="btn btn-danger btn-sm" type="button" data-eliminar-proveedor="${proveedor.id}" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    $('#tablaProveedores').html(filas || '<tr><td colspan="7">No hay proveedores registrados.</td></tr>');
}

function filtrarProveedores() {
    const busqueda = $('#buscarProveedor').val().toLowerCase();
    renderizarProveedores(proveedores.filter((proveedor) =>
        [proveedor.nombre, proveedor.nit, proveedor.email, proveedor.telefono]
            .some((valor) => String(valor || '').toLowerCase().includes(busqueda))
    ));
}

function eliminarProveedor(id) {
    Swal.fire({
        title: '¿Eliminar proveedor?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (resultado) => {
        if (!resultado.isConfirmed) return;
        try {
            await respuestaJson(await fetch(`${API_PROVEEDORES}${id}/`, {
                method: 'DELETE',
                headers: { 'X-CSRFToken': obtenerCookie('csrftoken') }
            }));
            await cargarProveedores();
            Swal.fire('Eliminado', 'El proveedor fue eliminado.', 'success');
        } catch (error) {
            mostrarErrorProveedor(error, 'eliminar');
        }
    });
}

window.addEventListener('load', () => document.body.classList.add('loaded'));
