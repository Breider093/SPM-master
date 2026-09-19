let productosRemision = [];
let detallesRemision = [];

function mostrarErrorRemision(error, mensaje) {
    console.error(error);
    let detalle = mensaje;
    try {
        const respuesta = JSON.parse(error.message);
        detalle = Object.entries(respuesta)
            .map(([campo, errores]) => `${campo}: ${[].concat(errores).join(', ')}`)
            .join('<br>') || mensaje;
    } catch (parseError) {
        detalle = error.message || mensaje;
    }
    Swal.fire('Error de validación', detalle, 'error');
}

function nombreProducto(producto) {
    return producto.nombre || producto.descripcion || producto.codigo || `Producto ${producto.id}`;
}

async function cargarOpcionesRemision() {
    const [clientes, transportadores, productos] = await Promise.all([
        solicitarTransportadores('http://localhost:8000/api/clientes/').then(obtenerListaTransportadores),
        listarTransportadores({ estado: 'ACTIVO' }),
        listarProductosTransportadores()
    ]);
    $('#cliente').html('<option value="">Seleccione un cliente</option>' + clientes.map((cliente) => `<option value="${cliente.id}">${cliente.razon_social || cliente.nombre || cliente.documento}</option>`).join(''));
    $('#transportador').html('<option value="">Seleccione un transportador</option>' + transportadores.map((transportador) => `<option value="${transportador.id}">${transportador.nombre}</option>`).join(''));
    $('#producto').html('<option value="">Seleccione un producto</option>' + productos.map((producto) => `<option value="${producto.id}">${nombreProducto(producto)}</option>`).join(''));
}

function renderizarDetallesRemision() {
    const total = detallesRemision.reduce((suma, detalle) => suma + detalle.subtotal, 0);
    $('#listaProductos').html(detallesRemision.map((detalle, indice) => `
        <div class="product-item" data-index="${indice}">
            <div class="row align-items-center">
                <div class="col-12 col-md-4"><h6 class="mb-0">${detalle.descripcion}</h6></div>
                <div class="col-12 col-md-2"><p class="mb-0">Cantidad: ${detalle.cantidad}</p></div>
                <div class="col-12 col-md-3"><p class="mb-0">Precio: $${detalle.precio_unitario.toFixed(2)}</p></div>
                <div class="col-12 col-md-2"><p class="mb-0">Subtotal: $${detalle.subtotal.toFixed(2)}</p></div>
                <div class="col-12 col-md-1 text-right"><button type="button" class="btn btn-link remove-product" data-index="${indice}"><i class="fas fa-times"></i></button></div>
            </div>
        </div>
    `).join(''));
    $('.total-amount').text(`$${total.toFixed(2)}`);
    return total;
}

$(document).ready(async function() {
    if (!$('#remisionForm').length) return;
    $('body').bootstrapMaterialDesign();
    $('#agregarProducto').off('click').on('click', function() {
        const producto = $('#producto option:selected');
        const cantidad = Number($('#cantidad').val());
        const precio = Number($('#precio').val());
        if (!producto.val() || cantidad <= 0 || precio < 0) {
            Swal.fire('Campos incompletos', 'Selecciona un producto e indica cantidad y precio.', 'warning');
            return;
        }
        detallesRemision.push({ producto: Number(producto.val()), descripcion: producto.text(), cantidad, precio_unitario: precio, subtotal: cantidad * precio });
        renderizarDetallesRemision();
        $('#producto, #cantidad, #precio').val('');
    });
    $(document).off('click.remision', '.remove-product').on('click.remision', '.remove-product', function() {
        detallesRemision.splice(Number($(this).data('index')), 1);
        renderizarDetallesRemision();
    });
    $('#remisionForm').off('submit').on('submit', async function(evento) {
        evento.preventDefault();
        const total = renderizarDetallesRemision();
        if (!detallesRemision.length) {
            Swal.fire('Sin productos', 'Agrega al menos un producto a la remisión.', 'warning');
            return;
        }
        try {
            const remision = await guardarRemisionTransportadores({
                cliente: Number($('#cliente').val()),
                transportador: Number($('#transportador').val()),
                fecha_entrega_programada: $('#fechaEntrega').val(),
                observaciones: $('#observaciones').val(),
                subtotal: total,
                total
            });
            await Promise.all(detallesRemision.map((detalle) => guardarDetalleRemision({
                remision: remision.id,
                producto: detalle.producto,
                cantidad: detalle.cantidad.toFixed(3),
                precio_unitario: detalle.precio_unitario.toFixed(2)
            })));
            await Swal.fire('Guardado', 'La remisión fue creada correctamente.', 'success');
            window.location.href = 'remision-consultar.html';
        } catch (error) {
            mostrarErrorRemision(error, 'No se pudo guardar la remisión.');
        }
    });
    try {
        await cargarOpcionesRemision();
    } catch (error) {
        mostrarErrorRemision(error, 'No se pudieron cargar clientes, productos y transportadores.');
    }
});
