// =========================================================
// CONSULTA DE NÓMINA
// LA DIVINATA
// =========================================================


// =========================================================
// ELEMENTOS
// =========================================================

const archivoInput = document.getElementById("archivo");
const nombreArchivo = document.getElementById("nombreArchivo");
const btnSubir = document.getElementById("btnSubir");
const mensajeUpload = document.getElementById("mensajeUpload");
const status = document.getElementById("status");
const summary = document.getElementById("summary");
const totalEmpleados = document.getElementById("totalEmpleados");
const nombreHoja = document.getElementById("nombreHoja");
const searchSection = document.getElementById("searchSection");
const busqueda = document.getElementById("busqueda");
const btnLimpiar = document.getElementById("btnLimpiar");
const resultadosSection = document.getElementById("resultadosSection");
const listaResultados = document.getElementById("listaResultados");
const contadorResultados = document.getElementById("contadorResultados");
const detalleSection = document.getElementById("detalleSection");
const detalleNombre = document.getElementById("detalleNombre");
const detalleNumero = document.getElementById("detalleNumero");
const detalleTotal = document.getElementById("detalleTotal");
const detalleContenido = document.getElementById("detalleContenido");
const comentariosContainer = document.getElementById("comentariosContainer");
const detalleComentarios = document.getElementById("detalleComentarios");
const emptyState = document.getElementById("emptyState");
const btnPDF = document.getElementById("btnPDF");


// =========================================================
// COLUMNAS EXACTAS DEL EXCEL
// =========================================================

const columnas = [

    "NO. EMPLEADO",
    "NOMBRE",
    "DEPARTAMANETO",
    "SALARIO DIARIO",
    "SALARIO HORA",
    "BONO MAX P&A",
    "BONO P&A",
    "COMPENSACION BASE",
    "REINTEGRO IMPUESTOS",
    "BONO VENTA META",
    "Bono KPIs",
    "HORAS DOMINGO",
    "PAGO DOMINGO (PLANTA)",
    "PRIMA DOMINICAL (SUCURSALES)",
    "HORAS DOBLES",
    "HORAS TRIPLES",
    "TE DOBLE",
    "TE TRIPLE",
    "REDUCCION POR PRESTAMO",
    "OTROS",
    "APOYO DE TRANSPORTE / UBER",
    "Diferencia Prima Vacacional",
    "BONO POR REFERIDO",
    "BONO DE   ANIVERSARIO",
    "TOTAL A DISPERSAR",
    "COMENTARIOS"

];


// =========================================================
// CAMPOS MONETARIOS
// =========================================================

const camposMoneda = [

    "SALARIO DIARIO",
    "SALARIO HORA",
    "BONO MAX P&A",
    "BONO P&A",
    "COMPENSACION BASE",
    "REINTEGRO IMPUESTOS",
    "BONO VENTA META",
    "Bono KPIs",
    "PAGO DOMINGO (PLANTA)",
    "PRIMA DOMINICAL (SUCURSALES)",
    "TE DOBLE",
    "TE TRIPLE",
    "REDUCCION POR PRESTAMO",
    "OTROS",
    "APOYO DE TRANSPORTE / UBER",
    "Diferencia Prima Vacacional",
    "BONO POR REFERIDO",
    "BONO DE   ANIVERSARIO",
    "TOTAL A DISPERSAR"

];


// =========================================================
// SELECCIONAR ARCHIVO
// =========================================================

archivoInput.addEventListener("change", () => {

    if (archivoInput.files.length === 0) {

        nombreArchivo.textContent =
            "Ningún archivo seleccionado";

        btnSubir.disabled = true;

        return;
    }


    const archivo =
        archivoInput.files[0];


    nombreArchivo.textContent =
        archivo.name;


    btnSubir.disabled =
        false;


    mensajeUpload.textContent =
        "";

});


// =========================================================
// SUBIR EXCEL
// =========================================================

btnSubir.addEventListener("click", async () => {

    if (archivoInput.files.length === 0) {
        return;
    }


    const archivo =
        archivoInput.files[0];


    const formData =
        new FormData();


    formData.append(
        "archivo",
        archivo
    );


    btnSubir.disabled =
        true;


    btnSubir.textContent =
        "Procesando...";


    mensajeUpload.textContent =
        "Procesando archivo Excel...";


    mensajeUpload.style.color =
        "#6BA539";


    try {

        const respuesta =
            await fetch(
                "/api/nomina/upload",
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                data.error ||
                "Error al subir el archivo."
            );

        }


        totalEmpleados.textContent =
            data.empleados;


        nombreHoja.textContent =
            data.hoja;


        summary.style.display =
            "grid";


        searchSection.style.display =
            "block";


        emptyState.style.display =
            "none";


        resultadosSection.style.display =
            "none";


        detalleSection.style.display =
            "none";


        status.textContent =
            "✓ Nómina cargada";


        status.style.background =
            "#D2D755";


        status.style.color =
            "#4A7729";


        mensajeUpload.textContent =
            `✓ Nómina cargada correctamente. ${data.empleados} colaboradores encontrados.`;


        mensajeUpload.style.color =
            "#4A7729";


        busqueda.value =
            "";


        busqueda.focus();


    } catch (error) {

        console.error(error);


        mensajeUpload.textContent =
            error.message;


        mensajeUpload.style.color =
            "#c0392b";

    } finally {

        btnSubir.disabled =
            false;


        btnSubir.textContent =
            "Subir nómina";

    }

});


// =========================================================
// BUSCADOR
// =========================================================

let timerBusqueda = null;


busqueda.addEventListener("input", () => {

    clearTimeout(timerBusqueda);


    timerBusqueda =
        setTimeout(() => {

            realizarBusqueda(
                busqueda.value
            );

        }, 200);

});


// =========================================================
// REALIZAR BÚSQUEDA
// =========================================================

async function realizarBusqueda(texto) {

    texto =
        texto.trim();


    detalleSection.style.display =
        "none";


    if (!texto) {

        resultadosSection.style.display =
            "none";

        return;
    }


    try {

        const respuesta =
            await fetch(
                `/api/nomina/buscar?texto=${encodeURIComponent(texto)}`
            );


        const resultados =
            await respuesta.json();


        mostrarResultados(
            resultados
        );


    } catch (error) {

        console.error(error);


        resultadosSection.style.display =
            "block";


        listaResultados.innerHTML = `

            <div class="card">

                Error al realizar la búsqueda.

            </div>

        `;

    }

}


// =========================================================
// MOSTRAR RESULTADOS
// =========================================================

function mostrarResultados(resultados) {

    resultadosSection.style.display =
        "block";


    listaResultados.innerHTML =
        "";


    contadorResultados.textContent =
        `${resultados.length} resultado${resultados.length === 1 ? "" : "s"}`;


    if (resultados.length === 0) {

        listaResultados.innerHTML = `

            <div class="card">

                <strong>
                    No se encontraron colaboradores.
                </strong>

                <p style="
                    margin-top:6px;
                    color:#707766;
                ">

                    Intenta con otro número o nombre.

                </p>

            </div>

        `;

        return;
    }


    resultados.forEach(empleado => {

        const item =
            document.createElement("div");


        item.className =
            "result-item";


        const numero =
            empleado["NO. EMPLEADO"] || "-";


        const nombre =
            empleado["NOMBRE"] || "Sin nombre";


        const departamento =
            empleado["DEPARTAMANETO"] || "";


        item.innerHTML = `

            <div>

                <div class="result-name">

                    ${escapeHTML(nombre)}

                </div>


                <div class="result-number">

                    No. empleado:
                    ${escapeHTML(numero)}

                    ${
                        departamento
                        ? ` · ${escapeHTML(departamento)}`
                        : ""
                    }

                </div>

            </div>


            <div class="result-arrow">
                →
            </div>

        `;


        item.addEventListener("click", () => {

            mostrarEmpleado(
                empleado
            );

        });


        listaResultados.appendChild(
            item
        );

    });

}


// =========================================================
// MOSTRAR EMPLEADO
// =========================================================

function mostrarEmpleado(empleado) {

    detalleSection.style.display =
        "block";


    const nombre =
        empleado["NOMBRE"] || "Sin nombre";


    const numero =
        empleado["NO. EMPLEADO"] || "-";


    detalleNombre.textContent =
        nombre;


    detalleNumero.textContent =
        `No. empleado: ${numero}`;


    detalleTotal.textContent =
        formatoMoneda(
            empleado["TOTAL A DISPERSAR"]
        );


    detalleContenido.innerHTML =
        "";


    columnas.forEach(columna => {

        if (

            columna === "NO. EMPLEADO" ||

            columna === "NOMBRE" ||

            columna === "TOTAL A DISPERSAR" ||

            columna === "COMENTARIOS"

        ) {

            return;

        }


        const valor =
            empleado[columna] ?? "";


        const item =
            document.createElement("div");


        item.className =
            "detail-item";


        const label =
            document.createElement("span");


        label.className =
            "detail-label";


        label.textContent =
            columna;


        const value =
            document.createElement("span");


        value.className =
            "detail-value";


        if (
            camposMoneda.includes(columna)
        ) {

            value.textContent =
                formatoMoneda(valor);

        } else {

            value.textContent =
                valor === ""
                ? "-"
                : valor;

        }


        item.appendChild(label);

        item.appendChild(value);

        detalleContenido.appendChild(item);

    });


    const comentarios =
        empleado["COMENTARIOS"] || "";


    if (comentarios !== "") {

        comentariosContainer.style.display =
            "block";


        detalleComentarios.textContent =
            comentarios;

    } else {

        comentariosContainer.style.display =
            "none";

    }


    detalleSection.scrollIntoView({

        behavior: "smooth",

        block: "start"

    });

}


// =========================================================
// FORMATO MONEDA
// =========================================================

function formatoMoneda(valor) {

    if (

        valor === null ||

        valor === undefined ||

        valor === ""

    ) {

        return "$0.00";

    }


    let numero;


    if (typeof valor === "number") {

        numero =
            valor;

    } else {

        let texto =
            String(valor)
                .replace(/\$/g, "")
                .replace(/,/g, "")
                .trim();


        numero =
            Number(texto);

    }


    if (Number.isNaN(numero)) {

        return String(valor);

    }


    return numero.toLocaleString(
        "es-MX",
        {
            style: "currency",
            currency: "MXN"
        }
    );

}


// =========================================================
// LIMPIAR BÚSQUEDA
// =========================================================

btnLimpiar.addEventListener("click", () => {

    busqueda.value =
        "";


    resultadosSection.style.display =
        "none";


    detalleSection.style.display =
        "none";


    busqueda.focus();

});

// =========================================================
// GENERAR PDF
// =========================================================

btnPDF.addEventListener(
    "click",
    async () => {

        const numero =
            detalleNumero.textContent
                .replace(
                    "No. empleado:",
                    ""
                )
                .trim();


        if (!numero) {

            alert(
                "No hay un colaborador seleccionado."
            );

            return;

        }


        // =========================================
        // BOTÓN
        // =========================================

        btnPDF.disabled =
            true;


        btnPDF.textContent =
            "Generando PDF...";


        try {

            console.log(
                "Solicitando PDF al servidor..."
            );


            const respuesta =
                await fetch(
                    `/api/nomina/pdf/${encodeURIComponent(numero)}`
                );


            if (!respuesta.ok) {

                let mensaje =
                    "No fue posible generar el PDF.";


                try {

                    const error =
                        await respuesta.json();


                    mensaje =
                        error.error ||
                        mensaje;

                } catch (e) {

                    // No hacer nada

                }


                throw new Error(
                    mensaje
                );

            }


            // =========================================
            // OBTENER PDF
            // =========================================

            const blob =
                await respuesta.blob();


            console.log(
                "PDF recibido:",
                blob.size,
                "bytes"
            );


            if (
                blob.size === 0
            ) {

                throw new Error(
                    "El servidor generó un PDF vacío."
                );

            }


            // =========================================
            // CREAR DESCARGA
            // =========================================

            const url =
                window.URL.createObjectURL(
                    blob
                );


            const enlace =
                document.createElement(
                    "a"
                );


            enlace.href =
                url;


            const nombre =
                detalleNombre.textContent
                    .trim();


            enlace.download =
                `Nomina_${limpiarNombreArchivo(numero)}_${limpiarNombreArchivo(nombre)}.pdf`;


            document.body.appendChild(
                enlace
            );


            enlace.click();


            enlace.remove();


            window.URL.revokeObjectURL(
                url
            );


            console.log(
                "PDF descargado correctamente."
            );


        } catch (error) {

            console.error(
                "ERROR PDF:",
                error
            );


            alert(
                error.message
            );


        } finally {

            btnPDF.disabled =
                false;


            btnPDF.textContent =
                "📄 Descargar PDF";

        }

    }
);


// =========================================================
// LIMPIAR NOMBRE DE ARCHIVO
// =========================================================

function limpiarNombreArchivo(
    texto
) {

    return String(texto)

        .replace(
            /[<>:"/\\|?*]/g,
            ""
        )

        .replace(
            /\s+/g,
            "_"
        )

        .substring(
            0,
            80
        );

}

// =========================================================
// LIMPIAR NOMBRE DE ARCHIVO
// =========================================================

function limpiarNombreArchivo(texto) {

    return String(texto)

        .replace(
            /[<>:"/\\|?*]/g,
            ""
        )

        .replace(
            /\s+/g,
            "_"
        )

        .substring(
            0,
            80
        );

}


// =========================================================
// SEGURIDAD HTML
// =========================================================

function escapeHTML(valor) {

    return String(valor)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}