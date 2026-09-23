function clienteRemision(remision) {
    return remision.cliente_nombre || (remision.cliente && remision.cliente.razon_social) || remision.cliente || '';
}

function productosRemision(remision) {
    return (remision.detalles || remision.items || []).map(function(detalle) {
        return '<li>' + (detalle.descripcion || detalle.producto_nombre || detalle.producto || '') + ' - ' + (detalle.cantidad || 0) + '</li>';
    }).join('');
}

$(document).ready(function() {
    var titulo = $('title').text().toLowerCase();
    if (!titulo.includes('reservas') && !titulo.includes('sin factura') && !titulo.includes('alarmas')) return;

    $('#btnNuevaReserva').remove();

    solicitarTransportadores('http://192.168.1.14:8000/api/clientes/').then(function(data) {
        var clientes = obtenerListaTransportadores(data);
        $('#cliente').empty().append('<option value="">Todos los clientes</option>');
        clientes.forEach(function(cliente) {
            $('#cliente').append(new Option(cliente.razon_social || cliente.nombre || cliente.documento, cliente.id));
        });
    }).catch(function(error) {
        console.error(error);
    });

    var carga;
    if (titulo.includes('reservas')) {
        carga = listarReservasRemision({ estado: $('#estadoReserva').val() }).then(function(reservas) {
            var contenedor = $('.container-fluid').has('#filterForm').first();
            $('.reservation-card').remove();
            reservas.forEach(function(reserva) {
                var remision = reserva.remision || {};
                var id = reserva.id || remision.id;
                var tarjeta = '<div class="reservation-card ' + String(reserva.estado || 'PENDIENTE').toLowerCase() + '">' +
                    '<div class="row align-items-center"><div class="col-1"><i class="fas fa-calendar-check reservation-icon text-warning"></i></div>' +
                    '<div class="col-8"><h5 class="reservation-title">' + (remision.numero || remision.codigo || 'REM-' + id) + '</h5>' +
                    '<p class="mb-0">Cliente: ' + clienteRemision(remision) + '</p>' +
                    '<small class="reservation-date">Fecha de entrega: ' + (remision.fecha_entrega || reserva.fecha_reserva || '') + '</small>' +
                    '<ul class="product-list">' + productosRemision(remision) + '</ul></div>' +
                    '<div class="col-3 text-right reservation-actions"><button class="btn btn-success" data-remision-action="confirmar" data-id="' + id + '"><i class="fas fa-check"></i></button>' +
                    '<button class="btn btn-danger" data-remision-action="cancelar" data-id="' + id + '"><i class="fas fa-times"></i></button></div></div></div>';
                contenedor.append(tarjeta);
            });
        });
    } else if (titulo.includes('sin factura')) {
        carga = listarRemisionesTransportadores({ sin_factura: 'true' }).then(function(remisiones) {
            var contenedor = $('.container-fluid').has('#filterForm').first();
            $('.remission-card').remove();
            remisiones.forEach(function(remision) {
                contenedor.append('<div class="remission-card pending" data-remision-id="' + remision.id + '"><div class="row align-items-center"><div class="col-8"><h5 class="remission-title">' + (remision.numero || remision.codigo || 'REM-' + remision.id) + '</h5><p>Cliente: ' + clienteRemision(remision) + '</p><small>Fecha de entrega: ' + (remision.fecha_entrega_programada || '') + '</small><ul class="product-list">' + productosRemision(remision) + '</ul></div><div class="col-4 text-right"><button class="btn btn-success" data-generar-factura="' + remision.id + '"><i class="fas fa-file-invoice"></i> Facturar</button></div></div></div>');
            });
        });
    } else {
        carga = generarAlarmasRemision().then(function() {
            return listarAlarmasRemision({ estado: 'PENDIENTE' });
        }).then(function(alarmas) {
            var contenedor = $('.container-fluid').has('#filterForm').first();
            $('.alarm-card').remove();
            alarmas.forEach(function(alarma) {
                var remision = alarma.remision || {};
                contenedor.append('<div class="alarm-card warning"><div class="row align-items-center"><div class="col-8"><h5 class="alarm-title">' + (alarma.tipo || 'ALARMA') + ' - ' + (remision.numero || alarma.remision_id || '') + '</h5><p>' + (alarma.descripcion || '') + '</p><small>Fecha límite: ' + (alarma.fecha_limite || '') + '</small></div><div class="col-3"><button class="btn btn-success" data-alarma-resolver="' + alarma.id + '"><i class="fas fa-check"></i></button></div></div></div>');
            });
        });
    }

    carga.catch(function(error) {
        console.error(error);
        Swal.fire('Error', 'No se pudieron cargar los datos de remisiones.', 'error');
    });

    $(document).on('click', '[data-remision-action]', function() {
        var id = $(this).data('id');
        var estado = $(this).data('remision-action') === 'confirmar' ? 'CONFIRMADA' : 'CANCELADA';
        guardarReservaRemision({ estado: estado }, id).then(function() {
            window.location.reload();
        }).catch(function(error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo actualizar la remisión.', 'error');
        });
    });

    $(document).on('click', '[data-alarma-resolver]', function() {
        resolverAlarmaRemision($(this).data('alarma-resolver')).then(function() {
            window.location.reload();
        }).catch(function(error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo resolver la alarma.', 'error');
        });
    });

    $(document).on('click', '[data-generar-factura]', function() {
        var boton = $(this);
        var remisionId = boton.data('generar-factura');
        var fecha = new Date().toISOString().slice(0, 10);
        var numero = 'FAC-' + fecha.replace(/-/g, '') + '-' + remisionId;
        boton.prop('disabled', true);
        crearFacturaRemision({
            numero: numero,
            fecha_emision: fecha,
            estado: 'EMITIDA',
            remision: remisionId
        }).then(function() {
            Swal.fire('Factura generada', 'La factura fue creada correctamente.', 'success');
            boton.closest('.remission-card').remove();
        }).catch(function(error) {
            console.error(error);
            boton.prop('disabled', false);
            Swal.fire('Error', 'No se pudo generar la factura.', 'error');
        });
    });
});
