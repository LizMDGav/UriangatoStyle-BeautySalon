document.addEventListener("DOMContentLoaded", () => {
    // Función para crear y actualizar contadores de caracteres
    function setupCharCounters() {
      // Configurar contador para el título
      setupCounter("title", 100)
  
      // Configurar contador para la descripción
      setupCounter("description", 220)
  
      // Configurar contadores para subtítulos y contenidos de secciones
      document.querySelectorAll(".content-section").forEach((section) => {
        if (!section.dataset || !section.dataset.sectionId) return
  
        const sectionId = section.dataset.sectionId
        setupCounter(`subtitle-${sectionId}`, 100)
        setupCounter(`content-${sectionId}`, 600)
      })
    }
  
    // Función para configurar un contador individual
    function setupCounter(elementId, limit) {
      const element = document.getElementById(elementId)
      if (!element) return
  
      // Crear el contador si no existe
      let counter = document.getElementById(`${elementId}-counter`)
      if (!counter) {
        counter = document.createElement("div")
        counter.id = `${elementId}-counter`
        counter.className = "char-counter"
        element.parentNode.insertBefore(counter, element.nextSibling)
      }
  
      // Actualizar el contador inicialmente
      updateCounter(element, counter, limit)
  
      // Configurar evento para actualizar el contador
      element.addEventListener("input", function () {
        updateCounter(this, counter, limit)
      })
  
      // Agregar evento reset para detectar cuando el formulario se resetea
      element.form?.addEventListener("reset", () => {
        // Usar setTimeout para asegurarse de que el reset ya ocurrió
        setTimeout(() => {
          updateCounter(element, counter, limit)
        }, 0)
      })
    }
  
    // Función para actualizar un contador
    function updateCounter(element, counter, limit) {
      const length = element.value.length
      counter.textContent = `${length}/${limit} caracteres`
  
      if (length > limit) {
        counter.className = "char-counter limit-exceeded"
      } else if (length > limit * 0.8) {
        counter.className = "char-counter limit-warning"
      } else {
        counter.className = "char-counter"
      }
    }
  
    // Función para actualizar todos los contadores (útil después de resetear el formulario)
    window.updateAllCounters = () => {
      document.querySelectorAll(".char-counter").forEach((counter) => {
        const inputId = counter.id.replace("-counter", "")
        const input = document.getElementById(inputId)
        const limit = inputId.includes("content")
          ? 600
          : inputId.includes("subtitle")
            ? 100
            : inputId === "title"
              ? 100
              : 220
  
        if (input) {
          updateCounter(input, counter, limit)
        }
      })
    }
  
    // Configurar contadores iniciales
    setupCharCounters()
  
    // Actualizar contadores cuando se añade una nueva sección
    const addSectionBtn = document.getElementById("addSection")
    if (addSectionBtn) {
      addSectionBtn.addEventListener("click", () => {
        // Esperar a que el DOM se actualice
        setTimeout(setupCharCounters, 100)
      })
    }
  
    // Observar cambios en el formulario para actualizar contadores
    const blogForm = document.getElementById("blogForm")
    if (blogForm) {
      // Agregar un evento para cuando el formulario se resetee
      blogForm.addEventListener("reset", () => {
        // Usar setTimeout para asegurarse de que el reset ya ocurrió
        setTimeout(window.updateAllCounters, 10)
      })
  
      // Agregar un evento personalizado para cuando se envíe el formulario exitosamente
      blogForm.addEventListener("formSubmitSuccess", () => {
        window.updateAllCounters()
      })
    }
  })
  