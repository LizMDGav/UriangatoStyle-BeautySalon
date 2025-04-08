document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');
    const usuarioField = document.getElementById('usuario');
    const passwordField = document.getElementById('password');
    const errorSpan = document.querySelector('.error-message');

    // Limpiar el mensaje de error al escribir en cualquiera de los campos
    usuarioField.addEventListener('input', () => errorSpan.textContent = "");
    passwordField.addEventListener('input', () => errorSpan.textContent = "");

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const usuario = usuarioField.value.trim();
        const password = passwordField.value;

        let error = false;

        // Verificar que ningún campo esté vacío
        if (!usuario || !password) {
            error = true;
        }

        // Validar 'Usuario'
        // Debe tener entre 8 y 32 caracteres y solo puede contener letras, números, puntos y guiones bajos
        const usuarioRegex = /^[A-Za-z0-9._]{8,32}$/;
        if (!usuarioRegex.test(usuario)) {
            error = true;
        }

        // Validar 'Contraseña'
        // Debe tener entre 8 y 32 caracteres
        if (password.length < 8 || password.length > 32) {
            error = true;
        }

        if (error) {
            errorSpan.textContent = "Usuario y/o contraseña incorrecto";
            return;
        }

        // Si las validaciones son correctas, procede con la acción deseada (por ejemplo, enviar el formulario)
        /*console.log("Formulario validado exitosamente.");
        form.reset();
        errorSpan.textContent = "";*/




        /////////////////// Validar con la base de datos //////////////////////

        async function handleLogin() {
            const usuario = usuarioField.value.trim();
            const password = passwordField.value;

            if (!usuario || !password) {
                errorSpan.textContent = "Usuario y contraseña son obligatorios";
                return;
            }

            try {
                const response = await fetch("/api/usuarios/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        usuario,
                        password
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Error en la autenticación");
                }

                if (data.success) {
                    window.location.href = "/";
                    form.reset();
                } else {
                    errorSpan.textContent = data.message || "Credenciales incorrectas";
                }

            } catch (error) {
                console.error("Error en login:", error);
                errorSpan.textContent = error.message || "Error al conectar con el servidor";
            }
        }

        handleLogin()

    });
});
