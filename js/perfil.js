document.addEventListener("DOMContentLoaded", async () => {
    const form = document.querySelector("form");
    const section = document.querySelector(".appointments-section");

    const showError = (input, msg) => {
        const span = input.parentNode.querySelector(".error-message");
        if (span) span.textContent = msg;
    };

    const clearError = input => {
        const span = input.parentNode.querySelector(".error-message");
        if (span) span.textContent = "";
    };

    form.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", () => clearError(input));
    });

    // Precargar datos del perfil
    try {
        const res = await fetch("/api/usuarios/perfil");
        const result = await res.json();

        if (result.success) {
            const { nombre, apellido, telefono, correo_electronico, usuario } = result.data;
            document.getElementById("nombre").value = nombre;
            document.getElementById("apellidos").value = apellido;
            document.getElementById("telefono").value = telefono.trim();
            document.getElementById("email").value = correo_electronico;
            document.getElementById("usuario").value = usuario;
        } else {
            window.location.href = "/index.html";
            form.reset();
        }
    } catch (err) {
        console.error("Error al cargar perfil:", err);
    }

    // Precargar citas del usuario (no admins)
    try {
        const sesion = await fetch("/api/usuarios/sesion");
        const { tipo } = await sesion.json();

        if (tipo !== "usuario") {
            section.style.display = "none";
            return;
        }

        const response = await fetch("/api/citas");
        const data = await response.json();

        if (!data.success) {
            section.innerHTML += "<p>No se pudieron cargar las citas.</p>";
            return;
        }

        const citasPorFecha = {};
        data.citas.forEach(cita => {
            const fecha = new Date(cita.fecha).toLocaleDateString("es-MX", {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });

            if (!citasPorFecha[fecha]) citasPorFecha[fecha] = [];
            citasPorFecha[fecha].push(cita);
        });

        section.innerHTML = `<h3>Citas programadas</h3>`;

        for (const fecha in citasPorFecha) {
            const divFecha = document.createElement("div");
            divFecha.classList.add("date-section");
            divFecha.innerHTML = `<h4>${fecha}</h4>`;

            citasPorFecha[fecha].forEach(cita => {
                const divCita = document.createElement("div");
                divCita.classList.add("appointment-row");

                divCita.innerHTML = `
                    <span class="time">${cita.hora.substring(0, 5)}</span>
                    <span class="service">${cita.servicio}</span>
                    <span class="price">$${parseFloat(cita.costo).toLocaleString()}</span>
                `;
                divFecha.appendChild(divCita);
            });

            section.appendChild(divFecha);
        }

    } catch (err) {
        console.error("Error al cargar citas:", err);
        section.innerHTML += "<p>Error al cargar las citas.</p>";
    }

    // Validación y envío del formulario
    form.addEventListener("submit", async e => {
        e.preventDefault();

        const nombreField = document.getElementById("nombre");
        const apellidosField = document.getElementById("apellidos");
        const telefonoField = document.getElementById("telefono");
        const emailField = document.getElementById("email");
        const passActualField = document.getElementById("password");
        const nuevaPassField = document.getElementById("nuevaContrasena");
        const confirmarPassField = document.getElementById("confirmarContrasena");

        const nombre = nombreField.value.trim();
        const apellidos = apellidosField.value.trim();
        const telefono = telefonoField.value.trim();
        const correo = emailField.value.trim();
        const passActual = passActualField.value;
        const nuevaPass = nuevaPassField.value;
        const confirmarPass = confirmarPassField.value;

        let error = false;

        const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{2,64}$/;
        if (!nameRegex.test(nombre)) {
            showError(nombreField, "El nombre debe tener entre 2 y 64 letras.");
            error = true;
        }
        if (!nameRegex.test(apellidos)) {
            showError(apellidosField, "Los apellidos deben tener entre 2 y 64 letras.");
            error = true;
        }

        if (telefono && !/^\d{10}$/.test(telefono)) {
            showError(telefonoField, "El teléfono debe tener exactamente 10 dígitos.");
            error = true;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!correo.includes('@') || correo.split('@')[0].length < 6) {
            showError(emailField, "Correo inválido.");
            error = true;
        } else if (!emailRegex.test(correo)) {
            showError(emailField, "Ingresa un correo electrónico válido.");
            error = true;
        }

        if (nuevaPass || confirmarPass) {
            if (!passActual) {
                showError(passActualField, "Debes ingresar tu contraseña actual.");
                error = true;
            }

            if (nuevaPass.length < 8 || nuevaPass.length > 32) {
                showError(nuevaPassField, "Debe tener entre 8 y 32 caracteres.");
                error = true;
            }

            if (nuevaPass !== confirmarPass) {
                showError(confirmarPassField, "Las contraseñas no coinciden.");
                error = true;
            }
        }

        if (error) return;

        try {
            const response = await fetch("/api/usuarios/perfil", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre,
                    apellidos,
                    telefono,
                    correo_electronico: correo,
                    password_actual: passActual,
                    nueva_password: nuevaPass
                })
            });

            const data = await response.json();
            if (data.success) {
                alert("Perfil actualizado correctamente.");
                location.reload();
            } else {
                alert(data.message || "No se pudo actualizar el perfil.");
            }
        } catch (err) {
            console.error("Error al actualizar perfil:", err);
            alert("Error al guardar los cambios.");
        }
    });
});
