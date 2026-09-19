function etiquetaEstadoSalida(estado) {
    const normalizado = String(estado || 'PENDIENTE').toUpperCase();
    const clase = normalizado === 'COMPLETADA' ? 'badge-completed' : normalizado === 'CANCELADA' ? 'badge-cancelled' : 'badge-pending';
    return `<span class="badge ${clase}">${normalizado}</span>`;
}

async function renderizarSalidas() {
    const [salidas, clientes, detalles] = await Promise.all([listarSalidas(), listarClientesInventario(), listarSalidaDetalles()]);
    $('.salida-card').closest('[class*="col-"]').remove();
    const clientesMapa = Object.fromEntries(clientes.map((cliente) => [cliente.id, cliente.razon_social || cliente.nombre || `Cliente ${cliente.id}`]));
    const detallesPorSalida = detalles.reduce((mapa, detalle) => {
        mapa[detalle.salida] = (mapa[detalle.salida] || []).concat(detalle);
        return mapa;
    }, {});
    const filas = salidas.map((salida) => {
        const salidaDetalles = salida.detalles || detallesPorSalida[salida.id] || [];
        return `<tr><td>${salida.numero || salida.id}</td><td>${clientesMapa[salida.cliente] || salida.cliente || ''}</td><td>${salida.fecha || ''}</td><td>${salida.tipo || ''}</td><td>${salidaDetalles.length}</td><td>$${Number(salida.total || salidaDetalles.reduce((suma, item) => suma + Number(item.total_linea || item.subtotal || 0), 0)).toFixed(2)}</td><td>${etiquetaEstadoSalida(salida.estado)}</td><td><button class="btn btn-info btn-sm" onclick="verDetalleSalidaApi(${salida.id})"><i class="fas fa-eye"></i></button></td></tr>`;
    }).join('');
    $('.table-custom tbody').last().html(filas || '<tr><td colspan="8">No hay salidas registradas.</td></tr>');
}

function verDetalleSalidaApi(id) {
    window.location.href = `salida-list.html?id=${id}`;
}

$(function() {
    renderizarSalidas().catch((error) => Swal.fire('Error', mensajeErrorInventario(error, 'No se pudieron cargar las salidas.'), 'error'));
    $('#searchSalida').off('keyup').on('keyup', function() {
        const termino = $(this).val().toLowerCase();
        $('.table-custom tbody tr').each(function() { $(this).toggle($(this).text().toLowerCase().includes(termino)); });
    });
});
