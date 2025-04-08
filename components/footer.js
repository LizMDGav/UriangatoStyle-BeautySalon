
document.addEventListener("DOMContentLoaded", async () => {
    const footerContainer = document.getElementById("footer-container");

    try {
        const response = await fetch("components/footer.html");
        const html = await response.text();
        footerContainer.innerHTML = html;

    } catch (err) {
        console.error("Error al cargar el footer:", err);
    }
});