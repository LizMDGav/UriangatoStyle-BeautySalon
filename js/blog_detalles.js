document.addEventListener("DOMContentLoaded", () => {
    // Obtener el ID del blog de la URL o del sessionStorage
    const urlParts = window.location.pathname.split("/")
    const blogId = urlParts[urlParts.length - 1] || sessionStorage.getItem("blogId")
  
    if (!blogId) {
      mostrarError("No se pudo encontrar el ID del blog")
      return
    }
  
    // Cargar el blog principal
    cargarDetallesBlog(blogId)
  
    // Cargar blogs relacionados para "Descubre más"
    cargarBlogsRelacionados(blogId)
  })
  
  function cargarDetallesBlog(blogId) {
    // Mostrar indicador de carga
    document.querySelector(".contenido .contenedor").innerHTML =
      '<div style="text-align: center; padding: 20px;"><p>Cargando detalles del blog...</p></div>'
  
    fetch(`/api/blogs/${blogId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("No se pudo cargar el blog")
        }
        return response.json()
      })
      .then((data) => {
        if (!data.success || !data.blog) {
          throw new Error("No se encontró el blog")
        }
  
        mostrarDetallesBlog(data.blog)
      })
      .catch((error) => {
        console.error("Error al cargar detalles del blog:", error)
        mostrarError("Error al cargar el blog. Por favor, inténtalo de nuevo más tarde.")
      })
  }
  
  function mostrarDetallesBlog(blog) {
    // Actualizar la imagen principal
    const imgEncabezado = document.querySelector(".img_encabezado img")
    if (imgEncabezado) {
      imgEncabezado.src = blog.image_path || "images/placeholder.svg"
      imgEncabezado.alt = blog.title
    }
  
    // Actualizar el contenido
    const contenido = document.querySelector(".contenido .contenedor")
    if (contenido) {
      // Formatear la fecha
      const fecha = new Date(blog.created_at)
      const fechaFormateada = fecha.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
  
      // Actualizar título y fecha
      contenido.innerHTML = `
        <h1>${blog.title}</h1>
        <h3>${fechaFormateada}</h3>
        
        <div class="informacion">
          <p>${blog.description}</p>
        </div>
      `
  
      // Añadir secciones si existen
      if (blog.sections && blog.sections.length > 0) {
        blog.sections.forEach((section) => {
          let sectionHTML = `<div class="informacion">`
  
          if (section.subtitle) {
            sectionHTML += `<h4>${section.subtitle}</h4>`
          }
  
          sectionHTML += `<p>${section.content}</p>`
  
          if (section.image_path) {
            sectionHTML += `
              <div class="seccion-imagen">
                <img src="${section.image_path}" alt="${section.subtitle || "Imagen de sección"}">
              </div>
            `
          }
  
          sectionHTML += `</div>`
  
          contenido.innerHTML += sectionHTML
        })
      }
    }
  
    // Actualizar el título de la página
    document.title = `${blog.title} - Uringato Style`
  }
  
  function cargarBlogsRelacionados(blogIdActual) {
    // Mostrar indicador de carga en la sección de artículos
    const articulosSection = document.querySelector(".articulos")
    const tituloArticulos = articulosSection.querySelector("h2")
  
    // Mantener el título y limpiar el resto
    articulosSection.innerHTML = ""
    articulosSection.appendChild(tituloArticulos)
  
    // Añadir indicador de carga
    const cargando = document.createElement("div")
    cargando.style.textAlign = "center"
    cargando.style.padding = "20px"
    cargando.innerHTML = "<p>Cargando blogs relacionados...</p>"
    articulosSection.appendChild(cargando)
  
    // Obtener todos los blogs
    fetch("/api/blogs")
      .then((response) => response.json())
      .then((data) => {
        // Eliminar el indicador de carga
        articulosSection.removeChild(cargando)
  
        if (!data.success || !data.blogs || !Array.isArray(data.blogs)) {
          throw new Error("No se pudieron cargar los blogs relacionados")
        }
  
        // Filtrar el blog actual y tomar hasta 2 blogs para mostrar
        const blogsRelacionados = data.blogs
          .filter((blog) => blog.id != blogIdActual) // Excluir el blog actual
          .slice(0, 4) // Tomar solo 2 blogs
  
        if (blogsRelacionados.length === 0) {
          const mensaje = document.createElement("p")
          mensaje.style.textAlign = "center"
          mensaje.textContent = "No hay más blogs disponibles en este momento."
          articulosSection.appendChild(mensaje)
          return
        }
  
        // Mostrar los blogs relacionados
        blogsRelacionados.forEach((blog) => {
          const article = document.createElement("article")
  
          // Imagen por defecto si no hay imagen
          const imageSrc = blog.image_path || "images/placeholder.svg"
  
          article.innerHTML = `
            <img src="${imageSrc}" alt="${blog.title}">
            <div>
              <h4>${blog.title}</h4>
              <a href="javascript:void(0)" onclick="verDetallesBlog(${blog.id})">Leer más</a>
            </div>
          `
  
          articulosSection.appendChild(article)
        })
      })
      .catch((error) => {
        console.error("Error al cargar blogs relacionados:", error)
  
        // Mostrar mensaje de error
        const mensaje = document.createElement("p")
        mensaje.style.textAlign = "center"
        mensaje.textContent = "Error al cargar blogs relacionados."
        articulosSection.appendChild(mensaje)
      })
  }
  
  function mostrarError(mensaje) {
    const contenido = document.querySelector(".contenido .contenedor")
    if (contenido) {
      contenido.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h2>Error</h2>
          <p>${mensaje}</p>
          <button onclick="window.location.href='/Blog'" style="margin-top: 20px;">Volver a Blogs</button>
        </div>
      `
    }
  }
  
  // Función para redirigir a la página de detalles del blog
  function verDetallesBlog(blogId) {
    // Guardar el ID del blog en sessionStorage para recuperarlo en la página de detalles
    sessionStorage.setItem("blogId", blogId)
  
    // Redirigir a la página de detalles
    window.location.href = `/${blogId}`
  }
  