/**
 * Servicio de exportación Excel y PDF.
 * Usado por Pacientes, Pagos e Historial.
 *
 * Dependencias: xlsx, jspdf, jspdf-autotable
 * npm install xlsx jspdf jspdf-autotable
 */
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── EXCEL ──────────────────────────────────────────────────────

/**
 * Exporta un array de objetos a un archivo .xlsx
 * @param {Object[]} rows     - datos a exportar
 * @param {Object[]} columns  - [{ header: 'Nombre', key: 'full_name', width: 25 }]
 * @param {string}   filename - nombre del archivo sin extensión
 * @param {string}   sheetName
 */
export function exportToExcel({ rows, columns, filename = 'exportacion', sheetName = 'Datos' }) {
  // Mapear rows a objetos con los headers como claves
  const data = rows.map(row =>
    Object.fromEntries(columns.map(col => [col.header, row[col.key] ?? '']))
  )

  const worksheet  = XLSX.utils.json_to_sheet(data)
  const workbook   = XLSX.utils.book_new()

  // Ancho de columnas
  worksheet['!cols'] = columns.map(col => ({ wch: col.width ?? 20 }))

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

// ── PDF ────────────────────────────────────────────────────────

/**
 * Exporta un array de objetos a un archivo .pdf con tabla formateada
 * @param {Object[]} rows
 * @param {Object[]} columns  - [{ header: 'Nombre', key: 'full_name' }]
 * @param {string}   filename
 * @param {string}   title    - título en la cabecera del PDF
 * @param {string}   subtitle - subtítulo opcional (ej: filtros aplicados)
 */
export function exportToPDF({ rows, columns, filename = 'exportacion', title = 'Reporte', subtitle = '' }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Cabecera
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 18)

  if (subtitle) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text(subtitle, 14, 26)
  }

  // Fecha de generación
  doc.setFontSize(8)
  doc.setTextColor(150)
  const now = new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
  doc.text('Generado: ' + now, doc.internal.pageSize.width - 14, 18, { align: 'right' })
  doc.setTextColor(0)

  // Tabla
  autoTable(doc, {
    startY: subtitle ? 32 : 26,
    head:   [columns.map(c => c.header)],
    body:   rows.map(row => columns.map(col => row[col.key] ?? '—')),
    styles: {
      fontSize:  8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor:  [83, 74, 183],  // primary #534AB7
      textColor:  255,
      fontStyle:  'bold',
      fontSize:   8,
    },
    alternateRowStyles: {
      fillColor: [248, 247, 252],
    },
    didDrawPage: (data) => {
      // Número de página en el pie
      const pageCount = doc.internal.getNumberOfPages()
      doc.setFontSize(7)
      doc.setTextColor(150)
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 8,
        { align: 'center' }
      )
    },
  })

  doc.save(`${filename}.pdf`)
}

// ── HELPERS de formato ─────────────────────────────────────────

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-PE', { dateStyle: 'short' }) : '—'

export const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—'

export const fmtSoles = (val) =>
  'S/ ' + Number(val ?? 0).toFixed(2)

export const fmtBool = (val) =>
  val ? 'Sí' : 'No'