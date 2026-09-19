$(document).ready(function() {
    $('body').bootstrapMaterialDesign();
    var tabla = $('table tbody');

    function cargarTransportadores() {
        listarTransportadores().then(function(transportadores) {
            tabla.empty();
            transportadores.forEach(function(transportador) {
                var fila = $('<tr>').attr('data-id', transportador.id);
                fila.append($('<td>').text(transportador.id));
                fila.append($('<td>').text(transportador.nombre || ''));
                fila.append($('<td>').text((transportador.telefono || '') + ' ' + (transportador.email || '')));
                fila.append($('<td>').text(transportador.placa || ''));
                fila.append($('<td>').text(transportador.estado || ''));
                var acciones = $('<td>');
                acciones.append($('<button>').addClass('btn btn-danger btn-action').attr('type', 'button').attr('data-action', 'delete').html('<i class="fas fa-trash"></i>'));
                fila.append(acciones);
                tabla.append(fila);
            });
            if (!transportadores.length) {
                tabla.html('<tr><td colspan="6">No hay transportadores registrados.</td></tr>');
            }
        }).catch(function(error) {
            console.error(error);
            Swal.fire('Error', 'No se pudieron cargar los transportadores.', 'error');
        });
    }

    $('#searchTransportador').on('input', function() {
        var termino = $(this).val().toLowerCase();
        tabla.find('tr').each(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(termino) !== -1);
        });
    });

    tabla.on('click', '[data-action="delete"]', function() {
        var id = $(this).closest('tr').data('id');
        Swal.fire({
            title: 'Eliminar transportador',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Si, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(function(confirmacion) {
            if (!confirmacion.isConfirmed) return;
            eliminarTransportador(id).then(function() {
                cargarTransportadores();
                Swal.fire('Eliminado', 'El transportador fue eliminado.', 'success');
            }).catch(function(error) {
                console.error(error);
                Swal.fire('Error', 'No se pudo eliminar el transportador.', 'error');
            });
        });
    });

    cargarTransportadores();
});
