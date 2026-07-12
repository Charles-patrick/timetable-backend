const PDFDocument = require("pdfkit");

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Column layout for the table (x positions + widths, in points)
const COLUMNS = [
  { key: "day", label: "Day", x: 40, width: 60 },
  { key: "time", label: "Time", x: 100, width: 80 },
  { key: "courseCode", label: "Course", x: 180, width: 70 },
  { key: "courseTitle", label: "Title", x: 250, width: 130 },
  { key: "lecturer", label: "Lecturer", x: 380, width: 90 },
  { key: "venue", label: "Venue", x: 470, width: 80 },
];

// Builds a PDF document (returns the PDFDocument instance, still streaming)
// for a list of populated Timetable entries. Caller pipes it to the response.
function buildTimetablePdf({ entries, title, subtitle }) {
  const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });

  doc.fontSize(18).font("Helvetica-Bold").text(title, { align: "center" });
  if (subtitle) {
    doc.moveDown(0.3);
    doc.fontSize(11).font("Helvetica").text(subtitle, { align: "center" });
  }
  doc.moveDown(1);

  const sorted = [...entries].sort((a, b) => {
    const dayDiff =
      DAY_ORDER.indexOf(a.timeSlot.day) - DAY_ORDER.indexOf(b.timeSlot.day);
    if (dayDiff !== 0) return dayDiff;
    return a.timeSlot.startTime.localeCompare(b.timeSlot.startTime);
  });

  drawTableHeader(doc);

  sorted.forEach((entry, i) => {
    if (doc.y > 500) {
      doc.addPage();
      drawTableHeader(doc);
    }
    drawRow(doc, {
      day: entry.timeSlot.day,
      time: `${entry.timeSlot.startTime} - ${entry.timeSlot.endTime}`,
      courseCode: entry.course.courseCode,
      courseTitle: entry.course.courseTitle,
      lecturer: entry.lecturer.name,
      venue: entry.venue.name,
    });
  });

  if (sorted.length === 0) {
    doc
      .fontSize(11)
      .font("Helvetica-Oblique")
      .text("No timetable entries found.", 40, doc.y + 10);
  }

  doc.end();
  return doc;
}

function drawTableHeader(doc) {
  const y = doc.y;
  doc.fontSize(10).font("Helvetica-Bold");
  COLUMNS.forEach((col) => {
    doc.text(col.label, col.x, y, { width: col.width });
  });
  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(760, doc.y).strokeColor("#cccccc").stroke();
  doc.moveDown(0.3);
}

function drawRow(doc, row) {
  const y = doc.y;
  doc.fontSize(9).font("Helvetica");
  COLUMNS.forEach((col) => {
    doc.text(String(row[col.key] ?? ""), col.x, y, { width: col.width });
  });
  doc.moveDown(0.8);
}

module.exports = { buildTimetablePdf };
