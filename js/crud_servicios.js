// CRUD servicios

$(document).ready(function() {
    // Cargar servicios al iniciar
    cargarServicios();

    // Función para cargar servicios
    function cargarServicios() {
        $.ajax({
            url: '/api/servicios',
            type: 'GET',
            success: function(response) {
                if (response.success) {
                    mostrarServicios(response.servicios);
                    console.log("si cargaron canitas")
                } else {
                    alert('Error al cargar servicios: ' + response.message);
                    console.log("No cargaron canitas :c")
                }
            },
            error: function(xhr) {
                alert('Error al conectar con el servidor');
                console.error(xhr.responseText);
                console.log("Problema con el servidor")
            }
        });
    }

    // Función para renderizar servicios en la tabla
    function mostrarServicios(servicios) {
        const tbody = $('table tbody');
        tbody.empty();

        servicios.forEach((servicio, index) => {
            const row = `
                <tr>
                    <td>
                        <span class="custom-checkbox">
                            <input type="checkbox" id="checkbox${index}" name="options[]" value="${servicio.id}">
                            <label for="checkbox${index}"></label>
                        </span>
                    </td>
                    <td>${servicio.id}</td>
                    <td>${servicio.nombre}</td>
                    <td>${servicio.descripcion || ''}</td>
                    <td>$${servicio.costo}</td>
                    <td>${servicio.descuento || 0}%</td>
                    <td><img src="${servicio.imagen}" width="50"></td>
                    <td>${servicio.categoria}</td>
                    <td>
                        <a href="#editServiceModal" class="edit" data-toggle="modal" data-id="${servicio.id}">
                            <i class="material-icons" data-toggle="tooltip" title="Edit">&#xE254;</i>
                        </a>
                        <a href="#deleteServiceModal" class="delete" data-toggle="modal" data-id="${servicio.id}">
                            <i class="material-icons" data-toggle="tooltip" title="Delete">&#xE872;</i>
                        </a>
                    </td>
                </tr>
            `;
            tbody.append(row);
        });

        // Inicializar tooltips
        $('[data-toggle="tooltip"]').tooltip();
    }

    // Manejar clic en botón Añadir
    $('#addServiceModal form').submit(function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const nombre = $('#addServiceModal input[name="nombre"]').val();
        if (!nombre) {
            alert('El nombre del servicio es requerido');
            return;
        }

        const formDataObj = {};
        for (let [key, value] of formData.entries()) {
            formDataObj[key] = value;
        }
        console.log("Datos a enviar al servidor:", formDataObj);


        $.ajax({
            url: '/api/servicios/agregar',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    $('#addServiceModal').modal('hide');
                    cargarServicios();
                    this.reset();
                }
            }.bind(this),
            error: function(xhr) {
                alert('Error al agregar servicio: ' + xhr.responseJSON?.message);
            }
        });
    });

    // Manejar clic en botón Editar
    $(document).on('click', '.edit', function() {
        const id = $(this).data('id');
        
        $.get('/api/servicios', function(response) {
            if (response.success) {
                const servicio = response.servicios.find(s => s.id == id);
                if (servicio) {
                    $('#editServiceModal input[name="nombre"]').val(servicio.nombre);
                    $('#editServiceModal textarea[name="descripcion"]').val(servicio.descripcion);
                    $('#editServiceModal input[name="costo"]').val(servicio.costo);
                    $('#editServiceModal input[name="descuento"]').val(servicio.descuento || 0);
                    $('#editServiceModal select[name="categoria"]').val(servicio.categoria);
                    $('#editServiceModal').data('id', id);
                }
            }
        });
    });

    // Manejar envío de formulario de edición
    $('#editServiceModal form').submit(function(e) {
        e.preventDefault();
        
        const id = $('#editServiceModal').data('id');
        const formData = new FormData(this);
        
        // Validar campos requeridos antes de enviar
        const nombre = $('#editServiceModal input[name="nombre"]').val();
        if (!nombre) {
            alert('El nombre del servicio es requerido');
            return;
        }
    
        // Agregar el ID al FormData
        formData.append('id', id);
    
        // Mostrar datos que se enviarán (para depuración)
        const formDataObj = {};
        for (let [key, value] of formData.entries()) {
            formDataObj[key] = value;
        }
        console.log("Datos a enviar al servidor:", formDataObj);
    
        $.ajax({
            url: `/api/servicios/editar/${id}`,
            type: 'PUT',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                console.log("Respuesta del servidor:", response);
                $('#editServiceModal').modal('hide');
                cargarServicios();
            },
            error: function(xhr) {
                console.error("Error en la solicitud:", {
                    status: xhr.status,
                    response: xhr.responseJSON,
                    statusText: xhr.statusText
                });
                alert(`Error al actualizar servicio: ${xhr.responseJSON?.message || xhr.statusText}`);
            }
        });
    });

    // Manejar clic en botón Eliminar
    $(document).on('click', '.delete', function() {
        const id = $(this).data('id');
        $('#deleteServiceModal').data('id', id);
    });

    // Confirmar eliminación
    $('#deleteServiceModal form').submit(function(e) {
        e.preventDefault();
        
        const id = $('#deleteServiceModal').data('id');
        
        $.ajax({
            url: `/api/servicios/eliminar/${id}`,
            type: 'DELETE',
            success: function(response) {
                if (response.success) {
                    $('#deleteServiceModal').modal('hide');
                    cargarServicios();
                }
            },
            error: function(xhr) {
                alert('Error al eliminar servicio: ' + xhr.responseJSON?.message);
            }
        });
    });

    // Selección múltiple
    $('#selectAll').click(function() {
        $('table tbody input[type="checkbox"]').prop('checked', this.checked);
    });
});
