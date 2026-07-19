// VM pricing is loaded from vmpricing.json (single source of truth).
// Do not hardcode prices here - update vmpricing.json instead.
let vmPrices = {};
let vmMeta = {};

// Disk pricing (approx AUD per GB/month)
const diskPricePerGB = 0.15;

// Optional component costs
const natGatewayCost = 40;
const lawCost = 30;
const mgmtServerRate = 0.15; // B4ms hourly rate, used with 730 hrs below
const goldenImageRate = 0.15;

// Licensing
const m365LicensePerUser = 17;

async function loadPricing() {
  const dropdown = document.getElementById("vmSize");
  try {
    const response = await fetch("vmpricing.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    dropdown.innerHTML = "";
    data.forEach(vm => {
      vmPrices[vm.name] = vm.price;
      vmMeta[vm.name] = vm;

      const option = document.createElement("option");
      option.value = vm.name;
      option.textContent = `${vm.name} (${vm.vcpu} vCPU, ${vm.ram} GB RAM) - $${vm.price.toFixed(2)}/hr`;
      if (vm.verified === false) {
        option.textContent += " ⚠ unverified";
      }
      dropdown.appendChild(option);
    });
  } catch (err) {
    // Common cause: opening this file directly via file:// instead of through a web server.
    // fetch() of local JSON is blocked by browser CORS rules in that case.
    console.error("Could not load vmpricing.json:", err);
    dropdown.innerHTML = '<option value="">Pricing unavailable - open via a web server, not file://</option>';
  }
}

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
  const mgmtCost = mgmtServer ? mgmtServerRate * 730 : 0;
  const goldenCost = goldenImage ? goldenImageRate * 730 : 0;

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
        backgroundColor: "#3b82f6"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `$${ctx.raw.toFixed(2)} AUD` } }
      },
      scales: {
        x: { ticks: { color: "#9ca3af" }, grid: { color: "#374151" } },
        y: { beginAtZero: true, ticks: { color: "#9ca3af", callback: v => `$${v}` }, grid: { color: "#374151" } }
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

// Load pricing on page start
loadPricing();
