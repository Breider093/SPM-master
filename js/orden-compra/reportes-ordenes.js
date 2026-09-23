const API_BASE = 'http://192.168.1.4:8000/api';
const API_REPORTES_ORDENES = `${API_BASE}/ordenes-compra/`;
const API_REPORTES_PROVEEDORES = `${API_BASE}/proveedores/`;

let ordenesReporte = [];
let proveedoresReporte = [];
let comprasMesChart;
let proveedorChart;

async function solicitarReportes(url) {
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    const datos = await respuesta.json();
    return Array.isArray(datos) ? datos : datos.results || [];
}

function nombreProveedorReporte(orden) {
    if (orden.proveedor && typeof orden.proveedor === 'object') {
        return orden.proveedor.nombre || orden.proveedor.razon_social || `Proveedor ${orden.proveedor.id}`;
    }
    const proveedor = proveedoresReporte.find((item) => String(item.id) === String(orden.proveedor));
    return proveedor ? (proveedor.nombre || proveedor.razon_social || `Proveedor ${proveedor.id}`) : 'Sin proveedor';
}

function fechaOrdenReporte(orden) {
    return orden.fecha_emision || orden.creado_en || orden.created_at || '';
}

function estadoOrdenReporte(estado) {
    return String(estado || 'PENDIENTE').toUpperCase();
}

function detallesOrdenReporte(orden) {
    return Array.isArray(orden.detalles) ? orden.detalles : [];
}

function formatoMonedaReporte(valor) {
    return Number(valor || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
}

function formatoFechaReporte(valor) {
    if (!valor) return 'Sin fecha';
    const fecha = new Date(`${valor.slice(0, 10)}T00:00:00`);
    return Number.isNaN(fecha.getTime()) ? valor : fecha.toLocaleDateString('es-CO');
}

function claseEstadoReporte(estado) {
    return {
        APROBADA: 'badge-success',
        CANCELADA: 'badge-danger',
        RECHAZADA: 'badge-danger',
        PENDIENTE: 'badge-warning'
    }[estado] || 'badge-secondary';
}

function actualizarEstadisticasReporte(ordenes) {
    const totalCompras = ordenes.reduce((suma, orden) => suma + Number(orden.total || 0), 0);
    const productosComprados = ordenes.reduce((suma, orden) => suma + detallesOrdenReporte(orden).reduce(
        (total, detalle) => total + Number(detalle.cantidad || 0), 0
    ), 0);
    const proveedores = new Set(ordenes.map((orden) => String(orden.proveedor))).size;

    $('#ordenesTotales').text(ordenes.length.toLocaleString('es-CO'));
    $('#totalCompras').text(formatoMonedaReporte(totalCompras));
    $('#productosComprados').text(productosComprados.toLocaleString('es-CO'));
    $('#proveedoresTotales').text(proveedores.toLocaleString('es-CO'));
}

function actualizarTablaReporte(ordenes) {
    const filas = ordenes.map((orden, indice) => {
        const estado = estadoOrdenReporte(orden.estado);
        const numero = orden.numero || orden.codigo || `OC-${orden.id}`;
        return `<tr>
            <td>${indice + 1}</td>
            <td>${numero}</td>
            <td>${nombreProveedorReporte(orden)}</td>
            <td>${formatoFechaReporte(fechaOrdenReporte(orden))}</td>
            <td>${formatoMonedaReporte(orden.total)}</td>
            <td><span class="badge ${claseEstadoReporte(estado)}">${estado}</span></td>
        </tr>`;
    }).join('');

    $('#tablaOrdenesReporte').html(filas || '<tr><td colspan="6" class="text-center">No hay órdenes para los filtros seleccionados.</td></tr>');
}

function actualizarGraficosReporte(ordenes) {
    const comprasPorMes = {};
    const comprasPorProveedor = {};
    ordenes.forEach((orden) => {
        const fecha = fechaOrdenReporte(orden).slice(0, 7) || 'Sin fecha';
        comprasPorMes[fecha] = (comprasPorMes[fecha] || 0) + Number(orden.total || 0);
        const proveedor = nombreProveedorReporte(orden);
        comprasPorProveedor[proveedor] = (comprasPorProveedor[proveedor] || 0) + Number(orden.total || 0);
    });

    if (comprasMesChart) comprasMesChart.destroy();
    comprasMesChart = new Chart(document.getElementById('comprasMesChart'), {
        type: 'line',
        data: {
            labels: Object.keys(comprasPorMes).sort(),
            datasets: [{
                label: 'Compras por mes',
                data: Object.keys(comprasPorMes).sort().map((mes) => comprasPorMes[mes]),
                borderColor: '#2C3E50',
                backgroundColor: 'rgba(44, 62, 80, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: {
            beginAtZero: true,
            ticks: { callback: (valor) => formatoMonedaReporte(valor) }
        } } }
    });

    if (proveedorChart) proveedorChart.destroy();
    proveedorChart = new Chart(document.getElementById('proveedorChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(comprasPorProveedor),
            datasets: [{
                data: Object.keys(comprasPorProveedor).map((proveedor) => comprasPorProveedor[proveedor]),
                backgroundColor: ['#2C3E50', '#3498db', '#95a5a6', '#27ae60', '#e67e22', '#8e44ad']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
}

function filtrarOrdenesReporte() {
    const inicio = $('#fechaInicio').val();
    const fin = $('#fechaFin').val();
    const proveedor = $('#proveedor').val();
    const estado = $('#estado').val().toUpperCase();
    const filtradas = ordenesReporte.filter((orden) => {
        const fecha = fechaOrdenReporte(orden).slice(0, 10);
        return (!inicio || fecha >= inicio) && (!fin || fecha <= fin) &&
            (!proveedor || String(orden.proveedor) === proveedor) &&
            (!estado || estadoOrdenReporte(orden.estado) === estado);
    });

    actualizarEstadisticasReporte(filtradas);
    actualizarGraficosReporte(filtradas);
    actualizarTablaReporte(filtradas);
}

function cargarProveedoresReporte() {
    $('#proveedor').html('<option value="">Todos los proveedores</option>' + proveedoresReporte.map((proveedor) =>
        `<option value="${proveedor.id}">${proveedor.nombre || proveedor.razon_social || `Proveedor ${proveedor.id}`}</option>`
    ).join(''));
}

$(document).ready(async function() {
    $('body').bootstrapMaterialDesign();
    try {
        [ordenesReporte, proveedoresReporte] = await Promise.all([
            solicitarReportes(API_REPORTES_ORDENES),
            solicitarReportes(API_REPORTES_PROVEEDORES)
        ]);
        cargarProveedoresReporte();
        filtrarOrdenesReporte();
    } catch (error) {
        actualizarEstadisticasReporte([]);
        actualizarGraficosReporte([]);
        actualizarTablaReporte([]);
        Swal.fire('Error', 'No se pudieron cargar los datos de reportes.', 'error');
    }

    $('#filterForm').on('submit', function(evento) {
        evento.preventDefault();
        filtrarOrdenesReporte();
    });

    $('#filterForm').on('reset', function() {
        window.setTimeout(filtrarOrdenesReporte, 0);
    });
});
