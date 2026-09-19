let registrosSaldo = [];

$(document).ready(async function() {
    $('body').bootstrapMaterialDesign();
    $('#searchCliente').on('input', filtrarRegistrosSaldo);
    $('#clientesTableBody').on('click', '[data-ver-cliente]', mostrarDetalleCliente);

    try {
        const [clientes, movimientos, detalles] = await Promise.all([
            listarClientes(),
            listarTodosLosMovimientos(),
            listarKardexDetalles()
        ]);
        registrosSaldo = construirRegistrosSaldo(clientes, movimientos, detalles);
        renderizarRegistrosSaldo(registrosSaldo);
    } catch (error) {
        mostrarErrorCliente(error, 'No se pudo cargar el saldo de los clientes.');
    }
});

async function listarTodosLosMovimientos() {
    const movimientos = [];
    let url = API_KARDEX_MOVIMIENTOS;

    while (url) {
        const respuesta = await solicitar(url);
        movimientos.push(...obtenerLista(respuesta));
        url = respuesta.next || null;
    }

    return movimientos;
}

function construirRegistrosSaldo(clientes, movimientos, detalles) {
    return clientes
        .map((cliente) => {
            const movimientosCliente = movimientos.filter((movimiento) =>
                obtenerIdSaldo(movimiento.cliente ?? movimiento.cliente_id) === String(cliente.id)
            );
            const movimientosPendientes = movimientosCliente.filter(esMovimientoPendiente);
            const detallePendiente = movimientosPendientes
                .flatMap((movimiento) => detalles.filter((detalle) =>
                    obtenerIdSaldo(detalle.movimiento ?? detalle.movimiento_id) === String(movimiento.id)
                ));
            const movimientoObra = movimientosPendientes.find((movimiento) => movimiento.obra || movimiento.obra_id);
            const obra = movimientoObra?.obra;

            return {
                cliente,
                movimientos: movimientosPendientes,
                detalles: detallePendiente,
                obra: obra?.nombre || movimientoObra?.obra_nombre || '',
                telefono: cliente.telefono || cliente.celular || '',
                contacto: cliente.email || '',
                saldo: calcularSaldo(movimientosCliente)
            };
        })
        .filter((registro) => registro.movimientos.length > 0);
}

function esMovimientoPendiente(movimiento) {
    const tipo = String(movimiento.tipo || '').toUpperCase();
    const estado = String(movimiento.estado || '').toUpperCase();
    return ['RESERVA', 'RESERVACION'].includes(tipo) &&
        (!estado || ['PENDIENTE', 'ACTIVO', 'EN_USO', 'RESERVADO'].includes(estado));
}

function calcularSaldo(movimientos) {
    return movimientos.reduce((saldo, movimiento) => {
        const tipo = String(movimiento.tipo || '').toUpperCase();
        const valor = Number(movimiento.valor || movimiento.total || 0);
        return ['PAGO', 'DEVOLUCION', 'DEVOLUCIÓN'].includes(tipo) ? saldo - valor : saldo + valor;
    }, 0);
}

function filtrarRegistrosSaldo() {
    const termino = $('#searchCliente').val().trim().toLowerCase();
    renderizarRegistrosSaldo(registrosSaldo.filter((registro) => {
        const cliente = registro.cliente;
        return [cliente.documento, cliente.razon_social, registro.obra, registro.telefono]
            .some((valor) => String(valor || '').toLowerCase().includes(termino));
    }));
}

function renderizarRegistrosSaldo(registros) {
    const filas = registros.map((registro) => `
        <tr>
            <td class="nit-cell">${registro.cliente.documento || ''}</td>
            <td>${registro.cliente.razon_social || ''}</td>
            <td>${registro.obra || 'No especificada'}</td>
            <td>${registro.telefono}</td>
            <td>${registro.contacto}</td>
            <td>
                <button class="btn btn-ver-detalle" type="button" data-ver-cliente="${registro.cliente.id}">
                    Ver detalle
                </button>
                <a class="btn btn-action" title="Kardex" href="cliente-kardex.html?cliente=${registro.cliente.id}">
                    <i class="fas fa-file-invoice-dollar"></i>
                </a>
            </td>
        </tr>
    `).join('');

    $('#clientesTableBody').html(filas || '<tr><td colspan="6">No hay clientes con equipos pendientes.</td></tr>');
}

async function mostrarDetalleCliente() {
    const id = String($(this).data('ver-cliente'));
    const registro = registrosSaldo.find((valor) => String(valor.cliente.id) === id);
    if (!registro) return;

    try {
        const saldo = await obtenerSaldoCliente(id);
        const valorSaldo = saldo.saldo ?? saldo.saldo_actual ?? saldo.total ?? registro.saldo;
        await Swal.fire({
            title: registro.cliente.razon_social,
            html: `Equipos pendientes: <strong>${registro.detalles.reduce((total, detalle) => total + Number(detalle.cantidad || 0), 0)}</strong><br>Saldo: <strong>${formatearSaldo(valorSaldo)}</strong>`,
            icon: 'info'
        });
    } catch (error) {
        mostrarErrorCliente(error, 'No se pudo consultar el saldo del cliente.');
    }
}

function obtenerIdSaldo(valor) {
    return String(valor && typeof valor === 'object' ? valor.id : valor);
}

function formatearSaldo(valor) {
    return Number(valor || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
}

window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});
