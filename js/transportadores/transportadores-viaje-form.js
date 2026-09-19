$(document).ready(function() {
    $('body').bootstrapMaterialDesign();
    const idViaje = new URLSearchParams(window.location.search).get('id');

    function errorApi(error, mensaje) {
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

    async function cargarOpciones() {
        try {
            const transportadores = await listarTransportadores({ estado: 'ACTIVO' });
            $('#transportador').html('<option value="">Seleccione un transportador</option>' + transportadores.map((item) => `<option value="${item.id}">${item.nombre || item.codigo || item.id}</option>`).join(''));
            $('#estadoTransportadores').text(transportadores.length ? `${transportadores.length} transportador(es) disponible(s).` : 'No hay transportadores activos.');
        } catch (error) {
            $('#transportador').html('<option value="">No se pudieron cargar</option>');
            $('#estadoTransportadores').text('Error al consultar transportadores. Recarga la página.');
            throw error;
        }

        try {
            const vehiculos = await listarVehiculos({ estado: 'ACTIVO' });
            $('#vehiculo').html('<option value="">Sin vehículo</option>' + vehiculos.map((item) => `<option value="${item.id}">${item.placa || item.id} - ${item.tipo || ''}</option>`).join('') + '<option value="__otro__">Otro</option>');
            $('#estadoVehiculos').text(vehiculos.length ? `${vehiculos.length} vehículo(s) disponible(s).` : 'No hay vehículos activos registrados.');
        } catch (error) {
            $('#vehiculo').html('<option value="">No se pudieron cargar</option>');
            $('#estadoVehiculos').text('Error al consultar vehículos.');
            console.error(error);
        }
        if (idViaje) {
            const viaje = await obtenerViaje(idViaje);
            $('#tituloViaje').text('EDITAR VIAJE');
            $('#transportador').val(viaje.transportador?.id || viaje.transportador || '');
            $('#vehiculo').val(viaje.vehiculo?.id || viaje.vehiculo || '');
            $('#origen').val(viaje.origen || '');
            $('#destino').val(viaje.destino || '');
            $('#pais_destino').val(viaje.pais_destino || 'Colombia');
            $('#fecha_salida').val((viaje.fecha_salida || '').slice(0, 16));
            $('#fecha_llegada_estimada').val((viaje.fecha_llegada_estimada || '').slice(0, 16));
            $('#observaciones').val(viaje.observaciones || '');
        }
    }

    $('#vehiculo').on('change', function() {
        if ($(this).val() === '__otro__') {
            if (!$('#transportador').val()) {
                $(this).val('');
                Swal.fire('Selecciona un transportador', 'El vehículo nuevo se asignará al transportador seleccionado.', 'warning');
                return;
            }
            $('#formNuevoVehiculo')[0].reset();
            $('#modalNuevoVehiculo').modal('show');
        }
    });

    $('#formNuevoVehiculo').on('submit', async function(evento) {
        evento.preventDefault();
        const boton = $(this).find('button[type="submit"]');
        boton.prop('disabled', true);
        try {
            const vehiculo = await guardarVehiculo({
                placa: $('#nuevaPlaca').val().trim().toUpperCase(),
                tipo: $('#nuevoTipoVehiculo').val(),
                marca: $('#nuevaMarca').val().trim(),
                modelo: $('#nuevoModelo').val().trim(),
                capacidad_kg: $('#nuevaCapacidad').val() || null,
                estado: 'ACTIVO'
            });
            await asignarVehiculoTransportador({
                transportador: Number($('#transportador').val()),
                vehiculo: vehiculo.id,
                es_principal: false
            });
            $('#vehiculo option[value="__otro__"]').before(`<option value="${vehiculo.id}">${vehiculo.placa} - ${vehiculo.tipo}</option>`);
            $('#vehiculo').val(String(vehiculo.id));
            $('#modalNuevoVehiculo').modal('hide');
            $('#estadoVehiculos').text('Vehículo nuevo registrado y asignado.');
            await Swal.fire('Guardado', 'El vehículo fue registrado correctamente.', 'success');
        } catch (error) {
            errorApi(error, 'No se pudo registrar el vehículo.');
        } finally {
            boton.prop('disabled', false);
        }
    });

    $('#formViaje').on('submit', async function(evento) {
        evento.preventDefault();
        const datos = {
            transportador: Number($('#transportador').val()),
            vehiculo: $('#vehiculo').val() ? Number($('#vehiculo').val()) : null,
            origen: $('#origen').val().trim(),
            destino: $('#destino').val().trim(),
            pais_destino: $('#pais_destino').val().trim(),
            fecha_salida: $('#fecha_salida').val(),
            fecha_llegada_estimada: $('#fecha_llegada_estimada').val() || null,
            observaciones: $('#observaciones').val().trim()
        };
        try {
            if (idViaje) await actualizarViaje(idViaje, datos);
            else await crearViaje(datos);
            await Swal.fire('Guardado', 'El viaje fue guardado correctamente.', 'success');
            window.location.href = 'transportadores-viajes.html';
        } catch (error) {
            errorApi(error, 'No se pudo guardar el viaje.');
        }
    });

    cargarOpciones().catch((error) => errorApi(error, 'No se pudieron cargar transportadores y vehículos.'));
});
