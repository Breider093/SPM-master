$(document).ready(function() {
    $('body').bootstrapMaterialDesign();
    const id = new URLSearchParams(window.location.search).get('id');

    if (!id) {
        mostrarErrorProveedor(new Error('Falta el ID del proveedor en la URL.'), 'cargar');
        return;
    }

    cargarProveedor(id);

    $('#formProveedor').on('submit', async function(evento) {
        evento.preventDefault();
        try {
            await respuestaJson(await fetch(`${API_PROVEEDORES}${id}/`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: $('#nombre').val().trim(),
                    nit: $('#nit').val().trim() || null,
                    direccion: $('#direccion').val().trim(),
                    telefono: $('#telefono').val().trim(),
                    email: $('#email').val().trim()
                })
            }));
            await Swal.fire('Actualizado', 'El proveedor fue actualizado.', 'success');
            window.location.href = 'proveedores-lista.html';
        } catch (error) {
            mostrarErrorProveedor(error, 'actualizar');
        }
    });
});

async function cargarProveedor(id) {
    try {
        const proveedor = await respuestaJson(await fetch(`${API_PROVEEDORES}${id}/`));
        $('#nombre').val(proveedor.nombre || '');
        $('#nit').val(proveedor.nit || '');
        $('#direccion').val(proveedor.direccion || '');
        $('#telefono').val(proveedor.telefono || '');
        $('#email').val(proveedor.email || '');
    } catch (error) {
        mostrarErrorProveedor(error, 'cargar');
    }
}

window.addEventListener('load', () => document.body.classList.add('loaded'));
