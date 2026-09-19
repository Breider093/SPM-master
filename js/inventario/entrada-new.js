function limpiarEntrada() {
    $('#entradaForm')[0].reset();
    $('#productosContainer').html('');
    addProduct();
}

let productosEntradaDisponibles = [];

function cargarFormularioEntrada() {
    Promise.all([listarProveedoresInventario(), listarProductosInventario()])
        .then(([proveedores, productos]) => {
            productosEntradaDisponibles = productos;
            $('#proveedor').html('<option value="">Seleccione un proveedor</option>' + proveedores.map((proveedor) => `<option value="${proveedor.id}">${proveedor.nombre || proveedor.razon_social || `Proveedor ${proveedor.id}`}</option>`).join(''));
            $('.product-item select[name="productos[]"]').html('<option value="">Seleccione un producto</option>' + productos.map((producto) => `<option value="${producto.id}">${producto.descripcion || producto.nombre || `Producto ${producto.id}`}</option>`).join(''));
        })
        .catch((error) => Swal.fire('Error', mensajeErrorInventario(error, 'No se pudieron cargar proveedores y productos.'), 'error'));
}

async function guardarEntradaApi() {
    const productos = $('.product-item').map(function() {
        return {
            producto: Number($(this).find('select[name="productos[]"]').val()),
            cantidad: Number($(this).find('input[name="cantidades[]"]').val()),
            precio_unitario: Number($(this).find('input[name="precios[]"]').val()),
            lote: $(this).find('input[name="lotes[]"]').val()
        };
    }).get();

    const entrada = await crearEntrada({
        fecha: $('#fecha').val(),
        proveedor: Number($('#proveedor').val()),
        factura: $('#factura').val(),
        observaciones: $('#observaciones').val(),
        estado: 'PENDIENTE'
    });

    await Promise.all(productos.map((detalle) => crearEntradaDetalle({
        entrada: entrada.id,
        producto: detalle.producto,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        lote: detalle.lote
    })));

    await confirmarEntrada(entrada.id);
}

$(function() {
    $('#entradaForm').off('submit').on('submit', function(evento) {
        evento.preventDefault();
        Swal.fire({
            title: '¿Guardar entrada?',
            text: 'Se registrará la entrada y se actualizará el inventario.',
            showCancelButton: true,
            confirmButtonText: 'Sí, guardar',
            cancelButtonText: 'Cancelar'
        }).then(async (resultado) => {
            if (!resultado.isConfirmed && !resultado.value) return;
            try {
                await guardarEntradaApi();
                limpiarEntrada();
                await Swal.fire('Guardada', 'La entrada fue registrada y confirmada correctamente.', 'success');
                window.location.href = 'entrada-list.html';
            } catch (error) {
                Swal.fire('Error', mensajeErrorInventario(error, 'No se pudo guardar la entrada.'), 'error');
            }
        });
    });

    $('button[type="reset"]').off('click').on('click', function(evento) {
        evento.preventDefault();
        Swal.fire({
            title: '¿Limpiar formulario?',
            text: 'Se perderán todos los datos ingresados.',
            showCancelButton: true,
            confirmButtonText: 'Sí, limpiar',
            cancelButtonText: 'Cancelar'
        }).then((resultado) => {
            if (resultado.isConfirmed || resultado.value) limpiarEntrada();
        });
    });

    cargarFormularioEntrada();
    $(document).on('click', '#productosContainer ~ .text-right button', function() {
        const opciones = '<option value="">Seleccione un producto</option>' + productosEntradaDisponibles.map((producto) => `<option value="${producto.id}">${producto.descripcion || producto.nombre || `Producto ${producto.id}`}</option>`).join('');
        $('#productosContainer .product-item:last select[name="productos[]"]').html(opciones);
    });
});
