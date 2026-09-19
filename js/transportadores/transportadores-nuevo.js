$(document).ready(async function() {
    $('body').bootstrapMaterialDesign();

    $('#formTransportador').on('submit', async function(evento) {
        evento.preventDefault();
        const boton = $(this).find('button[type="submit"]');
        boton.prop('disabled', true);

        try {
            const transportador = await guardarTransportador({
                nombre: $('#nombre').val().trim(),
                documento: $('#documento').val().trim(),
                telefono: $('#telefono').val().trim(),
                email: $('#email').val().trim(),
                licencia_numero: $('#licencia').val().trim(),
                estado: String($('#estado').val() || 'ACTIVO').toUpperCase()
            });

            const vehiculo = await guardarVehiculo({
                placa: $('#placa').val().trim().toUpperCase(),
                tipo: String($('#vehiculo').val()).toUpperCase(),
                estado: 'ACTIVO'
            });

            await asignarVehiculoTransportador({
                transportador: transportador.id,
                vehiculo: vehiculo.id,
                es_principal: true
            });

            await Swal.fire('Guardado', 'El transportador fue registrado correctamente.', 'success');
            window.location.href = 'transportadores-list.html';
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo registrar el transportador.', 'error');
        } finally {
            boton.prop('disabled', false);
        }
    });

    $('button[type="reset"]').on('click', function(evento) {
        evento.preventDefault();
        $('#formTransportador')[0].reset();
    });
});
