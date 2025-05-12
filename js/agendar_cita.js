import { generarTicketPDF } from "./generar_ticket.js";

document.addEventListener("DOMContentLoaded", async () => {
    
    //Si es un admin no dejar hacer nada
    try {
        const res = await fetch("/api/usuarios/sesion");
        const data = await res.json();

        if (data.tipo === "admin") {
            window.location.href = "/";
            form.reset();
        }
    } catch (err) {
        console.error("Error al verificar sesión:", err);
    }

    const form = document.querySelector("form");
    const selectServicio = document.getElementById("servicio");
    const inputCosto = document.getElementById("verCosto");
    const horaSelect = document.getElementById("hora");
    const fechaInput = document.getElementById("fecha");

    const today = new Date().toISOString().split("T")[0];
    document.getElementById("fecha").setAttribute("min", today);

    const showError = (input, msg) => {
        const span = input.parentNode.querySelector(".error-message");
        if (span) span.textContent = msg;
    };

    const clearError = input => {
        const span = input.parentNode.querySelector(".error-message");
        if (span) span.textContent = "";
    };

    form.querySelectorAll("input, select").forEach(input => {
        input.addEventListener("input", () => clearError(input));
        input.addEventListener("change", () => clearError(input));
    });

    // Cargar datos del perfil
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
        } else {
            window.location.href = "/Login";
            form.reset();
        }
    } catch (err) {
        console.error("Error al cargar datos:", err);
    }

    // Cargar servicios
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

    // Mostrar costo al cambiar servicio
    selectServicio.addEventListener("change", () => {
        const costo = selectServicio.value;
        inputCosto.value = `$ ${parseFloat(costo).toFixed(2)}`;
    });

    // Rellenar todas las horas disponibles inicialmente (08:00 a 19:00)
    const generarHoras = () => {
        horaSelect.innerHTML = '<option value="">Selecciona una hora</option>';
        for (let h = 8; h <= 19; h++) {
            const hora = `${h.toString().padStart(2, '0')}:00`;
            const option = document.createElement("option");
            option.value = hora;
            option.textContent = hora;
            horaSelect.appendChild(option);
        }
    };
    generarHoras();

    // Deshabilitar horas ocupadas al seleccionar fecha
    fechaInput.addEventListener("change", async () => {
        generarHoras(); // Reinicia todas las opciones
        const fechaSeleccionada = fechaInput.value;
        console.log(fechaSeleccionada);
        if (!fechaSeleccionada) return;

        try {
            const res = await fetch(`/api/citas/ocupadas?fecha=${fechaSeleccionada}`);
            const data = await res.json();

            if (data.success && Array.isArray(data.horas)) {
                data.horas.forEach(hora => {
                    const horaSinSegundos = hora.substring(0, 5);
                    const opcion = [...horaSelect.options].find(opt => opt.value === horaSinSegundos);
                    if (opcion) horaSelect.removeChild(opcion);
                });
            }

            console.log(data.horas);
        } catch (error) {
            console.error("Error al obtener horas ocupadas:", error);
        }
    });

    // Envío del formulario
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        let error = false;
        const correo = document.getElementById("correo");
        const telefono = document.getElementById("telefono");
        const fecha = document.getElementById("fecha");
        const hora = document.getElementById("hora");
        const servicio = document.getElementById("servicio");
        const domicilio = document.getElementById("domicilio");

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(correo.value.trim())) {
            showError(correo, "Ingresa un correo válido.");
            error = true;
        }

        if (!/^\d{10}$/.test(telefono.value.trim())) {
            showError(telefono, "El teléfono debe tener 10 dígitos.");
            error = true;
        }

        if (!fecha.value) {
            showError(fecha, "Selecciona una fecha válida.");
            error = true;
        }
        /*fechaInput.addEventListener("change", () => {
            const seleccionada = new Date(fechaInput.value);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
        
            if (seleccionada < hoy) {
                showError(fecha, "Selecciona una fecha válida.");
                fechaInput.value = "";
            }
        });*/

        if (!hora.value) {
            showError(hora, "Selecciona una hora.");
            error = true;
        }

        if (!servicio.value) {
            showError(servicio, "Selecciona un servicio.");
            error = true;
        }

        if (error) return;

        const servicioText = servicio.options[servicio.selectedIndex].text;
        const costo = servicio.value;

        try {
            const response = await fetch("/api/citas/agendar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    servicio: servicioText,
                    telefono: telefono.value.trim(),
                    correo: correo.value.trim(),
                    fecha: fecha.value,
                    hora: hora.value,
                    costo,
                    domicilio: domicilio.value.trim()
                })
            });

            const data = await response.json();
            const idCita = data.id;

            if (data.success) {
                const fechaBonita = formatearFechaSegura(fechaInput.value);
                generarTicketPDF(
                    idCita,
                    servicioText,
                    fechaBonita,
                    hora.value,
                    costo,
                );
                alert("Cita agendada correctamente.");
                location.reload();
            } else {
                alert(data.message || "No se pudo agendar la cita.");
            }
        } catch (err) {
            console.error("Error al agendar cita:", err);
            alert("Hubo un error al agendar la cita.");
        }
    });

    // Seleccionar automáticamente el servicio si viene en la URL
    const params = new URLSearchParams(window.location.search);
    const servicioURL = params.get("servicio");

    if (servicioURL) {
        const opcion = [...selectServicio.options].find(opt => opt.textContent === servicioURL);
        if (opcion) {
            opcion.selected = true;
            inputCosto.value = `$ ${parseFloat(opcion.value).toFixed(2)}`;
        }
    }

});

function formatearFechaSegura(fechaStr) {
    const [año, mes, dia] = fechaStr.split("-");
    const meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    return `${dia} de ${meses[parseInt(mes, 10) - 1]} de ${año}`;
}