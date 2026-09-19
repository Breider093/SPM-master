let clientesDisponibles = [];

$(document).ready(async function() {
    $('body').bootstrapMaterialDesign();

    $('#btnBuscar').on('click', buscarClientes);
    $('#buscarCliente').on('keydown', function(evento) {
        if (evento.key === 'Enter') {
            buscarClientes();
        }
    });

    try {
        clientesDisponibles = await listarClientes();
    } catch (error) {
        mostrarErrorCliente(error, 'No se pudieron cargar los clientes.');
    }
});

function buscarClientes() {
    const termino = $('#buscarCliente').val().trim().toLowerCase();
    const tipo = $('#tipoBusqueda').val();
    const estado = $('#estadoCliente').val();

    if (!termino) {
        Swal.fire('Campo vacío', 'Ingresa un término de búsqueda.', 'warning');
        return;
    }

    const resultados = clientesDisponibles.filter((cliente) => {
        const coincideEstado = estado === 'todos' ||
            (estado === 'activo' && cliente.habilitado) ||
            (estado === 'inactivo' && !cliente.habilitado);
        const valores = {
            todos: `${cliente.id} ${cliente.documento} ${cliente.razon_social}`,
            id: String(cliente.id),
            nombre: cliente.razon_social || '',
            apellido: cliente.razon_social || ''
        };
        return coincideEstado && valores[tipo].toLowerCase().includes(termino);
    });

    renderResultados(resultados);
}

function renderResultados(resultados) {
    const tarjetas = resultados.map((cliente) => `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="result-card">
                <div class="client-name">${cliente.razon_social || ''}</div>
                <div class="client-info">
                    <p><strong>ID:</strong> ${cliente.id}</p>
                    <p><strong>Documento:</strong> ${cliente.documento || ''}</p>
                    <p><strong>Teléfono:</strong> ${cliente.telefono || cliente.celular || ''}</p>
                    <p><strong>Email:</strong> ${cliente.email || ''}</p>
                    <p><strong>Estado:</strong> <span class="badge ${cliente.habilitado ? 'badge-success' : 'badge-secondary'}">${cliente.habilitado ? 'Activo' : 'Inactivo'}</span></p>
                </div>
                <div class="text-right mt-3">
                    <a class="btn btn-success btn-action" title="Editar" href="client-update.html?id=${cliente.id}">
                        <i class="fas fa-edit"></i>
                    </a>
                </div>
            </div>
        </div>
    `).join('');

    $('#resultadosBusqueda').html(tarjetas || '<div class="col-12"><p>No se encontraron clientes.</p></div>');
}

window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});
