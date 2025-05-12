
export function generarTicketPDF(id, servicio, fecha, hora, costo) {
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 100]
    });

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("Uriangato Style", 40, 10, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text("RFC: LOGE011185V50", 40, 16, { align: 'center' });
    doc.text(`Fecha: ${fecha}`, 40, 20, { align: 'center' });
    doc.text(`Ticket: ${id}`, 40, 24, { align: 'center' });
    doc.text("Educación Superior 2000,", 40, 28, { align: 'center' });
    doc.text("38980 Uriangato, Gto.", 40, 32, { align: 'center' });
    doc.text("Tel: 445 457 7468", 40, 36, { align: 'center' });

    doc.setFont(undefined, 'bold');
    doc.text("Hora del servicio:", 10, 44);
    doc.text(hora, 70, 44, { align: 'right' });

    doc.line(10, 46, 70, 46);

    doc.setFont(undefined, 'bold');
    doc.text("SERVICIO", 10, 52);
    doc.text("PRECIO", 70, 52, { align: 'right' });

    doc.setFont(undefined, 'normal');
    doc.text(servicio, 10, 58);
    doc.text(`$ ${costo}`, 70, 58, { align: 'right' });

    doc.setFont(undefined, 'bold');
    doc.text("TOTAL NETO", 10, 70);
    doc.setFontSize(12);
    doc.text(`$ ${costo}`, 70, 70, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text("¡Gracias por su compra, vuelva pronto!", 40, 85, { align: 'center' });

    doc.save(`Ticket No ${id}.pdf`);
}

// Hacerla accesible desde el HTML
window.generarTicketPDF = generarTicketPDF;