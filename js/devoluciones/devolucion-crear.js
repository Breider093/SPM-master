let clientesDevolucion = [];
let obrasDevolucion = [];
let productosDevolucion = [];
let transportadoresDevolucion = [];
let detallesDevolucion = [];

function productoDevolucion(producto) { return producto.descripcion || producto.nombre || producto.codigo || `Producto ${producto.id}`; }
function clienteDevolucion(cliente) { return cliente.razon_social || cliente.nombre || cliente.documento || `Cliente ${cliente.id}`; }
function motivoDevolucion(motivo) { return { DEFECTUOSO: 'Producto defectuoso', EXCESO_PEDIDO: 'Exceso de pedido', CAMBIO_PRODUCTO: 'Cambio de producto', OTRO: 'Otro' }[motivo] || motivo; }

function renderizarDetallesDevolucion() {
    const totalKg = detallesDevolucion.reduce((suma, detalle) => suma + detalle.total_kg, 0);
    $('#tablaProductos').html(detallesDevolucion.map((detalle, indice) => `<tr data-index="${indice}"><td>${detalle.descripcion}</td><td>${detalle.pendiente}</td><td>${detalle.cantidad}</td><td>${detalle.peso_unitario}</td><td>${motivoDevolucion(detalle.motivo)}</td><td>${detalle.total_kg.toFixed(2)}</td><td><button type="button" class="btn btn-danger btn-sm quitar-detalle-devolucion"><i class="fas fa-times"></i></button></td></tr>`).join(''));
    $('#totalKg').text(`${totalKg.toFixed(2)} Kgr`);
}

function filaDetalleDevolucion() {
    return `<tr class="detalle-editor"><td><select class="form-control producto-devolucion" required><option value="">Seleccione producto</option>${productosDevolucion.map((producto) => `<option value="${producto.id}" data-peso="${producto.peso_kg || 0}">${productoDevolucion(producto)}</option>`).join('')}</select></td><td>-</td><td><input class="form-control cantidad-devolucion" type="number" min="0.001" step="0.001" required></td><td><input class="form-control peso-devolucion" type="number" min="0" step="0.001" required></td><td><select class="form-control motivo-devolucion" required><option value="">Seleccione motivo</option><option value="DEFECTUOSO">Defectuoso</option><option value="EXCESO_PEDIDO">Exceso de pedido</option><option value="CAMBIO_PRODUCTO">Cambio de producto</option><option value="OTRO">Otro</option></select></td><td class="total-detalle-devolucion">0.00</td><td><button type="button" class="btn btn-danger btn-sm quitar-editor-devolucion"><i class="fas fa-times"></i></button></td></tr>`;
}

function cargarObrasDevolucion(cliente) {
    $('#obra').html('<option value="">Seleccione obra</option>' + obrasDevolucion.filter((obra) => String(obra.cliente) === String(cliente)).map((obra) => `<option value="${obra.id}">${obra.nombre || obra.descripcion}</option>`).join(''));
}

function reconstruirDetallesDesdeTabla() {
    detallesDevolucion = [];
    $('#tablaProductos tr.detalle-editor').each(function() {
        const producto = $(this).find('.producto-devolucion option:selected');
        const cantidad = Number($(this).find('.cantidad-devolucion').val());
        const peso = Number($(this).find('.peso-devolucion').val());
        const motivo = $(this).find('.motivo-devolucion').val();
        if (producto.val() && cantidad > 0 && peso >= 0 && motivo) detallesDevolucion.push({ producto: Number(producto.val()), descripcion: producto.text(), cantidad, peso_unitario: peso, total_kg: cantidad * peso, motivo });
    });
}

async function guardarDevolucionFormulario() {
    reconstruirDetallesDesdeTabla();
    const cliente = Number($('#cliente').val());
    const obra = Number($('#obra').val());
    const transportador = Number($('#transportador').val());
    if (!cliente || !obra || !transportador || !$('#fechaFactura').val() || !$('#precioTransporte').val() || !detallesDevolucion.length) { Swal.fire('Campos incompletos', 'Completa cliente, obra, transportador, precio y agrega productos.', 'warning'); return; }
    try {
        const devolucion = await crearDevolucion({ cliente, obra, transportador, factura: $('#factura').val() || null, fecha_factura: $('#fechaFactura').val(), fecha_entrega: $('#fechaEntrega').val() || null, precio_transporte: Number($('#precioTransporte').val()).toFixed(2), observaciones: $('#observaciones').val(), estado: 'PENDIENTE', estado_factura: $('#factura').val() ? 'PENDIENTE' : 'SIN_FACTURA' });
        await Promise.all(detallesDevolucion.map((detalle) => crearDetalleDevolucion({ devolucion: devolucion.id, producto: detalle.producto, cantidad: detalle.cantidad.toFixed(3), peso_unitario: detalle.peso_unitario.toFixed(3), total_kg: detalle.total_kg.toFixed(3), motivo: detalle.motivo }))); 
        await Swal.fire('Guardada', 'La devolución fue registrada correctamente.', 'success');
        window.location.href = 'devolucion-consultar.html';
    } catch (error) { Swal.fire('Error', mensajeErrorDevolucion(error, 'No se pudo guardar la devolución.'), 'error'); }
}

$(document).ready(async function() {
    $('body').bootstrapMaterialDesign();
    try {
        [clientesDevolucion, obrasDevolucion, productosDevolucion, transportadoresDevolucion] = await Promise.all([listarClientesDevolucion(), listarObrasDevolucion(), listarProductosDevolucion(), listarTransportadoresDevolucion()]);
        $('#cliente').html('<option value="">Seleccione cliente</option>' + clientesDevolucion.filter((cliente) => cliente.habilitado !== false).map((cliente) => `<option value="${cliente.id}">${clienteDevolucion(cliente)}</option>`).join(''));
        $('#transportador').html('<option value="">Seleccione transportador</option>' + transportadoresDevolucion.map((item) => `<option value="${item.id}">${item.nombre || item.codigo || item.id}</option>`).join(''));
    } catch (error) { Swal.fire('Error', 'No se pudieron cargar los catálogos de devoluciones.', 'error'); }
    $('#cliente').on('change', function() { const cliente = clientesDevolucion.find((item) => String(item.id) === String(this.value)); cargarObrasDevolucion(this.value); $('#nit').val(cliente?.documento || ''); $('#direccionCliente').val(cliente?.direccion || ''); });
    $('#obra').on('change', function() { const obra = obrasDevolucion.find((item) => String(item.id) === String(this.value)); $('#direccionObra').val(obra?.direccion || ''); $('#telefonoObra').val(obra?.telefono || ''); });
    $('#tablaProductos').on('click', '.quitar-editor-devolucion', function() { $(this).closest('tr').remove(); });
    $('#tablaProductos').on('click', '.quitar-detalle-devolucion', function() { detallesDevolucion.splice(Number($(this).closest('tr').data('index')), 1); renderizarDetallesDevolucion(); });
    $('#tablaProductos').on('change input', '.producto-devolucion, .cantidad-devolucion, .peso-devolucion', function() { const fila = $(this).closest('tr'); const total = Number(fila.find('.cantidad-devolucion').val() || 0) * Number(fila.find('.peso-devolucion').val() || 0); fila.find('.total-detalle-devolucion').text(total.toFixed(2)); });
    window.addProductRow = function() { $('#tablaProductos').append(filaDetalleDevolucion()); };
    $('#devolucionForm').on('submit', function(evento) { evento.preventDefault(); Swal.fire({ title: '¿Guardar devolución?', text: 'Se registrará en el backend.', icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, guardar', cancelButtonText: 'Cancelar' }).then((resultado) => { if (resultado.isConfirmed || resultado.value) guardarDevolucionFormulario(); }); });
    $('#devolucionForm button[type="reset"]').on('click', function(evento) { evento.preventDefault(); detallesDevolucion = []; $('#devolucionForm')[0].reset(); $('#tablaProductos').empty(); $('#totalKg').text('0.00 Kgr'); });
});
