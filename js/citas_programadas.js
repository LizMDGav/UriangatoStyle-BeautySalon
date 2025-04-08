document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector(".appointments-list");

    // Verificar sesión de admin
    try {
        const sesionRes = await fetch("/api/usuarios/sesion");
        const sesion = await sesionRes.json();
        if (!sesion.loggedIn || sesion.tipo !== "admin") {
            window.location.href = "/index.html";
            return;
        }
    } catch (err) {
        console.error("Error al verificar sesión:", err);
        return;
    }

    // Obtener citas
    try {
        const res = await fetch("/api/citas");
        const data = await res.json();

        if (!data.success || !Array.isArray(data.citas)) {
            container.innerHTML = "<p>No se pudieron cargar las citas.</p>";
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

        container.innerHTML = ""; // Limpiar contenido

        let toggleId = 1;
        for (const fecha in citasPorFecha) {
            const section = document.createElement("div");
            section.classList.add("date-section");
            section.innerHTML = `<h4>${fecha}</h4>`;

            citasPorFecha[fecha].forEach(cita => {
                const card = document.createElement("div");
                card.classList.add("appointment-card");

                const toggle = `toggle-${toggleId++}`;
                const inputToggle = `<input type="checkbox" id="${toggle}" class="toggle-input">`;

                const summary = `
                    <div class="appointment-summary">
                        <div class="summary-left">
                            <span class="time">${cita.hora.substring(0, 5)}</span>
                            <span class="service">${cita.servicio}</span>
                        </div>
                        <div class="summary-right">
                            <span class="price">$${parseFloat(cita.costo).toLocaleString()}</span>
                            <label for="${toggle}" class="toggle-details-btn"></label>
                        </div>
                    </div>
                `;

                const details = document.createElement("div");
                details.classList.add("appointment-details");
                details.innerHTML = `
                    <div class="details-data">
                        <p><strong>Usuario:</strong> ${cita.usuario}</p>
                        <p><strong>Nombre completo:</strong> ${cita.nombre_completo}</p>
                        <p><strong>Teléfono:</strong> ${cita.telefono}</p>
                        <p><strong>Correo:</strong> ${cita.correo}</p>
                        ${cita.domicilio ? `<p><strong>Domicilio:</strong> ${cita.domicilio}</p>` : ""}
                    </div>
                    <div class="details-buttons">
                        <button class="cancel-btn">Cancelar cita</button>
                    </div>
                `;

                // Cancelar cita: evento click
                details.querySelector(".cancel-btn").addEventListener("click", async () => {
                    if (!confirm("¿Estás seguro de cancelar esta cita?")) return;

                    try {
                        const res = await fetch(`/api/citas/${cita.id}`, {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ status: "Cancelada" })
                        });

                        const result = await res.json();

                        if (result.success) {
                            alert("Cita cancelada correctamente.");
                            card.remove(); // Eliminar del DOM
                        } else {
                            alert("No se pudo cancelar la cita.");
                        }
                    } catch (error) {
                        console.error("Error al cancelar cita:", error);
                        alert("Ocurrió un error al cancelar la cita.");
                    }
                });

                card.innerHTML = `${inputToggle}${summary}`;
                card.appendChild(details);
                section.appendChild(card);
            });

            container.appendChild(section);
        }

    } catch (err) {
        console.error("Error al cargar citas:", err);
        container.innerHTML = "<p>Error al obtener las citas del servidor.</p>";
    }
});
