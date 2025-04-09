
document.addEventListener("DOMContentLoaded", async () => {
    const navbarContainer = document.getElementById("navbar-container");

    try {
        const response = await fetch("components/navbar.html");
        const html = await response.text();
        navbarContainer.innerHTML = html;

        // Lógica de sesión
        const logoutBtn = document.getElementById("logout-btn");
        const flotantBtn = document.getElementById("flotant-btn");
        const usuarioIcon = document.getElementById("sesion").parentElement;

        try {
            const res = await fetch("/api/usuarios/sesion");
            const data = await res.json();

            if (data.loggedIn) {

                // Checar que el usuario logueado realmente tenga citas activas
                const checarCitas = await fetch("/api/notificaciones");
                const dataCitas = await checarCitas.json();

                if (dataCitas.success && dataCitas.citas 
                    && dataCitas.citas.length > 0 && !localStorage.getItem("notiMostrada")) 
                    {
                        localStorage.setItem("notiMostrada", true);
                        notificacion("Citas programadas.", "Tienes citas activas, ve a tu perfil para verificarlas.", "../images/notificacion.png");
                    }

                document.getElementById("sesion").textContent = `${data.usuario}`;
                usuarioIcon.href = "Perfil";
                logoutBtn.style.display = "block";

                if (flotantBtn?.textContent === "Agendar cita") {
                    flotantBtn.href = "AgendarCita";
                }

                if (data.tipo === "admin") {
                    console.log("Acceso como administrador");
                    flotantBtn.style.display = "none";

                    // Insertar nuevo ícono en el contenedor de iconos
                    const iconosDiv = document.querySelector(".iconos");

                    const adminLink = document.createElement("a");
                    adminLink.href = "/CitasProgramadas";
                    adminLink.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" stroke-linecap="round"
                            stroke-linejoin="round" width="40" height="40" stroke-width="1">
                            <path d="M11.795 21h-6.795a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v4"></path>
                            <path d="M18 18m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"></path>
                            <path d="M15 3v4"></path>
                            <path d="M7 3v4"></path>
                            <path d="M3 11h16"></path>
                            <path d="M18 16.496v1.504l1 1"></path>
                        </svg>
                    `;
                    iconosDiv.insertBefore(adminLink, logoutBtn);

                    const settingsLink = document.createElement("a");
                    settingsLink.href = "/CRUDServicios";
                    settingsLink.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg"
                            width="40" height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1"
                            stroke-linecap="round"
                            stroke-linejoin="round">
                            <path d="M19.875 6.27a2.225 2.225 0 0 1 1.125 1.948v7.284c0 .809 -.443 1.555 -1.158 1.948l-6.75 4.27a2.269 2.269 0 0 1 -2.184 0l-6.75 -4.27a2.225 2.225 0 0 1 -1.158 -1.948v-7.285c0 -.809 .443 -1.554 1.158 -1.947l6.75 -3.98a2.33 2.33 0 0 1 2.25 0l6.75 3.98h-.033z" />
                            <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                        </svg>
                    `;
                    iconosDiv.insertBefore(settingsLink, logoutBtn);
                }

            } else {
                logoutBtn.style.display = "none";
            }

        } catch (error) {
            console.error("Error al verificar sesión:", error);
        }

        if (logoutBtn) {
            logoutBtn.addEventListener("click", async () => {
                await fetch("/api/usuarios/logout", { method: "POST" });
                //location.reload();
                localStorage.removeItem("notiMostrada");
                window.location.href = "/";
            });
        }

    } catch (err) {
        console.error("Error al cargar el navbar:", err);
    }
});

function notificacion(titulo = "Citas programadas.", mensaje = "Tienes citas activas, ve a tu perfil para verificarlas.", icono = "../images/notificacion.png") {
    if (!("Notification" in window)) {
        alert("Este navegador no soporta notificaciones.");
    } else if (Notification.permission === "granted") {
        new Notification(titulo, { body: mensaje, icon: icono });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(titulo, { body: mensaje, icon: icono });
            }
        });
    }
}