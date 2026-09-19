let detallesFactura = [];
let productosDisponiblesFactura = [];

function nombreProductoFactura(producto) {
    return producto.descripcion || producto.nombre || producto.codigo || `Producto ${producto.id}`;
}

function renderizarDetallesFactura() {
    const subtotal = detallesFactura.reduce((suma, detalle) => suma + detalle.subtotal, 0);
    const impuesto = subtotal * 0.19;
    $('#subtotal').text(`$${subtotal.toFixed(2)}`);
    $('#iva').text(`$${impuesto.toFixed(2)}`);
    $('#total').text(`$${(subtotal + impuesto).toFixed(2)}`);
    $('#productosContainer').html(detallesFactura.map((detalle, indice) => `
        <div class="product-item" data-index="${indice}">
            <div class="row align-items-center">
                <div class="col-12 col-md-4"><strong>${detalle.descripcion}</strong></div>
                <div class="col-12 col-md-3">Cantidad: ${detalle.cantidad}</div>
                <div class="col-12 col-md-3">Precio: $${detalle.precio_unitario.toFixed(2)}</div>
                <div class="col-12 col-md-2"><button type="button" class="btn btn-danger btn-block remove-factura-product"><i class="fas fa-times"></i></button></div>
            </div>
        </div>`).join(''));
    return { subtotal, impuesto, total: subtotal + impuesto };
}

function plantillaProductoFactura() {
    return `<div class="product-item"><div class="row"><div class="col-12 col-md-4"><div class="form-group"><label>Producto</label><select class="form-control form-input producto-select" required><option value="">Seleccione producto</option>${productosDisponiblesFactura.map((producto) => `<option value="${producto.id}">${nombreProductoFactura(producto)}</option>`).join('')}</select></div></div><div class="col-12 col-md-3"><div class="form-group"><label>Cantidad</label><input type="number" class="form-control form-input cantidad-input" min="0.001" step="0.001" required></div></div><div class="col-12 col-md-3"><div class="form-group"><label>Precio Unitario</label><input type="number" class="form-control form-input precio-input" min="0" step="0.01" required></div></div><div class="col-12 col-md-2"><div class="form-group"><label>&nbsp;</label><button type="button" class="btn btn-danger btn-block remove-factura-product"><i class="fas fa-times"></i></button></div></div></div></div>`;
}

function seleccionarMetodoPago(elemento, metodo) {
    $('.payment-method').removeClass('selected');
    $(elemento).addClass('selected');
    $('#metodoPago').val(metodo);
}

async function guardarFacturaFormulario() {
    const cliente = Number($('#cliente').val());
    const fecha = $('#fecha').val();
    const metodoPago = $('#metodoPago').val();
    const totales = renderizarDetallesFactura();
    if (!cliente || !fecha || !metodoPago || !detallesFactura.length) {
        Swal.fire('Campos incompletos', 'Selecciona cliente, fecha, método de pago y agrega productos.', 'warning');
        return;
    }
    try {
        const factura = await crearFacturaApi({ cliente, fecha_emision: fecha, metodo_pago: metodoPago.toUpperCase(), estado: 'EMITIDA', subtotal: totales.subtotal.toFixed(2), impuestos: totales.impuesto.toFixed(2), total: totales.total.toFixed(2), observaciones: $('#observaciones').val() });
        await Promise.all(detallesFactura.map((detalle) => crearDetalleFacturaApi({ factura: factura.id, producto: detalle.producto, descripcion: detalle.descripcion, cantidad: detalle.cantidad.toFixed(3), precio_unitario: detalle.precio_unitario.toFixed(2), subtotal: detalle.subtotal.toFixed(2) })));
        await Swal.fire('Guardada', 'La factura fue registrada correctamente.', 'success');
        window.location.href = 'factura-consultar.html';
    } catch (error) {
        Swal.fire('Error', mensajeErrorFactura(error, 'No se pudo guardar la factura.'), 'error');
    }
}

$(document).ready(async function() {
    $('body').bootstrapMaterialDesign();
    $('#metodoPago').remove();
    $('.payment-methods').after('<input type="hidden" id="metodoPago" name="metodoPago">');
    try {
        const [clientes, productos] = await Promise.all([listarClientesFactura(), listarProductosFactura()]);
        productosDisponiblesFactura = productos;
        $('#cliente').html('<option value="">Seleccione un cliente</option>' + clientes.filter((cliente) => cliente.habilitado !== false).map((cliente) => `<option value="${cliente.id}">${cliente.razon_social || cliente.nombre || cliente.documento}</option>`).join(''));
        $('#productosContainer').html(plantillaProductoFactura());
    } catch (error) {
        Swal.fire('Error', 'No se pudieron cargar clientes y productos.', 'error');
    }

    window.addProduct = function() { $('#productosContainer').append(plantillaProductoFactura()); };
    window.removeProduct = function(button) { $(button).closest('.product-item').remove(); };
    window.selectPaymentMethod = seleccionarMetodoPago;
    $(document).on('input change', '.cantidad-input, .precio-input', function() {
        const detalles = [];
        $('#productosContainer .product-item').each(function() {
            const producto = $(this).find('.producto-select').val();
            const cantidad = Number($(this).find('.cantidad-input').val());
            const precio = Number($(this).find('.precio-input').val());
            if (producto && cantidad > 0 && precio >= 0) {
                const registro = productosDisponiblesFactura.find((item) => String(item.id) === String(producto));
                detalles.push({ producto: Number(producto), descripcion: registro ? nombreProductoFactura(registro) : 'Producto', cantidad, precio_unitario: precio, subtotal: cantidad * precio });
            }
        });
        detallesFactura = detalles;
        const subtotal = detalles.reduce((suma, detalle) => suma + detalle.subtotal, 0);
        $('#subtotal').text(`$${subtotal.toFixed(2)}`); $('#iva').text(`$${(subtotal * 0.19).toFixed(2)}`); $('#total').text(`$${(subtotal * 1.19).toFixed(2)}`);
    });
    $(document).on('click', '.remove-factura-product', function() { $(this).closest('.product-item').remove(); });
    $('#facturaForm').on('submit', function(evento) { evento.preventDefault(); Swal.fire({ title: '¿Guardar factura?', text: 'Se registrará la factura en el backend.', icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, guardar', cancelButtonText: 'Cancelar' }).then((resultado) => { if (resultado.isConfirmed || resultado.value) guardarFacturaFormulario(); }); });
    $('#facturaForm button[type="reset"]').on('click', function(evento) { evento.preventDefault(); detallesFactura = []; $('#facturaForm')[0].reset(); $('#metodoPago').val(''); $('.payment-method').removeClass('selected'); $('#productosContainer').html(plantillaProductoFactura()); renderizarDetallesFactura(); });
});
