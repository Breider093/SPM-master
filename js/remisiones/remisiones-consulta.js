$(document).ready(async function() {
    if (!$('.table tbody').length || !$('title').text().toLowerCase().includes('remisiones')) return;
    const tabla = $('.table tbody');

    function renderizar(remisiones) {
        tabla.html(remisiones.map((remision, indice) => {
            const estado = String(remision.estado || '').toUpperCase();
            const acciones = [
                '<button class="btn btn-info action-btn" data-action="details"><i class="fas fa-eye"></i></button>'
            ];
            if (estado === 'PENDIENTE') {
                acciones.push('<button class="btn btn-success action-btn" data-action="confirmar"><i class="fas fa-check"></i></button>');
                acciones.push('<button class="btn btn-warning action-btn" data-action="cancelar"><i class="fas fa-ban"></i></button>');
            } else if (estado === 'CONFIRMADA' || estado === 'RESERVADA') {
                acciones.push('<button class="btn btn-primary action-btn" data-action="entregar"><i class="fas fa-truck"></i></button>');
                acciones.push('<button class="btn btn-warning action-btn" data-action="cancelar"><i class="fas fa-ban"></i></button>');
            }
            if (estado !== 'ENTREGADA') {
                acciones.push('<button class="btn btn-danger action-btn" data-action="delete"><i class="fas fa-trash"></i></button>');
            }
            return `
            <tr data-id="${remision.id}">
                <td>${indice + 1}</td>
                <td>${remision.numero || remision.codigo || `REM-${remision.id}`}</td>
                <td>${remision.cliente_nombre || remision.cliente?.razon_social || remision.cliente || ''}</td>
                <td>${remision.fecha_entrega || remision.fecha_emision || ''}</td>
                <td>${remision.transportador_nombre || remision.transportador?.nombre || remision.transportador || ''}</td>
                <td>$${Number(remision.total || 0).toLocaleString()}</td>
                <td><span class="badge badge-${String(remision.estado || '').toLowerCase()}">${remision.estado || ''}</span></td>
                <td>${acciones.join(' ')}</td>
            </tr>
        `; }).join('') || '<tr><td colspan="8">No hay remisiones registradas.</td></tr>');
    }

    async function cargar() {
        try {
            const remisiones = await listarRemisionesTransportadores({
                cliente: $('#cliente').val(),
                estado: $('#estado').val(),
                transportador: $('#transportador').val(),
                fecha_desde: $('#fechaInicio').val(),
                fecha_hasta: $('#fechaFin').val()
            });
            renderizar(remisiones);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudieron cargar las remisiones.', 'error');
        }
    }

    $('#searchForm').off('submit').on('submit', function(evento) {
        evento.preventDefault();
        cargar();
    });
    tabla.on('click', '[data-action="details"]', function() {
        const fila = $(this).closest('tr');
        Swal.fire({ title: 'Detalles de la Remisión', html: `<p><strong>Número:</strong> ${fila.find('td').eq(1).text()}</p><p><strong>Cliente:</strong> ${fila.find('td').eq(2).text()}</p><p><strong>Transportador:</strong> ${fila.find('td').eq(4).text()}</p><p><strong>Total:</strong> ${fila.find('td').eq(5).text()}</p>` });
    });
    tabla.on('click', '[data-action="delete"]', async function() {
        const id = $(this).closest('tr').data('id');
        const confirmacion = await Swal.fire({ title: '¿Eliminar remisión?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
        if (!confirmacion.isConfirmed) return;
        try {
            await eliminarRemisionTransportadores(id);
            await cargar();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo eliminar la remisión.', 'error');
        }
    });
    tabla.on('click', '[data-action="confirmar"], [data-action="entregar"], [data-action="cancelar"]', async function() {
        try {
            const accion = $(this).data('action');
            await ejecutarAccionRemision($(this).closest('tr').data('id'), accion);
            if (accion === 'entregar') {
                await Swal.fire('Remisión entregada', 'La entrega fue registrada y el movimiento de kardex fue generado.', 'success');
            }
            await cargar();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo ejecutar la acción de la remisión.', 'error');
        }
    });
    await cargar();
});
