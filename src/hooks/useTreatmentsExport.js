import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const TYPE_LABEL = {
  multisession: "Multisesión",
  unit: "Por unidad",
  single: "Sesión única",
};

function normalize(treatments) {
  return treatments.map((t) => ({
    name: t.name ?? "—",
    specialty: t.specialty?.name ?? "—",
    type: t.is_multisession
      ? TYPE_LABEL.multisession
      : t.unit_price
        ? TYPE_LABEL.unit
        : TYPE_LABEL.single,
    price: t.is_multisession
      ? "Por caso"
      : `S/ ${Number(t.effective_price).toFixed(2)}${t.unit_price ? "/ud." : ""}`,
    duration: `${t.duration_min ?? 0} min`,
    status: t.effective_active ? "Activo" : "Inactivo",
    origin: t.is_tenant_own ? "Propio" : "Global",
  }));
}

export function useTreatmentsExport(treatmentsCatalog) {
  const handlePdf = () => {
    const rows = normalize(treatmentsCatalog);
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(14);
    doc.text("Catálogo de Tratamientos", 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-PE")}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [
        [
          "Nombre",
          "Especialidad",
          "Tipo",
          "Precio",
          "Duración",
          "Estado",
          "Origen",
        ],
      ],
      body: rows.map((r) => [
        r.name,
        r.specialty,
        r.type,
        r.price,
        r.duration,
        r.status,
        r.origin,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [83, 74, 183] }, // color primario de tu app
    });

    doc.save(`tratamientos_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExcel = () => {
    const rows = normalize(treatmentsCatalog);

    const worksheet = XLSX.utils.json_to_sheet(
      rows.map((r) => ({
        Nombre: r.name,
        Especialidad: r.specialty,
        Tipo: r.type,
        Precio: r.price,
        Duración: r.duration,
        Estado: r.status,
        Origen: r.origin,
      })),
    );

    // Ancho de columnas
    worksheet["!cols"] = [
      { wch: 40 }, // Nombre
      { wch: 25 }, // Especialidad
      { wch: 18 }, // Tipo
      { wch: 15 }, // Precio
      { wch: 12 }, // Duración
      { wch: 12 }, // Estado
      { wch: 12 }, // Origen
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Tratamientos");

    XLSX.writeFile(
      workbook,
      `tratamientos_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  return { handlePdf, handleExcel };
}
