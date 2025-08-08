function calculateCost() {
  const vmSize = document.getElementById("vmSize").value;
  const sessionHosts = parseInt(document.getElementById("sessionHosts").value);
  const natGateway = document.getElementById("natGateway").checked;
  const law = document.getElementById("law").checked;
  const mgmtServer = document.getElementById("mgmtServer").checked;
  const goldenImage = document.getElementById("goldenImage").checked;
  const m365License = document.getElementById("m365License").checked;
  const userCount = parseInt(document.getElementById("userCount").value);

  const vmPrices = {
    D2s_v3: 100,
    D4s_v3: 200,
    D8s_v3: 400,
    B2ms: 80,
    B4ms: 160
  };

  let total = 0;
  let breakdown = [];

  const vmCost = vmPrices[vmSize] * sessionHosts;
  total += vmCost;
  breakdown.push(["Session Hosts", `$${vmCost}`]);

  if (natGateway) {
    total += 50;
    breakdown.push(["NAT Gateway", "$50"]);
  }

  if (law) {
    total += 30;
    breakdown.push(["Log Analytics Workspace", "$30"]);
  }

  if (mgmtServer) {
    total += vmPrices["B4ms"];
    breakdown.push(["Management Server (B4ms)", `$${vmPrices["B4ms"]}`]);
  }

  if (goldenImage) {
    total += vmPrices["B4ms"];
    breakdown.push(["Golden Image Server (B4ms)", `$${vmPrices["B4ms"]}`]);
  }

  if (m365License) {
    const licenseCost = userCount * 18;
    total += licenseCost;
    breakdown.push([`Microsoft 365 Business Standard (${userCount} users)`, `$${licenseCost}`]);
  }

  document.getElementById("topTotalCost").textContent = `Total Monthly Cost: $${total} AUD`;
  document.getElementById("chartTotalCost").textContent = `Total Monthly Cost: $${total} AUD`;

  renderChart(breakdown);
  renderTable(breakdown);
}

function renderChart(breakdown) {
  const labels = breakdown.map(item => item[0]);
  const data = breakdown.map(item => parseFloat(item[1].replace("$", "")));

  const ctx = document.getElementById("costChart").getContext("2d");
  if (window.costChart) window.costChart.destroy();

  window.costChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: ["#0078d4", "#00a3a3", "#ffc107", "#28a745", "#6f42c1", "#fd7e14"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function renderTable(breakdown) {
  let html = "<table><tr><th>Component</th><th>Cost (AUD)</th></tr>";
  breakdown.forEach(([label, cost]) => {
    html += `<tr><td>${label}</td><td>${cost}</td></tr>`;
  });
  html += "</table>";
  document.getElementById("breakdownTable").innerHTML = html;
}
