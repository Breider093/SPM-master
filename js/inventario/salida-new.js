let productosSalida = [];

function actualizarListaProductosSalida() {
    $('#listaProductos').empty();
    productosSalida.forEach((producto, index) => {
        $('#listaProductos').append(`<div class="product-item"><div class="product-info"><div class="product-title">${producto.nombre}</div><div>Cantidad: ${producto.cantidad} | Precio: $${producto.precio} | Total: $${producto.total.toFixed(2)}</div></div><div class="product-actions"><button type="button" class="btn btn-danger btn-sm" onclick="eliminarProductoSalida(${index})"><i class="fas fa-trash"></i></button></div></div>`);
    });
}

function actualizarTotalesSalida() {
    const subtotal = productosSalida.reduce((suma, producto) => suma + producto.total, 0);
    const iva = subtotal * 0.19;
    $('#subtotal').text(`$${subtotal.toFixed(2)}`);
    $('#iva').text(`$${iva.toFixed(2)}`);
    $('#total').text(`$${(subtotal + iva).toFixed(2)}`);
}

function eliminarProductoSalida(index) {
    productosSalida.splice(index, 1);
    actualizarListaProductosSalida();
    actualizarTotalesSalida();
}

function agregarProducto() {
    const producto = Number($('#producto').val());
    const cantidad = Number($('#cantidad').val());
    const precio = Number($('#precio').val());
    if (!producto || cantidad <= 0 || precio <= 0) {
        Swal.fire('Error', 'Debe completar producto, cantidad y precio.', 'error');
        return;
    }
    productosSalida.push({ id: producto, nombre: $('#producto option:selected').text(), cantidad, precio, total: cantidad * precio });
    actualizarListaProductosSalida();
    actualizarTotalesSalida();
    $('#producto, #cantidad, #precio').val('');
}

function cargarFormularioSalida() {
    Promise.all([listarClientesInventario(), listarProductosInventario()])
        .then(([clientes, productos]) => {
            $('#cliente').html('<option value="">Seleccione un cliente</option>' + clientes.map((cliente) => `<option value="${cliente.id}">${cliente.razon_social || cliente.nombre || cliente.documento || `Cliente ${cliente.id}`}</option>`).join(''));
            $('#producto').html('<option value="">Seleccione un producto</option>' + productos.map((producto) => `<option value="${producto.id}">${producto.descripcion || producto.nombre || `Producto ${producto.id}`}</option>`).join(''));
        })
        .catch((error) => Swal.fire('Error', mensajeErrorInventario(error, 'No se pudieron cargar clientes y productos.'), 'error'));
}

async function guardarSalidaApi() {
    const datosSalida = {
        fecha: $('#fecha').val(),
        cliente: Number($('#cliente').val()),
        tipo: $('#tipo').val().toUpperCase(),
        observaciones: $('#observaciones').val(),
        estado: 'PENDIENTE'
    };
    if ($('#responsable').val()) datosSalida.responsable = Number($('#responsable').val());
    const salida = await crearSalida(datosSalida);

    await Promise.all(productosSalida.map((producto) => {
        const subtotal = producto.total;
        return crearSalidaDetalle({
            salida: salida.id,
            producto: producto.id,
            cantidad: producto.cantidad,
            precio_unitario: producto.precio,
            subtotal,
            iva_linea: subtotal * 0.19,
            total_linea: subtotal * 1.19
        });
    }));

    await completarSalida(salida.id);
}

$(function() {
    $('#fecha').val(new Date().toISOString().slice(0, 10));
    $('#salidaForm').off('submit').on('submit', function(evento) {
        evento.preventDefault();
        if (!productosSalida.length) {
            Swal.fire('Error', 'Debe agregar al menos un producto.', 'error');
            return;
        }
        Swal.fire({ title: '¿Guardar salida?', text: 'Se validará y descontará el stock disponible.', showCancelButton: true, confirmButtonText: 'Sí, guardar', cancelButtonText: 'Cancelar' }).then(async (resultado) => {
            if (!resultado.isConfirmed && !resultado.value) return;
            try {
                await guardarSalidaApi();
                $('#salidaForm')[0].reset();
                productosSalida = [];
                actualizarListaProductosSalida();
                actualizarTotalesSalida();
                await Swal.fire('Guardada', 'La salida fue completada y el inventario actualizado.', 'success');
                window.location.href = 'salida-list.html';
            } catch (error) {
                Swal.fire('Error', mensajeErrorInventario(error, 'No se pudo guardar la salida. Verifique el stock disponible.'), 'error');
            }
        });
    });

    $('button[type="reset"]').off('click').on('click', function(evento) {
        evento.preventDefault();
        Swal.fire({ title: '¿Limpiar formulario?', text: 'Se perderán todos los datos ingresados.', showCancelButton: true, confirmButtonText: 'Sí, limpiar', cancelButtonText: 'Cancelar' }).then((resultado) => {
            if (!resultado.isConfirmed && !resultado.value) return;
            $('#salidaForm')[0].reset();
            productosSalida = [];
            actualizarListaProductosSalida();
            actualizarTotalesSalida();
        });
    });

    cargarFormularioSalida();
    actualizarTotalesSalida();
});
