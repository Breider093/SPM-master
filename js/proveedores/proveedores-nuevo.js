$(document).ready(function() {
    $('body').bootstrapMaterialDesign();

    $('#formProveedor').on('submit', async function(evento) {
        evento.preventDefault();
        try {
            await respuestaJson(await fetch(API_PROVEEDORES, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: $('#nombre').val().trim(),
                    nit: $('#nit').val().trim() || null,
                    direccion: $('#direccion').val().trim(),
                    telefono: $('#telefono').val().trim(),
                    email: $('#email').val().trim()
                })
            }));
            await Swal.fire('Creado', 'El proveedor fue registrado.', 'success');
            window.location.href = 'proveedores-lista.html';
        } catch (error) {
            mostrarErrorProveedor(error, 'crear');
        }
    });
});

window.addEventListener('load', () => document.body.classList.add('loaded'));
