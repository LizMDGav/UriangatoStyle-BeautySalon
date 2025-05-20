document.addEventListener('DOMContentLoaded', async () => {

    // Verificar sesión de admin
    try {
        const sesionRes = await fetch("/api/usuarios/sesion");
        const sesion = await sesionRes.json();
        if (!sesion.loggedIn || sesion.tipo !== "admin") {
            window.location.href = "/index.html";
            return;
        }
    } catch (err) {
        console.error("Error al verificar sesión:", err);
        return;
    }
    // Referencias a elementos del DOM
    const periodoRadios = document.querySelectorAll('input[name="periodo"]');
    const fechaContainer = document.getElementById('fecha-container');
    const generarBtn = document.getElementById('generar-btn');

    // Instancia del gráfico
    let myChart = null;
    // Guardar el periodo actualmente seleccionado
    let periodoActual = document.querySelector('input[name="periodo"]:checked').value;

    // Cuando cambie el radio, actualizo selector y guardo el periodoActual
    periodoRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            actualizarSelectorFecha();
            periodoActual = document.querySelector('input[name="periodo"]:checked').value;
        });
    });

    generarBtn.addEventListener('click', generarReporte);

    // --- FUNCIONES ---

    // Inicializar selector de fecha según el periodo
    function actualizarSelectorFecha() {
        const periodo = document.querySelector('input[name="periodo"]:checked').value;
        fechaContainer.innerHTML = '';

        if (periodo === 'dia') {
            // Selector de día (calendario)
            const inputFecha = document.createElement('input');
            inputFecha.type = 'date';
            inputFecha.id = 'fecha-input';
            inputFecha.className = 'date-input';
            inputFecha.value = formatearFecha(new Date());
            fechaContainer.appendChild(inputFecha);

        } else if (periodo === 'mes') {
            // Selector de mes y año
            const meses = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];

            const selectMes = document.createElement('select');
            selectMes.id = 'mes-input';
            selectMes.className = 'date-input';
            meses.forEach((m, i) => {
                const opt = document.createElement('option');
                opt.value = i + 1;
                opt.textContent = m;
                selectMes.appendChild(opt);
            });
            // Preseleccionar mes actual
            selectMes.value = new Date().getMonth() + 1;

            const inputAnio = document.createElement('input');
            inputAnio.type = 'number';
            inputAnio.id = 'anio-input';
            inputAnio.className = 'date-input';
            inputAnio.min = '2000';
            inputAnio.max = '2100';
            inputAnio.value = new Date().getFullYear();
            // Bloquear teclas no numéricas (e, E, +, -, .)
            inputAnio.addEventListener('keydown', e => {
                if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
            });

            fechaContainer.appendChild(selectMes);
            fechaContainer.appendChild(inputAnio);

        } else if (periodo === 'anio') {
            // Selector de solo año
            const soloAnio = document.createElement('input');
            soloAnio.type = 'number';
            soloAnio.id = 'solo-anio-input';
            soloAnio.className = 'date-input';
            soloAnio.min = '2000';
            soloAnio.max = '2100';
            soloAnio.value = new Date().getFullYear();
            // Limitar a 4 dígitos
            soloAnio.addEventListener('input', () => {
                if (soloAnio.value.length > 4) {
                    soloAnio.value = soloAnio.value.slice(0, 4);
                }
            });
            // Bloquear teclas no numéricas (e, E, +, -, .)
            soloAnio.addEventListener('keydown', e => {
                if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
            });

            fechaContainer.appendChild(soloAnio);
        }
    }

    // Formatear fecha YYYY-MM-DD
    function formatearFecha(fecha) {
        const y = fecha.getFullYear();
        const m = String(fecha.getMonth() + 1).padStart(2, '0');
        const d = String(fecha.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // Hacer petición a la API
    async function obtenerDatosVentas(params) {
        let url = '/api/ventas/reporte?';
        Object.entries(params).forEach(([k, v]) => {
            url += `${k}=${v}&`;
        });

        console.log('URL de petición:', url);
        const res = await fetch(url);

        if (!res.ok) {
            const text = await res.text();
            console.error('Error en respuesta:', text);
            throw new Error(text || 'Error en la respuesta del servidor');
        }

        const data = await res.json();
        console.log('Datos crudos del servidor:', data);

        if (!data.success) {
            throw new Error(data.message || 'Error al obtener datos del servidor');
        }

        return {
            etiquetas: data.etiquetas || [],
            valores: data.valores || []
        };
    }

    // Manejar clic en "Generar reporte"
    function generarReporte() {
        const periodo = periodoActual;

        // Validaciones de año no vacío
        if (periodo === 'mes') {
            const anio = document.getElementById('anio-input').value.trim();
            if (!anio) {
                mostrarMensajeError('Por favor ingresa un año para el periodo mensual');
                return;
            }
        }
        if (periodo === 'anio') {
            const anio = document.getElementById('solo-anio-input').value.trim();
            if (!anio) {
                mostrarMensajeError('Por favor ingresa un año para el periodo anual');
                return;
            }
        }

        let params = {};

        if (periodo === 'dia') {
            params = {
                tipo: 'dia',
                fecha: document.getElementById('fecha-input').value
            };
        }
        else if (periodo === 'mes') {
            params = {
                tipo: 'mes',
                mes: document.getElementById('mes-input').value,
                anio: document.getElementById('anio-input').value
            };
        }
        else { // 'anio'
            params = {
                tipo: 'anio',
                anio: document.getElementById('solo-anio-input').value
            };
        }

        console.log('Parámetros a enviar:', params);

        obtenerDatosVentas(params)
            .then(datos => {
                console.log('Datos procesados:', datos);
                actualizarGrafico(datos, periodo, params);
            })
            .catch(err => {
                console.error(err);
                mostrarMensajeError(err.message);
            });
    }

    // Actualizar / crear el gráfico con rangos completos
    function actualizarGrafico(datos, periodo, params) {
        const container = document.querySelector('.grafica-container');
        if (myChart) myChart.destroy();

        container.innerHTML = '<canvas id="ventas-chart"></canvas>';
        const ctx = document.getElementById('ventas-chart').getContext('2d');

        // Construir etiquetas completas según periodo
        let etiquetasCompletas = [];
        if (periodo === 'dia') {
            for (let h = 8; h <= 19; h++) {
                etiquetasCompletas.push(`${String(h).padStart(2, '0')}:00`);
            }
        }
        else if (periodo === 'mes') {
            const mes = parseInt(params.mes, 10) - 1;
            const anio = parseInt(params.anio, 10);
            const dias = new Date(anio, mes + 1, 0).getDate();
            for (let d = 1; d <= dias; d++) {
                etiquetasCompletas.push(String(d));
            }
        }
        else {
            etiquetasCompletas = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];
        }

        // Mapear datos y rellenar ceros
        const mapaVentas = new Map();
        datos.etiquetas.forEach((etq, i) => {
            mapaVentas.set(etq, datos.valores[i]);
        });
        const valoresCompletos = etiquetasCompletas.map(etq =>
            mapaVentas.has(etq) ? mapaVentas.get(etq) : 0
        );

        if (valoresCompletos.every(v => v === 0)) {
            mostrarMensajeSinDatos();
            return;
        }

        const xAxisLabel = periodo === 'dia'
            ? 'Horas'
            : periodo === 'mes'
                ? 'Días'
                : 'Meses';
        const yAxisLabel = 'Pesos mexicanos';

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: etiquetasCompletas,
                datasets: [{
                    label: 'Ventas',
                    data: valoresCompletos,
                    tension: 0.3,
                    fill: true,
                    borderWidth: 2,
                    backgroundColor: 'rgba(74, 193, 160, 0.2)',
                    borderColor: 'rgba(74, 193, 160, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: xAxisLabel,
                            font: { size: 14, weight: 'bold' }
                        },
                        grid: { color: 'rgba(0, 0, 0, 0.1)' }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: yAxisLabel,
                            font: { size: 14, weight: 'bold' }
                        },
                        grid: { color: 'rgba(0, 0, 0, 0.1)' }
                    }
                },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
                }
            }
        });
    }

    // Mostrar mensaje “sin datos”
    function mostrarMensajeSinDatos() {
        const c = document.querySelector('.grafica-container');
        c.innerHTML = '';
        const div = document.createElement('div');
        div.className = 'mensaje-sin-datos';
        div.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <p>No hay ventas registradas en el periodo seleccionado</p>
        `;
        Object.assign(div.style, {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#6d463e',
            fontSize: '1.2rem',
            textAlign: 'center'
        });
        const i = div.querySelector('i');
        i.style.fontSize = '3rem';
        i.style.marginBottom = '1rem';
        c.appendChild(div);
    }

    // Mostrar mensaje de error
    function mostrarMensajeError(texto) {
        const c = document.querySelector('.grafica-container');
        c.innerHTML = '';
        const div = document.createElement('div');
        div.className = 'mensaje-error';
        div.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>${texto}</p>
        `;
        Object.assign(div.style, {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#d32f2f',
            fontSize: '1.2rem',
            textAlign: 'center'
        });
        const i = div.querySelector('i');
        i.style.fontSize = '3rem';
        i.style.marginBottom = '1rem';
        c.appendChild(div);
    }

    // Inicializar al cargar
    actualizarSelectorFecha();
    generarReporte();
});
