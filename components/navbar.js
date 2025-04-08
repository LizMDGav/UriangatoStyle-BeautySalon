
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

                if (flotantBtn.textContent == "Agendar cita") {
                    flotantBtn.href = "AgendarCita";
                }

                logoutBtn.style.display = "block";

                if (data.tipo === "admin") {
                    console.log("Acceso como administrador");
                    // Mostrar opciones especiales en tu navbar
                    flotantBtn.style.display = "none";
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
                window.location.href = "/";
            });
        }

    } catch (err) {
        console.error("Error al cargar el navbar:", err);
    }
});