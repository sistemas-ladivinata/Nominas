const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");

const app = express();
const PORT = process.env.PORT || 3000;


// =========================================================
// CONFIGURACIÓN
// =========================================================

app.use(cors());
app.use(express.json());
app.use(express.static("public"));


// =========================================================
// CARPETA UPLOADS
// =========================================================

const uploadsPath =
    path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath);
}


// =========================================================
// MULTER
// =========================================================

const storage =
    multer.diskStorage({
        destination: function (req, file, cb) {
            cb(
                null,
                uploadsPath
            );
        },

        filename: function (req, file, cb) {
            cb(
                null,
                "nomina" +
                path.extname(file.originalname)
            );
        }
    });


const upload =
    multer({
        storage
    });

// =========================================================
// VARIABLE PARA GUARDAR LA NÓMINA
// =========================================================

let empleados = [];


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
// SUBIR EXCEL
// =========================================================

app.post(
    "/api/nomina/upload",
    upload.single("archivo"),
    (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    error:
                        "No se recibió ningún archivo."
                });
            }


            console.log("");
            console.log("=================================");
            console.log("       EXCEL RECIBIDO");
            console.log("=================================");
            console.log(
                "Archivo:",
                req.file.originalname
            );


            const workbook =
                XLSX.readFile(
                    req.file.path
                );
            console.log(
                "Hojas encontradas:"
            );
            console.log(
                workbook.SheetNames
            );


            let nombreHoja =
                workbook.SheetNames.find(
                    nombre =>
                        nombre
                            .toLowerCase()
                            .includes(
                                "extras semana"
                            )
                );


            if (!nombreHoja) {

                nombreHoja =
                    workbook.SheetNames[0];

            }


            console.log(
                "Hoja utilizada:",
                nombreHoja
            );


            const hoja =
                workbook.Sheets[
                    nombreHoja
                ];


            const datos =
                XLSX.utils.sheet_to_json(
                    hoja,
                    {
                        defval: ""
                    }
                );


            console.log(
                "Registros encontrados:",
                datos.length
            );


            empleados =
                datos;


            fs.unlinkSync(
                req.file.path
            );


            res.json({

                success:
                    true,

                hoja:
                    nombreHoja,

                empleados:
                    empleados.length

            });


        } catch (error) {

            console.error(
                "ERROR:",
                error
            );


            res.status(500).json({

                error:
                    "No fue posible procesar el archivo.",

                detalle:
                    error.message

            });

        }

    }
);


// =========================================================
// OBTENER TODOS
// =========================================================

app.get(
    "/api/nomina/empleados",
    (req, res) => {

        res.json({

            total:
                empleados.length,

            empleados:
                empleados

        });

    }
);


// =========================================================
// BUSCAR
// =========================================================

app.get(
    "/api/nomina/buscar",
    (req, res) => {

        const texto =
            (req.query.texto || "")
                .toString()
                .trim()
                .toLowerCase();


        if (!texto) {

            return res.json([]);

        }


        const resultados =
            empleados.filter(
                empleado => {

                    const numero =
                        String(
                            empleado[
                                "NO. EMPLEADO"
                            ] || ""
                        )
                        .toLowerCase();


                    const nombre =
                        String(
                            empleado[
                                "NOMBRE"
                            ] || ""
                        )
                        .toLowerCase();


                    return (

                        numero.includes(
                            texto
                        )

                        ||

                        nombre.includes(
                            texto
                        )

                    );

                }
            );


        res.json(
            resultados
        );

    }
);


// =========================================================
// OBTENER UN EMPLEADO
// =========================================================

app.get(
    "/api/nomina/empleado/:numero",
    (req, res) => {

        const numeroBuscado =
            String(
                req.params.numero
            )
            .trim()
            .toLowerCase();


        const empleado =
            empleados.find(
                e =>
                    String(
                        e[
                            "NO. EMPLEADO"
                        ] || ""
                    )
                    .trim()
                    .toLowerCase()
                    ===
                    numeroBuscado
            );


        if (!empleado) {

            return res.status(404).json({

                error:
                    "Empleado no encontrado."

            });

        }


        res.json(
            empleado
        );

    }
);


// =========================================================
// FUNCIÓN PARA FORMATO MONEDA
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


    if (
        typeof valor === "number"
    ) {

        numero =
            valor;

    } else {

        numero =
            Number(
                String(valor)
                    .replace(/\$/g, "")
                    .replace(/,/g, "")
                    .trim()
            );

    }


    if (
        Number.isNaN(numero)
    ) {

        return String(valor);

    }


    return numero.toLocaleString(
        "es-MX",
        {
            style:
                "currency",

            currency:
                "MXN"
        }
    );

}


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
// PDF DE EMPLEADO
// =========================================================

app.get(
    "/api/nomina/pdf/:numero",
    (req, res) => {

        try {

            const numeroBuscado =
                String(
                    req.params.numero
                )
                .trim()
                .toLowerCase();


            // =========================================
            // BUSCAR EMPLEADO
            // =========================================

            const empleado =
                empleados.find(
                    e =>
                        String(
                            e[
                                "NO. EMPLEADO"
                            ] || ""
                        )
                        .trim()
                        .toLowerCase()
                        ===
                        numeroBuscado
                );


            if (!empleado) {

                return res.status(404).json({

                    error:
                        "Empleado no encontrado."

                });

            }


            const nombre =
                empleado[
                    "NOMBRE"
                ] || "Sin nombre";


            const numero =
                empleado[
                    "NO. EMPLEADO"
                ] || "-";


            // =========================================
            // CREAR PDF
            // =========================================

            const doc =
                new PDFDocument({

                    size:
                        "A4",

                    margins: {

                        top:
                            45,

                        bottom:
                            45,

                        left:
                            45,

                        right:
                            45

                    },

                    bufferPages:
                        true

                });


            const nombreArchivo =
                `Nomina_${limpiarNombreArchivo(numero)}_${limpiarNombreArchivo(nombre)}.pdf`;


            res.setHeader(
                "Content-Type",
                "application/pdf"
            );


            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${nombreArchivo}"`
            );


            doc.pipe(res);


            // =========================================
            // COLORES LA DIVINATA
            // =========================================

            const VERDE_OSCURO =
                "#4A7729";

            const VERDE =
                "#6BA539";

            const VERDE_LIMA =
                "#D2D755";

            const AMARILLO =
                "#E9E186";

            const GRIS =
                "#707766";

            const BORDE =
                "#E1E5D9";

            const FONDO =
                "#F7F8F3";


            // =========================================
            // ENCABEZADO
            // =========================================

            doc
                .fillColor(
                    VERDE_OSCURO
                )
                .fontSize(
                    25
                )
                .font(
                    "Helvetica-Bold"
                )
                .text(
                    "LA DIVINATA",
                    {
                        align:
                            "center"
                    }
                );


            doc
                .fillColor(
                    VERDE
                )
                .fontSize(
                    14
                )
                .text(
                    "DESGLOSE DE NÓMINA",
                    {
                        align:
                            "center"
                    }
                );


            doc
                .moveDown(
                    0.6
                );


            doc
                .strokeColor(
                    VERDE_OSCURO
                )
                .lineWidth(
                    2
                )
                .moveTo(
                    45,
                    doc.y
                )
                .lineTo(
                    550,
                    doc.y
                )
                .stroke();


            doc.moveDown(
                1
            );


            // =========================================
            // INFORMACIÓN DEL EMPLEADO
            // =========================================

            const inicioEmpleado =
                doc.y;


            doc
                .roundedRect(
                    45,
                    inicioEmpleado,
                    505,
                    75,
                    8
                )
                .fill(
                    FONDO
                );


            doc
                .fillColor(
                    VERDE
                )
                .fontSize(
                    9
                )
                .font(
                    "Helvetica-Bold"
                )
                .text(
                    "COLABORADOR",
                    60,
                    inicioEmpleado + 13
                );


            doc
                .fillColor(
                    VERDE_OSCURO
                )
                .fontSize(
                    17
                )
                .font(
                    "Helvetica-Bold"
                )
                .text(
                    String(nombre),
                    60,
                    inicioEmpleado + 29
                );


            doc
                .fillColor(
                    GRIS
                )
                .fontSize(
                    10
                )
                .font(
                    "Helvetica"
                )
                .text(
                    `No. empleado: ${numero}`,
                    60,
                    inicioEmpleado + 52
                );


            const departamento =
                empleado[
                    "DEPARTAMANETO"
                ] || "";


            if (departamento) {

                doc.text(
                    `Departamento: ${departamento}`,
                    300,
                    inicioEmpleado + 52
                );

            }


            doc.y =
                inicioEmpleado + 95;


            // =========================================
            // SECCIONES
            // =========================================

            function tituloSeccion(
                titulo
            ) {

                if (
                    doc.y > 730
                ) {

                    doc.addPage();

                }


                doc
                    .fillColor(
                        VERDE_OSCURO
                    )
                    .fontSize(
                        12
                    )
                    .font(
                        "Helvetica-Bold"
                    )
                    .text(
                        titulo
                    );


                doc.moveDown(
                    0.35
                );

            }


            // =========================================
            // CAMPOS PRINCIPALES
            // =========================================

            tituloSeccion(
                "DATOS SALARIALES"
            );


            const camposSalario = [

                "SALARIO DIARIO",
                "SALARIO HORA",
                "COMPENSACION BASE"

            ];


            dibujarCampos(
                camposSalario
            );


            // =========================================
            // BONOS
            // =========================================

            tituloSeccion(
                "BONOS Y COMPENSACIONES"
            );


            const camposBonos = [

                "BONO MAX P&A",
                "BONO P&A",
                "REINTEGRO IMPUESTOS",
                "BONO VENTA META",
                "Bono KPIs",
                "BONO POR REFERIDO",
                "BONO DE   ANIVERSARIO"

            ];


            dibujarCampos(
                camposBonos
            );


            // =========================================
            // HORAS
            // =========================================

            tituloSeccion(
                "HORAS Y PRIMAS"
            );


            const camposHoras = [

                "HORAS DOMINGO",
                "PAGO DOMINGO (PLANTA)",
                "PRIMA DOMINICAL (SUCURSALES)",
                "HORAS DOBLES",
                "HORAS TRIPLES",
                "TE DOBLE",
                "TE TRIPLE"

            ];


            dibujarCampos(
                camposHoras
            );


            // =========================================
            // OTROS
            // =========================================

            tituloSeccion(
                "OTROS CONCEPTOS"
            );


            const camposOtros = [

                "REDUCCION POR PRESTAMO",
                "OTROS",
                "APOYO DE TRANSPORTE / UBER",
                "Diferencia Prima Vacacional"

            ];


            dibujarCampos(
                camposOtros
            );


            // =========================================
            // TOTAL
            // =========================================

            if (
                doc.y > 680
            ) {

                doc.addPage();

            }


            doc.moveDown(
                0.8
            );


            const totalY =
                doc.y;


            doc
                .roundedRect(
                    45,
                    totalY,
                    505,
                    75,
                    8
                )
                .fill(
                    VERDE_OSCURO
                );


            doc
                .fillColor(
                    AMARILLO
                )
                .fontSize(
                    10
                )
                .font(
                    "Helvetica-Bold"
                )
                .text(
                    "TOTAL A DISPERSAR",
                    65,
                    totalY + 16
                );


            doc
                .fillColor(
                    "#FFFFFF"
                )
                .fontSize(
                    23
                )
                .font(
                    "Helvetica-Bold"
                )
                .text(
                    formatoMoneda(
                        empleado[
                            "TOTAL A DISPERSAR"
                        ]
                    ),
                    65,
                    totalY + 32,
                    {
                        width:
                            465,

                        align:
                            "right"
                    }
                );


            doc.y =
                totalY + 95;


            // =========================================
            // COMENTARIOS
            // =========================================

            const comentarios =
                empleado[
                    "COMENTARIOS"
                ] || "";


            if (
                String(comentarios).trim()
            ) {

                if (
                    doc.y > 700
                ) {

                    doc.addPage();

                }


                tituloSeccion(
                    "COMENTARIOS"
                );


                doc
                    .roundedRect(
                        45,
                        doc.y,
                        505,
                        60,
                        6
                    )
                    .fill(
                        FONDO
                    );


                doc
                    .fillColor(
                        "#4F5848"
                    )
                    .fontSize(
                        10
                    )
                    .font(
                        "Helvetica"
                    )
                    .text(
                        String(comentarios),
                        60,
                        doc.y + 13,
                        {
                            width:
                                475
                        }
                    );


                doc.moveDown(
                    4
                );

            }


            // =========================================
            // PIE DE PÁGINA
            // =========================================

            const rangoPaginas =
                doc.bufferedPageRange();


            for (
                let i =
                    rangoPaginas.start;

                i <
                rangoPaginas.start +
                rangoPaginas.count;

                i++
            ) {

                doc.switchToPage(
                    i
                );


                doc
                    .fillColor(
                        GRIS
                    )
                    .fontSize(
                        8
                    )
                    .font(
                        "Helvetica"
                    )
                    .text(
                        `La Divinata · Desglose de nómina · Página ${i + 1} de ${rangoPaginas.count}`,
                        45,
                        780,
                        {
                            width:
                                505,

                            align:
                                "center"
                        }
                    );

            }


            // =========================================
            // FINALIZAR
            // =========================================

            doc.end();


            // =========================================
            // FUNCIÓN PARA DIBUJAR CAMPOS
            // =========================================

            function dibujarCampos(
                campos
            ) {

                const ancho =
                    245;

                const alto =
                    45;

                const separacion =
                    15;


                campos.forEach(
                    (campo, index) => {

                        const columna =
                            index % 2;

                        const x =
                            45 +
                            columna *
                            (ancho + 15);


                        if (
                            columna === 0 &&
                            index > 0
                        ) {

                            doc.y +=
                                separacion;

                        }


                        if (
                            doc.y + alto >
                            750
                        ) {

                            doc.addPage();

                        }


                        const y =
                            doc.y;


                        doc
                            .roundedRect(
                                x,
                                y,
                                ancho,
                                alto,
                                6
                            )
                            .fillAndStroke(
                                "#FBFCF8",
                                BORDE
                            );


                        doc
                            .fillColor(
                                GRIS
                            )
                            .fontSize(
                                8
                            )
                            .font(
                                "Helvetica"
                            )
                            .text(
                                campo,
                                x + 10,
                                y + 9,
                                {
                                    width:
                                        ancho - 20,

                                    ellipsis:
                                        true
                                }
                            );


                        let valor =
                            empleado[
                                campo
                            ];


                        if (
                            camposMoneda.includes(
                                campo
                            )
                        ) {

                            valor =
                                formatoMoneda(
                                    valor
                                );

                        } else if (
                            valor === "" ||
                            valor === null ||
                            valor === undefined
                        ) {

                            valor =
                                "-";

                        }


                        doc
                            .fillColor(
                                "#30382A"
                            )
                            .fontSize(
                                11
                            )
                            .font(
                                "Helvetica-Bold"
                            )
                            .text(
                                String(valor),
                                x + 10,
                                y + 24,
                                {
                                    width:
                                        ancho - 20,

                                    ellipsis:
                                        true
                                }
                            );


                        if (
                            columna === 1
                        ) {

                            doc.y =
                                y + alto;

                        }

                    }
                );


                // Si terminamos en columna izquierda
                // avanzar una fila

                if (
                    campos.length % 2 !== 0
                ) {

                    doc.y +=
                        alto;

                }

            }

        } catch (error) {

            console.error(
                "ERROR GENERANDO PDF:",
                error
            );


            if (
                !res.headersSent
            ) {

                res.status(500).json({

                    error:
                        "No fue posible generar el PDF.",

                    detalle:
                        error.message

                });

            }

        }

    }
);


// =========================================================
// INICIAR SERVIDOR
// =========================================================

app.listen(
    PORT,
    '0.0.0.0',
    () => {

        console.log("");
        console.log("=================================");
        console.log("       CONSULTA DE NÓMINA");
        console.log("=================================");
        console.log("");
        console.log(
            "Servidor iniciado en:"
        );
        console.log(
            `http://0.0.0.0:${PORT}`
        );
        console.log("");

    }
);