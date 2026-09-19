let detallesCotizacion = [];

function nombreClienteCotizacion(cliente) {
    return cliente.razon_social || cliente.nombre || cliente.documento || `Cliente ${cliente.id}`;
}

function nombreProductoCotizacion(producto) {
    return producto.descripcion || producto.nombre || producto.codigo || `Producto ${producto.id}`;
}

function renderizarDetallesCotizacion() {
    const total = detallesCotizacion.reduce((suma, detalle) => suma + detalle.subtotal, 0);
    $('#listaProductos').html(detallesCotizacion.map((detalle, indice) => `
        <div class="product-item" data-index="${indice}">
            <div class="row align-items-center">
                <div class="col-12 col-md-4"><h6 class="mb-0">${detalle.descripcion}</h6></div>
                <div class="col-12 col-md-2"><p class="mb-0">Cantidad: ${detalle.cantidad}</p></div>
                <div class="col-12 col-md-3"><p class="mb-0">Precio: $${detalle.precio_unitario.toFixed(2)}</p></div>
                <div class="col-12 col-md-2"><p class="mb-0">Subtotal: $${detalle.subtotal.toFixed(2)}</p></div>
                <div class="col-12 col-md-1 text-right">
                    <button type="button" class="btn btn-link remove-product" data-index="${indice}" title="Eliminar producto"><i class="fas fa-times"></i></button>
                </div>
            </div>
        </div>`).join(''));
    $('.total-amount').text(`$${total.toFixed(2)}`);
    return total;
}

async function guardarCotizacion() {
    const cliente = Number($('#cliente').val());
    const fechaVencimiento = $('#fechaVencimiento').val();
    const total = renderizarDetallesCotizacion();
    if (!cliente || !fechaVencimiento || !detallesCotizacion.length) {
        Swal.fire('Campos incompletos', 'Selecciona cliente, vencimiento y agrega al menos un producto.', 'warning');
        return;
    }

    try {
        const cotizacion = await crearCotizacion({
            cliente,
            fecha_vencimiento: fechaVencimiento,
            observaciones: $('#observaciones').val(),
            subtotal: total.toFixed(2),
            impuestos: '0.00',
            total: total.toFixed(2)
        });
        await Promise.all(detallesCotizacion.map((detalle) => crearDetalleCotizacion({
            cotizacion: cotizacion.id,
            producto: detalle.producto,
            descripcion: detalle.descripcion,
            cantidad: detalle.cantidad.toFixed(3),
            precio_unitario: detalle.precio_unitario.toFixed(2),
            subtotal: detalle.subtotal.toFixed(2)
        })));
        await Swal.fire('Guardada', 'La cotización fue creada correctamente.', 'success');
        window.location.href = 'cotizacion-consultar.html';
    } catch (error) {
        Swal.fire('Error', mensajeErrorCotizacion(error, 'No se pudo guardar la cotización.'), 'error');
    }
}

$(document).ready(async function() {
    $('body').bootstrapMaterialDesign();
    try {
        const [clientes, productos] = await Promise.all([listarClientesCotizacion(), listarProductosCotizacion()]);
        $('#cliente').html('<option value="">Seleccione un cliente</option>' + clientes
            .filter((cliente) => cliente.habilitado !== false)
            .map((cliente) => `<option value="${cliente.id}">${nombreClienteCotizacion(cliente)}</option>`).join(''));
        $('#producto').html('<option value="">Seleccione un producto</option>' + productos
            .map((producto) => `<option value="${producto.id}">${nombreProductoCotizacion(producto)}</option>`).join(''));
    } catch (error) {
        Swal.fire('Error', 'No se pudieron cargar clientes y productos.', 'error');
    }

    $('#agregarProducto').on('click', function() {
        const producto = $('#producto option:selected');
        const cantidad = Number($('#cantidad').val());
        const precio = Number($('#precio').val());
        if (!producto.val() || cantidad <= 0 || precio < 0) {
            Swal.fire('Campos incompletos', 'Selecciona un producto e indica cantidad y precio.', 'warning');
            return;
        }
        detallesCotizacion.push({ producto: Number(producto.val()), descripcion: producto.text(), cantidad, precio_unitario: precio, subtotal: cantidad * precio });
        renderizarDetallesCotizacion();
        $('#producto, #cantidad, #precio').val('');
    });

    $(document).on('click', '.remove-product', function() {
        detallesCotizacion.splice(Number($(this).data('index')), 1);
        renderizarDetallesCotizacion();
    });

    $('#cotizacionForm').on('submit', function(evento) {
        evento.preventDefault();
        Swal.fire({ title: '¿Guardar cotización?', text: 'Se creará la cotización con los productos seleccionados.', icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, guardar', cancelButtonText: 'Cancelar' })
            .then((resultado) => { if (resultado.isConfirmed || resultado.value) guardarCotizacion(); });
    });

    $('#cotizacionForm button[type="reset"]').on('click', function(evento) {
        evento.preventDefault();
        detallesCotizacion = [];
        $('#cotizacionForm')[0].reset();
        renderizarDetallesCotizacion();
    });
});
