$(document).ready(async function() {
    $('body').bootstrapMaterialDesign();
    const tabla = $('table tbody');

    function mostrarError(error, mensaje) {
        console.error(error);
        let detalle = mensaje;
        try {
            const respuesta = JSON.parse(error.message);
            detalle = Object.entries(respuesta).map(([campo, errores]) => `${campo}: ${[].concat(errores).join(', ')}`).join('<br>') || mensaje;
        } catch (parseError) {
            detalle = error.message || mensaje;
        }
        Swal.fire('Error', detalle, 'error');
    }

    async function cargarTransportadores() {
        const transportadores = await listarTransportadores({ estado: 'ACTIVO' });
        $('#searchTransportador').append(transportadores.map((transportador) => `<option value="${transportador.id}">${transportador.nombre || transportador.codigo || transportador.id}</option>`).join(''));
    }

    async function cargarViajes() {
        const viajes = await listarViajes({
            transportador: $('#searchTransportador').val(),
            destino: $('#searchDestino').val(),
            fecha_salida: $('#searchFecha').val()
        });
        tabla.html(viajes.map((viaje) => {
            const transportador = viaje.transportador_nombre || viaje.transportador?.nombre || viaje.transportador || '';
            const estado = String(viaje.estado || '').toUpperCase();
            const acciones = ['<button type="button" class="btn btn-info btn-action" data-action="details" title="Ver detalles"><i class="fas fa-eye"></i></button>'];
            if (estado === 'PROGRAMADO') {
                acciones.push('<button type="button" class="btn btn-success btn-action" data-action="iniciar" title="Iniciar"><i class="fas fa-play"></i></button>');
                acciones.push('<button type="button" class="btn btn-danger btn-action" data-action="cancelar" title="Cancelar"><i class="fas fa-ban"></i></button>');
                acciones.push('<button type="button" class="btn btn-warning btn-action" data-action="editar" title="Editar"><i class="fas fa-edit"></i></button>');
            } else if (estado === 'EN_CURSO') {
                acciones.push('<button type="button" class="btn btn-primary btn-action" data-action="complete" title="Completar"><i class="fas fa-check"></i></button>');
                acciones.push('<button type="button" class="btn btn-danger btn-action" data-action="cancelar" title="Cancelar"><i class="fas fa-ban"></i></button>');
            }
            return `<tr data-id="${viaje.id}">
                <td>${viaje.id}</td>
                <td>${transportador}</td>
                <td>${viaje.destino || ''}<br><small>${viaje.pais_destino || ''}</small></td>
                <td><strong>Salida:</strong> ${viaje.fecha_salida || ''}<br><strong>Llegada:</strong> ${viaje.fecha_llegada_real || viaje.fecha_llegada_estimada || ''}</td>
                <td>${viaje.estado || ''}</td>
                <td>${acciones.join(' ')}</td>
            </tr>`;
        }).join('') || '<tr><td colspan="6">No hay viajes registrados.</td></tr>');
    }

    $('#searchForm').on('submit', function(evento) {
        evento.preventDefault();
        cargarViajes().catch((error) => mostrarError(error, 'No se pudieron cargar los viajes.'));
    });

    $('#searchForm').on('reset', function() {
        setTimeout(() => cargarViajes().catch((error) => mostrarError(error, 'No se pudieron cargar los viajes.')), 0);
    });

    tabla.on('click', '[data-action]', async function() {
        const id = $(this).closest('tr').data('id');
        const accion = $(this).data('action');
        try {
            if (accion === 'details') {
                const fila = $(this).closest('tr');
                await Swal.fire({ title: 'Detalles del Viaje', html: `<p><strong>Transportador:</strong> ${fila.find('td').eq(1).text()}</p><p><strong>Destino:</strong> ${fila.find('td').eq(2).text()}</p><p><strong>Estado:</strong> ${fila.find('td').eq(4).text()}</p>` });
                return;
            }
            if (accion === 'editar') {
                window.location.href = `transportadores-viaje-form.html?id=${id}`;
                return;
            }
            await ejecutarAccionViaje(id, accion === 'complete' ? 'completar' : accion);
            await cargarViajes();
        } catch (error) {
            mostrarError(error, 'No se pudo actualizar el viaje.');
        }
    });

    try {
        await cargarTransportadores();
        await cargarViajes();
    } catch (error) {
        mostrarError(error, 'No se pudieron cargar los viajes.');
    }
});
