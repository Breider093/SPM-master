let productosDisponiblesProforma = [];

function formatoMoneda(numero) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
    }).format(Number(numero || 0));
}

function obtenerProductoHtml(productos = productosDisponiblesProforma) {
    return `
        <option value="">Seleccione producto</option>
        ${productos.map((producto) => `
            <option value="${producto.id}">${producto.descripcion || producto.nombre || producto.codigo || `Producto ${producto.id}`}</option>
        `).join('')}
    `;
}

window.addProduct = function() {
    const container = document.getElementById('productosContainer');
    const row = document.createElement('div');
    row.className = 'product-item';
    row.innerHTML = `
        <div class="row">
            <div class="col-12 col-md-4">
                <div class="form-group">
                    <label>Producto</label>
                    <select class="form-control form-input producto-select" required>
                        ${obtenerProductoHtml()}
                    </select>
                </div>
            </div>
            <div class="col-12 col-md-3">
                <div class="form-group">
                    <label>Cantidad</label>
                    <input type="number" class="form-control form-input cantidad-input" min="0" step="0.01" placeholder="Cantidad" required>
                </div>
            </div>
            <div class="col-12 col-md-3">
                <div class="form-group">
                    <label>Precio Unitario</label>
                    <input type="number" class="form-control form-input precio-input" min="0" step="0.01" placeholder="Precio" required>
                </div>
            </div>
            <div class="col-12 col-md-2">
                <div class="form-group">
                    <label>&nbsp;</label>
                    <button type="button" class="btn btn-danger btn-block" onclick="removeProduct(this)">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    container.appendChild(row);
};

window.removeProduct = function(button) {
    const item = button.closest('.product-item');
    if (item) item.remove();
    calcularTotalesProforma();
};

window.selectValidity = function(element, days) {
    $('.validity-option').removeClass('selected');
    $(element).addClass('selected');
    $('#validez').val(days);
};

function calcularTotalesProforma() {
    let subtotal = 0;
    const rows = $('.product-item');

    rows.each(function() {
        const cantidad = parseFloat($(this).find('.cantidad-input').val()) || 0;
        const precio = parseFloat($(this).find('.precio-input').val()) || 0;
        subtotal += cantidad * precio;
    });

    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    $('#subtotal').text(formatoMoneda(subtotal));
    $('#iva').text(formatoMoneda(iva));
    $('#total').text(formatoMoneda(total));
}

function limpiarFormularioProforma() {
    $('#proformaForm')[0].reset();
    $('#productosContainer').html('');
    addProduct();
    $('#validez').val('30');
    $('.validity-option').removeClass('selected');
    $('.validity-option[data-days="30"]').addClass('selected');
    calcularTotalesProforma();
}

async function guardarProforma() {
    const cliente = Number($('#cliente').val());
    const fecha = $('#fecha').val();
    const vigenciaDias = Number($('#validez').val()) || 30;
    const observaciones = $('#observaciones').val();

    const items = $('.product-item').map(function() {
        const productoId = Number($(this).find('.producto-select').val());
        const cantidad = parseFloat($(this).find('.cantidad-input').val()) || 0;
        const precio = parseFloat($(this).find('.precio-input').val()) || 0;

        if (!productoId || cantidad <= 0 || precio <= 0) return null;

        const subtotalLinea = cantidad * precio;
        return {
            producto: productoId,
            descripcion: $(this).find('.producto-select option:selected').text(),
            cantidad,
            precio_unitario: precio,
            subtotal: subtotalLinea
        };
    }).get().filter(Boolean);

    if (!cliente || !fecha || !items.length) {
        Swal.fire('Campos incompletos', 'Debe seleccionar cliente, fecha y al menos un producto.', 'warning');
        return;
    }

    const subtotal = items.reduce((suma, item) => suma + Number(item.subtotal), 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    try {
        const proforma = await crearProforma({
            cliente,
            fecha_emision: fecha,
            fecha_vencimiento: new Date(new Date(fecha).getTime() + vigenciaDias * 86400000).toISOString().slice(0, 10),
            vigencia_dias: vigenciaDias,
            observaciones,
            subtotal: subtotal.toFixed(2),
            impuestos: iva.toFixed(2),
            total: total.toFixed(2),
            estado: 'PENDIENTE'
        });

        if (!proforma || !proforma.id) {
            throw new Error(JSON.stringify({ detalle: 'La API no devolvió un id de proforma.' }));
        }

        await Promise.all(items.map((item) => crearDetalleProforma({
            cotizacion: proforma.id,
            producto: item.producto,
            descripcion: item.descripcion,
            cantidad: Number(item.cantidad).toFixed(3),
            precio_unitario: Number(item.precio_unitario).toFixed(2),
            subtotal: Number(item.subtotal).toFixed(2),
            iva_linea: (Number(item.subtotal) * 0.19).toFixed(2),
            total_linea: (Number(item.subtotal) * 1.19).toFixed(2)
        })));

        limpiarFormularioProforma();
        await Swal.fire('Guardada', 'La proforma fue creada correctamente.', 'success');
        window.location.href = 'proforma-list.html';
    } catch (error) {
        console.error('Error al guardar proforma:', error);
        Swal.fire('Error', mensajeErrorProforma(error, 'No se pudo guardar la proforma. Revisa que la API esté levantada y que los endpoints existan.'), 'error');
    }
}

$(document).ready(async function() {
    $('body').bootstrapMaterialDesign();

    try {
        const [clientes, productos] = await Promise.all([listarClientesProforma(), listarProductosProforma()]);
        productosDisponiblesProforma = productos;

        $('#cliente').html('<option value="">Seleccione un cliente</option>' + clientes
            .map((cliente) => `<option value="${cliente.id}">${cliente.razon_social || cliente.nombre || cliente.documento || `Cliente ${cliente.id}`}</option>`)
            .join(''));

        $('.producto-select').each(function() {
            $(this).html(obtenerProductoHtml(productos));
        });
    } catch (error) {
        Swal.fire('Error', 'No se pudieron cargar clientes y productos.', 'error');
    }

    $('#validez').val('30');
    $('.validity-option[data-days="30"]').addClass('selected');
    $(document).on('input', '.cantidad-input, .precio-input', calcularTotalesProforma);
    $('#proformaForm').on('submit', function(evento) {
        evento.preventDefault();
        Swal.fire({
            title: '¿Guardar proforma?',
            text: 'Se creará la proforma con los productos seleccionados.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, guardar',
            cancelButtonText: 'Cancelar'
        }).then((resultado) => {
            if (resultado.isConfirmed || resultado.value) guardarProforma();
        });
    });

    $('button[type="reset"]').on('click', function(evento) {
        evento.preventDefault();
        Swal.fire({
            title: '¿Limpiar formulario?',
            text: 'Se perderán todos los datos ingresados.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, limpiar',
            cancelButtonText: 'Cancelar'
        }).then((resultado) => {
            if (!resultado.isConfirmed && !resultado.value) return;
            limpiarFormularioProforma();
        });
    });

    calcularTotalesProforma();
});
