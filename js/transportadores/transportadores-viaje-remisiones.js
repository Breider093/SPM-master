$(document).ready(function() {
    $('body').bootstrapMaterialDesign();

    function mostrarError(error, mensaje) {
        console.error(error);
        Swal.fire('Error', mensaje, 'error');
    }

    function cargarViajes() {
        return listarViajes({ estado: 'PROGRAMADO' }).then(function(viajes) {
            $('#viaje').html('<option value="">Seleccione un viaje</option>' + viajes.map(function(viaje) {
                return `<option value="${viaje.id}">${viaje.codigo || viaje.id} - ${viaje.destino || ''}</option>`;
            }).join(''));
        });
    }

    function cargarRemisiones() {
        return listarRemisionesTransportadores({ estado: 'PENDIENTE' }).then(function(remisiones) {
            $('#remisionesBody').html(remisiones.map(function(remision) {
                return `<tr><td>${remision.numero || remision.codigo || `REM-${remision.id}`}</td><td>${remision.cliente_nombre || remision.cliente || ''}</td><td>${remision.fecha_entrega_programada || ''}</td><td>${remision.estado || ''}</td><td><button type="button" class="btn btn-primary btn-asignar" data-id="${remision.id}"><i class="fas fa-link"></i> Asignar</button></td></tr>`;
            }).join('') || '<tr><td colspan="5">No hay remisiones pendientes.</td></tr>');
        });
    }

    $('#remisionesBody').on('click', '.btn-asignar', function() {
        const boton = $(this);
        const viaje = $('#viaje').val();
        if (!viaje) {
            Swal.fire('Selecciona un viaje', 'Debes elegir un viaje antes de asignar.', 'warning');
            return;
        }
        boton.prop('disabled', true);
        guardarViajeRemision({ viaje: Number(viaje), remision: Number(boton.data('id')) }).then(function() {
            Swal.fire('Asignada', 'La remisión fue asignada al viaje.', 'success');
            return cargarRemisiones();
        }).catch((error) => {
            boton.prop('disabled', false);
            mostrarError(error, 'No se pudo asignar la remisión.');
        });
    });

    Promise.all([cargarViajes(), cargarRemisiones()]).catch((error) => mostrarError(error, 'No se pudieron cargar viajes y remisiones.'));
});
