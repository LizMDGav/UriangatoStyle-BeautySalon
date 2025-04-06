document.addEventListener("DOMContentLoaded", async () => {
    const form = document.querySelector("form");
    const selectServicio = document.getElementById("servicio");
    const inputCosto = document.getElementById("verCosto");
    const horaSelect = document.getElementById("hora");

    const clearError = input => {
        const span = input.parentNode.querySelector(".error-message");
        if (span) span.textContent = "";
    };

    // Limpiar errores al escribir
    form.querySelectorAll("input").forEach(input => {
        input.addEventListener("input", () => clearError(input));
    });

    // Precargar datos del usuario
    try {
        const res = await fetch("/api/usuarios/perfil");
        const result = await res.json();

        if (result.success) {
            const { nombre, apellido, telefono, correo_electronico, usuario } = result.data;
            document.getElementById("nombre").value = nombre;
            document.getElementById("apellidos").value = apellido;
            document.getElementById("telefono").value = telefono.trim();
            document.getElementById("correo").value = correo_electronico;
            document.getElementById("usuario").value = usuario;
        }
    } catch (err) {
        console.error("Error al cargar datos:", err);
    }

    // Precargar datos de los servicios
    try {
        const response = await fetch("/api/servicios");
        const data = await response.json();

        if (data.success) {
            data.servicios.forEach(servicio => {
                const option = document.createElement("option");
                option.value = servicio.costo;
                option.textContent = servicio.nombre;
                selectServicio.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Error cargando servicios:", error);
    }

    // Escuchar cambios en el select para mostrar el costo
    selectServicio.addEventListener("change", () => {
        const costo = selectServicio.value;
        inputCosto.value = `$ ${parseFloat(costo).toFixed(2)}`;
    });

    for (let hora = 9; hora <= 19; hora++) {
        const horaTexto = `${hora.toString().padStart(2, "0")}:00`;
        const option = document.createElement("option");
        option.value = horaTexto;
        option.textContent = horaTexto;
        horaSelect.appendChild(option);
    }
});
async function validarFormulario() {
    event.preventDefault(); // evita que se envíe el formulario

    // Limpiar mensajes de error
    document.querySelectorAll('.error-message').forEach(span => span.textContent = '');

    let valido = true;

    const correo = document.getElementById('correo').value;
    const telefono = document.getElementById('telefono').value;
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora');
    const servicio = document.getElementById('servicio');
    const domicilio = document.getElementById('domicilio').value;

    if (correo.trim() === '' || !correo.includes('@')) {
        correo.nextElementSibling.textContent = 'Ingresa un correo válido.';
        valido = false;
    }

    if (telefono.trim() === '' || !/^\d{10}$/.test(telefono.trim())) {
        telefono.nextElementSibling.textContent = 'El teléfono debe ser de 10 digitos.';
        valido = false;
    }

    if (fecha === '') {
        fecha.nextElementSibling.textContent = 'Selecciona una fecha valida.';
        valido = false;
    }

    if (hora.value === '') {
        hora.nextElementSibling.textContent = 'Selecciona una hora.';
        valido = false;
    }

    if (servicio.value === '') {
        servicio.nextElementSibling.textContent = 'Selecciona un servicio.';
        valido = false;
    }

    if (valido) {
        const servicioSelect = document.getElementById("servicio");
        const horaSelect = document.getElementById("hora");
    
        const servicio = servicioSelect.options[servicioSelect.selectedIndex].text;
        const costo = servicioSelect.value;
        const hora = horaSelect.value;
    
        try {
            const response = await fetch("/api/citas/agendar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    servicio,
                    telefono,
                    correo,
                    fecha,
                    hora,
                    costo,
                    domicilio
                })
            });
    
            const data = await response.json();
    
            if (data.success) {
                alert("Cita agendada correctamente.");
                location.reload();
            } else {
                alert(data.message || "No se pudo agendar la cita.");
            }
        } catch (err) {
            console.error("Error al crear la cita:", err);
            alert("Error al crear la cita.");
        }
    }
}