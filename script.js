let vmList = [];

fetch("vm-pricing.json")
  .then(res => res.json())
  .then(data => {
    vmList = data;
    populateVMs();
    calculateCosts(); // Initial calculation
  });

const vmTypeSelect = document.getElementById("vm-type");
const vmSearch = document.getElementById("vm-search");

function populateVMs(filter = "") {
  vmTypeSelect.innerHTML = "";
  vmList
    .filter(vm => vm.name.toLowerCase().includes(filter.toLowerCase()))
    .forEach(vm => {
      const option = document.createElement("option");
      option.value = vm.name;
      option.textContent = `${vm.name} (${vm.vcpu} vCPU, ${vm.ram} GB RAM)`;
      vmTypeSelect.appendChild(option);
    });
}

vmSearch.addEventListener("input", () => populateVMs(vmSearch.value));

// Update sliders
document.getElementById("fslogix").addEventListener("input", e => {
  document.getElementById("fslogix-value").textContent = `${e.target.value} GB`;
  calculateCosts();
});

document.getElementById("osdisk").addEventListener("input", e => {
  document.getElementById("osdisk-value").textContent = `${e.target.value} GB`;
  calculateCosts();
});

// Recalculate on change
["vm-type", "location", "hours", "fslogix-toggle", "nat-toggle", "law-toggle", "mgmt-toggle", "golden-toggle", "session-hosts"].forEach(id => {
  document.getElementById(id).addEventListener("change", calculateCosts);
});

function calculateCosts() {
  const selectedVM = vmList.find(vm => vm.name === vmTypeSelect.value);
  if (!selectedVM) return;

  const hours = parseInt(document.getElementById("hours").value);
  const sessionHosts = parseInt(document.getElementById("session-hosts").value);
  const fslogixSize = parseInt(document.getElementById("fslogix").value);
  const osDiskSize = parseInt(document.getElementById("osdisk").value);

  const includeFSLogix = document.getElementById("fslogix-toggle").checked;
  const includeNAT = document.getElementById("nat-toggle").checked;
  const includeLAW = document.getElementById("law-toggle").checked;
  const includeMgmt = document.getElementById("mgmt-toggle").checked;
  const includeGolden = document.getElementById("golden-toggle").checked;

  // Base VM cost (no Windows license)
  const vmCost = selectedVM.price * hours * sessionHosts;

  // FSLogix cost (assume $0.01/GB/hr)
  const fslogixCost = includeFSLogix ? fslogixSize * 0.01 * hours * sessionHosts : 0;

  // OS Disk cost (assume $0.0005/GB/hr)
  const osDiskCost = osDiskSize * 0.0005 * hours * sessionHosts;

  // NAT Gateway (flat $20/month)
  const natCost = includeNAT ? 20 : 0;

  // LAW (flat $15/month)
  const lawCost = includeLAW ? 15 : 0;

  // Management Server (B4ms, includes Windows license)
  const mgmtCost = includeMgmt ? (0.25 + 0.04) * hours : 0;

  // Golden Image VM (B4ms, includes Windows license, assume 20 hrs/month)
  const goldenCost = includeGolden ? (0.25 + 0.04) * 20 : 0;

  // Network bandwidth (flat $2)
  const bandwidthCost = 2;

  // Total before buffer
  let total = vmCost + fslogixCost + osDiskCost + natCost + lawCost + mgmtCost + goldenCost + bandwidthCost;

  // Add 8% buffer
  const buffer = total * 0.08;
  const finalTotal = total + buffer;

  renderChart({
    "Session Hosts": vmCost,
    "FSLogix": fslogixCost,
    "OS Disk": osDiskCost,
    "NAT Gateway": natCost,
    "LAW": lawCost,
    "Mgmt Server": mgmtCost,
    "Golden Image": goldenCost,
    "Bandwidth": bandwidthCost,
    "Buffer": buffer
  });

  renderTable({
    "Session Hosts": vmCost,
    "FSLogix": fslogixCost,
    "OS Disk": osDiskCost,
    "NAT Gateway": natCost,
    "LAW": lawCost,
    "Mgmt Server": mgmtCost,
    "Golden Image": goldenCost,
    "Bandwidth": bandwidthCost,
    "Buffer (8%)": buffer,
    "Total (AUD)": finalTotal
  });
}

let chart;

function renderChart(data) {
  const ctx = document.getElementById("costChart").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: [
          "#00ADB5", "#393E46", "#EEEEEE", "#222831", "#FF5722",
          "#FFC107", "#8BC34A", "#3F51B5", "#9C27B0"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "right" }
      }
    }
  });
}

function renderTable(data) {
  const table = document.getElementById("cost-table");
  table.innerHTML = "<tr><th>Component</th><th>Cost (AUD)</th></tr>";
  for (const [key, value] of Object.entries(data)) {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${key}</td><td>$${value.toFixed(2)}</td>`;
    table.appendChild(row);
  }
}

// Export CSV
document.getElementById("download-csv").addEventListener("click", () => {
  const rows = [["Component", "Cost (AUD)"]];
  document.querySelectorAll("#cost-table tr").forEach(tr => {
    const cells = tr.querySelectorAll("td");
    if (cells.length) {
      rows.push([cells[0].textContent, cells[1].textContent]);
    }
  });
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "avd-cost.csv";
  link.click();
});

// Export PDF
document.getElementById("download-pdf").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("AVD Cost Breakdown", 10, 10);
  let y = 20;
  document.querySelectorAll("#cost-table tr").forEach(tr => {
    const cells = tr.querySelectorAll("td");
    if (cells.length) {
      doc.text(`${cells[0].textContent}: ${cells[1].textContent}`, 10, y);
      y += 10;
    }
  });
  doc.save("avd-cost.pdf");
});
