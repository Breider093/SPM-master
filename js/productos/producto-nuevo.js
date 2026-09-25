const API_BASE = '/api';

$(document).ready(function() {
    $('body').bootstrapMaterialDesign();
    cargarTiposProducto();

    $('#formProducto').on('submit', function(e) {
        e.preventDefault();

        const form = this;
        const descripcion = $('#descripcion').val().trim();
        const tipoProducto = $('#tipo_producto').val();
        const peso = $('#peso').val();
        const precioAlquiler = $('#precio_alquiler').val();
        const precioReposicion = $('#precio_reposicion').val();

        if (!descripcion || !tipoProducto || !peso || !precioAlquiler || !precioReposicion) {
            Swal.fire({
                icon: 'error',
                title: 'Campos Incompletos',
                text: 'Por favor complete todos los campos requeridos'
            });
            return;
        }

        const formData = new FormData(form);
        formData.append('habilitado', 'true');

        fetch(`${API_BASE}/productos/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: formData
        })
            .then(async (response) => {
                const responseData = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(JSON.stringify(responseData));
                }

                return responseData;
            })
            .then(() => {
                Swal.fire({
                    icon: 'success',
                    title: '¡Éxito!',
                    text: 'Producto registrado correctamente',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    form.reset();
                    $('.custom-file-label').html('Seleccionar archivo');
                });
            })
            .catch((error) => {
                console.error('Error al crear producto:', error);

                let errorMessage = 'No se pudo registrar el producto. Revisa la conexión con el servidor.';
                try {
                    const errors = JSON.parse(error.message);
                    errorMessage = Object.entries(errors)
                        .map(([field, messages]) => `<strong>${field}:</strong> ${[].concat(messages).join(', ')}`)
                        .join('<br>');
                } catch (parseError) {
                    console.error('Respuesta de error no válida:', parseError);
                }

                Swal.fire({
                    icon: 'error',
                    title: 'Error al crear producto',
                    html: `<div style="text-align: left; white-space: pre-wrap;">${errorMessage}</div>`
                });
            });
    });

    $('.custom-file-input').on('change', function() {
        const fileName = $(this).val().split('\\').pop();
        $(this).next('.custom-file-label').html(fileName || 'Seleccionar archivo');
    });

    $('button[type="reset"]').click(function(e) {
        e.preventDefault();
        Swal.fire({
            title: '¿Estás seguro?',
            text: 'Se borrarán todos los datos ingresados',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, limpiar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                $('#formProducto')[0].reset();
                $('.custom-file-label').html('Seleccionar archivo');
                Swal.fire(
                    '¡Limpiado!',
                    'El formulario ha sido limpiado.',
                    'success'
                );
            }
        });
    });
});

function cargarTiposProducto() {
    fetch(`${API_BASE}/tipos-producto/`)
        .then((response) => {
            if (!response.ok) {
                throw new Error('No se pudieron cargar los tipos de producto.');
            }
            return response.json();
        })
        .then((data) => {
            const tipos = Array.isArray(data) ? data : data.results || [];
            const select = document.getElementById('tipo_producto');

            tipos.forEach((tipo) => {
                select.add(new Option(tipo.nombre, tipo.id));
            });
        })
        .catch((error) => {
            console.error('Error al cargar tipos de producto:', error);
            Swal.fire('Error', error.message, 'error');
        });
}

function getCookie(name) {
    const cookies = document.cookie ? document.cookie.split(';') : [];

    for (const cookie of cookies) {
        const trimmedCookie = cookie.trim();
        if (trimmedCookie.startsWith(`${name}=`)) {
            return decodeURIComponent(trimmedCookie.substring(name.length + 1));
        }
    }

    return '';
}

window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});
