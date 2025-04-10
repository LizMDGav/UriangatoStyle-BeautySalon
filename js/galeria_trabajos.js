document.addEventListener("DOMContentLoaded", () => {
    const categoryButtons = document.querySelectorAll(".category-btn")
    const galleryContainer = document.querySelector(".gallery-container")
    const loadingIndicator = document.querySelector(".loading-indicator")
    const noImagesMessage = document.querySelector(".no-images-message")
  
    let currentCategory = "cabello"

    const galleryImages = {
      cabello: [
        { name: "cabello1.webp", alt: "Estilo de cabello 1" },
        { name: "cabello2.webp", alt: "Estilo de cabello 2" },
        { name: "cabello3.webp", alt: "Estilo de cabello 3" },
        { name: "cabello4.webp", alt: "Estilo de cabello 4" },
        { name: "cabello5.webp", alt: "Estilo de cabello 5" },
        { name: "cabello6.webp", alt: "Estilo de cabello 6" },
      ],
      pestanas: [
        { name: "pestanas1.webp", alt: "Estilo de pestañas 1" },
        { name: "pestanas2.webp", alt: "Estilo de pestañas 2" },
        { name: "pestanas3.jpg", alt: "Estilo de pestañas 3" },
        { name: "pestanas4.jpg", alt: "Estilo de pestañas 4" },
        { name: "pestanas5.jpg", alt: "Estilo de pestañas 5" },
        { name: "pestanas6.webp", alt: "Estilo de pestañas 6" }
      ],
      maquillaje_peinado: [
        { name: "maquillaje1.webp", alt: "Maquillaje y peinado 1" },
        { name: "maquillaje2.webp", alt: "Maquillaje y peinado 2" },
        { name: "maquillaje3.webp", alt: "Maquillaje y peinado 3" },
        { name: "maquillaje4.jpg", alt: "Maquillaje y peinado 4" },
        { name: "maquillaje5.webp", alt: "Maquillaje y peinado 5" },
        { name: "maquillaje6.jpg", alt: "Maquillaje y peinado 6" },
        { name: "maquillaje7.jpg", alt: "Maquillaje y peinado 7" }
      ],
    }
  
    loadGalleryImages(currentCategory)
  
    categoryButtons.forEach((button) => {
      button.addEventListener("click", function () {
        categoryButtons.forEach((btn) => btn.classList.remove("active"))
        this.classList.add("active")
        const category = this.dataset.category
        loadGalleryImages(category)
      })
    })
  
    function loadGalleryImages(category) {
      loadingIndicator.style.display = "flex"
      galleryContainer.style.display = "none"
      noImagesMessage.style.display = "none"
  
      currentCategory = category
  
      setTimeout(() => {
        const images = galleryImages[category] || []
  
        loadingIndicator.style.display = "none"
  
        if (images.length === 0) {
          noImagesMessage.style.display = "block"
          galleryContainer.style.display = "none"
        } else {
          galleryContainer.style.display = "grid"
          renderGallery(images, category)
        }
      }, 300)
    }
  

    function renderGallery(images, category) {
      galleryContainer.innerHTML = ""
  
      const basePath = `/public/galeriaTrabajos/${category}/`
  
      images.forEach((image) => {
        const galleryItem = document.createElement("div")
        galleryItem.className = "gallery-item"
  
        const img = document.createElement("img")
        img.src = `${basePath}${image.name}`
        img.alt = image.alt
        img.loading = "lazy"
  
        img.onerror = function () {
          this.onerror = null
          this.src = "/images/placeholder.svg"
          this.alt = "Imagen no disponible"
        }
  
        galleryItem.appendChild(img)
        galleryContainer.appendChild(galleryItem)
      })
    }
  })
  