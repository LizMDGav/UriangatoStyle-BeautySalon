document.addEventListener("DOMContentLoaded", () => {
    const cargarServicios = async () => {
        try {
            const response = await fetch(`/api/servicios/serviciospopulares`);
            const data = await response.json();

            if (Array.isArray(data)) {
                const resultado = document.getElementById("grid-container");
                resultado.innerHTML = "";  // Limpia el contenedor antes de agregar nuevos elementos

                data.forEach(s => {
                    const descuento = Number(s.descuento).toFixed(2);
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
                    const descuento = Number(s.descuento).toFixed(2);
                    const precioOriginal = Number(s.costo).toFixed(2);
                    const precioPromocion = (s.costo - (s.costo * descuento / 100)).toFixed(2);

                    resultado.innerHTML += `
                        <div class="item">
                            <img src="${s.imagen}" alt="${s.nombre}" />
                            <h3>${s.nombre}</h3>
                            <h4><span>${precioOriginal} </span> ${precioPromocion}</h4>
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