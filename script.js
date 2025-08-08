// VM pricing in AUD per hour
const vmPrices = {
  B2ms: 0.08, B4ms: 0.15,
  D2s_v5: 0.12, D4s_v5: 0.25, D8s_v5: 0.50,
  D2as_v5: 0.11, D4as_v5: 0.22, D8as_v5: 0.44,
  D2dls_v5: 0.13, D4dls_v5: 0.26, D8dls_v5: 0.52,
  E2s_v5: 0.20, E4s_v5: 0.35, E8s_v5: 0.70,
  E2as_v5: 0.18, E4as_v5: 0.33, E8as_v5: 0.66,
  E2dls_v5: 0.21, E4dls_v5: 0.38, E8dls_v5: 0.75
};

// Disk pricing (approx AUD per GB/month)
const diskPricePerGB = 0.15;

// Optional component costs
const natGatewayCost = 40;
const lawCost = 30;
const mgmtServerCost = 0.15 * 730; // B4ms × 730 hrs
const goldenImageCost = 0.15 * 730;

// Licensing
const m365LicensePerUser = 17;

function calculateCost() {
  const vmSize = document.getElementById("vmSize").value;
  const sessionHosts = parseInt(document.getElementById("sessionHosts").value);
  const usageHours = parseInt(document.getElementById("usageHours").value);
  const includeFslogix = document.getElementById("includeFslogix").checked;
  const fslogixSize = includeFslogix ? parseInt(document.getElementById("fslogixSize").value) : 0;
  const osDiskSize = parseInt(document.getElementById("osDiskSize").value);
  const region = document.getElementById("region").value;

  const natGateway = document.getElementById("natGateway").checked;
  const law = document.getElementById("law").checked;
  const mgmtServer = document.getElementById("mgmtServer").checked;
  const goldenImage = document.getElementById("goldenImage").checked;

  const m365License = document.getElementById("m365License").checked;
  const userCount = parseInt(document.getElementById("userCount").value);

  // VM cost
  const vmHourlyRate = vmPrices[vmSize] || 0;
  const vmCost = vmHourlyRate * usageHours * sessionHosts;

  // Disk cost
  const fslogixCost = fslogixSize * diskPricePerGB * sessionHosts;
  const osDiskCost = osDiskSize * diskPricePerGB * sessionHosts;

  // Optional components
  const natCost = natGateway ? natGatewayCost : 0;
  const lawComponent = law ? lawCost : 0;
  const mgmtCost = mgmtServer ? mgmtServerCost : 0;
  const goldenCost = goldenImage ? goldenImageCost : 0;

  // Licensing
  const licenseCost = m365License ? m365LicensePerUser * userCount : 0;

  // Total
  const totalCost = vmCost + fslogixCost + osDiskCost + natCost + lawComponent + mgmtCost + goldenCost + licenseCost;

  // Update UI
  document.getElementById("topTotalCost").textContent = `Total Monthly Cost: $${totalCost.toFixed(2)} AUD`;
  document.getElementById("chartTotalCost").textContent = `Total Monthly Cost: $${totalCost.toFixed(2)} AUD`;

  renderChart({
    "VMs": vmCost,
    "FSLogix Disks": fslogixCost,
    "OS Disks": osDiskCost,
    "NAT Gateway": natCost,
    "Log Analytics": lawComponent,
    "Mgmt Server": mgmtCost,
    "Golden Image": goldenCost,
    "Licensing": licenseCost
  });

  renderBreakdown({
    vmSize, sessionHosts, usageHours, region,
    vmCost, fslogixCost, osDiskCost, natCost,
    lawComponent, mgmtCost, goldenCost, licenseCost,
    totalCost
  });
}

// Chart rendering
let chart;
function renderChart(data) {
  const ctx = document.getElementById("costChart").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(data),
      datasets: [{
        label: "Monthly Cost (AUD)",
        data: Object.values(data),
        backgroundColor: "#0078d4"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `$${ctx.raw.toFixed(2)} AUD` } }
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => `$${v}` } }
      }
    }
  });
}

// Breakdown table
function renderBreakdown(details) {
  const table = `
    <h2>Cost Breakdown</h2>
    <table>
      <tr><td>VM Size</td><td>${details.vmSize}</td></tr>
      <tr><td>Session Hosts</td><td>${details.sessionHosts}</td></tr>
      <tr><td>Usage Hours</td><td>${details.usageHours}</td></tr>
      <tr><td>Region</td><td>${details.region}</td></tr>
      <tr><td>VM Cost</td><td>$${details.vmCost.toFixed(2)}</td></tr>
      <tr><td>FSLogix Disk Cost</td><td>$${details.fslogixCost.toFixed(2)}</td></tr>
      <tr><td>OS Disk Cost</td><td>$${details.osDiskCost.toFixed(2)}</td></tr>
      <tr><td>NAT Gateway</td><td>$${details.natCost.toFixed(2)}</td></tr>
      <tr><td>Log Analytics</td><td>$${details.lawComponent.toFixed(2)}</td></tr>
      <tr><td>Mgmt Server</td><td>$${details.mgmtCost.toFixed(2)}</td></tr>
      <tr><td>Golden Image</td><td>$${details.goldenCost.toFixed(2)}</td></tr>
      <tr><td>Licensing</td><td>$${details.licenseCost.toFixed(2)}</td></tr>
      <tr><th>Total</th><th>$${details.totalCost.toFixed(2)} AUD</th></tr>
    </table>
  `;
  document.getElementById("breakdownTable").innerHTML = table;
}

// Range display
document.getElementById("fslogixSize").addEventListener("input", e => {
  document.getElementById("fslogixValue").textContent = `${e.target.value} GB`;
});
document.getElementById("osDiskSize").addEventListener("input", e => {
  document.getElementById("osDiskValue").textContent = `${e.target.value} GB`;
});
