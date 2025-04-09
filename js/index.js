document.addEventListener("DOMContentLoaded", () => {
    const cargarServicios = async () => {
        try {
            const response = await fetch(`/api/servicios/serviciospopulares`);
            const data = await response.json();

            if (Array.isArray(data)) {
                const resultado = document.getElementById("grid-container");
                resultado.innerHTML = "";  // Limpia el contenedor antes de agregar nuevos elementos

                data.forEach(s => {
                    let precioFinal = Number(s.costo);
                    let precioFormateado = precioFinal.toFixed(2);  // Formatea el precio con 2 decimales

                    resultado.innerHTML += `
                        <div class="item">
                            <img src="${s.imagen}" alt="${s.nombre}" />
                            <h3>${s.nombre}</h3>
                            <h4>$${precioFormateado}</h4>
                            <button>Agendar cita</button>
                        </div>
                    `;
                });
            } else {
                console.error("Los datos no son un array:", data);
            }
        } catch (error) {
            console.error("Error al obtener los servicios:", error);
        }
    };

    const cargarPromociones = async () => {
        try {
            const response = await fetch(`/api/servicios/promociones`);
            const data = await response.json();
            console.log(data);  // Verifica qué datos estás recibiendo

            if (Array.isArray(data)) {
                const resultado = document.getElementById("grid-containerprom");
                resultado.innerHTML = "";  // Limpia el contenedor antes de agregar nuevos elementos

                data.forEach(s => {
                    let precioFinal = Number(s.costo);
                    let precioFormateado = precioFinal.toFixed(2);  // Formatea el precio con 2 decimales

                    resultado.innerHTML += `
                        <div class="item">
                            <img src="${s.imagen}" alt="${s.nombre}" />
                            <h3>${s.nombre}</h3>
                            <h4><span>${precioFinal} </span> ${precioFormateado}</h4>
                            <button>Agendar cita</button>
                        </div>
                    `;
                });
            } else {
                console.error("Los datos no son un array:", data);
            }
        } catch (error) {
            console.error("Error al obtener los servicios:", error);
        }
    };

    cargarServicios();
    cargarPromociones();
});