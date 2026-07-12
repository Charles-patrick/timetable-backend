const ExcelJS = require("exceljs");

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Builds an xlsx workbook (returns the ExcelJS Workbook instance) for a
// list of populated Timetable entries. Caller writes it to the response.
async function buildTimetableWorkbook({ entries, title }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Online Timetable Generating System";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(title.slice(0, 31) || "Timetable"); // sheet names max 31 chars

  sheet.columns = [
    { header: "Day", key: "day", width: 12 },
    { header: "Time", key: "time", width: 16 },
    { header: "Course Code", key: "courseCode", width: 14 },
    { header: "Course Title", key: "courseTitle", width: 32 },
    { header: "Unit", key: "unit", width: 8 },
    { header: "Level", key: "level", width: 8 },
    { header: "Lecturer", key: "lecturer", width: 22 },
    { header: "Venue", key: "venue", width: 16 },
  ];

  // Style the header row
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F2937" },
  };
  sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  const sorted = [...entries].sort((a, b) => {
    const dayDiff =
      DAY_ORDER.indexOf(a.timeSlot.day) - DAY_ORDER.indexOf(b.timeSlot.day);
    if (dayDiff !== 0) return dayDiff;
    return a.timeSlot.startTime.localeCompare(b.timeSlot.startTime);
  });

  sorted.forEach((entry) => {
    sheet.addRow({
      day: entry.timeSlot.day,
      time: `${entry.timeSlot.startTime} - ${entry.timeSlot.endTime}`,
      courseCode: entry.course.courseCode,
      courseTitle: entry.course.courseTitle,
      unit: entry.course.courseUnit ?? "",
      level: entry.level,
      lecturer: entry.lecturer.name,
      venue: entry.venue.name,
    });
  });

  // Light borders on every used cell for readability when printed
  sheet.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFDDDDDD" } },
        bottom: { style: "thin", color: { argb: "FFDDDDDD" } },
        left: { style: "thin", color: { argb: "FFDDDDDD" } },
        right: { style: "thin", color: { argb: "FFDDDDDD" } },
      };
    });
  });

  sheet.autoFilter = { from: "A1", to: "H1" };
  sheet.views = [{ state: "frozen", ySplit: 1 }]; // freeze header row

  return workbook;
}

module.exports = { buildTimetableWorkbook };
