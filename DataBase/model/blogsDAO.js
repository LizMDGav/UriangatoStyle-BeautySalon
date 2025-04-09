import db from '../db.js';
import fs from 'fs';
import path from "path"
import { fileURLToPath } from 'url'

// Obtener la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function eliminarArchivo(filePath) {
    // Si la ruta está vacía o es null, no hacer nada
    if (!filePath) return;

    try {
        // Eliminar el primer slash si existe para evitar problemas de ruta
        const rutaRelativa = filePath.startsWith("/") ? filePath.substring(1) : filePath;

        // Construir la ruta absoluta (subiendo dos niveles desde el directorio actual)
        const rutaCompleta = path.join(__dirname, "../..", rutaRelativa);

        console.log(`Intentando eliminar archivo: ${rutaCompleta}`);

        // Verificar si el archivo existe antes de intentar eliminarlo
        if (fs.existsSync(rutaCompleta)) {
            fs.unlinkSync(rutaCompleta);
            console.log(`Archivo eliminado: ${rutaCompleta}`);
        } else {
            console.log(`El archivo no existe: ${rutaCompleta}`);
        }
    } catch (error) {
        console.error(`Error al eliminar archivo ${filePath}:`, error);
    }
}
/**
 * Crea un nuevo blog con sus secciones
 * @param {Object} blogData - Datos del blog
 * @returns {Promise<number>} - ID del blog creado
 */
export async function crearBlog(blogData) {
    console.log("Iniciando creación de blog en la base de datos");

    try {
        return await db.tx(async t => {
            console.log("Insertando blog principal");

            // Insertar blog principal y obtener el id
            const blogResult = await t.one(
                'INSERT INTO blogs (title, description, image_path, admin_id) VALUES ($1, $2, $3, $4) RETURNING id',
                [blogData.title, blogData.description, blogData.image_path, blogData.admin_id]
            );

            const blogId = blogResult.id;
            console.log("Blog creado con ID:", blogId);

            // Insertar secciones
            if (blogData.sections && blogData.sections.length > 0) {
                console.log("Insertando", blogData.sections.length, "secciones");

                for (const section of blogData.sections) {
                    await t.none(
                        'INSERT INTO blog_sections (blog_id, subtitle, content, image_path, section_order) VALUES ($1, $2, $3, $4, $5)',
                        [blogId, section.subtitle, section.content, section.image_path, section.section_order]
                    );
                }
            } else {
                console.log("No hay secciones para insertar");
            }

            // La transacción se confirma si todo sale bien y retorna el id del blog.
            return blogId;
        });
    } catch (error) {
        console.error("Error en crearBlog:", error);
        throw error; // Re-lanzar el error para manejarlo en el nivel superior
    }
}

/**
 * Obtiene todos los blogs
 * @returns {Promise<Array>} - Lista de blogs
 */
export async function obtenerBlogs() {
    // db.any devuelve una promesa que se resuelve con un array de filas
    return db.any(`
      SELECT b.*, a.nombre_completo as autor
      FROM blogs b
      LEFT JOIN administradores a ON b.admin_id = a.id
      ORDER BY b.created_at DESC
    `);
}


/**
 * Obtiene un blog por su ID
 * @param {number} id - ID del blog
 * @returns {Promise<Object>} - Datos del blog
 */
export async function obtenerBlogPorId(id) {
    return db.oneOrNone(`
      SELECT b.*, a.nombre_completo as autor
      FROM blogs b
      LEFT JOIN administradores a ON b.admin_id = a.id
      WHERE b.id = $1
    `, [id]);
}


/**
 * Obtiene las secciones de un blog
 * @param {number} blogId - ID del blog
 * @returns {Promise<Array>} - Lista de secciones
 */
export async function obtenerSeccionesBlog(blogId) {
    return db.any(`
      SELECT *
      FROM blog_sections
      WHERE blog_id = $1
      ORDER BY section_order
    `, [blogId]);
}


/**
* Elimina un blog, sus secciones y todas las imágenes asociadas
* @param {number} id - ID del blog
* @returns {Promise<boolean>} - true si se eliminó correctamente
*/
export async function eliminarBlog(id) {
    try {
        return await db.tx(async (t) => {
            console.log(`Iniciando eliminación del blog ID: ${id}`)

            // 1. Obtener la información del blog principal para la imagen principal
            const blog = await t.oneOrNone("SELECT image_path FROM blogs WHERE id = $1", [id])

            // 2. Obtener todas las secciones para sus imágenes
            const secciones = await t.any("SELECT image_path FROM blog_sections WHERE blog_id = $1", [id])

            // 3. Eliminar las secciones de la base de datos
            await t.none("DELETE FROM blog_sections WHERE blog_id = $1", [id])

            // 4. Eliminar el blog de la base de datos
            const result = await t.result("DELETE FROM blogs WHERE id = $1", [id])

            // 5. Si la eliminación en la base de datos fue exitosa, eliminar las imágenes
            if (result.rowCount > 0) {
                console.log(`Blog ID ${id} eliminado de la base de datos. Procediendo a eliminar imágenes.`)

                // Eliminar la imagen principal si existe
                if (blog && blog.image_path) {
                    eliminarArchivo(blog.image_path)
                }

                // Eliminar las imágenes de las secciones
                if (secciones && secciones.length > 0) {
                    secciones.forEach((seccion) => {
                        if (seccion.image_path) {
                            eliminarArchivo(seccion.image_path)
                        }
                    })
                }

                return true
            }

            return false
        })
    } catch (error) {
        console.error(`Error al eliminar blog ID ${id}:`, error)
        throw error // Re-lanzar el error para manejarlo en el nivel superior
    }
}


/**
 * Actualiza las secciones de un blog
 * @param {number} blogId - ID del blog
 * @param {Array} nuevasSecciones - Array con las nuevas secciones
 * @returns {Promise<void>}
 */
export async function actualizarSeccionesBlog(blogId, nuevasSecciones) {
    try {
        return await db.tx(async (t) => {
            // 1. Obtener las secciones existentes
            const seccionesExistentes = await t.any("SELECT * FROM blog_sections WHERE blog_id = $1 ORDER BY section_order", [
                blogId,
            ])

            // 2. Para cada nueva sección, actualizar o insertar
            for (let i = 0; i < nuevasSecciones.length; i++) {
                const nuevaSeccion = nuevasSecciones[i]
                const seccionExistente = seccionesExistentes[i]

                if (seccionExistente) {
                    // Si existe una sección en esta posición, actualizarla
                    await t.none(
                        "UPDATE blog_sections SET subtitle = $1, content = $2, image_path = $3, section_order = $4 WHERE id = $5",
                        [
                            nuevaSeccion.subtitle || null,
                            nuevaSeccion.content,
                            nuevaSeccion.image_path,
                            i + 1, // Asegurar que el orden sea correcto
                            seccionExistente.id,
                        ],
                    )

                    console.log(`Sección ID ${seccionExistente.id} actualizada para el blog ID ${blogId}`)

                    // Si la imagen ha cambiado y había una imagen anterior, eliminar la anterior
                    if (
                        nuevaSeccion.image_path &&
                        seccionExistente.image_path &&
                        nuevaSeccion.image_path !== seccionExistente.image_path
                    ) {
                        eliminarArchivo(seccionExistente.image_path)
                    }
                } else {
                    // Si no existe una sección en esta posición, crearla
                    await t.none(
                        "INSERT INTO blog_sections (blog_id, subtitle, content, image_path, section_order) VALUES ($1, $2, $3, $4, $5)",
                        [blogId, nuevaSeccion.subtitle || null, nuevaSeccion.content, nuevaSeccion.image_path, i + 1],
                    )

                    console.log(`Nueva sección creada para el blog ID ${blogId}, orden ${i + 1}`)
                }
            }

            // 3. Si hay más secciones existentes que nuevas, eliminar las sobrantes
            if (seccionesExistentes.length > nuevasSecciones.length) {
                const seccionesAEliminar = seccionesExistentes.slice(nuevasSecciones.length)

                for (const seccion of seccionesAEliminar) {
                    // Eliminar la sección
                    await t.none("DELETE FROM blog_sections WHERE id = $1", [seccion.id])
                    console.log(`Sección ID ${seccion.id} eliminada del blog ID ${blogId}`)

                    // Eliminar la imagen si existe
                    if (seccion.image_path) {
                        eliminarArchivo(seccion.image_path)
                    }
                }
            }

            return true
        })
    } catch (error) {
        console.error(`Error al actualizar secciones del blog ID ${blogId}:`, error)
        throw error
    }
}

/**
 * Actualiza un blog existente
 * @param {Object} blogData - Datos del blog a actualizar
 * @returns {Promise<boolean>} - true si se actualizó correctamente
 */
export async function actualizarBlog(blogData) {
    try {
      const result = await db.result("UPDATE blogs SET title = $1, description = $2, image_path = $3 WHERE id = $4", [
        blogData.title,
        blogData.description,
        blogData.image_path,
        blogData.id,
      ])
  
      console.log(`Blog ID ${blogData.id} actualizado. Filas afectadas: ${result.rowCount}`)
      return result.rowCount > 0
    } catch (error) {
      console.error(`Error al actualizar blog ID ${blogData.id}:`, error)
      throw error
    }
  }



