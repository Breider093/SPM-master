let clientesKardex = [];
let obrasKardex = [];

$(document).ready(async function() {
    $('body').bootstrapMaterialDesign();
    $('#selectCliente').on('change', cargarDatosCliente);
    $('#selectObra').on('change', limpiarResultadosKardex);
    $('#btnProcesarKardex').on('click', procesarKardex);
    $('#btnOtraObra').on('click', abrirModalCrearObra);
    $('#formCrearObra').on('submit', guardarObra);

    try {
        clientesKardex = await listarClientes();
        cargarClientesKardex(clientesKardex);
    } catch (error) {
        mostrarErrorCliente(error, 'No se pudieron cargar los datos del kardex.');
    }
});

function cargarClientesKardex(clientes) {
    const select = $('#selectCliente');
    select.empty().append(new Option('Seleccionar *', ''));
    clientes.forEach((cliente) => {
        select.append(new Option(cliente.razon_social || cliente.nombre || cliente.documento, cliente.id));
    });
}

async function cargarDatosCliente() {
    const cliente = clientesKardex.find((registro) => String(registro.id) === String($('#selectCliente').val()));
    if (!cliente) {
        $('#nitCliente, #direccionCliente').val('');
        return;
    }

    $('#nitCliente').val(cliente.documento || '');
    $('#direccionCliente').val(cliente.direccion || '');
    try {
        obrasKardex = await listarObrasCliente(cliente.id);
        cargarObrasCliente(obrasKardex);
    } catch (error) {
        obrasKardex = [];
        cargarObrasCliente([]);
        mostrarErrorCliente(error, 'No se pudieron cargar las obras del cliente.');
    }
}

function cargarObrasCliente(obras) {
    const select = $('#selectObra');
    select.empty().append(new Option('Todas las obras', ''));
    obras.forEach((obra) => select.append(new Option(obra.nombre || obra.descripcion, obra.id)));
}

function abrirModalCrearObra() {
    if (!$('#selectCliente').val()) {
        Swal.fire('Selecciona un cliente', 'Debes seleccionar un cliente antes de crear una obra.', 'warning');
        return;
    }

    $('#formCrearObra')[0].reset();
    $('#obraEstado').val('ACTIVA');
    $('#modalCrearObra').modal('show');
}

async function guardarObra(evento) {
    evento.preventDefault();
    const clienteId = $('#selectCliente').val();
    const formulario = evento.currentTarget;

    if (!clienteId || !formulario.checkValidity()) {
        formulario.reportValidity();
        return;
    }

    const datos = {
        cliente: Number(clienteId),
        nombre: $('#obraNombre').val().trim(),
        direccion: $('#obraDireccion').val().trim(),
        telefono: $('#obraTelefono').val().trim(),
        estado: $('#obraEstado').val()
    };

    try {
        const obra = await crearObra(datos);
        obrasKardex = await listarObrasCliente(clienteId);
        cargarObrasCliente(obrasKardex);
        $('#selectObra').val(String(obra.id)).trigger('change');
        $('#modalCrearObra').modal('hide');
        Swal.fire('Obra creada', 'La obra fue asociada al cliente correctamente.', 'success');
    } catch (error) {
        mostrarErrorCliente(error, 'No se pudo crear la obra.');
    }
}

$('#selectObra').on('change', function() {
    const obra = obrasKardex.find((registro) => String(registro.id) === String(this.value));
    $('#direccionObra').val(obra?.direccion || '');
    $('#telefonoObra').val(obra?.telefono || '');
    limpiarResultadosKardex();
});

async function procesarKardex() {
    const clienteId = $('#selectCliente').val();
    const obraId = $('#selectObra').val();
    const fechaDesde = $('#fechaInicio').val();
    const fechaHasta = $('#fechaCorte').val();

    if (!clienteId || !fechaDesde || !fechaHasta) {
        Swal.fire('Campos incompletos', 'Selecciona un cliente y un rango de fechas.', 'warning');
        return;
    }

    if (fechaDesde > fechaHasta) {
        Swal.fire('Rango inválido', 'La fecha inicial no puede ser posterior a la fecha final.', 'warning');
        return;
    }

    try {
        const boton = $('#btnProcesarKardex');
        boton.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Consultando...');
        const respuesta = await listarKardexCliente(clienteId, fechaDesde, fechaHasta, obraId);
        const kardex = normalizarKardex(respuesta);
        const cliente = clientesKardex.find((registro) => String(registro.id) === String(clienteId));
        renderInformacionCliente(cliente, kardex.saldo, obraId, kardex.movimientos);
        renderTransacciones(kardex.movimientos);
    } catch (error) {
        mostrarErrorCliente(error, 'No se pudo consultar el kardex.');
    } finally {
        $('#btnProcesarKardex').prop('disabled', false).html('<i class="fas fa-sync-alt"></i> &nbsp; PROCESAR');
    }
}

function normalizarKardex(respuesta) {
    const movimientos = Array.isArray(respuesta)
        ? respuesta
        : respuesta.movimientos || respuesta.transacciones || respuesta.results || [];
    const saldo = {
        saldo_inicial: respuesta.saldo_inicial ?? respuesta.saldo?.inicial ?? 0,
        saldo_final: respuesta.saldo_final ?? respuesta.saldo?.final ?? respuesta.saldo_actual ?? 0
    };
    return { movimientos, saldo };
}

function renderInformacionCliente(cliente, saldo, obraId, movimientos) {
    const obra = movimientos.find((movimiento) => movimiento.obra)?.obra;
    $('#nombreClienteInfo').text(cliente?.razon_social || '');
    $('#nitClienteInfo').text(cliente?.documento || '');
    $('#direccionClienteInfo').text(cliente?.direccion || '');
    $('#obraClienteInfo').text(obra?.nombre || obraId || 'Todas las obras');
    $('#saldoActual').text(formatearMoneda(saldo.saldo_final));
    $('#infoCliente').show();
}

function renderTransacciones(movimientos) {
    const filas = movimientos.flatMap((movimiento) => {
        const detalles = movimiento.detalles || movimiento.items || [];
        const registros = detalles.length ? detalles : [null];
        return registros.map((detalle) => `
            <tr>
                <td>${formatearFecha(movimiento.fecha)}</td>
                <td>${movimiento.codigo || movimiento.id || ''}</td>
                <td>${detalle?.cantidad ?? movimiento.cantidad ?? ''}</td>
                <td><span class="badge badge-custom">${movimiento.tipo || ''}</span></td>
                <td>${movimiento.numero_documento || movimiento.documento || ''}</td>
                <td>${movimiento.descripcion || ''}</td>
                <td>${formatearMoneda(detalle?.subtotal ?? movimiento.subtotal ?? movimiento.valor ?? 0)}</td>
                <td>${formatearMoneda(movimiento.saldo ?? movimiento.saldo_acumulado ?? 0)}</td>
            </tr>
        `);
    }).join('');

    $('#tablaKardex').html(filas || '<tr><td colspan="8">No hay movimientos para el rango seleccionado.</td></tr>');
    $('#tablaTransacciones').show();
}

function limpiarResultadosKardex() {
    $('#infoCliente, #tablaTransacciones').hide();
}

function formatearFecha(fecha) {
    return fecha ? new Date(fecha).toLocaleDateString() : '';
}

function formatearMoneda(valor) {
    return Number(valor || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
}

window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});
