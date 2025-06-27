import jsPDF from "jspdf";
import "jspdf-autotable";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ExpenseReportData {
  id: string;
  title: string;
  description: string;
  amount: number;
  expense_date: string;
  status: string;
  created_at: string;
  admin_notes?: string;
  is_travel_expense: boolean;
  from_location?: string;
  to_location?: string;
  travel_start_date?: string;
  travel_end_date?: string;
  transport_mode?: string;
  accommodation_details?: string;
  business_purpose?: string;
  is_food_expense: boolean;
  food_name?: string;
  restaurant_name?: string;
  with_client?: boolean;
  client_name?: string;
  client_company?: string;
  number_of_attendees?: number;
  meal_type?: string;
  bill_file_url?: string;
  bill_file_name?: string;
  employee: {
    full_name: string;
    email: string;
    department: string;
  };
  category: {
    name: string;
  };
}

export const generateCSVReport = (
  reports: ExpenseReportData[],
  filters: any
) => {
  const headers = [
    "Report ID",
    "Employee Name",
    "Employee Email",
    "Department",
    "Title",
    "Category",
    "Amount",
    "Expense Date",
    "Status",
    "Submitted Date",
    "Travel Expense",
    "From Location",
    "To Location",
    "Travel Start",
    "Travel End",
    "Transport Mode",
    "Business Purpose",
    "Food Expense",
    "Food Name",
    "Restaurant",
    "Meal Type",
    "With Client",
    "Client Name",
    "Client Company",
    "Attendees",
    "Description",
    "Bill Available",
    "Bill File Name",
    "Admin Notes",
  ];

  const rows = reports.map((report) => [
    report.id,
    report.employee.full_name,
    report.employee.email,
    report.employee.department,
    report.title,
    report.category.name,
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(report.amount),
    report.expense_date,
    report.status,
    new Date(report.created_at).toLocaleDateString(),
    report.is_travel_expense ? "Yes" : "No",
    report.from_location || "",
    report.to_location || "",
    report.travel_start_date || "",
    report.travel_end_date || "",
    report.transport_mode || "",
    report.business_purpose || "",
    report.is_food_expense ? "Yes" : "No",
    report.food_name || "",
    report.restaurant_name || "",
    report.meal_type || "",
    report.with_client ? "Yes" : "No",
    report.client_name || "",
    report.client_company || "",
    report.number_of_attendees || "",
    report.description || "",
    report.bill_file_url ? "Yes" : "No",
    report.bill_file_name || "",
    report.admin_notes || "",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const filename = `expense-report-${
    new Date().toISOString().split("T")[0]
  }.csv`;

  return { blob, filename };
};

export const generatePDFReport = (
  reports: ExpenseReportData[],
  filters: any
) => {
  const doc = new jsPDF("l", "mm", "a4"); // Landscape orientation for more columns

  // Add title
  doc.setFontSize(20);
  doc.text("Expense Reports", 20, 20);

  // Add filter information
  doc.setFontSize(12);
  let yPos = 35;
  doc.text("Report Filters:", 20, yPos);
  yPos += 7;

  if (filters.employee !== "all") {
    doc.text(`Employee: ${filters.employee}`, 25, yPos);
    yPos += 5;
  }
  if (filters.department !== "all") {
    doc.text(`Department: ${filters.department}`, 25, yPos);
    yPos += 5;
  }
  if (filters.status !== "all") {
    doc.text(`Status: ${filters.status}`, 25, yPos);
    yPos += 5;
  }
  if (filters.dateFrom) {
    doc.text(`From Date: ${filters.dateFrom}`, 25, yPos);
    yPos += 5;
  }
  if (filters.dateTo) {
    doc.text(`To Date: ${filters.dateTo}`, 25, yPos);
    yPos += 5;
  }

  yPos += 10;

  // Summary statistics
  const totalAmount = reports.reduce((sum, r) => sum + Number(r.amount), 0);
  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const approvedCount = reports.filter((r) => r.status === "approved").length;
  const rejectedCount = reports.filter((r) => r.status === "rejected").length;

  doc.text("Summary:", 20, yPos);
  yPos += 7;
  doc.text(`Total Reports: ${reports.length}`, 25, yPos);
  yPos += 5;
  doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 25, yPos);
  yPos += 5;
  doc.text(
    `Pending: ${pendingCount} | Approved: ${approvedCount} | Rejected: ${rejectedCount}`,
    25,
    yPos
  );
  yPos += 15;

  // Create table data
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const tableData = reports.map((report) => [
    report.employee.full_name,
    report.title,
    report.category.name,
    formatCurrency(Number(report.amount)),
    report.expense_date,
    report.status,
    report.is_travel_expense
      ? "Travel"
      : report.is_food_expense
      ? "Food"
      : "Regular",
    report.bill_file_url ? "Yes" : "No",
  ]);

  // Add table
  doc.autoTable({
    head: [
      [
        "Employee",
        "Title",
        "Category",
        "Amount",
        "Date",
        "Status",
        "Type",
        "Bill",
      ],
    ],
    body: tableData,
    startY: yPos,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
    columnStyles: {
      3: { halign: "right" }, // Amount column
      4: { halign: "center" }, // Date column
      5: { halign: "center" }, // Status column
      6: { halign: "center" }, // Type column
      7: { halign: "center" }, // Bill column
    },
  });

  // Add detailed breakdown for each report
  let currentY = (doc as any).lastAutoTable.finalY + 20;

  reports.forEach((report, index) => {
    if (currentY > 180) {
      // Check if we need a new page
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.text(`Report ${index + 1}: ${report.title}`, 20, currentY);
    currentY += 10;

    doc.setFontSize(10);
    const details = [
      `Employee: ${report.employee.full_name} (${report.employee.department})`,
      `Amount: ${formatCurrency(Number(report.amount))} | Date: ${
        report.expense_date
      } | Status: ${report.status}`,
      `Category: ${report.category.name}`,
    ];

    if (report.description) {
      details.push(`Description: ${report.description}`);
    }

    if (report.is_travel_expense) {
      details.push(`Travel: ${report.from_location} → ${report.to_location}`);
      if (report.business_purpose) {
        details.push(`Purpose: ${report.business_purpose}`);
      }
    }

    if (report.is_food_expense) {
      details.push(`Food: ${report.food_name} (${report.meal_type})`);
      if (report.restaurant_name) {
        details.push(`Restaurant: ${report.restaurant_name}`);
      }
      if (report.with_client && report.client_name) {
        details.push(
          `Client: ${report.client_name}${
            report.client_company ? ` (${report.client_company})` : ""
          }`
        );
      }
      details.push(`Attendees: ${report.number_of_attendees || 1}`);
    }

    if (report.bill_file_name) {
      details.push(`Bill: ${report.bill_file_name}`);
    }

    if (report.admin_notes) {
      details.push(`Admin Notes: ${report.admin_notes}`);
    }

    details.forEach((detail) => {
      doc.text(detail, 25, currentY);
      currentY += 5;
    });

    currentY += 5; // Extra space between reports
  });

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 20, 200);
    doc.text(`Page ${i} of ${pageCount}`, 250, 200);
  }

  const filename = `expense-report-detailed-${
    new Date().toISOString().split("T")[0]
  }.pdf`;

  return { doc, filename };
};

export const generateExcelReport = (
  reports: ExpenseReportData[],
  filters: any
) => {
  // For Excel generation, we'll create a more structured CSV that can be opened in Excel
  const worksheets = {
    summary: {
      name: "Summary",
      data: [
        ["Metric", "Value"],
        ["Total Reports", reports.length],
        [
          "Total Amount",
          new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
          }).format(reports.reduce((sum, r) => sum + Number(r.amount), 0)),
        ],
        [
          "Pending Reports",
          reports.filter((r) => r.status === "pending").length,
        ],
        [
          "Approved Reports",
          reports.filter((r) => r.status === "approved").length,
        ],
        [
          "Rejected Reports",
          reports.filter((r) => r.status === "rejected").length,
        ],
        ["Travel Expenses", reports.filter((r) => r.is_travel_expense).length],
        ["Food Expenses", reports.filter((r) => r.is_food_expense).length],
      ],
    },
    details: {
      name: "Detailed Report",
      data: [
        [
          "Report ID",
          "Employee Name",
          "Email",
          "Department",
          "Title",
          "Category",
          "Amount",
          "Expense Date",
          "Status",
          "Submitted Date",
          "Description",
          "Travel Expense",
          "From Location",
          "To Location",
          "Travel Start",
          "Travel End",
          "Transport Mode",
          "Business Purpose",
          "Accommodation",
          "Food Expense",
          "Food Name",
          "Restaurant",
          "Meal Type",
          "With Client",
          "Client Name",
          "Client Company",
          "Attendees",
          "Bill Available",
          "Bill File Name",
          "Admin Notes",
        ],
        ...reports.map((report) => [
          report.id,
          report.employee.full_name,
          report.employee.email,
          report.employee.department,
          report.title,
          report.category.name,
          report.amount,
          report.expense_date,
          report.status,
          new Date(report.created_at).toLocaleDateString(),
          report.description || "",
          report.is_travel_expense ? "Yes" : "No",
          report.from_location || "",
          report.to_location || "",
          report.travel_start_date || "",
          report.travel_end_date || "",
          report.transport_mode || "",
          report.business_purpose || "",
          report.accommodation_details || "",
          report.is_food_expense ? "Yes" : "No",
          report.food_name || "",
          report.restaurant_name || "",
          report.meal_type || "",
          report.with_client ? "Yes" : "No",
          report.client_name || "",
          report.client_company || "",
          report.number_of_attendees || "",
          report.bill_file_url ? "Yes" : "No",
          report.bill_file_name || "",
          report.admin_notes || "",
        ]),
      ],
    },
  };

  // Create CSV content with multiple sheets (Excel will recognize this format)
  let csvContent = "";

  // Summary sheet
  csvContent += "SUMMARY\n";
  worksheets.summary.data.forEach((row) => {
    csvContent +=
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",") +
      "\n";
  });

  csvContent += "\n\nDETAILED REPORT\n";
  worksheets.details.data.forEach((row) => {
    csvContent +=
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",") +
      "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const filename = `expense-report-excel-${
    new Date().toISOString().split("T")[0]
  }.csv`;

  return { blob, filename };
};

export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const downloadPDF = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};
