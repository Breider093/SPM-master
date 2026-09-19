function etiquetaEstadoEntrada(estado) {
    const normalizado = String(estado || 'PENDIENTE').toUpperCase();
    const clase = normalizado === 'COMPLETADA' ? 'badge-completed' : normalizado === 'CANCELADA' ? 'badge-cancelled' : 'badge-pending';
    return `<span class="badge ${clase}">${normalizado}</span>`;
}

async function renderizarEntradas() {
    const [entradas, proveedores, detalles] = await Promise.all([listarEntradas(), listarProveedoresInventario(), listarEntradaDetalles()]);
    $('.entrada-card').closest('.col-12').remove();
    const proveedoresMapa = Object.fromEntries(proveedores.map((proveedor) => [proveedor.id, proveedor.nombre || `Proveedor ${proveedor.id}`]));
    const detallesPorEntrada = detalles.reduce((mapa, detalle) => {
        mapa[detalle.entrada] = (mapa[detalle.entrada] || []).concat(detalle);
        return mapa;
    }, {});
    const filas = entradas.map((entrada) => {
        const entradaDetalles = entrada.detalles || detallesPorEntrada[entrada.id] || [];
        return `<tr><td>${entrada.numero || `ENT-${entrada.id}`}</td><td>${entrada.fecha || ''}</td><td>${proveedoresMapa[entrada.proveedor] || entrada.proveedor || ''}</td><td>${entrada.factura || ''}</td><td>${entradaDetalles.length}</td><td>$${Number(entrada.total || entradaDetalles.reduce((suma, item) => suma + Number(item.subtotal || 0), 0)).toFixed(2)}</td><td>${etiquetaEstadoEntrada(entrada.estado)}</td><td><button class="btn btn-info btn-sm" onclick="verDetalleEntradaApi(${entrada.id})"><i class="fas fa-eye"></i></button></td></tr>`;
    }).join('');
    $('.table-custom tbody').last().html(filas || '<tr><td colspan="8">No hay entradas registradas.</td></tr>');
}

function verDetalleEntradaApi(id) {
    window.location.href = `entrada-list.html?id=${id}`;
}

$(function() {
    renderizarEntradas().catch((error) => Swal.fire('Error', mensajeErrorInventario(error, 'No se pudieron cargar las entradas.'), 'error'));
    $('#filterForm').off('submit').on('submit', function(evento) {
        evento.preventDefault();
        renderizarEntradas().catch((error) => Swal.fire('Error', mensajeErrorInventario(error, 'No se pudieron filtrar las entradas.'), 'error'));
    });
});
