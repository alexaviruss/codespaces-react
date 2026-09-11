import { formatCurrency } from "./currencyFormatter";
import { formatDate } from "./dateHelpers";

// Export expenses to CSV
export const exportToCSV = (expenses, monthlyBudget) => {
  if (expenses.length === 0) {
    alert("No expenses to export");
    return;
  }

  const headers = ["Date", "Time", "Category", "Amount", "Payment Mode", "Note"];
  const rows = expenses.map((exp) => [
    exp.date,
    exp.time || "",
    exp.category === "Other" ? exp.customCategory : exp.category,
    exp.amount,
    exp.paymentMode,
    exp.note || "",
  ]);

  const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  rows.push([]);
  rows.push(["Summary", "", "", "", "", ""]);
  rows.push(["Total Spent", "", "", totalSpent, "", ""]);
  rows.push(["Monthly Budget", "", "", monthlyBudget, "", ""]);
  rows.push(["Remaining", "", "", Math.max(0, monthlyBudget - totalSpent), "", ""]);
  rows.push(["Spent %", "", "", `${((totalSpent / monthlyBudget) * 100).toFixed(2)}%`, "", ""]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => (typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell)).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `expenses-${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export to JSON
export const exportToJSON = (expenses, monthlyBudget, udhaariList) => {
  if (expenses.length === 0) {
    alert("No data to export");
    return;
  }

  const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalLent = udhaariList
    .filter((i) => i.type === "Lent" && i.status === "Pending")
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalBorrowed = udhaariList
    .filter((i) => i.type === "Borrowed" && i.status === "Pending")
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const exportData = {
    exportDate: new Date().toISOString(),
    summary: {
      totalSpent,
      monthlyBudget,
      remaining: Math.max(0, monthlyBudget - totalSpent),
      percentageSpent: ((totalSpent / monthlyBudget) * 100).toFixed(2),
      totalLent,
      totalBorrowed,
    },
    expenses,
    udhaari: udhaariList,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `paisa-track-${new Date().toISOString().split("T")[0]}.json`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Generate PDF report (requires html2pdf library)
export const exportToPDF = async (expenses, monthlyBudget, udhaariList) => {
  try {
    const html2pdf = window.html2pdf || (await import("html2pdf.js")).default;

    const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const totalLent = udhaariList
      .filter((i) => i.type === "Lent" && i.status === "Pending")
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const totalBorrowed = udhaariList
      .filter((i) => i.type === "Borrowed" && i.status === "Pending")
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const htmlContent = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="color: #14b8a6;">PaisaTrack Report</h1>
        <p style="color: #666;">Generated on ${new Date().toLocaleString()}</p>
        
        <h2 style="color: #14b8a6; border-bottom: 2px solid #14b8a6; padding-bottom: 10px;">Summary</h2>
        <table style="width: 100%; margin-bottom: 20px;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Spent</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">₹${totalSpent.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Monthly Budget</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">₹${monthlyBudget}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Remaining</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">₹${Math.max(0, monthlyBudget - totalSpent).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Spent %</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${((totalSpent / monthlyBudget) * 100).toFixed(2)}%</td>
          </tr>
        </table>

        <h2 style="color: #14b8a6; border-bottom: 2px solid #14b8a6; padding-bottom: 10px;">Top Expenses</h2>
        <table style="width: 100%; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Date</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Category</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Amount</th>
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Mode</th>
            </tr>
          </thead>
          <tbody>
            ${expenses
              .slice(0, 10)
              .map(
                (exp) => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${exp.date}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${
                  exp.category === "Other" ? exp.customCategory : exp.category
                }</td>
                <td style="padding: 10px; border: 1px solid #ddd;">₹${exp.amount}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${exp.paymentMode}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    const options = {
      margin: 10,
      filename: `paisa-track-${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
    };

    html2pdf().set(options).from(htmlContent).save();
  } catch (error) {
    console.error("PDF export error:", error);
    alert("PDF export requires html2pdf library. Using JSON export instead.");
    exportToJSON(expenses, monthlyBudget, udhaariList);
  }
};
