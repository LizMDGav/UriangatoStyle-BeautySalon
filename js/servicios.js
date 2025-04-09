// Apartado de servicios
document.addEventListener("DOMContentLoaded", () => {
    const cargarServicios = async (categoria) => {
        try {
            const response = await fetch(`/api/servicios/${categoria}`);
            const data = await response.json();

            const resultado = document.getElementById("grid-container");
            resultado.innerHTML = "";

            data.forEach(s => {
                const descuento =  Number(s.descuento).toFixed(2);
                if (descuento > 0) {
                    console.log("descuentoooooooooo", descuento);
                    // Calcula el precio con descuento
                    const precioOriginal = Number(s.costo).toFixed(2);
                
                    const precioPromocion = (s.costo - (s.costo * descuento / 100)).toFixed(2);
                
                    resultado.innerHTML += `
                        <div class="item">
                            <img src="${s.imagen}" alt="${s.nombre}" />
                            <h3>${s.nombre}</h3>
                            <h4>
                                <span>$${precioOriginal}</span> $${precioPromocion}
                            </h4>
                            <button class="btn-agendar" data-servicio="${s.nombre}">Agendar Cita</button>
                        </div>
                    `;
                } else {
                    resultado.innerHTML += `
                        <div class="item">
                            <img src="${s.imagen}" alt="${s.nombre}" />
                            <h3>${s.nombre}</h3>
                            <h4>$${Number(s.costo).toFixed(2)}</h4>
                            <button class="btn-agendar" data-servicio="${s.nombre}">Agendar Cita</button>
                        </div>
                    `;
                }
            });

            document.querySelectorAll(".btn-agendar").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const servicio = btn.dataset.servicio;

                    try {
                        const res = await fetch("/api/usuarios/sesion");
                        const data = await res.json();

                        if (data.loggedIn && data.tipo === "usuario") {
                            // Usuario válido, redireccionar
                            window.location.href = `AgendarCita?servicio=${encodeURIComponent(servicio)}`;
                        } else if (data.loggedIn && data.tipo === "admin") {
                            alert("Los administradores no pueden agendar citas.");
                        } else {
                            // No logueado
                            window.location.href = "/Login";
                        }
                    } catch (err) {
                        console.error("Error al verificar sesión:", err);
                        alert("Error al verificar sesión.");
                    }
                });
            });


        } catch (error) {
            console.error("Error al obtener los servicios:", error);
        }
    };

    // Agregamos los listeners
    document.getElementById("btncabello").addEventListener("click", () => cargarServicios("cabello"));
    document.getElementById("btnpestañas").addEventListener("click", () => cargarServicios("eyelashes"));
    document.getElementById("btnmaquillaje_peinado").addEventListener("click", () => cargarServicios("maquillaje_peinado"));
    document.getElementById("btnpromociones").addEventListener("click", () => cargarServicios("promociones"));

    // Llamamos automáticamente los servicios de cabello al cargar la página
    cargarServicios("cabello");
});


