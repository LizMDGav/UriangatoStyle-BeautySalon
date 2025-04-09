document.addEventListener("DOMContentLoaded", () => {
    let sectionCount = 1
    const contentSections = document.getElementById("contentSections")
    const addSectionBtn = document.getElementById("addSection")
    const blogForm = document.getElementById("blogForm")
    const submitButton = document.getElementById("submitButton")
    const submitSpinner = document.getElementById("submitSpinner")
    const successNotification = document.getElementById("successNotification")
    const errorNotification = document.getElementById("errorNotification")
    const cancelButton = document.getElementById("cancelButton")
  
    const mainImageInput = document.getElementById("mainImage")
    const selectMainImageBtn = document.getElementById("selectMainImage")
    const mainImagePreview = document.getElementById("mainImagePreview")
    const removeMainImageBtn = document.getElementById("removeMainImage")
  
    // Determinar si estamos en modo edición o creación
    const urlParams = new URLSearchParams(window.location.search)
    const blogId = urlParams.get("id")
    const isEditMode = !!blogId
  
    // Actualizar título de la página y botón según el modo
    if (isEditMode) {
      document.title = "Editar Blog - Uringato Style"
      const pageTitle = document.querySelector("header h2")
      if (pageTitle) pageTitle.textContent = "Editar Blog"
  
      const cardTitle = document.querySelector(".card-title")
      if (cardTitle) cardTitle.textContent = "Editar Blog"
  
      if (submitButton) submitButton.textContent = "Guardar Cambios"
  
      // Crear campo oculto para el ID del blog si estamos en modo edición
      if (blogForm && !document.getElementById("blogId")) {
        const hiddenInput = document.createElement("input")
        hiddenInput.type = "hidden"
        hiddenInput.id = "blogId"
        hiddenInput.name = "blogId"
        hiddenInput.value = blogId
        blogForm.appendChild(hiddenInput)
      }
  
      // Cargar los datos del blog para edición
      cargarDatosBlog(blogId)
    }
  
    if (cancelButton) {
      cancelButton.addEventListener("click", () => {
        // Mostrar modal de confirmación en lugar de confirm()
        const modalCancelar = document.getElementById("modal-cancelar")
        if (modalCancelar) {
          modalCancelar.style.display = "block"
        }
      })
    }
  
    // Configurar eventos para el modal de cancelación
    const modalCancelar = document.getElementById("modal-cancelar")
    const modalCancelNo = document.getElementById("modal-cancel-no")
    const modalCancelSi = document.getElementById("modal-cancel-si")
  
    if (modalCancelNo) {
      modalCancelNo.addEventListener("click", () => {
        if (modalCancelar) modalCancelar.style.display = "none"
      })
    }
  
    if (modalCancelSi) {
      modalCancelSi.addEventListener("click", () => {
        // Redirigir a la página de blogs
        window.location.href = "/blog.html"
      })
    }
  
    // Cerrar el modal si se hace clic fuera de él
    if (modalCancelar) {
      window.addEventListener("click", (event) => {
        if (event.target === modalCancelar) {
          modalCancelar.style.display = "none"
        }
      })
    }
  
    // Asegurarse de que la primera sección tenga el atributo data-section-id
    const firstSection = contentSections?.querySelector(".content-section")
    if (firstSection && !firstSection.dataset.sectionId) {
      firstSection.dataset.sectionId = "section-1"
    }
  
    // Asegurarse de que los botones en la primera sección tengan data-section-id
    if (firstSection) {
      const selectImageBtn = firstSection.querySelector(".select-image")
      if (selectImageBtn && !selectImageBtn.dataset.sectionId) {
        selectImageBtn.dataset.sectionId = "section-1"
      }
  
      const removeImageBtn = firstSection.querySelector(".remove-image")
      if (removeImageBtn && !removeImageBtn.dataset.sectionId) {
        removeImageBtn.dataset.sectionId = "section-1"
      }
    }
  
    // Configurar eventos para el formulario
    if (selectMainImageBtn) {
      selectMainImageBtn.addEventListener("click", () => {
        mainImageInput.click()
      })
    }
  
    if (mainImageInput) {
      mainImageInput.addEventListener("change", function () {
        if (this.files && this.files[0]) {
          const reader = new FileReader()
  
          reader.onload = (e) => {
            mainImagePreview.src = e.target.result
            mainImagePreview.style.display = "block"
            removeMainImageBtn.classList.remove("hidden")
          }
  
          reader.readAsDataURL(this.files[0])
        }
      })
    }
  
    if (removeMainImageBtn) {
      removeMainImageBtn.addEventListener("click", function () {
        mainImagePreview.src = ""
        mainImagePreview.style.display = "none"
        mainImageInput.value = ""
        this.classList.add("hidden")
      })
    }
  
    // Agregar nueva sección
    if (addSectionBtn) {
      addSectionBtn.addEventListener("click", () => {
        sectionCount++
        agregarNuevaSeccion(sectionCount)
      })
    }
  
    // Función para cargar los datos del blog (solo en modo edición)
    function cargarDatosBlog(id) {
      fetch(`/api/blogs/${id}`)
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
  
          const blog = data.blog
  
          // Cargar datos principales
          document.getElementById("title").value = blog.title || ""
          document.getElementById("description").value = blog.description || ""
  
          // Cargar imagen principal si existe
          if (blog.image_path) {
            mainImagePreview.src = blog.image_path
            mainImagePreview.style.display = "block"
            removeMainImageBtn.classList.remove("hidden")
          }
  
          // Limpiar secciones existentes
          contentSections.innerHTML = ""
  
          // Cargar secciones
          if (blog.sections && blog.sections.length > 0) {
            blog.sections.forEach((section, index) => {
              sectionCount = index + 1
              agregarSeccion(section, sectionCount)
            })
          } else {
            // Si no hay secciones, agregar una vacía
            agregarNuevaSeccion(1)
          }
  
          // Actualizar contadores de caracteres
          if (typeof window.updateAllCounters === "function") {
            setTimeout(window.updateAllCounters, 100)
          }
        })
        .catch((error) => {
          console.error("Error al cargar blog:", error)
          mostrarNotificacion(false, "Error al cargar el blog. Inténtalo de nuevo más tarde.")
        })
    }
  
    // Función para agregar una sección existente (para edición)
    function agregarSeccion(section, index) {
      const sectionId = `section-${index}`
  
      const newSection = document.createElement("div")
      newSection.className = "content-section"
      newSection.dataset.sectionId = sectionId
  
      newSection.innerHTML = `
        <div class="section-header-inner">
          <h4>Sección ${index}</h4>
          <button 
            type="button" 
            class="btn-danger btn-sm remove-section"
            ${document.querySelectorAll(".content-section").length === 0 ? "disabled" : ""}
          >
            Eliminar
          </button>
        </div>
        
        <div class="form-group">
          <label for="subtitle-${sectionId}">Subtítulo <span class="optional-label">(opcional)</span></label>
          <input 
            type="text" 
            id="subtitle-${sectionId}" 
            name="subtitle-${sectionId}" 
            placeholder="Ingresa un subtítulo para esta sección (opcional)"
            value="${section.subtitle || ""}"
          >
        </div>
        
        <div class="form-group">
          <label for="content-${sectionId}">Contenido</label>
          <textarea 
            id="content-${sectionId}" 
            name="content-${sectionId}" 
            placeholder="Escribe el contenido de esta sección" 
            required
          >${section.content || ""}</textarea>
        </div>
        
        <div class="form-group">
          <label>Imagen <span class="optional-label">(opcional)</span></label>
          <div class="flex flex-col gap-2">
            <input 
              type="file" 
              id="image-${sectionId}" 
              name="image-${sectionId}" 
              accept="image/*" 
              class="hidden"
            >
            <button 
              type="button" 
              class="btn-outline select-image" 
              data-section-id="${sectionId}"
            >
              Seleccionar Imagen
            </button>
            
            <div class="image-container" id="image-container-${sectionId}">
              <img 
                src="${section.image_path || ""}"
                alt="Vista previa" 
                class="image-preview" 
                id="preview-${sectionId}"
                style="${section.image_path ? "display: block;" : "display: none;"}"
              >
              <button 
                type="button" 
                class="btn-danger btn-sm remove-image ${section.image_path ? "" : "hidden"}" 
                data-section-id="${sectionId}"
              >
                Eliminar Imagen
              </button>
            </div>
          </div>
        </div>
      `
  
      contentSections.appendChild(newSection)
      setupEventListeners()
    }
  
    // Función para agregar una nueva sección vacía
    function agregarNuevaSeccion(index) {
      const sectionId = `section-${index}`
  
      // Habilitar todos los botones de eliminar si hay más de una sección
      if (document.querySelectorAll(".content-section").length > 0) {
        document.querySelectorAll(".remove-section").forEach((btn) => {
          btn.disabled = false
        })
      }
  
      const newSection = document.createElement("div")
      newSection.className = "content-section"
      newSection.dataset.sectionId = sectionId
  
      newSection.innerHTML = `
        <div class="section-header-inner">
          <h4>Sección ${index}</h4>
          <button 
            type="button" 
            class="btn-danger btn-sm remove-section"
            ${document.querySelectorAll(".content-section").length === 0 ? "disabled" : ""}
          >
            Eliminar
          </button>
        </div>
        
        <div class="form-group">
          <label for="subtitle-${sectionId}">Subtítulo <span class="optional-label">(opcional)</span></label>
          <input 
            type="text" 
            id="subtitle-${sectionId}" 
            name="subtitle-${sectionId}" 
            placeholder="Ingresa un subtítulo para esta sección (opcional)"
          >
        </div>
        
        <div class="form-group">
          <label for="content-${sectionId}">Contenido</label>
          <textarea 
            id="content-${sectionId}" 
            name="content-${sectionId}" 
            placeholder="Escribe el contenido de esta sección" 
            required
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>Imagen <span class="optional-label">(opcional)</span></label>
          <div class="flex flex-col gap-2">
            <input 
              type="file" 
              id="image-${sectionId}" 
              name="image-${sectionId}" 
              accept="image/*" 
              class="hidden"
            >
            <button 
              type="button" 
              class="btn-outline select-image" 
              data-section-id="${sectionId}"
            >
              Seleccionar Imagen
            </button>
            
            <div class="image-container" id="image-container-${sectionId}">
              <img 
                alt="Vista previa" 
                class="image-preview" 
                id="preview-${sectionId}"
              >
              <button 
                type="button" 
                class="btn-danger btn-sm remove-image hidden" 
                data-section-id="${sectionId}"
              >
                Eliminar Imagen
              </button>
            </div>
          </div>
        </div>
      `
  
      contentSections.appendChild(newSection)
      setupEventListeners()
  
      // Actualizar contadores de caracteres
      if (typeof window.setupCharCounters === "function") {
        setTimeout(window.setupCharCounters, 100)
      }
    }
  
    // Configurar eventos para botones de imagen y eliminar sección
    function setupEventListeners() {
      // Botones para seleccionar imagen
      document.querySelectorAll(".select-image").forEach((btn) => {
        btn.addEventListener("click", function () {
          if (!this.dataset || !this.dataset.sectionId) return
          const sectionId = this.dataset.sectionId
          const imageInput = document.getElementById(`image-${sectionId}`)
          if (imageInput) imageInput.click()
        })
      })
  
      // Input de archivo para previsualizar imagen
      document.querySelectorAll('input[type="file"]').forEach((input) => {
        if (input.id === "mainImage") return // Ya configurado separadamente
  
        input.addEventListener("change", function () {
          if (!this.id) return
          const sectionId = this.id.replace("image-", "")
          const preview = document.getElementById(`preview-${sectionId}`)
          const removeBtn = this.parentElement.querySelector(".remove-image")
  
          if (!preview || !removeBtn) return
  
          if (this.files && this.files[0]) {
            const reader = new FileReader()
  
            reader.onload = (e) => {
              preview.src = e.target.result
              preview.style.display = "block"
              removeBtn.classList.remove("hidden")
            }
  
            reader.readAsDataURL(this.files[0])
          }
        })
      })
  
      // Botones para eliminar imagen
      document.querySelectorAll(".remove-image").forEach((btn) => {
        if (btn.id === "removeMainImage") return // Ya configurado separadamente
  
        btn.addEventListener("click", function () {
          if (!this.dataset || !this.dataset.sectionId) return
          const sectionId = this.dataset.sectionId
          const preview = document.getElementById(`preview-${sectionId}`)
          const fileInput = document.getElementById(`image-${sectionId}`)
  
          if (!preview || !fileInput) return
  
          preview.src = ""
          preview.style.display = "none"
          fileInput.value = ""
          this.classList.add("hidden")
        })
      })
  
      // Botones para eliminar sección
      document.querySelectorAll(".remove-section").forEach((btn) => {
        btn.addEventListener("click", function () {
          const section = this.closest(".content-section")
          if (!section) return
  
          section.remove()
  
          // Actualizar numeración de secciones
          const sections = document.querySelectorAll(".content-section")
          sections.forEach((section, index) => {
            const header = section.querySelector("h4")
            if (header) header.textContent = `Sección ${index + 1}`
          })
  
          // Deshabilitar botón de eliminar si solo queda una sección
          if (sections.length === 1) {
            const removeBtn = sections[0].querySelector(".remove-section")
            if (removeBtn) removeBtn.disabled = true
          }
        })
      })
    }
  
    // Función para validar el formulario
    function validateForm() {
      let isValid = true
      let errorMessage = ""
  
      // Validar título
      const titleElement = document.getElementById("title")
      if (!titleElement.value.trim()) {
        isValid = false
        errorMessage = "El título no puede estar vacío."
        titleElement.classList.add("error")
      } else if (titleElement.value.length > 100) {
        isValid = false
        errorMessage = "El título no puede exceder los 100 caracteres."
        titleElement.classList.add("error")
      } else {
        titleElement.classList.remove("error")
      }
  
      // Validar descripción
      const descriptionElement = document.getElementById("description")
      if (!descriptionElement.value.trim()) {
        isValid = false
        errorMessage = errorMessage || "La descripción no puede estar vacía."
        descriptionElement.classList.add("error")
      } else if (descriptionElement.value.length > 220) {
        isValid = false
        errorMessage = errorMessage || "La descripción no puede exceder los 220 caracteres."
        descriptionElement.classList.add("error")
      } else {
        descriptionElement.classList.remove("error")
      }
  
      // Validar secciones
      document.querySelectorAll(".content-section").forEach((section) => {
        if (!section.dataset || !section.dataset.sectionId) return
  
        const sectionId = section.dataset.sectionId
        const subtitleElement = document.getElementById(`subtitle-${sectionId}`)
        const contentElement = document.getElementById(`content-${sectionId}`)
  
        if (!subtitleElement || !contentElement) return
  
        // Validar subtítulo (opcional pero con límite de caracteres)
        if (subtitleElement.value.trim() && subtitleElement.value.length > 100) {
          isValid = false
          errorMessage = errorMessage || `El subtítulo de la sección no puede exceder los 100 caracteres.`
          subtitleElement.classList.add("error")
        } else {
          subtitleElement.classList.remove("error")
        }
  
        // Validar contenido
        if (!contentElement.value.trim()) {
          isValid = false
          errorMessage = errorMessage || `El contenido de la sección no puede estar vacío.`
          contentElement.classList.add("error")
        } else if (contentElement.value.length > 600) {
          isValid = false
          errorMessage = errorMessage || `El contenido de la sección no puede exceder los 600 caracteres.`
          contentElement.classList.add("error")
        } else {
          contentElement.classList.remove("error")
        }
      })
  
      return { isValid, errorMessage }
    }
  
    // Mostrar notificación
    function mostrarNotificacion(isSuccess, message) {
      if (!successNotification || !errorNotification) return
  
      if (isSuccess) {
        successNotification.textContent =
          message || (isEditMode ? "Blog actualizado exitosamente!" : "Blog guardado exitosamente!")
        successNotification.style.display = "block"
        errorNotification.style.display = "none"
  
        // Ocultar después de 5 segundos
        setTimeout(() => {
          successNotification.style.display = "none"
        }, 5000)
      } else {
        errorNotification.textContent =
          message ||
          (isEditMode
            ? "Error al actualizar el blog. Inténtalo de nuevo."
            : "Error al guardar el blog. Inténtalo de nuevo.")
        errorNotification.style.display = "block"
        successNotification.style.display = "none"
  
        // Ocultar después de 5 segundos
        setTimeout(() => {
          errorNotification.style.display = "none"
        }, 5000)
      }
    }
  
    // Función para resetear los contadores de caracteres
    function resetCharCounters() {
      // Obtener todos los contadores
      const counters = document.querySelectorAll(".char-counter")
  
      // Actualizar cada contador a 0/límite
      counters.forEach((counter) => {
        const inputId = counter.id.replace("-counter", "")
        const limit = inputId.includes("content")
          ? 600
          : inputId.includes("subtitle")
            ? 100
            : inputId === "title"
              ? 100
              : 220
        counter.textContent = `0/${limit} caracteres`
        counter.className = "char-counter" // Resetear clase
      })
    }
  
    // Envío del formulario
    if (blogForm) {
      blogForm.addEventListener("submit", async (e) => {
        e.preventDefault()
  
        // Validar el formulario antes de enviar
        const { isValid, errorMessage } = validateForm()
  
        if (!isValid) {
          mostrarNotificacion(false, errorMessage)
          return
        }
  
        // Mostrar spinner y deshabilitar botón
        if (submitSpinner) submitSpinner.style.display = "inline-block"
        if (submitButton) submitButton.disabled = true
  
        try {
          // Crear FormData para enviar archivos
          const formData = new FormData()
  
          // Agregar datos principales del blog
          const titleElement = document.getElementById("title")
          const descriptionElement = document.getElementById("description")
  
          if (titleElement) formData.append("title", titleElement.value)
          if (descriptionElement) formData.append("description", descriptionElement.value)
  
          // Agregar imagen principal si existe
          if (mainImageInput && mainImageInput.files && mainImageInput.files[0]) {
            formData.append("mainImage", mainImageInput.files[0])
          }
  
          // Recopilar datos de las secciones
          const sections = []
          document.querySelectorAll(".content-section").forEach((section, index) => {
            // Verificar que section.dataset exista y tenga sectionId
            if (!section.dataset || !section.dataset.sectionId) {
              console.warn(`La sección ${index} no tiene un sectionId válido, se omitirá`)
              return // Salta esta sección
            }
  
            const sectionId = section.dataset.sectionId
  
            // Verificar que los elementos existan antes de acceder a ellos
            const subtitleElement = document.getElementById(`subtitle-${sectionId}`)
            const contentElement = document.getElementById(`content-${sectionId}`)
            const imageInput = document.getElementById(`image-${sectionId}`)
            const imagePreview = document.getElementById(`preview-${sectionId}`)
  
            if (!subtitleElement || !contentElement) {
              console.warn(`Elementos de la sección ${sectionId} no encontrados, se omitirá`)
              return // Salta esta sección
            }
  
            const subtitle = subtitleElement.value
            const content = contentElement.value
  
            // Crear objeto de sección
            const sectionData = {
              subtitle: subtitle,
              content: content,
              section_order: index + 1,
            }
  
            // Si estamos en modo edición y hay una imagen previa que no se ha cambiado
            if (isEditMode && imagePreview && imagePreview.style.display !== "none" && !imageInput.files.length) {
              sectionData.image_path = imagePreview.src
            }
  
            // Agregar a la lista de secciones
            sections.push(sectionData)
  
            // Agregar imagen de sección si existe
            if (imageInput && imageInput.files && imageInput.files[0]) {
              formData.append(`sectionImage_${index}`, imageInput.files[0])
              formData.append(`sectionIndex${index}`, index.toString())
            }
          })
  
          // Agregar datos de secciones como JSON
          formData.append("sections", JSON.stringify(sections))
  
          // Determinar la URL y método según el modo
          const url = isEditMode ? `/api/blogs/${blogId}` : "/api/blogs"
          const method = isEditMode ? "PUT" : "POST"
  
          // Enviar datos al servidor
          const response = await fetch(url, {
            method: method,
            body: formData,
          })
  
          const result = await response.json()
  
          if (response.ok) {
            // Mostrar notificación de éxito
            mostrarNotificacion(true, result.message)
  
            if (isEditMode) {
              // En modo edición, redirigir a la página de blogs después de 2 segundos
              setTimeout(() => {
                window.location.href = "/blog.html"
              }, 2000)
            } else {
              // En modo creación, limpiar el formulario
              blogForm.reset()
  
              // Limpiar imagen principal
              if (mainImagePreview) {
                mainImagePreview.src = ""
                mainImagePreview.style.display = "none"
              }
              if (removeMainImageBtn) {
                removeMainImageBtn.classList.add("hidden")
              }
  
              // Reiniciar secciones
              if (contentSections) {
                while (contentSections.children.length > 1) {
                  contentSections.removeChild(contentSections.lastChild)
                }
  
                // Reiniciar la primera sección
                const firstSection = contentSections.firstElementChild
                console.log("Primera sección:", firstSection)
  
                // Verificar que firstSection exista y tenga dataset.sectionId
                if (firstSection && firstSection.dataset && firstSection.dataset.sectionId) {
                  const firstSectionId = firstSection.dataset.sectionId
                  console.log("ID de la primera sección:", firstSectionId)
  
                  // Verificar que los elementos existan antes de manipularlos
                  const subtitleElement = document.getElementById(`subtitle-${firstSectionId}`)
                  const contentElement = document.getElementById(`content-${firstSectionId}`)
                  const firstPreview = document.getElementById(`preview-${firstSectionId}`)
  
                  if (subtitleElement) subtitleElement.value = ""
                  if (contentElement) contentElement.value = ""
  
                  if (firstPreview) {
                    firstPreview.src = ""
                    firstPreview.style.display = "none"
                  }
  
                  const removeImageBtn = firstSection.querySelector(".remove-image")
                  if (removeImageBtn) removeImageBtn.classList.add("hidden")
                } else {
                  console.warn(
                    "No se pudo reiniciar la primera sección: elemento no encontrado o sin atributo data-section-id",
                  )
                }
              }
  
              // Reiniciar contador de secciones
              sectionCount = 1
  
              // Resetear los contadores de caracteres
              resetCharCounters()
            }
          } else {
            // Mostrar notificación de error
            mostrarNotificacion(
              false,
              result.message || (isEditMode ? "Error al actualizar el blog" : "Error al guardar el blog"),
            )
          }
        } catch (error) {
          console.error("Error al enviar el formulario:", error)
          mostrarNotificacion(false, "Error de conexión. Inténtalo de nuevo.")
        } finally {
          // Ocultar spinner y habilitar botón
          if (submitSpinner) submitSpinner.style.display = "none"
          if (submitButton) submitButton.disabled = false
        }
      })
    }
  
    // Configurar eventos iniciales
    setupEventListeners()
  })
  