$(document).ready(function() {
    $('body').bootstrapMaterialDesign();

    $('#formCliente').on('submit', async function(evento) {
        evento.preventDefault();
        const form = this;
        const datos = obtenerDatosFormularioCliente(form);

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        try {
            const cliente = await crearCliente(datos);
            await subirDocumentosSeleccionados(cliente.id);
            await Swal.fire('Cliente creado', 'El cliente fue registrado correctamente.', 'success');
            form.reset();
            $('.custom-file-label').html('Ningún archivo seleccionado');
        } catch (error) {
            mostrarErrorCliente(error, 'No se pudo crear el cliente.');
        }
    });

    $('.custom-file-input').on('change', function() {
        const nombre = this.files[0]?.name || 'Ningún archivo seleccionado';
        $(this).next('.custom-file-label').html(nombre);
    });
});

function obtenerDatosFormularioCliente(form) {
    const datos = Object.fromEntries(new FormData(form).entries());
    delete datos.rut;
    delete datos.cedula_repr;
    delete datos.contrato_alquiler;
    delete datos.camara_comercio;
    delete datos.certificado_bancario;
    datos.tipo_documento = (datos.tipo_documento || '').toUpperCase();
    datos.habilitado = form.habilitado.checked;
    return datos;
}

async function subirDocumentosSeleccionados(clienteId) {
    const tipos = ['rut', 'cedula_repr', 'contrato_alquiler', 'camara_comercio', 'certificado_bancario'];
    const cargas = tipos
        .map((tipo) => ({ tipo, archivo: document.getElementById(tipo).files[0] }))
        .filter(({ archivo }) => archivo)
        .map(({ tipo, archivo }) => subirDocumento(clienteId, tipo, archivo));

    await Promise.all(cargas);
}

window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});
