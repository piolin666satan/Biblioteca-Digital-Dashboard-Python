document.addEventListener('DOMContentLoaded', () => {
    // 1. CONFIGURACIÓN
    // Asegúrate de que este nombre coincida con el que generaste en exportar.py
    const jsonPath = './alquimia_literaria.json'; 
    let datosGlobales = []; 
    let ordenAscendente = true;
    let columnaActual = 'titulo';

    // Elementos del DOM
    const cuerpoTabla = document.getElementById('cuerpo-tabla');
    const inputBuscador = document.getElementById('buscador');
    const selectCategoria = document.getElementById('filtro-categoria');

    const selectAnalitico = document.getElementById('filtro-analitico');
    selectAnalitico.addEventListener('change', filtrarYProcesar);
    
    // 2. LECTURA DEL JSON GENERADO POR PYTHON
    fetch(jsonPath)
        .then(response => {
            if (!response.ok) throw new Error("No se pudo cargar el archivo JSON.");
            return response.json();
        })
        .then(data => {
            datosGlobales = data;

            // Extraer categorías únicas para llenar el selector (dropdown) dinámicamente
            const categoriasUnicas = [...new Set(datosGlobales.map(item => item.categoria))].sort();
            categoriasUnicas.forEach(cat => {
                if(cat) {
                    const opcion = document.createElement('option');
                    opcion.value = cat;
                    opcion.textContent = cat;
                    selectCategoria.appendChild(opcion);
                }
            });

            // Arrancamos el dashboard
            filtrarYProcesar();
        })
        .catch(err => {
            console.error("Error en frontend:", err);
            cuerpoTabla.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center; font-weight:bold;">⚠️ Error cargando el JSON. Asegúrate de que el archivo existe en la carpeta Frontend y corriste tu backend.</td></tr>`;
        });

    // 3. EVENTOS DE BÚSQUEDA Y FILTROS
    inputBuscador.addEventListener('input', filtrarYProcesar);
    selectCategoria.addEventListener('change', filtrarYProcesar);

function filtrarYProcesar() {
    const busqueda = inputBuscador.value.toLowerCase().trim();
    const categoriaSeleccionada = selectCategoria.value;
    const vistaAnalitica = selectAnalitico.value; // Nueva lógica

    let datosFiltrados = datosGlobales.filter(item => {
        const titulo = item.titulo ? item.titulo.toLowerCase() : "";
        const autor = item.autor ? item.autor.toLowerCase() : "";
        
        const coincideBusqueda = titulo.includes(busqueda) || autor.includes(busqueda);
        const coincideCategoria = categoriaSeleccionada === "TODAS" || item.categoria === categoriaSeleccionada;

        return coincideBusqueda && coincideCategoria;
    });

    // Lógica para vistas especiales
    if (vistaAnalitica === 'TOP_RATING') {
        datosFiltrados = datosFiltrados.filter(item => item.calificacion_usuarios > 4.0);
    } else if (vistaAnalitica === 'MAX_STOCK') {
        // Ordenamos por stock descendente y tomamos los primeros 20
        datosFiltrados.sort((a, b) => b.stock_disponible - a.stock_disponible);
        datosFiltrados = datosFiltrados.slice(0, 20);
    } else if (vistaAnalitica === 'PREDOMINANTE') {
        // Encontrar la categoría que más libros tiene
        const conteo = {};
        datosFiltrados.forEach(item => conteo[item.categoria] = (conteo[item.categoria] || 0) + 1);
        const categoriaTop = Object.keys(conteo).reduce((a, b) => conteo[a] > conteo[b] ? a : b);
        datosFiltrados = datosFiltrados.filter(item => item.categoria === categoriaTop);
    } else {
        // Ordenamiento normal
        datosFiltrados = aplicarOrdenamiento(datosFiltrados);
    }

    actualizarDashboard(datosFiltrados);
}

    // 4. ORDENAMIENTO EN TABLA
    document.getElementById('th-titulo').addEventListener('click', () => ejecutarOrdenamiento('titulo'));
    document.getElementById('th-autor').addEventListener('click', () => ejecutarOrdenamiento('autor'));
    document.getElementById('th-categoria').addEventListener('click', () => ejecutarOrdenamiento('categoria'));
    document.getElementById('th-calificacion').addEventListener('click', () => ejecutarOrdenamiento('calificacion_usuarios'));
    document.getElementById('th-stock').addEventListener('click', () => ejecutarOrdenamiento('stock_disponible'));

    function ejecutarOrdenamiento(propiedad) {
        if (columnaActual === propiedad) {
            ordenAscendente = !ordenAscendente; 
        } else {
            columnaActual = propiedad;
            ordenAscendente = true; 
        }
        filtrarYProcesar();
    }

    function aplicarOrdenamiento(datos) {
        return datos.sort((a, b) => {
            let valA = a[columnaActual];
            let valB = b[columnaActual];

            if (typeof valA === 'string') {
                return ordenAscendente ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else {
                return ordenAscendente ? valA - valB : valB - valA;
            }
        });
    }

    // 5. RENDERIZADO DE TABLA Y KPIs
    function actualizarDashboard(datos) {
        let totalStock = 0;
        let sumaCalificaciones = 0;
        let htmlFilas = '';
        const mapaCategorias = {};

        // Solo renderizamos las primeras 1000 filas en HTML para no bloquear el navegador,
        // pero los cálculos de gráficos y KPIs sí se hacen con las 10.000 (o las filtradas)
        const datosParaTabla = datos.slice(0, 1000); 

        datos.forEach(reg => {
            totalStock += reg.stock_disponible || 0;
            sumaCalificaciones += reg.calificacion_usuarios || 0;

            // Agrupamos para los gráficos
            const cat = reg.categoria || "Sin categoría";
            if (!mapaCategorias[cat]) {
                mapaCategorias[cat] = { cantidad_libros: 0, stock_total: 0 };
            }
            mapaCategorias[cat].cantidad_libros += 1;
            mapaCategorias[cat].stock_total += reg.stock_disponible;
        });

        // Crear las filas de la tabla
        datosParaTabla.forEach(reg => {
            htmlFilas += `
                <tr>
                    <td><strong>${reg.titulo}</strong></td>
                    <td>${reg.autor}</td>
                    <td>${reg.categoria}</td>
                    <td class="rating">⭐ ${reg.calificacion_usuarios.toFixed(2)}</td>
                    <td>${reg.stock_disponible}</td>
                </tr>
            `;
        });

        // Cálculos de KPIs
        const promedio = datos.length > 0 ? (sumaCalificaciones / datos.length).toFixed(2) : "0.00";

        document.getElementById('kpi-titulos').textContent = datos.length.toLocaleString();
        document.getElementById('kpi-stock').textContent = totalStock.toLocaleString();
        document.getElementById('kpi-promedio').textContent = promedio;

        cuerpoTabla.innerHTML = htmlFilas || `<tr><td colspan="5" style="text-align:center; padding: 20px;">No se encontraron libros.</td></tr>`;

        // Generar gráficos
        generarGraficosPlotly(mapaCategorias);
    }

    // 6. GRÁFICOS (Plotly.js)
    function generarGraficosPlotly(mapaCategorias) {
        const categorias = Object.keys(mapaCategorias);
        const cantidadLibros = categorias.map(c => mapaCategorias[c].cantidad_libros);
        const stockTotal = categorias.map(c => mapaCategorias[c].stock_total);

        if (categorias.length === 0) {
            document.getElementById('grafico-barras').innerHTML = "<p>Sin datos</p>";
            document.getElementById('grafico-torta').innerHTML = "<p>Sin datos</p>";
            return;
        }

        // Gráfico de Barras: Stock Total por Categoría
        const traceStock = {
            x: categorias, 
            y: stockTotal,
            type: 'bar', 
            marker: { color: '#0b5394' }
        };
        const layoutBarras = {
            title: 'Stock Total Disponible por Categoría',
            margin: { b: 80 },
            xaxis: { tickangle: -45, automargin: true }
        };
        Plotly.newPlot('grafico-barras', [traceStock], layoutBarras, {responsive: true});

        // Gráfico de Torta: Distribución de Títulos (Cantidad de libros)
        const dataTorta = [{
            values: cantidadLibros,
            labels: categorias,
            type: 'pie',
            hole: 0.4,
            textinfo: 'percent',
            marker: { colors: ['#0b5394', '#3d85c6', '#6fa8dc', '#9fc5e8', '#cfe2f3'] }
        }];
        const layoutTorta = {
            title: 'Distribución del Inventario',
            margin: { l: 20, r: 20, b: 20, t: 50 }
        };
        Plotly.newPlot('grafico-torta', dataTorta, layoutTorta, {responsive: true});
    }
});