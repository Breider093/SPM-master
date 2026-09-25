const API_BASE_URL = '/api';
const REPORTES_API_BASE = `${API_BASE_URL}/reportes`;

function poblarSelect(selectId, opciones, textoBase, valorBase = '') {
    const select = document.getElementById(selectId);
    if (!select) return;

    const items = Array.isArray(opciones) ? opciones : [];
    select.innerHTML = `<option value="${valorBase}">${textoBase}</option><option value="todos">TODOS</option>`;

    items.forEach((item) => {
        const valor = item.id ?? item.value ?? item.nombre ?? item.razon_social ?? item.descripcion ?? '';
        const texto = item.nombre || item.razon_social || item.descripcion || item.titulo || item.codigo || String(valor);

        if (valor !== '' && texto) {
            select.appendChild(new Option(texto, String(valor)));
        }
    });
}

async function cargarOpcionesInventario() {
    try {
        const [proveedoresResponse, tiposResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/proveedores/`),
            fetch(`${API_BASE_URL}/tipos-producto/`)
        ]);

        if (proveedoresResponse.ok) {
            const proveedores = await proveedoresResponse.json();
            const listaProveedores = Array.isArray(proveedores) ? proveedores : (proveedores.results || []);
            poblarSelect('proveedor', listaProveedores, 'Seleccione un proveedor');
        }

        if (tiposResponse.ok) {
            const tipos = await tiposResponse.json();
            const listaTipos = Array.isArray(tipos) ? tipos : (tipos.results || []);
            poblarSelect('tipoProducto', listaTipos, 'Seleccione un tipo');
        }
    } catch (error) {
        console.error('No se pudieron cargar los filtros de inventario:', error);
    }
}

async function cargarOpcionesEquiposObra() {
    try {
        const [clientesResponse, obrasResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/clientes/`),
            fetch(`${API_BASE_URL}/obras/`)
        ]);

        if (clientesResponse.ok) {
            const clientes = await clientesResponse.json();
            const listaClientes = Array.isArray(clientes) ? clientes : (clientes.results || []);
            poblarSelect('cliente', listaClientes, 'Seleccione un cliente');
        }

        if (obrasResponse.ok) {
            const obras = await obrasResponse.json();
            const listaObras = Array.isArray(obras) ? obras : (obras.results || []);
            poblarSelect('obra', listaObras, 'Seleccione una obra');
        }
    } catch (error) {
        console.error('No se pudieron cargar los filtros de equipos en obra:', error);
    }
}

function obtenerParametrosReporteInventario() {
    const params = new URLSearchParams();
    const proveedor = document.getElementById('proveedor')?.value || '';
    const tipoProducto = document.getElementById('tipoProducto')?.value || '';
    const descripcion = document.getElementById('descripcion')?.value || '';

    if (proveedor && proveedor !== 'todos') params.set('proveedor', proveedor);
    if (tipoProducto && tipoProducto !== 'todos') params.set('tipoProducto', tipoProducto);
    if (descripcion) params.set('descripcion', descripcion);

    return params;
}

function obtenerParametrosEquiposObra() {
    const params = new URLSearchParams();
    const cliente = document.getElementById('cliente')?.value || '';
    const descripcion = document.getElementById('descripcion')?.value || '';
    const obra = document.getElementById('obra')?.value || '';

    if (cliente && cliente !== 'todos') params.set('cliente', cliente);
    if (descripcion) params.set('descripcion', descripcion);
    if (obra && obra !== 'todos') params.set('obra', obra);

    return params;
}

function exportarReporteInventario(tipo) {
    const baseUrl = tipo === 'pdf'
        ? `${REPORTES_API_BASE}/inventario/exportar-pdf/`
        : `${REPORTES_API_BASE}/inventario/exportar-excel/`;
    const params = obtenerParametrosReporteInventario();
    const url = `${baseUrl}?${params.toString()}`;
    window.open(url, '_blank');
}

function exportarReporteEquiposObra(tipo) {
    const baseUrl = tipo === 'pdf'
        ? `${REPORTES_API_BASE}/equipos-obra/exportar-pdf/`
        : `${REPORTES_API_BASE}/equipos-obra/exportar-excel/`;
    const params = obtenerParametrosEquiposObra();
    const url = `${baseUrl}?${params.toString()}`;
    window.open(url, '_blank');
}

async function cargarInventario() {
    const tbody = document.getElementById('inventarioTableBody');
    if (!tbody) return;

    try {
        const params = obtenerParametrosReporteInventario();
        const response = await fetch(`${REPORTES_API_BASE}/inventario/?${params.toString()}`);
        if (!response.ok) throw new Error('No se pudo cargar el inventario');
        const data = await response.json();
        const filas = Array.isArray(data) ? data : (data.results || []);

        tbody.innerHTML = filas.length ? filas.map((item) => `
            <tr class="text-center">
                <td>${item.codigo || ''}</td>
                <td>${item.descripcion || ''}</td>
                <td>${item.tipo || ''}</td>
                <td>${item.saldo_proveedor ?? 0}</td>
                <td>${item.remision ?? 0}</td>
                <td>${item.devolucion ?? 0}</td>
                <td>${item.reposicion ?? 0}</td>
                <td>${item.en_alquiler ?? 0}</td>
                <td>${item.en_bodega ?? 0}</td>
                <td>${item.estado ? `<span class="badge ${item.estado === 'Stock Bajo' ? 'badge-warning' : 'badge-success'}">${item.estado}</span>` : ''}</td>
            </tr>
        `).join('') : '<tr><td colspan="10" class="text-center">No hay datos para mostrar.</td></tr>';
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">No se pudo cargar la información.</td></tr>';
    }
}

async function cargarEquiposObra() {
    const tbody = document.getElementById('equiposObraTableBody');
    if (!tbody) return;

    try {
        const params = obtenerParametrosEquiposObra();
        const response = await fetch(`${REPORTES_API_BASE}/equipos-obra/?${params.toString()}`);
        if (!response.ok) throw new Error('No se pudo cargar los equipos en obra');
        const data = await response.json();
        const filas = Array.isArray(data) ? data : (data.results || []);

        tbody.innerHTML = filas.length ? filas.map((item) => `
            <tr class="text-center">
                <td>${item.id ?? ''}</td>
                <td>${item.descripcion || ''}</td>
                <td>${item.cantidad ?? 0}</td>
                <td>${item.cliente || ''}</td>
                <td>${item.obra || ''}</td>
                <td>${item.fecha_inicio || ''}</td>
                <td>${item.fecha_fin || ''}</td>
                <td>${item.estado ? `<span class="badge ${item.estado === 'En Uso' ? 'badge-info' : 'badge-success'}">${item.estado}</span>` : ''}</td>
            </tr>
        `).join('') : '<tr><td colspan="8" class="text-center">No hay datos para mostrar.</td></tr>';
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No se pudo cargar la información.</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('proveedor') || document.getElementById('tipoProducto')) {
        cargarOpcionesInventario();
    }

    if (document.getElementById('cliente') || document.getElementById('obra')) {
        cargarOpcionesEquiposObra();
    }

    const btnPdfInventario = document.getElementById('btnExportarPdfInventario');
    const btnExcelInventario = document.getElementById('btnExportarExcelInventario');
    const btnPdfEquipos = document.getElementById('btnExportarPdfEquiposObra');
    const btnExcelEquipos = document.getElementById('btnExportarExcelEquiposObra');

    btnPdfInventario?.addEventListener('click', function() {
        exportarReporteInventario('pdf');
    });

    btnExcelInventario?.addEventListener('click', function() {
        exportarReporteInventario('excel');
    });

    btnPdfEquipos?.addEventListener('click', function() {
        exportarReporteEquiposObra('pdf');
    });

    btnExcelEquipos?.addEventListener('click', function() {
        exportarReporteEquiposObra('excel');
    });

    const buscarInventarioBtn = document.querySelector('#inventarioBuscar');
    buscarInventarioBtn?.addEventListener('click', cargarInventario);

    const buscarEquiposBtn = document.querySelector('#equiposObraBuscar');
    buscarEquiposBtn?.addEventListener('click', cargarEquiposObra);

    if (document.getElementById('inventarioTableBody')) {
        cargarInventario();
    }

    if (document.getElementById('equiposObraTableBody')) {
        cargarEquiposObra();
    }
});
