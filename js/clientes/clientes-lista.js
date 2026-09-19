let clientes = [];
let urlPaginaActual = null;
let tamanoPagina = 0;

$(document).ready(async function() {
    $('body').bootstrapMaterialDesign();

    $('#searchRazonSocial').on('input', filtrarClientes);
    $('.btn-filter').on('click', filtrarClientes);
    $('#clientesTableBody').on('click', '[data-eliminar-cliente]', confirmarEliminacion);
    $('#clientesPagination').on('click', '[data-pagina-url]', cargarPagina);
    $('#btnExportarPdfClientes').on('click', exportarClientesPdf);

    await cargarPaginaInicial();
});

function exportarClientesPdf() {
    const url = `${API_CLIENTES}exportar-pdf/`;
    window.open(url, '_blank');
}

async function cargarPaginaInicial() {
    await cargarPaginaUrl(API_CLIENTES);
}

async function cargarPagina(evento) {
    evento.preventDefault();
    await cargarPaginaUrl($(this).data('pagina-url'));
}

async function cargarPaginaUrl(url) {
    try {
        const pagina = await listarClientesPagina(url);
        clientes = pagina.clientes;
        tamanoPagina = tamanoPagina || clientes.length;
        urlPaginaActual = url;
        renderClientes(clientes);
        renderPaginacion(pagina);
    } catch (error) {
        mostrarErrorCliente(error, 'No se pudieron cargar los clientes.');
    }
}

function filtrarClientes() {
    const termino = $('#searchRazonSocial').val().trim().toLowerCase();
    renderClientes(clientes.filter((cliente) =>
        (cliente.razon_social || '').toLowerCase().includes(termino)
    ));
}

function renderClientes(registros) {
    const filas = registros.map((cliente) => `
        <tr>
            <td>${cliente.documento || ''}</td>
            <td>${cliente.razon_social || ''}</td>
            <td>${cliente.direccion || ''}</td>
            <td>${cliente.celular || ''}</td>
            <td>${cliente.telefono || ''}</td>
            <td>${cliente.habilitado ? 'Sí' : 'No'}</td>
            <td>
                <div class="btn-group">
                    <a class="btn btn-action" title="Editar" href="client-update.html?id=${cliente.id}">
                        <i class="fas fa-edit"></i>
                    </a>
                    <button class="btn btn-action" title="Eliminar" type="button" data-eliminar-cliente="${cliente.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    $('#clientesTableBody').html(filas || '<tr><td colspan="7">No hay clientes registrados.</td></tr>');
}

function renderPaginacion(pagina) {
    const pagination = $('#clientesPagination');
    pagination.empty();

    if (!pagina.count || (!pagina.next && !pagina.previous)) {
        return;
    }

    const paginaActual = obtenerNumeroPagina(urlPaginaActual);
    const totalPaginas = Math.ceil(pagina.count / (tamanoPagina || 1));
    const primeraPagina = totalPaginas > 0 ? construirUrlPagina(urlPaginaActual, 1) : null;
    const ultimaPagina = totalPaginas > 0 ? construirUrlPagina(urlPaginaActual, totalPaginas) : null;

    agregarEnlacePaginacion('Primera', primeraPagina, paginaActual === 1);
    agregarEnlacePaginacion('«', pagina.previous, !pagina.previous);

    for (let numero = 1; numero <= totalPaginas; numero += 1) {
        agregarEnlacePaginacion(String(numero), construirUrlPagina(urlPaginaActual, numero), numero === paginaActual, numero === paginaActual);
    }

    agregarEnlacePaginacion('»', pagina.next, !pagina.next);
    agregarEnlacePaginacion('Última', ultimaPagina, paginaActual === totalPaginas);
}

function agregarEnlacePaginacion(texto, url, deshabilitado, activo = false) {
    const clase = `page-item${deshabilitado ? ' disabled' : ''}${activo ? ' active' : ''}`;
    const atributo = url && !deshabilitado ? `data-pagina-url="${url}" href="${url}"` : '';
    $('#clientesPagination').append(`<li class="${clase}"><a class="page-link" ${atributo}>${texto}</a></li>`);
}

function obtenerNumeroPagina(url) {
    return Number(new URL(url, window.location.origin).searchParams.get('page')) || 1;
}

function construirUrlPagina(url, numero) {
    const paginaUrl = new URL(url, window.location.origin);
    paginaUrl.searchParams.set('page', numero);
    return paginaUrl.toString();
}

async function confirmarEliminacion() {
    const id = $(this).data('eliminar-cliente');
    const resultado = await Swal.fire({
        title: '¿Eliminar cliente?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!resultado.isConfirmed) {
        return;
    }

    try {
        await eliminarCliente(id);
        clientes = clientes.filter((cliente) => String(cliente.id) !== String(id));
        renderClientes(clientes);
        Swal.fire('Eliminado', 'El cliente fue eliminado.', 'success');
    } catch (error) {
        mostrarErrorCliente(error, 'No se pudo eliminar el cliente.');
    }
}

window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});
