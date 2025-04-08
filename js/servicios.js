// Apartado de servicios
document.addEventListener("DOMContentLoaded", () => {
    const cargarServicios = async (categoria) => {
        try {
            const response = await fetch(`/api/servicios/${categoria}`);
            const data = await response.json();

            const resultado = document.getElementById("grid-container");
            resultado.innerHTML = ""; 

            data.forEach(s => {
                let precioFinal = Number(s.costo);
                let precioFormateado = precioFinal.toFixed(2);

                resultado.innerHTML += `
                    <div class="item">
                        <img src="${s.imagen}" alt="${s.nombre}" />
                        <h3>${s.nombre}</h3>
                        <h4>$${precioFormateado}</h4>
                        <button>Agendar cita</button>
                    </div>
                `;
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


