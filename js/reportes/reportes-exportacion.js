function obtenerParametrosReporteInventario() {
    const params = new URLSearchParams();
    const proveedor = document.getElementById('proveedor')?.value || '';
    const tipoProducto = document.getElementById('tipoProducto')?.value || '';
    const descripcion = document.getElementById('descripcion')?.value || '';

    if (proveedor) params.set('proveedor', proveedor);
    if (tipoProducto) params.set('tipoProducto', tipoProducto);
    if (descripcion) params.set('descripcion', descripcion);

    return params;
}

function exportarReporteInventario(tipo) {
    const baseUrl = tipo === 'pdf'
        ? '/api/reportes/inventario/exportar-pdf/'
        : '/api/reportes/inventario/exportar-excel/';
    const params = obtenerParametrosReporteInventario();
    const url = `${baseUrl}?${params.toString()}`;
    window.open(url, '_blank');
}

function obtenerParametrosEquiposObra() {
    const params = new URLSearchParams();
    const cliente = document.getElementById('cliente')?.value || '';
    const descripcion = document.getElementById('descripcion')?.value || '';
    const obra = document.getElementById('obra')?.value || '';

    if (cliente) params.set('cliente', cliente);
    if (descripcion) params.set('descripcion', descripcion);
    if (obra) params.set('obra', obra);

    return params;
}

function exportarReporteEquiposObra(tipo) {
    const baseUrl = tipo === 'pdf'
        ? '/api/reportes/equipos-obra/exportar-pdf/'
        : '/api/reportes/equipos-obra/exportar-excel/';
    const params = obtenerParametrosEquiposObra();
    const url = `${baseUrl}?${params.toString()}`;
    window.open(url, '_blank');
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('btnExportarPdfInventario')?.addEventListener('click', function() {
        exportarReporteInventario('pdf');
    });

    document.getElementById('btnExportarExcelInventario')?.addEventListener('click', function() {
        exportarReporteInventario('excel');
    });

    document.getElementById('btnExportarPdfEquiposObra')?.addEventListener('click', function() {
        exportarReporteEquiposObra('pdf');
    });

    document.getElementById('btnExportarExcelEquiposObra')?.addEventListener('click', function() {
        exportarReporteEquiposObra('excel');
    });
});
