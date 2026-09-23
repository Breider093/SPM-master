const API_BASE = 'http://192.168.1.4:8000/api';
const API_ORDENES_COMPRA = `${API_BASE}/ordenes-compra/`;
const API_ORDEN_COMPRA_DETALLES = `${API_BASE}/orden-compra-detalles/`;
const API_PRODUCTOS_COMPRA = `${API_BASE}/productos/`;
const API_PROVEEDORES_COMPRA = `${API_BASE}/proveedores/`;

function obtenerCookieOrdenCompra(nombre) {
    const cookies = document.cookie ? document.cookie.split(';') : [];
    const cookie = cookies.find((valor) => valor.trim().startsWith(`${nombre}=`));
    return cookie ? decodeURIComponent(cookie.trim().substring(nombre.length + 1)) : '';
}

function listaOrdenCompra(datos) {
    return Array.isArray(datos) ? datos : datos.results || [];
}

async function solicitarOrdenCompra(url, opciones = {}) {
    const headers = new Headers(opciones.headers || {});
    headers.set('X-CSRFToken', obtenerCookieOrdenCompra('csrftoken'));
    const respuesta = await fetch(url, { ...opciones, headers });
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
        throw new Error(JSON.stringify(datos));
    }
    return datos;
}

function mensajeErrorOrdenCompra(error, fallback = 'No se pudo completar la operación.') {
    try {
        const errores = JSON.parse(error.message);
        return Object.entries(errores)
            .map(([campo, mensajes]) => `${campo}: ${[].concat(mensajes).join(', ')}`)
            .join('<br>');
    } catch (parseError) {
        return fallback;
    }
}

function listarProveedoresCompra() {
    return solicitarOrdenCompra(API_PROVEEDORES_COMPRA).then(listaOrdenCompra);
}

function listarProductosCompra() {
    return solicitarOrdenCompra(API_PRODUCTOS_COMPRA).then(listaOrdenCompra);
}

function listarOrdenesCompra() {
    return solicitarOrdenCompra(API_ORDENES_COMPRA).then(listaOrdenCompra);
}

function crearOrdenCompra(datos) {
    return solicitarOrdenCompra(API_ORDENES_COMPRA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function crearDetalleOrdenCompra(datos) {
    return solicitarOrdenCompra(API_ORDEN_COMPRA_DETALLES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
}

function eliminarOrdenCompra(id) {
    return solicitarOrdenCompra(`${API_ORDENES_COMPRA}${id}/`, { method: 'DELETE' });
}

function aprobarOrdenCompra(id) {
    return solicitarOrdenCompra(`${API_ORDENES_COMPRA}${id}/aprobar/`, { method: 'POST' });
}

function cancelarOrdenCompra(id) {
    return solicitarOrdenCompra(`${API_ORDENES_COMPRA}${id}/cancelar/`, { method: 'POST' });
}

let detallesOrdenCompra = [];

function renderizarDetallesOrdenCompra() {
    const total = detallesOrdenCompra.reduce((suma, detalle) => suma + detalle.subtotal, 0);
    $('#listaProductos').html(detallesOrdenCompra.map((detalle, indice) => `
        <div class="product-item" data-index="${indice}">
            <div class="row align-items-center">
                <div class="col-12 col-md-4"><h6 class="mb-0">${detalle.descripcion}</h6></div>
                <div class="col-12 col-md-2"><p class="mb-0">Cantidad: ${detalle.cantidad}</p></div>
                <div class="col-12 col-md-3"><p class="mb-0">Precio: $${detalle.precio_unitario.toFixed(2)}</p></div>
                <div class="col-12 col-md-2"><p class="mb-0">Subtotal: $${detalle.subtotal.toFixed(2)}</p></div>
                <div class="col-12 col-md-1 text-right">
                    <button type="button" class="btn btn-link remove-product" data-index="${indice}" title="Eliminar producto">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join(''));
    $('.total-amount').text(`$${total.toFixed(2)}`);
    return total;
}

async function cargarCatalogosOrdenCompra() {
    const [proveedores, productos] = await Promise.all([
        listarProveedoresCompra(),
        listarProductosCompra()
    ]);
    $('#proveedor').html('<option value="">Seleccione un proveedor</option>' +
        proveedores.map((proveedor) => `<option value="${proveedor.id}">${proveedor.nombre || proveedor.razon_social}</option>`).join(''));
    $('#producto').html('<option value="">Seleccione un producto</option>' +
        productos.map((producto) => `<option value="${producto.id}">${producto.descripcion || producto.nombre || producto.codigo}</option>`).join(''));
}

async function guardarFormularioOrdenCompra() {
    const total = renderizarDetallesOrdenCompra();
    const proveedor = Number($('#proveedor').val());
    const fechaEntrega = $('#fechaEntrega').val();

    if (!proveedor || !fechaEntrega || !detallesOrdenCompra.length) {
        Swal.fire('Campos incompletos', 'Selecciona proveedor, fecha y agrega al menos un producto.', 'warning');
        return;
    }

    try {
        const orden = await crearOrdenCompra({
            proveedor,
            fecha_entrega_programada: fechaEntrega,
            observaciones: $('#observaciones').val(),
            subtotal: total.toFixed(2),
            impuestos: '0.00',
            total: total.toFixed(2)
        });
        await Promise.all(detallesOrdenCompra.map((detalle) => crearDetalleOrdenCompra({
            orden_compra: orden.id,
            producto: detalle.producto,
            cantidad: detalle.cantidad.toFixed(3),
            precio_unitario: detalle.precio_unitario.toFixed(2),
            subtotal: detalle.subtotal.toFixed(2)
        })));
        await Swal.fire('Guardado', 'La orden de compra fue creada correctamente.', 'success');
        window.location.href = 'orden-compra-consultar.html';
    } catch (error) {
        Swal.fire('Error', mensajeErrorOrdenCompra(error, 'No se pudo guardar la orden de compra.'), 'error');
    }
}

$(document).ready(async function() {
    if (!$('#ordenForm').length) return;

    $('#agregarProducto').off('click');
    $('#ordenForm').off('submit');
    $(document).off('click', '.remove-product');

    $('#agregarProducto').on('click', function() {
        const producto = $('#producto option:selected');
        const cantidad = Number($('#cantidad').val());
        const precio = Number($('#precio').val());
        if (!producto.val() || cantidad <= 0 || precio < 0) {
            Swal.fire('Campos incompletos', 'Selecciona un producto e indica cantidad y precio.', 'warning');
            return;
        }
        detallesOrdenCompra.push({
            producto: Number(producto.val()),
            descripcion: producto.text(),
            cantidad,
            precio_unitario: precio,
            subtotal: cantidad * precio
        });
        renderizarDetallesOrdenCompra();
        $('#producto, #cantidad, #precio').val('');
    });

    $(document).on('click', '.remove-product', function() {
        detallesOrdenCompra.splice(Number($(this).data('index')), 1);
        renderizarDetallesOrdenCompra();
    });

    $('#ordenForm').on('submit', function(evento) {
        evento.preventDefault();
        Swal.fire({
            title: '¿Guardar orden?',
            text: 'Se creará la orden con los productos seleccionados.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, guardar',
            cancelButtonText: 'Cancelar'
        }).then((resultado) => {
            if (resultado.isConfirmed || resultado.value) guardarFormularioOrdenCompra();
        });
    });

    $('#ordenForm button[type="reset"]').off('click').on('click', function(evento) {
        evento.preventDefault();
        detallesOrdenCompra = [];
        $('#ordenForm')[0].reset();
        renderizarDetallesOrdenCompra();
    });

    try {
        await cargarCatalogosOrdenCompra();
    } catch (error) {
        Swal.fire('Error', 'No se pudieron cargar proveedores y productos.', 'error');
    }
});

function valorOrdenCompra(orden, campo, alternativa = '') {
    const valor = orden[campo];
    if (valor && typeof valor === 'object') return valor.nombre || valor.razon_social || valor.descripcion || valor.id;
    return valor ?? alternativa;
}

function estadoOrdenCompra(estado) {
    const estados = {
        PENDIENTE: ['badge-warning', 'fa-clock'],
        APROBADA: ['badge-success', 'fa-check-circle'],
        RECHAZADA: ['badge-danger', 'fa-times-circle'],
        COMPLETADA: ['badge-success', 'fa-check-double'],
        CANCELADA: ['badge-secondary', 'fa-ban']
    };
    return estados[String(estado || '').toUpperCase()] || ['badge-info', 'fa-tag'];
}

function renderizarTablaOrdenesCompra(ordenes) {
    const filas = ordenes.map((orden, indice) => {
        const estado = String(valorOrdenCompra(orden, 'estado', 'PENDIENTE')).toUpperCase();
        const [claseEstado, iconoEstado] = estadoOrdenCompra(estado);
        const proveedor = valorOrdenCompra(orden, 'proveedor', 'Sin proveedor');
        const numero = valorOrdenCompra(orden, 'numero', valorOrdenCompra(orden, 'codigo', `OC-${orden.id}`));
        const fechaEmision = valorOrdenCompra(orden, 'fecha_emision', valorOrdenCompra(orden, 'created_at', ''));
        const fechaEntrega = valorOrdenCompra(orden, 'fecha_entrega_programada', valorOrdenCompra(orden, 'fecha_entrega', ''));
        const total = Number(valorOrdenCompra(orden, 'total', 0)).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
        return `<tr data-id="${orden.id}" data-search="${`${numero} ${proveedor} ${estado}`.toLowerCase()}">
            <td>${indice + 1}</td>
            <td><div class="orden-info"><div class="orden-icon"><i class="fas fa-file-invoice"></i></div><div><h6 class="mb-0">${numero}</h6><small class="text-muted">Orden de compra</small></div></div></td>
            <td><div class="proveedor-info"><i class="fas fa-building text-primary"></i><div><h6 class="mb-0">${proveedor}</h6></div></div></td>
            <td><div class="fecha-info"><div><p class="fecha-label mb-0">Emisión:</p><strong>${fechaEmision || '-'}</strong></div><div><p class="fecha-label mb-0">Entrega:</p><strong>${fechaEntrega || '-'}</strong></div></div></td>
            <td class="monto-info">${total}</td>
            <td class="text-center"><span class="status-badge ${claseEstado}"><i class="fas ${iconoEstado}"></i> ${estado}</span></td>
            <td class="text-center">
                <button type="button" class="btn btn-info btn-action btn-ver-orden" title="Ver detalles"><i class="fas fa-eye"></i></button>
                ${estado === 'PENDIENTE' ? '<button type="button" class="btn btn-success btn-action btn-aprobar-orden" title="Aprobar"><i class="fas fa-check"></i></button>' : ''}
                ${estado === 'PENDIENTE' || estado === 'APROBADA' ? '<button type="button" class="btn btn-warning btn-action btn-cancelar-orden" title="Cancelar"><i class="fas fa-ban"></i></button>' : ''}
                <button type="button" class="btn btn-danger btn-action btn-eliminar-orden" title="Eliminar"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
    $('table tbody').html(filas || '<tr><td colspan="7" class="text-center">No hay órdenes para mostrar.</td></tr>');
}

async function inicializarConsultaOrdenesCompra() {
    if (!$('#searchForm').length || !$('table tbody').length) return;
    try {
        const ordenes = await listarOrdenesCompra();
        renderizarTablaOrdenesCompra(ordenes);

        $('#searchForm').off('submit').on('submit', function(evento) {
            evento.preventDefault();
            const texto = `${$('#searchOrden').val()} ${$('#searchProveedor').val()} ${$('#searchFecha').val()} ${$('#searchEstado').val()}`.toLowerCase();
            $('table tbody tr').each(function() {
                $(this).toggle($(this).data('search').includes(texto.trim()));
            });
        });
        $('#searchForm button[type="reset"]').off('click').on('click', function(evento) {
            evento.preventDefault();
            $('#searchForm')[0].reset();
            $('table tbody tr').show();
        });
    } catch (error) {
        Swal.fire('Error', mensajeErrorOrdenCompra(error, 'No se pudieron cargar las órdenes.'), 'error');
    }
}

$(document).on('click', '.btn-eliminar-orden', async function() {
    const id = $(this).closest('tr').data('id');
    const resultado = await Swal.fire({ title: '¿Eliminar orden?', text: 'Esta acción no se puede deshacer.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' });
    if (!resultado.isConfirmed) return;
    try {
        await eliminarOrdenCompra(id);
        $(this).closest('tr').remove();
        Swal.fire('Eliminada', 'La orden fue eliminada.', 'success');
    } catch (error) {
        Swal.fire('Error', mensajeErrorOrdenCompra(error), 'error');
    }
});

$(document).on('click', '.btn-aprobar-orden, .btn-cancelar-orden', async function() {
    const id = $(this).closest('tr').data('id');
    const aprobar = $(this).hasClass('btn-aprobar-orden');
    try {
        const orden = aprobar ? await aprobarOrdenCompra(id) : await cancelarOrdenCompra(id);
        const ordenes = await listarOrdenesCompra();
        renderizarTablaOrdenesCompra(ordenes);
        Swal.fire('Actualizada', `La orden quedó en estado ${String(valorOrdenCompra(orden, 'estado', aprobar ? 'APROBADA' : 'CANCELADA')).toUpperCase()}.`, 'success');
    } catch (error) {
        Swal.fire('Error', mensajeErrorOrdenCompra(error), 'error');
    }
});

$(document).on('click', '.btn-ver-orden', function() {
    const fila = $(this).closest('tr');
    Swal.fire({
        title: 'Detalles de la orden',
        html: `<p><strong>Orden:</strong> ${fila.find('h6').first().text()}</p><p><strong>Proveedor:</strong> ${fila.find('.proveedor-info h6').text()}</p><p><strong>Total:</strong> ${fila.find('.monto-info').text()}</p><p><strong>Estado:</strong> ${fila.find('.status-badge').text().trim()}</p>`,
        confirmButtonColor: '#2C3E50'
    });
});

$(document).ready(inicializarConsultaOrdenesCompra);
