let facturasFront = [];
let clientesFacturasFront = [];

function escaparFactura(valor) {
    return $('<div>').text(valor ?? '').html();
}

function nombreClienteFactura(factura) {
    if (factura.cliente && typeof factura.cliente === 'object') return factura.cliente.razon_social || factura.cliente.nombre || factura.cliente.documento;
    const cliente = clientesFacturasFront.find((item) => String(item.id) === String(factura.cliente));
    return cliente ? (cliente.razon_social || cliente.nombre || cliente.documento) : 'Sin cliente';
}

function estadoFacturaFront(factura) {
    return String(factura.estado || 'PENDIENTE').toUpperCase();
}

function fechaFacturaFront(factura) {
    return factura.fecha_emision || factura.fecha || '';
}

function monedaFacturaFront(valor) {
    return Number(valor || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
}

function productosFacturaFront(factura) {
    return (factura.detalles || factura.items || []).map((detalle) => `<li>${escaparFactura(detalle.descripcion || detalle.producto_nombre || detalle.producto || 'Producto')} - ${escaparFactura(detalle.cantidad || 0)}</li>`).join('');
}

function accionesFacturaFront(factura) {
    const estado = estadoFacturaFront(factura);
    if (estado === 'PAGADA' || estado === 'ANULADA') return '';
    return `<button class="btn btn-success action-btn" data-factura-action="pay" title="Registrar pago"><i class="fas fa-dollar-sign"></i></button><button class="btn btn-danger action-btn" data-factura-action="cancel" title="Anular"><i class="fas fa-ban"></i></button>`;
}

function renderizarFacturasFront(registros) {
    const soloPendientes = $('title').text().toLowerCase().includes('pendientes');
    const visibles = soloPendientes ? registros.filter((factura) => ['PENDIENTE', 'VENCIDA', 'EMITIDA'].includes(estadoFacturaFront(factura))) : registros;
    $('#facturasContainer').html(visibles.map((factura) => `<div class="factura-card ${escaparFactura(estadoFacturaFront(factura).toLowerCase())}" data-id="${escaparFactura(factura.id)}"><div class="row align-items-center"><div class="col-1"><i class="fas fa-file-invoice-dollar factura-icon"></i></div><div class="col-8"><h5 class="factura-title">${escaparFactura(factura.numero || `FACT-${factura.id}`)}</h5><p class="mb-0">Cliente: ${escaparFactura(nombreClienteFactura(factura))}</p><small class="factura-date"><i class="fas fa-calendar"></i> Fecha: ${escaparFactura(fechaFacturaFront(factura))}</small><ul class="product-list">${productosFacturaFront(factura)}</ul><p class="mb-0"><strong>Total:</strong> ${escaparFactura(monedaFacturaFront(factura.total))}</p><p class="mb-0"><strong>Estado:</strong> ${escaparFactura(estadoFacturaFront(factura))}</p></div><div class="col-3 text-right factura-actions"><button class="btn btn-info action-btn" data-factura-action="details" title="Ver detalles"><i class="fas fa-eye"></i></button><button class="btn btn-secondary action-btn" data-factura-action="print" title="Imprimir"><i class="fas fa-print"></i></button>${accionesFacturaFront(factura)}</div></div></div>`).join('') || '<div class="alert alert-info">No hay facturas para los filtros seleccionados.</div>');
}

function filtrarFacturasFront() {
    const busqueda = ($('#busqueda').val() || '').toLowerCase();
    const estado = ($('#estadoFactura').val() || '').toUpperCase();
    const cliente = $('#cliente').val();
    const inicio = $('#fechaInicio').val();
    const fin = $('#fechaFin').val();
    renderizarFacturasFront(facturasFront.filter((factura) => {
        const texto = `${factura.numero || ''} ${nombreClienteFactura(factura)}`.toLowerCase();
        const fecha = fechaFacturaFront(factura).slice(0, 10);
        return (!busqueda || texto.includes(busqueda)) && (!estado || estadoFacturaFront(factura) === estado) && (!cliente || String(factura.cliente) === cliente) && (!inicio || fecha >= inicio) && (!fin || fecha <= fin);
    }));
}

async function cargarFacturas() {
    try {
        facturasFront = await listarFacturasApi();
        filtrarFacturasFront();
    } catch (error) {
        $('#facturasContainer').html('<div class="alert alert-danger">No se pudieron cargar las facturas desde la API.</div>');
    }
}

$(document).ready(async function() {
    if (!$('#facturasContainer').length) return;
    $('body').bootstrapMaterialDesign();
    try {
        clientesFacturasFront = await listarClientesFactura();
        $('#cliente').html('<option value="">Todos los clientes</option>' + clientesFacturasFront.map((cliente) => `<option value="${cliente.id}">${escaparFactura(cliente.razon_social || cliente.nombre || cliente.documento)}</option>`).join(''));
        await cargarFacturas();
    } catch (error) {
        $('#facturasContainer').html('<div class="alert alert-danger">No se pudieron cargar los datos.</div>');
    }
    $('#filterForm').on('submit', function(evento) { evento.preventDefault(); filtrarFacturasFront(); });
    $('#filterForm').on('reset', function() { window.setTimeout(filtrarFacturasFront, 0); });
    $('#facturasContainer').on('click', '[data-factura-action="details"]', function() {
        const factura = facturasFront.find((item) => String(item.id) === String($(this).closest('.factura-card').data('id')));
        if (factura) Swal.fire({ title: 'Detalles de la factura', text: JSON.stringify(factura, null, 2), confirmButtonColor: '#2C3E50' });
    });
    $('#facturasContainer').on('click', '[data-factura-action="print"]', function() { window.print(); });
    $('#facturasContainer').on('click', '[data-factura-action="pay"]', async function() {
        const id = $(this).closest('.factura-card').data('id');
        const resultado = await Swal.fire({ title: 'Registrar pago', input: 'number', inputLabel: 'Monto', inputAttributes: { min: '0.01', step: '0.01' }, showCancelButton: true, confirmButtonText: 'Pagar', cancelButtonText: 'Cancelar' });
        if (!resultado.value) return;
        try {
            await pagarFacturaApi(id, { monto: resultado.value });
            await cargarFacturas();
            Swal.fire('Pago registrado', 'La factura fue actualizada.', 'success');
        } catch (error) {
            Swal.fire('Error', mensajeErrorFactura(error, 'No se pudo registrar el pago.'), 'error');
        }
    });
    $('#facturasContainer').on('click', '[data-factura-action="cancel"]', async function() {
        const id = $(this).closest('.factura-card').data('id');
        const resultado = await Swal.fire({ title: '¿Anular factura?', showCancelButton: true, confirmButtonText: 'Sí, anular', cancelButtonText: 'Cancelar' });
        if (!resultado.isConfirmed && !resultado.value) return;
        try {
            await anularFacturaApi(id);
            await cargarFacturas();
            Swal.fire('Anulada', 'La factura fue anulada.', 'success');
        } catch (error) {
            Swal.fire('Error', mensajeErrorFactura(error, 'No se pudo anular la factura.'), 'error');
        }
    });
});
