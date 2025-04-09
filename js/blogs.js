let blogIdToDelete = null
document.addEventListener("DOMContentLoaded", () => {
    // Verificar si el usuario está logueado y es administrador
    checkUserSession()

    // Configurar eventos para el panel de administración
    const btnCrearBlog = document.getElementById("btn-crear-blog")
    if (btnCrearBlog) {
        btnCrearBlog.addEventListener("click", () => {
            window.location.href = "/crear-blog"
        })
    }

    // Configurar eventos para el modal de eliminación
    const modalEliminar = document.getElementById("modal-eliminar")
    const modalCancel = document.getElementById("modal-cancel")
    const modalConfirm = document.getElementById("modal-confirm")

    if (modalCancel) {
        modalCancel.addEventListener("click", () => {
            modalEliminar.style.display = "none"
        })
    }

    if (modalConfirm) {
        modalConfirm.addEventListener("click", () => {
            if (blogIdToDelete) {
                eliminarBlog(blogIdToDelete)
            }
            modalEliminar.style.display = "none"
        })
    }

    // Cerrar el modal si se hace clic fuera de él
    if (modalEliminar) {
        window.addEventListener("click", (event) => {
            if (event.target === modalEliminar) {
                modalEliminar.style.display = "none"
            }
        })
    }
})

// Función para verificar la sesión del usuario
function checkUserSession() {
    fetch("/api/usuarios/sesion")
        .then((response) => {
            console.log("Respuesta recibida:", response.status)

            // Si la respuesta no es exitosa (401 Unauthorized), mostrar vista de usuario normal
            if (!response.ok) {
                mostrarVistaUsuario()
                return Promise.reject("No hay sesión activa")
            }

            return response.json()
        })
        .then((data) => {
            console.log("Datos de sesión:", data)
            if (data.loggedIn && data.tipo === "admin") {
                // Es un administrador, mostrar panel de administración
                const adminPanel = document.getElementById("admin-panel")
                const userBlogContent = document.getElementById("user-blog-content")

                if (adminPanel) adminPanel.style.display = "block"
                if (userBlogContent) userBlogContent.style.display = "none"

                // Cargar los blogs para el panel de administración
                cargarBlogsAdmin()
            } else {
                // No es admin o no está logueado, mostrar contenido normal
                mostrarVistaUsuario()
            }
        })
        .catch((error) => {
            console.log("Error o no hay sesión:", error)
            // En caso de error, mostrar la vista de usuario normal
            mostrarVistaUsuario()
        })
}

// Función para mostrar la vista de usuario normal
function mostrarVistaUsuario() {
    const adminPanel = document.getElementById("admin-panel")
    const userBlogContent = document.getElementById("user-blog-content")

    if (adminPanel) adminPanel.style.display = "none"
    if (userBlogContent) userBlogContent.style.display = "block"

    // Cargar los blogs para usuarios normales desde la base de datos
    cargarBlogsUsuario()
}

function mostrarVistaAdmin() {
    const adminPanel = document.getElementById("admin-panel")
    const userBlogContent = document.getElementById("user-blog-content")

    if (adminPanel) adminPanel.style.display = "block"
    if (userBlogContent) userBlogContent.style.display = "none"

    // Cargar los blogs para el panel de administración
    cargarBlogsAdmin()
}

function configurarBotonesAdmin() {
    // Configurar botones de editar
    document.querySelectorAll(".btn-editar").forEach((btn) => {
        btn.addEventListener("click", function () {
            const blogId = this.getAttribute("data-id")
            // Redirigir a la página de edición con el ID del blog
            window.location.href = `/editar-blog?id=${blogId}`
        })
    })

    // Configurar botones de eliminar
    document.querySelectorAll(".btn-eliminar").forEach((btn) => {
        btn.addEventListener("click", function () {
            const blogId = this.getAttribute("data-id")
            // Mostrar modal de confirmación
            blogIdToDelete = blogId
            document.getElementById("modal-eliminar").style.display = "block"
        })
    })
}

// Función para eliminar un blog
function eliminarBlog(blogId) {
    fetch(`/api/blogs/${blogId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                // Recargar la lista de blogs
                cargarBlogsAdmin()
            } else {
                alert("Error al eliminar el blog: " + data.message)
            }
        })
        .catch((error) => {
            console.error("Error al eliminar blog:", error)
            alert("Error al eliminar el blog. Inténtalo de nuevo.")
        })
}

// Función para cargar blogs en el panel de administración
function cargarBlogsAdmin() {
    console.log("Cargando blogs para admin...")

    fetch("/api/blogs")
        .then((response) => response.json())
        .then((data) => {
            console.log("Respuesta de API blogs:", data)

            const blogsGrid = document.getElementById("blogs-grid")
            if (!blogsGrid) {
                console.error("Elemento blogs-grid no encontrado")
                return
            }

            blogsGrid.innerHTML = "" // Limpiar contenido existente

            // Si la respuesta tiene success pero no tiene blogs, asumimos que no hay blogs
            if (data.success && !data.blogs) {
                console.log("No hay blogs en la respuesta")
                blogsGrid.innerHTML =
                    '<p style="grid-column: 1/-1; text-align: center; padding: 20px;">No hay blogs disponibles. ¡Crea el primero!</p>'
                return
            }

            // Determinar dónde están los blogs en la respuesta
            let blogs = []

            if (data.success && data.blogs && Array.isArray(data.blogs)) {
                blogs = data.blogs
                console.log("Blogs encontrados:", blogs.length)
            } else {
                console.error("Formato de respuesta no reconocido:", data)
                blogsGrid.innerHTML =
                    '<p style="grid-column: 1/-1; text-align: center; padding: 20px;">Error al cargar blogs. Formato de datos incorrecto.</p>'
                return
            }

            if (blogs.length === 0) {
                blogsGrid.innerHTML =
                    '<p style="grid-column: 1/-1; text-align: center; padding: 20px;">No hay blogs disponibles. ¡Crea el primero!</p>'
                return
            }

            blogs.forEach((blog) => {
                const blogCard = document.createElement("div")
                blogCard.className = "blog-card"

                // Imagen por defecto si no hay imagen
                const imageSrc = blog.image_path || "images/placeholder.svg"

                blogCard.innerHTML = `
          <img src="${imageSrc}" alt="${blog.title}" class="blog-card-image">
          <div class="blog-card-content">
            <h3 class="blog-card-title">${blog.title}</h3>
            <div class="blog-card-actions">
              <button class="btn-editar" data-id="${blog.id}">Editar</button>
              <button class="btn-eliminar" data-id="${blog.id}">Eliminar</button>
            </div>
          </div>
        `

                blogsGrid.appendChild(blogCard)
            })

            // Configurar eventos para los botones de editar y eliminar
            configurarBotonesAdmin()
        })
        .catch((error) => {
            console.error("Error al cargar blogs:", error)
            const blogsGrid = document.getElementById("blogs-grid")
            if (blogsGrid) {
                blogsGrid.innerHTML =
                    '<p style="grid-column: 1/-1; text-align: center; padding: 20px;">Error al cargar blogs. Inténtalo de nuevo más tarde.</p>'
            }
        })
}

function cargarBlogsUsuario() {
    console.log("Cargando blogs para usuario...")

    const userBlogContent = document.getElementById("user-blog-content")
    if (!userBlogContent) {
        console.error("Elemento user-blog-content no encontrado")
        return
    }

    // Mostrar mensaje de carga
    userBlogContent.innerHTML =
        '<div id="loading-blogs" style="text-align: center; padding: 20px;"><p>Cargando blogs...</p></div>'

    fetch("/api/blogs")
        .then((response) => response.json())
        .then((data) => {
            console.log("Respuesta de API blogs (usuario):", data)

            // Limpiar contenido existente
            userBlogContent.innerHTML = ""

            // Si la respuesta tiene success pero no tiene blogs, asumimos que no hay blogs
            if (data.success && !data.blogs) {
                console.log("No hay blogs en la respuesta (usuario)")
                userBlogContent.innerHTML =
                    '<p style="text-align: center; padding: 20px;">No hay blogs disponibles en este momento.</p>'
                return
            }

            // Determinar dónde están los blogs en la respuesta
            let blogs = []

            if (data.success && data.blogs && Array.isArray(data.blogs)) {
                blogs = data.blogs
                console.log("Blogs encontrados (usuario):", blogs.length)
            } else {
                console.error("Formato de respuesta no reconocido (usuario):", data)
                userBlogContent.innerHTML =
                    '<p style="text-align: center; padding: 20px;">Error al cargar blogs. Formato de datos incorrecto.</p>'
                return
            }

            if (blogs.length === 0) {
                userBlogContent.innerHTML =
                    '<p style="text-align: center; padding: 20px;">No hay blogs disponibles en este momento.</p>'
                return
            }

            // Crear secciones de blog alternando normal e invertida
            blogs.forEach((blog, index) => {
                const isEven = index % 2 === 0
                const sectionClass = isEven ? "normal" : "invertida"

                // Agregar separador antes de cada sección excepto la primera
                if (index > 0) {
                    const hr = document.createElement("hr")
                    userBlogContent.appendChild(hr)
                }

                const section = document.createElement("section")
                section.className = `contenedor-blog ${sectionClass}`

                // Imagen por defecto si no hay imagen
                const imageSrc = blog.image_path || "images/placeholder.svg"

                if (isEven) {
                    section.innerHTML = `
            <div class="informacion_Izq textoB">
                <h2>${blog.title}</h2>
                <p>${blog.description ? blog.description.substring(0, 200) + (blog.description.length > 200 ? "..." : "") : "Sin descripción"}</p>
                <button type="button" onclick="verDetallesBlog(${blog.id})">Ver más</button>
            </div>
            <div class="imagen-container-left">
                <img src="${imageSrc}" alt="${blog.title}" style="width: 100%; height: 100%; object-fit: cover; object-position: center;">
            </div>
          `
                } else {
                    section.innerHTML = `
            <div class="imagen-container-right">
                <img src="${imageSrc}" alt="${blog.title}" style="width: 100%; height: 100%; object-fit: cover; object-position: center;">
            </div>
            <div class="informacion_Der textoB">
                <h2>${blog.title}</h2>
                <p>${blog.description ? blog.description.substring(0, 200) + (blog.description.length > 200 ? "..." : "") : "Sin descripción"}</p>
                <button type="button" onclick="verDetallesBlog(${blog.id})">Ver más</button>
            </div>
          `
                }

                userBlogContent.appendChild(section)
            })
        })
        .catch((error) => {
            console.error("Error al cargar blogs:", error)
            userBlogContent.innerHTML =
                '<p style="text-align: center; padding: 20px;">Error al cargar blogs. Inténtalo de nuevo más tarde.</p>'
        })
}

// Función para redirigir a la página de detalles del blog
function verDetallesBlog(blogId) {
    // Guardar el ID del blog en sessionStorage para recuperarlo en la página de detalles
    sessionStorage.setItem("blogId", blogId)

    // Redirigir a la página de detalles
    window.location.href = `/${blogId}`
}
