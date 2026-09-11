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

// Generate HTML report (can be printed as PDF)
export const exportToPDF = (expenses, monthlyBudget, udhaariList) => {
  const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalLent = udhaariList
    .filter((i) => i.type === "Lent" && i.status === "Pending")
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalBorrowed = udhaariList
    .filter((i) => i.type === "Borrowed" && i.status === "Pending")
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>PaisaTrack Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #14b8a6; }
        h2 { color: #14b8a6; border-bottom: 2px solid #14b8a6; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
        th { background-color: #f0f0f0; }
        .summary { margin: 20px 0; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <h1>🏦 PaisaTrack Report</h1>
      <p>Generated on ${new Date().toLocaleString()}</p>
      
      <h2>Summary</h2>
      <table>
        <tr>
          <td><strong>Total Spent</strong></td>
          <td>₹${totalSpent.toFixed(2)}</td>
        </tr>
        <tr>
          <td><strong>Monthly Budget</strong></td>
          <td>₹${monthlyBudget}</td>
        </tr>
        <tr>
          <td><strong>Remaining</strong></td>
          <td>₹${Math.max(0, monthlyBudget - totalSpent).toFixed(2)}</td>
        </tr>
        <tr>
          <td><strong>Spent %</strong></td>
          <td>${((totalSpent / monthlyBudget) * 100).toFixed(2)}%</td>
        </tr>
      </table>

      <h2>Top 10 Expenses</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Mode</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${expenses
            .slice(0, 10)
            .map(
              (exp) => `
            <tr>
              <td>${exp.date}</td>
              <td>${exp.category === "Other" ? exp.customCategory : exp.category}</td>
              <td>₹${exp.amount}</td>
              <td>${exp.paymentMode}</td>
              <td>${exp.note || "-"}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <script>
        // Auto-open print dialog when page loads
        window.print();
      </script>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `paisa-track-${new Date().toISOString().split("T")[0]}.html`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
