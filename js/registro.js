document.addEventListener('DOMContentLoaded', function () {
    const formulario = document.getElementById('registroForm');

    // Creamos un contenedor para los mensajes flotantes si no existe en el HTML
    let msgContainer = document.createElement('div');
    msgContainer.id = 'floatingMsg';
    // Estilos para el mensaje flotante (puedes modificarlos en tu CSS)
    msgContainer.style.position = 'fixed';
    msgContainer.style.top = '20px';
    msgContainer.style.left = '50%'; 
    msgContainer.style.transform = 'translateX(-50%)'; 
    msgContainer.style.textAlign = 'center'
    msgContainer.style.padding = '10px 20px';
    msgContainer.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
    msgContainer.style.color = '#fff';
    msgContainer.style.borderRadius = '4px';
    msgContainer.style.fontSize = '14px';
    msgContainer.style.display = 'none';
    msgContainer.style.zIndex = '1000';
    document.body.appendChild(msgContainer);

    // Función para mostrar el mensaje flotante
    function showError(message) {
        msgContainer.textContent = message;
        msgContainer.style.display = 'block';
        // Oculta el mensaje después de 3 segundos
        setTimeout(() => {
            msgContainer.style.display = 'none';
        }, 6000);
    }

    formulario.addEventListener('submit', function (event) {
        event.preventDefault();

        // Recuperación de valores
        const nombre = document.getElementById('nombre').value.trim();
        const apellidos = document.getElementById('apellidos').value.trim();
        const correo = document.getElementById('correo').value.trim();
        const usuario = document.getElementById('usuario').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // 1. Verificar que ningún campo esté vacío
        if (!nombre || !apellidos || !correo || !usuario || !password || !confirmPassword) {
            showError("Todos los campos son obligatorios.");
            return;
        }

        // 2. Validar 'Nombre' y 'Apellidos'
        // Permitir solo letras (incluyendo acentos y ñ) y espacios, entre 2 y 64 caracteres
        const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,64}$/;
        if (!nameRegex.test(nombre)) {
            showError("El nombre debe tener entre 2 y 64 caracteres y no puede contener números ni caracteres especiales.");
            return;
        }
        if (!nameRegex.test(apellidos)) {
            showError("Los apellidos deben tener entre 2 y 64 caracteres y no pueden contener números ni caracteres especiales.");
            return;
        }

        // 3. Validar 'Correo'
        const [localPart] = correo.split('@');
        if (localPart.length < 6) {
            showError("La parte local del correo (antes del @) debe tener al menos 6 caracteres.");
            return;
        }

        // Validación básica para correo: contiene @, extensión y permite números y puntos
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            showError("Ingresa un correo electrónico válido.");
            return;
        }

        // 4. Validar 'Usuario'
        // Permite letras, números, puntos y guiones bajos, entre 8 y 32 caracteres
        const usuarioRegex = /^[A-Za-z0-9._]{8,32}$/;
        if (!usuarioRegex.test(usuario)) {
            showError("El usuario debe tener entre 8 y 32 caracteres y solo puede contener letras, números, puntos y guiones bajos.");
            return;
        }

        // 5. Validar 'Contraseña' y 'Confirmar contraseña'
        if (password.length < 8 || password.length > 32) {
            showError("La contraseña debe tener entre 8 y 32 caracteres.");
            return;
        }
        if (confirmPassword.length < 8 || confirmPassword.length > 32) {
            showError("La confirmación de la contraseña debe tener entre 8 y 32 caracteres.");
            return;
        }
        if (password !== confirmPassword) {
            showError("Las contraseñas no coinciden.");
            return;
        }

        // Si se pasan todas las validaciones, puedes proceder con el envío de datos o la siguiente acción.
        console.log("Formulario validado exitosamente.");
        // Aquí podrías limpiar el formulario, enviar los datos, etc.
        formulario.reset();
    });
});