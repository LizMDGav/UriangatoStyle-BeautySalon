
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
                document.getElementById("sesion").textContent = `${data.usuario}`;
                usuarioIcon.href = "perfil.html";
                logoutBtn.style.display = "block";

                if (flotantBtn?.textContent === "Agendar cita") {
                    flotantBtn.href = "agendar_cita.html";
                }

                if (data.tipo === "admin") {
                    console.log("Acceso como administrador");
                    flotantBtn.style.display = "none";

                    // Insertar nuevo ícono en el contenedor de iconos
                    const iconosDiv = document.querySelector(".iconos");

                    const adminLink = document.createElement("a");
                    adminLink.href = "citas_programadas.html";
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
                window.location.href = "index.html";
            });
        }

    } catch (err) {
        console.error("Error al cargar el navbar:", err);
    }
});
