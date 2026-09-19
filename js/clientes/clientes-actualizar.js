$(document).ready(async function() {
    $('body').bootstrapMaterialDesign();

    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
        mostrarErrorCliente(new Error('Falta el ID del cliente en la URL.'), 'cargar');
        return;
    }

    try {
        cargarFormularioCliente(await obtenerCliente(id));
    } catch (error) {
        mostrarErrorCliente(error, 'No se pudo cargar el cliente.');
    }

    $('#formCliente').on('submit', async function(evento) {
        evento.preventDefault();
        if (!this.checkValidity()) {
            this.reportValidity();
            return;
        }

        try {
            await actualizarCliente(id, obtenerDatosFormularioCliente(this));
            await Swal.fire('Actualizado', 'El cliente fue actualizado correctamente.', 'success');
            window.location.href = 'client-list.html';
        } catch (error) {
            mostrarErrorCliente(error, 'No se pudo actualizar el cliente.');
        }
    });
});

function cargarFormularioCliente(cliente) {
    const datos = normalizarCliente(cliente);
    $('#cliente_documento').val(datos.documento);
    $('#tipo_documento').val(datos.tipo_documento);
    $('#razon_social').val(datos.razon_social);
    $('#cliente_direccion').val(datos.direccion);
    $('#ciudad').val(datos.ciudad);
    $('#cliente_email').val(datos.email);
    $('#cliente_telefono').val(datos.telefono);
    $('#cliente_celular').val(datos.celular);
    $('#habilitado').prop('checked', datos.habilitado);
}

function obtenerDatosFormularioCliente(form) {
    const datos = Object.fromEntries(new FormData(form).entries());
    datos.habilitado = form.habilitado.checked;
    return datos;
}

window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});
