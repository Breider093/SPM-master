let cotizacionesDisponibles = [];
let clientesCotizacion = [];

function nombreClienteConsulta(cliente) {
    if (cliente && typeof cliente === 'object') return cliente.razon_social || cliente.nombre || cliente.documento || `Cliente ${cliente.id}`;
    const registro = clientesCotizacion.find((item) => String(item.id) === String(cliente));
    return registro ? (registro.razon_social || registro.nombre || registro.documento || `Cliente ${registro.id}`) : 'Sin cliente';
}

function estadoCotizacion(estado) {
    return String(estado || 'PENDIENTE').toUpperCase();
}

function claseEstadoCotizacion(estado) {
    return { APROBADA: 'badge-success', RECHAZADA: 'badge-danger', CANCELADA: 'badge-danger', VENCIDA: 'badge-secondary', PENDIENTE: 'badge-warning' }[estado] || 'badge-secondary';
}

function accionesCotizacion(estado) {
    if (estado === 'PENDIENTE') {
        return `<button type="button" class="btn btn-success action-btn btn-estado-cotizacion" data-estado="APROBADA" title="Aprobar"><i class="fas fa-check"></i></button>
            <button type="button" class="btn btn-warning action-btn btn-estado-cotizacion" data-estado="RECHAZADA" title="Rechazar"><i class="fas fa-times"></i></button>`;
    }
    if (estado === 'APROBADA') {
        return '<button type="button" class="btn btn-warning action-btn btn-estado-cotizacion" data-estado="CANCELADA" title="Cancelar"><i class="fas fa-ban"></i></button>';
    }
    return '';
}

function monedaCotizacion(valor) {
    return Number(valor || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
}

function fechaCotizacion(valor) {
    if (!valor) return 'Sin fecha';
    const fecha = new Date(`${String(valor).slice(0, 10)}T00:00:00`);
    return Number.isNaN(fecha.getTime()) ? valor : fecha.toLocaleDateString('es-CO');
}

function renderizarCotizaciones(registros) {
    $('#cotizacionesBody').html(registros.map((cotizacion, indice) => {
        const estado = estadoCotizacion(cotizacion.estado);
        return `<tr data-id="${cotizacion.id}">
            <td>${indice + 1}</td>
            <td>${cotizacion.numero || `COT-${cotizacion.id}`}</td>
            <td>${nombreClienteConsulta(cotizacion.cliente)}</td>
            <td>${fechaCotizacion(cotizacion.fecha_emision || cotizacion.creado_en)}</td>
            <td>${fechaCotizacion(cotizacion.fecha_vencimiento)}</td>
            <td>${monedaCotizacion(cotizacion.total)}</td>
            <td><span class="badge ${claseEstadoCotizacion(estado)}">${estado}</span></td>
            <td>
                <button type="button" class="btn btn-info action-btn btn-ver-cotizacion" title="Ver detalles"><i class="fas fa-eye"></i></button>
                ${accionesCotizacion(estado)}
                <button type="button" class="btn btn-danger action-btn btn-eliminar-cotizacion" title="Eliminar"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('') || '<tr><td colspan="8" class="text-center">No hay cotizaciones para los filtros seleccionados.</td></tr>');
}

function filtrarCotizaciones() {
    const inicio = $('#fechaInicio').val();
    const fin = $('#fechaFin').val();
    const cliente = $('#cliente').val();
    const estado = $('#estado').val();
    const registros = cotizacionesDisponibles.filter((cotizacion) => {
        const fecha = String(cotizacion.fecha_emision || cotizacion.creado_en || '').slice(0, 10);
        return (!inicio || fecha >= inicio) && (!fin || fecha <= fin) &&
            (!cliente || String(cotizacion.cliente) === cliente) &&
            (!estado || estadoCotizacion(cotizacion.estado) === estado);
    });
    renderizarCotizaciones(registros);
}

function mostrarDetalleCotizacion(cotizacion) {
    const detalles = Array.isArray(cotizacion.detalles) ? cotizacion.detalles : [];
    const lista = detalles.map((detalle) => `<li>${detalle.descripcion || `Producto ${detalle.producto}`} - ${detalle.cantidad} - ${monedaCotizacion(detalle.precio_unitario)} c/u</li>`).join('') || '<li>Sin productos</li>';
    Swal.fire({ title: 'Detalles de la cotización', html: `<div class="text-left"><p><strong>Número:</strong> ${cotizacion.numero || `COT-${cotizacion.id}`}</p><p><strong>Cliente:</strong> ${nombreClienteConsulta(cotizacion.cliente)}</p><p><strong>Fecha:</strong> ${fechaCotizacion(cotizacion.fecha_emision || cotizacion.creado_en)}</p><p><strong>Vencimiento:</strong> ${fechaCotizacion(cotizacion.fecha_vencimiento)}</p><p><strong>Estado:</strong> ${estadoCotizacion(cotizacion.estado)}</p><p><strong>Total:</strong> ${monedaCotizacion(cotizacion.total)}</p><hr><h6>Productos:</h6><ul>${lista}</ul></div>`, confirmButtonColor: '#2C3E50' });
}

$(document).ready(async function() {
    $('body').bootstrapMaterialDesign();
    try {
        [cotizacionesDisponibles, clientesCotizacion] = await Promise.all([listarCotizaciones(), listarClientesCotizacion()]);
        $('#cliente').html('<option value="">Todos los clientes</option>' + clientesCotizacion.map((cliente) => `<option value="${cliente.id}">${nombreClienteConsulta(cliente)}</option>`).join(''));
        filtrarCotizaciones();
    } catch (error) {
        renderizarCotizaciones([]);
        Swal.fire('Error', mensajeErrorCotizacion(error, 'No se pudieron cargar las cotizaciones.'), 'error');
    }

    $('#searchForm').on('submit', function(evento) { evento.preventDefault(); filtrarCotizaciones(); });
    $('#searchForm').on('reset', function() { window.setTimeout(filtrarCotizaciones, 0); });

    $('#cotizacionesBody').on('click', '.btn-ver-cotizacion', function() {
        const cotizacion = cotizacionesDisponibles.find((registro) => String(registro.id) === String($(this).closest('tr').data('id')));
        if (cotizacion) mostrarDetalleCotizacion(cotizacion);
    });

    $('#cotizacionesBody').on('click', '.btn-estado-cotizacion', async function() {
        const boton = $(this);
        const id = boton.closest('tr').data('id');
        const estado = boton.data('estado');
        const resultado = await Swal.fire({
            title: `¿${estado === 'APROBADA' ? 'Aprobar' : estado === 'RECHAZADA' ? 'Rechazar' : 'Cancelar'} cotización?`,
            text: 'El cambio se guardará en el backend.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, continuar',
            cancelButtonText: 'Cancelar'
        });
        if (!resultado.isConfirmed && !resultado.value) return;
        try {
            const actualizada = await cambiarEstadoCotizacion(id, estado);
            const indice = cotizacionesDisponibles.findIndex((registro) => String(registro.id) === String(id));
            if (indice !== -1) cotizacionesDisponibles[indice] = actualizada;
            filtrarCotizaciones();
            Swal.fire('Actualizada', `La cotización quedó ${estado.toLowerCase()}.`, 'success');
        } catch (error) {
            Swal.fire('Error', mensajeErrorCotizacion(error, 'No se pudo cambiar el estado.'), 'error');
        }
    });

    $('#cotizacionesBody').on('click', '.btn-eliminar-cotizacion', async function() {
        const id = $(this).closest('tr').data('id');
        const resultado = await Swal.fire({ title: '¿Eliminar cotización?', text: 'Esta acción no se puede deshacer.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
        if (!resultado.isConfirmed && !resultado.value) return;
        try {
            await eliminarCotizacion(id);
            cotizacionesDisponibles = cotizacionesDisponibles.filter((registro) => String(registro.id) !== String(id));
            filtrarCotizaciones();
            Swal.fire('Eliminada', 'La cotización fue eliminada.', 'success');
        } catch (error) {
            Swal.fire('Error', mensajeErrorCotizacion(error, 'No se pudo eliminar la cotización.'), 'error');
        }
    });
});
