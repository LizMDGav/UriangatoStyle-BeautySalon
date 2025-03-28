document.addEventListener('DOMContentLoaded', function () {
    const formulario = document.getElementById('registroForm');

    // Función para mostrar el mensaje de error en el <span> correspondiente
    function showFieldError(field, message) {
        const errorElem = field.parentNode.querySelector('.error-message');
        if (errorElem) {
            errorElem.textContent = message;
        }
    }

    // Función para borrar el mensaje de error del <span>
    function clearFieldError(field) {
        const errorElem = field.parentNode.querySelector('.error-message');
        if (errorElem) {
            errorElem.textContent = '';
        }
    }

    // Agregar event listener a cada input para borrar su error al escribir
    const inputs = formulario.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', function () {
            clearFieldError(input);
        });
    });

    formulario.addEventListener('submit', function (event) {
        event.preventDefault();

        // Recuperación de valores y elementos de cada campo
        const nombreField = document.getElementById('nombre');
        const apellidosField = document.getElementById('apellidos');
        const correoField = document.getElementById('correo');
        const usuarioField = document.getElementById('usuario');
        const passwordField = document.getElementById('password');
        const confirmPasswordField = document.getElementById('confirmPassword');

        const nombre = nombreField.value.trim();
        const apellidos = apellidosField.value.trim();
        const correo = correoField.value.trim();
        const usuario = usuarioField.value.trim();
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;

        let error = false;

        // 1. Verificar que ningún campo esté vacío
        if (!nombre) {
            showFieldError(nombreField, "Este campo es obligatorio.");
            error = true;
        }
        if (!apellidos) {
            showFieldError(apellidosField, "Este campo es obligatorio.");
            error = true;
        }
        if (!correo) {
            showFieldError(correoField, "Este campo es obligatorio.");
            error = true;
        }
        if (!usuario) {
            showFieldError(usuarioField, "Este campo es obligatorio.");
            error = true;
        }
        if (!password) {
            showFieldError(passwordField, "Este campo es obligatorio.");
            error = true;
        }
        if (!confirmPassword) {
            showFieldError(confirmPasswordField, "Este campo es obligatorio.");
            error = true;
        }
        if (error) return;

        // 2. Validar 'Nombre' y 'Apellidos'
        // Solo se permiten letras (incluyendo acentos y ñ) y espacios, entre 2 y 64 caracteres
        const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,64}$/;
        if (!nameRegex.test(nombre)) {
            showFieldError(nombreField, "El nombre debe tener entre 2 y 64 caracteres y no puede contener números ni caracteres especiales.");
            error = true;
        }
        if (!nameRegex.test(apellidos)) {
            showFieldError(apellidosField, "Los apellidos deben tener entre 2 y 64 caracteres y no pueden contener números ni caracteres especiales.");
            error = true;
        }

        // 3. Validar 'Correo'
        if (!correo.includes('@')) {
            showFieldError(correoField, "El correo debe contener el símbolo '@'.");
            error = true;
        } else {
            const localPart = correo.split('@')[0];
            if (localPart.length < 6) {
                showFieldError(correoField, "La parte local del correo (antes del @) debe tener al menos 6 caracteres.");
                error = true;
            }
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            showFieldError(correoField, "Ingresa un correo electrónico válido.");
            error = true;
        }

        // 4. Validar 'Usuario'
        // Se permiten letras, números, puntos y guiones bajos, entre 8 y 32 caracteres
        const usuarioRegex = /^[A-Za-z0-9._]{8,32}$/;
        if (!usuarioRegex.test(usuario)) {
            showFieldError(usuarioField, "El usuario debe tener entre 8 y 32 caracteres y solo puede contener letras, números, puntos y guiones bajos.");
            error = true;
        }

        // 5. Validar 'Contraseña' y 'Confirmar contraseña'
        if (password.length < 8 || password.length > 32) {
            showFieldError(passwordField, "La contraseña debe tener entre 8 y 32 caracteres.");
            error = true;
        }
        if (confirmPassword.length < 8 || confirmPassword.length > 32) {
            showFieldError(confirmPasswordField, "La confirmación de la contraseña debe tener entre 8 y 32 caracteres.");
            error = true;
        }
        if (password !== confirmPassword) {
            showFieldError(confirmPasswordField, "Las contraseñas no coinciden.");
            error = true;
        }

        if (error) return;

        // Si todas las validaciones son correctas
        console.log("Formulario validado exitosamente.");
        
        /////////////////// Envío a la base de datos ///////////////////
        
        const nombreCompleto = `${nombre} ${apellidos}`;

        async function registrarUsuario(nombreCompleto, correo_electronico, usuario, password) {
            try {
                const response = await fetch("/api/usuarios/registro", {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({ 
                        nombreCompleto, 
                        correo_electronico, 
                        usuario, 
                        password 
                    }),
                });
        
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || "Error en el servidor");
                }
        
                if (data.success) {
                    alert("Usuario registrado exitosamente");
                    
                    window.location.href = "/Login";
                } else {
                    alert(data.message || "Error al registrar usuario");
                }
            } catch (error) {
                console.error("Error completo:", error);
                
                if (error.message.includes('Failed to fetch')) {
                    alert("No se pudo conectar al servidor");
                } else {
                    alert(error.message || "Ocurrió un error al registrar el usuario");
                }
            }
        }


        registrarUsuario(nombreCompleto, correo, usuario, password);
        

        formulario.reset();
    });
    
});
