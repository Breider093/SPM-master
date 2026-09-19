function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
    }).format(Number(valor || 0));
}

function calcularEstadoProforma(proforma) {
    const estado = (proforma.estado || '').toLowerCase();
    if (estado === 'vencida' || estado === 'expired') return 'vencida';
    if (estado === 'convertida' || estado === 'anulada') return 'vencida';
    return 'activa';
}

function prepararDatosResumen(proformas, clientes) {
    const clientesMapa = {};
    clientes.forEach((cliente) => {
        clientesMapa[cliente.id] = cliente;
    });

    const registros = proformas.map((proforma) => {
        const cliente = clientesMapa[proforma.cliente] || { nombre: `Cliente ${proforma.cliente || ''}` };
        return {
            ...proforma,
            fecha: proforma.fecha_emision || proforma.fecha || '',
            clienteNombre: cliente.razon_social || cliente.nombre || cliente.documento || `Cliente ${proforma.cliente || ''}`,
            estado: calcularEstadoProforma(proforma),
            total: Number(proforma.total || 0)
        };
    });

    const total = registros.length;
    const activas = registros.filter((registro) => registro.estado === 'activa').length;
    const vencidas = registros.filter((registro) => registro.estado === 'vencida').length;
    const valorTotal = registros.reduce((suma, registro) => suma + registro.total, 0);

    const porMes = {};
    registros.forEach((registro) => {
        const fecha = registro.fecha_emision || registro.fecha || registro.created_at || new Date().toISOString().slice(0, 10);
        const mes = new Date(fecha).toLocaleString('es-ES', { month: 'short' });
        porMes[mes] = (porMes[mes] || 0) + 1;
    });

    const porCliente = {};
    registros.forEach((registro) => {
        const nombre = registro.clienteNombre;
        porCliente[nombre] = (porCliente[nombre] || 0) + 1;
    });

    return { registros, total, activas, vencidas, valorTotal, porMes, porCliente };
}

function renderizarResumen(datos) {
    $('#totalProformas').text(datos.total);
    $('#proformasActivas').text(datos.activas);
    $('#proformasVencidas').text(datos.vencidas);
    $('#valorTotal').text(formatearMoneda(datos.valorTotal));

    const labelsMes = Object.keys(datos.porMes);
    const chartMes = Object.values(datos.porMes);

    const labelsCliente = Object.keys(datos.porCliente);
    const chartCliente = Object.values(datos.porCliente);

    if (window.mesChartInstance) window.mesChartInstance.destroy();
    if (window.clienteChartInstance) window.clienteChartInstance.destroy();

    if (window.Chart) {
        const monthlyCtx = document.getElementById('monthlyChart')?.getContext('2d');
        const clientCtx = document.getElementById('clientChart')?.getContext('2d');

        if (monthlyCtx) {
            window.mesChartInstance = new Chart(monthlyCtx, {
                type: 'line',
                data: {
                    labels: labelsMes.length ? labelsMes : ['Sin datos'],
                    datasets: [{
                        label: 'Proformas',
                        data: chartMes.length ? chartMes : [0],
                        borderColor: '#2C3E50',
                        backgroundColor: 'rgba(44, 62, 80, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

        if (clientCtx) {
            window.clienteChartInstance = new Chart(clientCtx, {
                type: 'doughnut',
                data: {
                    labels: labelsCliente.length ? labelsCliente : ['Sin datos'],
                    datasets: [{
                        data: chartCliente.length ? chartCliente : [1],
                        backgroundColor: ['#2C3E50', '#3498DB', '#E74C3C', '#F39C12', '#27AE60']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }
    }

    const body = $('#resumenProformasBody');
    if (!body.length) return;

    if (!datos.registros.length) {
        body.html('<tr><td colspan="6" class="text-center">No hay proformas para mostrar.</td></tr>');
        return;
    }

    body.html(datos.registros.slice(0, 10).map((registro) => `
        <tr>
            <td>${registro.numero_proforma || `PRO-${registro.id}`}</td>
            <td>${registro.clienteNombre}</td>
            <td>${registro.fecha || '-'}</td>
            <td><span class="status-badge ${registro.estado === 'vencida' ? 'expired' : 'active'}">${registro.estado === 'vencida' ? 'Vencida' : 'Activa'}</span></td>
            <td>${formatearMoneda(registro.total)}</td>
            <td>
                <button class="btn btn-info btn-sm" title="Ver Detalles" data-id="${registro.id}">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join(''));
}

async function cargarResumenProformas() {
    try {
        const [proformas, clientes] = await Promise.all([listarProformas(), listarClientesProforma()]);
        const resumen = prepararDatosResumen(proformas, clientes);
        renderizarResumen(resumen);
    } catch (error) {
        $('#totalProformas').text('0');
        $('#proformasActivas').text('0');
        $('#proformasVencidas').text('0');
        $('#valorTotal').text('$0.00');
        $('#resumenProformasBody').html('<tr><td colspan="6" class="text-center">No se pudieron cargar las proformas.</td></tr>');
    }
}

$(document).ready(async function() {
    $('body').bootstrapMaterialDesign();

    try {
        const clientes = await listarClientesProforma();
        $('#cliente').html('<option value="">Todos los clientes</option>' + clientes
            .map((cliente) => `<option value="${cliente.id}">${cliente.razon_social || cliente.nombre || cliente.documento || `Cliente ${cliente.id}`}</option>`)
            .join(''));
    } catch (error) {
        $('#cliente').html('<option value="">Todos los clientes</option>');
    }

    cargarResumenProformas();

    $('#filterForm').on('submit', function(evento) {
        evento.preventDefault();
        const fechaInicio = $('#fechaInicio').val();
        const fechaFin = $('#fechaFin').val();
        const cliente = $('#cliente').val();

        listarProformas().then((proformas) => {
            let registros = proformas.filter((proforma) => {
                let valido = true;
                if (cliente && String(proforma.cliente) !== String(cliente)) valido = false;
                if (fechaInicio && (proforma.fecha || proforma.created_at) && new Date(proforma.fecha || proforma.created_at) < new Date(fechaInicio)) valido = false;
                if (fechaFin && (proforma.fecha || proforma.created_at) && new Date(proforma.fecha || proforma.created_at) > new Date(fechaFin)) valido = false;
                return valido;
            });

            listarClientesProforma().then((clientes) => {
                renderizarResumen(prepararDatosResumen(registros, clientes));
            });
        });
    });

    $('#filterForm').on('reset', function() {
        setTimeout(() => cargarResumenProformas(), 0);
    });

    $(document).on('click', '#resumenProformasBody .btn-info', function() {
        const id = $(this).data('id');
        listarProformas().then((proformas) => {
            const proforma = proformas.find((item) => String(item.id) === String(id));
            if (!proforma) return;
            Swal.fire({
                title: 'Detalles de la Proforma',
                html: `
                    <div class="text-left">
                        <p><strong>Número:</strong> ${proforma.numero_proforma || `PRO-${proforma.id}`}</p>
                        <p><strong>Cliente:</strong> ${proforma.cliente || 'N/A'}</p>
                        <p><strong>Fecha:</strong> ${proforma.fecha || '-'}</p>
                        <p><strong>Total:</strong> ${formatearMoneda(Number(proforma.total || 0))}</p>
                    </div>
                `,
                confirmButtonColor: '#2C3E50'
            });
        });
    });
});
