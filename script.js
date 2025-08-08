let vmList = [];

fetch("vm-pricing.json")
  .then(res => res.json())
  .then(data => {
    vmList = data;
    populateVMs();
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

document.getElementById("fslogix").addEventListener("input", e => {
  document.getElementById("fslogix-value").textContent = `${e.target.value} GB`;
});

document.getElementById("osdisk").addEventListener("input", e => {
  document.getElementById("osdisk-value").textContent = `${e.target.value} GB`;
});

// Add cost calculation, chart rendering, and export logic here...
