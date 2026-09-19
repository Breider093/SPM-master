function nombreClienteProforma(cliente) {
    return cliente?.razon_social || cliente?.nombre || cliente?.documento || `Cliente ${cliente?.id || ''}`;
}

function renderizarProformas(registros) {
    const contenedor = $('#proformasContainer');
    if (!contenedor.length) return;

    if (!registros.length) {
        contenedor.html('<div class="alert alert-info">No hay proformas disponibles.</div>');
        return;
    }

    contenedor.html(registros.map((proforma) => {
        const estado = (proforma.estado || 'PENDIENTE').toLowerCase();
        const fecha = proforma.fecha_emision || proforma.fecha || proforma.fecha_vencimiento || new Date().toISOString().slice(0, 10);
        const total = Number(proforma.total || 0);
        const clienteNombre = typeof proforma.cliente === 'object' ? nombreClienteProforma(proforma.cliente) : `Cliente ${proforma.cliente || ''}`;

        return `
            <div class="proforma-card ${estado === 'vencida' ? 'vencida' : 'activa'}">
                <div class="row align-items-center">
                    <div class="col-1">
                        <i class="fas fa-file-invoice-dollar proforma-icon ${estado === 'vencida' ? 'text-danger' : 'text-success'}"></i>
                    </div>
                    <div class="col-8">
                        <h5 class="proforma-title">${proforma.numero_proforma || `PRO-${proforma.id}`}</h5>
                        <p class="mb-0">Cliente: ${clienteNombre}</p>
                        <small class="proforma-date">
                            <i class="fas fa-calendar"></i> Fecha: ${fecha}
                        </small>
                        <span class="days-badge ${estado === 'vencida' ? 'danger' : 'success'}">
                            <i class="fas fa-clock"></i> ${estado === 'vencida' ? 'Vencida' : 'Activa'}
                        </span>
                        <p class="mb-0"><strong>Total:</strong> ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(total)}</p>
                    </div>
                    <div class="col-3 text-right proforma-actions">
                        <button class="btn btn-info action-btn" data-id="${proforma.id}" data-action="details" title="Ver Detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-success action-btn" data-id="${proforma.id}" data-action="convert" title="Convertir a Factura">
                            <i class="fas fa-file-invoice"></i>
                        </button>
                        <button class="btn btn-warning action-btn" data-id="${proforma.id}" data-action="renew" title="Renovar">
                            <i class="fas fa-sync"></i>
                        </button>
                        <button class="btn btn-secondary action-btn" data-id="${proforma.id}" data-action="print" title="Imprimir">
                            <i class="fas fa-print"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join(''));
}

async function cargarProformas() {
    try {
        const [proformas, clientes] = await Promise.all([listarProformas(), listarClientesProforma()]);
        const clienteMapa = {};
        clientes.forEach((cliente) => { clienteMapa[cliente.id] = cliente; });

        const registros = proformas.map((proforma) => ({
            ...proforma,
            fecha: proforma.fecha_emision || proforma.fecha || '',
            cliente: clienteMapa[proforma.cliente] || { id: proforma.cliente, nombre: `Cliente ${proforma.cliente || ''}` }
        }));

        renderizarProformas(registros);
    } catch (error) {
        $('#proformasContainer').html('<div class="alert alert-danger">No se pudieron cargar las proformas.</div>');
    }
}

$(document).ready(async function() {
    $('body').bootstrapMaterialDesign();

    try {
        const clientes = await listarClientesProforma();
        $('#cliente').html('<option value="">Todos los clientes</option>' + clientes
            .map((cliente) => `<option value="${cliente.id}">${nombreClienteProforma(cliente)}</option>`)
            .join(''));
    } catch (error) {
        $('#cliente').html('<option value="">Todos los clientes</option>');
    }

    cargarProformas();

    $('#filterForm').on('submit', function(evento) {
        evento.preventDefault();
        const busqueda = $('#busqueda').val().toLowerCase();
        const estado = $('#estadoProforma').val();
        const cliente = $('#cliente').val();

        $('.proforma-card').each(function() {
            const card = $(this);
            const titulo = card.find('.proforma-title').text().toLowerCase();
            const textoCliente = card.find('p.mb-0').text().toLowerCase();
            const cardEstado = card.hasClass('activa') ? 'activa' : 'vencida';
            let mostrar = true;

            if (busqueda && !titulo.includes(busqueda) && !textoCliente.includes(busqueda)) mostrar = false;
            if (estado && cardEstado !== estado) mostrar = false;
            if (cliente) {
                const clienteActual = card.find('p.mb-0').text().replace('Cliente: ', '');
                if (clienteActual !== $('#cliente option:selected').text()) mostrar = false;
            }

            card.toggle(mostrar);
        });
    });

    $('#filterForm').on('reset', function() {
        setTimeout(() => $('.proforma-card').show(), 0);
    });

    $(document).on('click', '.action-btn', async function() {
        const id = $(this).data('id');
        const action = $(this).data('action');

        if (action === 'details') {
            const proforma = await listarProformas().then((items) => items.find((item) => String(item.id) === String(id)));
            Swal.fire({
                title: 'Detalles de la Proforma',
                html: `
                    <div class="text-left">
                        <p><strong>Número:</strong> ${proforma?.numero_proforma || `PRO-${id}`}</p>
                        <p><strong>Cliente:</strong> ${proforma?.cliente || 'N/A'}</p>
                        <p><strong>Fecha:</strong> ${proforma?.fecha || '-'}</p>
                        <p><strong>Total:</strong> ${formatoMoneda(Number(proforma?.total || 0))}</p>
                    </div>
                `,
                confirmButtonColor: '#2C3E50'
            });
            return;
        }

        if (action === 'convert') {
            Swal.fire({
                title: '¿Convertir a factura?',
                text: 'Se generará una factura basada en esta proforma.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, convertir',
                cancelButtonText: 'Cancelar'
            }).then(async (resultado) => {
                if (!resultado.isConfirmed) return;
                try {
                    await convertirProformaAFactura(id);
                    Swal.fire('¡Convertida!', 'La proforma fue convertida a factura correctamente.', 'success');
                    cargarProformas();
                } catch (error) {
                    Swal.fire('Error', 'No se pudo convertir la proforma.', 'error');
                }
            });
            return;
        }

        if (action === 'renew') {
            Swal.fire({
                title: '¿Renovar proforma?',
                text: 'Se extenderá la validez de la proforma por 30 días.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, renovar',
                cancelButtonText: 'Cancelar'
            }).then(async (resultado) => {
                if (!resultado.isConfirmed) return;
                try {
                    const proforma = (await listarProformas()).find((item) => String(item.id) === String(id));
                    const siguiente = proforma ? { ...proforma, fecha_vencimiento: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) } : null;
                    if (!siguiente) throw new Error('No existe la proforma');
                    await solicitarProforma(`${API_PROFORMAS}${id}/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(siguiente) });
                    Swal.fire('¡Renovada!', 'La proforma fue renovada correctamente.', 'success');
                    cargarProformas();
                } catch (error) {
                    Swal.fire('Error', 'No se pudo renovar la proforma.', 'error');
                }
            });
            return;
        }

        if (action === 'print') {
            Swal.fire({
                title: '¿Imprimir proforma?',
                text: 'Se generará un PDF con los detalles de la proforma.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, imprimir',
                cancelButtonText: 'Cancelar'
            }).then((resultado) => {
                if (resultado.isConfirmed) {
                    Swal.fire('¡PDF Generado!', 'El documento ha sido generado correctamente.', 'success');
                }
            });
        }
    });
});
