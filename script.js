/**
 * The Turf Barber — Interactive Web Logic
 * Powers live price calculations, package selections, and 1-tap SMS booking.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const serviceRadios = document.querySelectorAll('input[name="mowService"]');
  const edgeUpCheckbox = document.getElementById('chk-edge');
  const timeSlotSelect = document.getElementById('timeSlot');
  const addressInput = document.getElementById('custAddress');
  const notesInput = document.getElementById('custNotes');

  const totalAmountEl = document.getElementById('totalAmount');
  const btnPriceDisplayEl = document.getElementById('btnPriceDisplay');
  const breakdownServiceTitle = document.getElementById('breakdownServiceTitle');
  const breakdownServicePrice = document.getElementById('breakdownServicePrice');
  const breakdownAddonRow = document.getElementById('breakdownAddonRow');
  const textBookingBtn = document.getElementById('textBookingBtn');

  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  const serviceNames = {
    full: 'The Full Cut (Front & Back)',
    front: 'The Front Fade (Front Yard)',
    back: 'The Back Fade (Back Yard)'
  };

  const servicePrices = {
    full: 45,
    front: 25,
    back: 25
  };

  // Recalculate price and update booking link
  function updateQuote() {
    let selectedService = 'full';
    serviceRadios.forEach(radio => {
      if (radio.checked) {
        selectedService = radio.value;
      }
    });

    const basePrice = servicePrices[selectedService] || 45;
    const hasEdgeUp = edgeUpCheckbox ? edgeUpCheckbox.checked : false;
    const edgeUpPrice = hasEdgeUp ? 10 : 0;
    const totalPrice = basePrice + edgeUpPrice;

    // Update UI numbers
    if (totalAmountEl) totalAmountEl.textContent = totalPrice;
    if (btnPriceDisplayEl) btnPriceDisplayEl.textContent = `$${totalPrice}`;

    // Update Breakdown
    if (breakdownServiceTitle) breakdownServiceTitle.textContent = serviceNames[selectedService];
    if (breakdownServicePrice) breakdownServicePrice.textContent = `$${basePrice}`;
    
    if (breakdownAddonRow) {
      breakdownAddonRow.style.display = hasEdgeUp ? 'flex' : 'none';
    }

    // Build pre-filled SMS message
    const serviceNameClean = selectedService === 'full' ? 'The Full Cut ($45)' : 
                             selectedService === 'front' ? 'The Front Fade ($25)' : 'The Back Fade ($25)';
    const addonText = hasEdgeUp ? ' + The Edge-Up Sidewalk Trim ($10)' : '';
    const address = addressInput && addressInput.value.trim() ? addressInput.value.trim() : '[My Pflugerville Address]';
    const slot = timeSlotSelect ? timeSlotSelect.value : 'this week';
    const notes = notesInput && notesInput.value.trim() ? ` (Notes: ${notesInput.value.trim()})` : '';

    const message = `Hi Zaiyden! I'd like to book ${serviceNameClean}${addonText} (Total: $${totalPrice}) for ${address} during ${slot}.${notes} Does that time slot work for you?`;

    // iOS and Android SMS URI compatibility
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const separator = isIOS ? '&' : '?';
    const smsHref = `sms:7372164902${separator}body=${encodeURIComponent(message)}`;

    if (textBookingBtn) {
      textBookingBtn.setAttribute('href', smsHref);
    }
  }

  // Event Listeners for Calculator
  serviceRadios.forEach(radio => radio.addEventListener('change', updateQuote));
  if (edgeUpCheckbox) edgeUpCheckbox.addEventListener('change', updateQuote);
  if (timeSlotSelect) timeSlotSelect.addEventListener('change', updateQuote);
  if (addressInput) addressInput.addEventListener('input', updateQuote);
  if (notesInput) notesInput.addEventListener('input', updateQuote);

  // Link Menu buttons directly to calculator selections
  const selectServiceBtns = document.querySelectorAll('.select-service-btn');
  selectServiceBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetService = btn.getAttribute('data-service');
      const radioToSelect = document.getElementById(`svc-${targetService}`);
      if (radioToSelect) {
        radioToSelect.checked = true;
        updateQuote();
      }

      // Smooth scroll to calculator
      const calcSection = document.getElementById('calculator');
      if (calcSection) {
        calcSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Add-on toggle button in menu
  const addonToggleBtn = document.getElementById('addonToggleBtn');
  if (addonToggleBtn && edgeUpCheckbox) {
    addonToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      edgeUpCheckbox.checked = true;
      updateQuote();
      const calcSection = document.getElementById('calculator');
      if (calcSection) {
        calcSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Mobile Navigation Menu Toggle
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    // Close menu when clicking any nav link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }

  // Initial Calculation Run
  updateQuote();

  // Initialize Leaflet Map (Same mapping tool used in The Frame Shop)
  function initServiceAreaMap() {
    const mapEl = document.getElementById('service-area-map');
    if (!mapEl) return;

    if (typeof L === 'undefined') {
      console.warn('Leaflet is not yet defined.');
      return;
    }

    // Centered on the Corridor bounded by Hwy 130, Rowe Lane, East Wilco Hwy, and Jakes Hill Rd
    const map = L.map('service-area-map', {
      scrollWheelZoom: false,
      zoomControl: true
    }).setView([30.504, -97.572], 13);

    // OpenStreetMap standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    // Master Perimeter Bounded by:
    // West: Highway 130
    // North: East Wilco Highway
    // East: Jakes Hill Rd
    // South: Rowe Lane
    const masterServiceBoundary = [
      [30.4850, -97.5950], // SW: Hwy 130 at Rowe Lane
      [30.4980, -97.5940], // West: Along Hwy 130
      [30.5120, -97.5910], // West: Along Hwy 130
      [30.5230, -97.5880], // NW: Hwy 130 at East Wilco Hwy
      [30.5220, -97.5750], // North: Along East Wilco Hwy
      [30.5200, -97.5620], // North: Along East Wilco Hwy
      [30.5180, -97.5500], // NE: East Wilco Hwy at Jakes Hill Rd
      [30.5060, -97.5510], // East: Along Jakes Hill Rd
      [30.4950, -97.5520], // East: Along Jakes Hill Rd
      [30.4860, -97.5530], // SE: Jakes Hill Rd at Rowe Lane
      [30.4875, -97.5680], // South: Along Rowe Lane
      [30.4885, -97.5800], // South: Along Rowe Lane
      [30.4850, -97.5950]  // Back to SW
    ];

    const masterPolygon = L.polygon(masterServiceBoundary, {
      color: '#1b5e20',
      fillColor: '#8bc34a',
      fillOpacity: 0.12,
      weight: 3,
      dashArray: '8, 6'
    }).addTo(map);

    masterPolygon.bindPopup(`
      <div class="map-popup-box">
        <h4>⚡ The Turf Barber Priority Territory</h4>
        <p class="popup-sub">Bounded by Highway 130, Rowe Lane, East Wilco Highway & Jakes Hill Road</p>
        <span class="popup-badge">Active Weekly & Bi-Weekly Routes</span>
        <p class="popup-info">Covering The Estates at Rowe Lane, Rolling Meadows, Steeds Crossing & Rolling Hills.</p>
        <a href="#calculator" class="popup-link">Book Your Cut &rarr;</a>
      </div>
    `);

    // Four Bounding Road Corridor Labels
    const roadBadges = [
      { name: "Highway 130 (West)", lat: 30.5050, lng: -97.5925 },
      { name: "East Wilco Hwy (North)", lat: 30.5220, lng: -97.5690 },
      { name: "Jakes Hill Rd (East)", lat: 30.5020, lng: -97.5510 },
      { name: "Rowe Lane (South)", lat: 30.4870, lng: -97.5740 }
    ];

    const roadLabelIcon = (text) => L.divIcon({
      className: 'road-corridor-marker',
      html: `<div style="background:#092313; color:#8bc34a; font-size:10.5px; font-weight:800; padding:2px 8px; border-radius:10px; border:1px solid #8bc34a; box-shadow:0 2px 6px rgba(0,0,0,0.3); white-space:nowrap;">🛣️ ${text}</div>`,
      iconSize: [120, 20],
      iconAnchor: [60, 10]
    });

    roadBadges.forEach(r => {
      L.marker([r.lat, r.lng], { icon: roadLabelIcon(r.name) }).addTo(map);
    });

    // Neighborhood Grids Inside the Bounded Quadrangle
    const neighborhoods = {
      rowelane: {
        name: "The Estates at Rowe Lane",
        label: "Estates at Rowe Lane",
        center: [30.4910, -97.5850],
        coords: [
          [30.4855, -97.5940],
          [30.4965, -97.5930],
          [30.4975, -97.5780],
          [30.4880, -97.5770],
          [30.4855, -97.5880]
        ],
        desc: "Along Rowe Lane between Hwy 130 and Hodde Ln",
        color: "#28a745"
      },
      steeds: {
        name: "Steeds Crossing",
        label: "Steeds Crossing",
        center: [30.5040, -97.5850],
        coords: [
          [30.4980, -97.5930],
          [30.5100, -97.5900],
          [30.5090, -97.5790],
          [30.4980, -97.5810]
        ],
        desc: "Derby Day Ave & Steeds Crossing corridor",
        color: "#388e3c"
      },
      rollinghills: {
        name: "Rolling Hills",
        label: "Rolling Hills",
        center: [30.5150, -97.5740],
        coords: [
          [30.5110, -97.5860],
          [30.5210, -97.5840],
          [30.5190, -97.5640],
          [30.5100, -97.5660]
        ],
        desc: "Northern sector along East Wilco Highway",
        color: "#2e7d32"
      },
      rollingmeadows: {
        name: "Rolling Meadows",
        label: "Rolling Meadows",
        center: [30.4960, -97.5630],
        coords: [
          [30.4880, -97.5750],
          [30.5080, -97.5760],
          [30.5070, -97.5530],
          [30.4865, -97.5530]
        ],
        desc: "Texas Meadows Dr towards Jakes Hill Rd",
        color: "#1e7e34"
      }
    };

    const neighborhoodLayers = {};

    const turfPinIcon = (label) => L.divIcon({
      className: 'turf-map-marker',
      html: `<div class="turf-pin-inner"><span class="pin-symbol">🌿</span><span class="pin-text">${label}</span></div>`,
      iconSize: [130, 32],
      iconAnchor: [65, 32]
    });

    Object.entries(neighborhoods).forEach(([key, n]) => {
      const poly = L.polygon(n.coords, {
        color: n.color,
        weight: 2.5,
        fillColor: n.color,
        fillOpacity: 0.32
      }).addTo(map);

      const marker = L.marker(n.center, {
        icon: turfPinIcon(n.label)
      }).addTo(map);

      const popupContent = `
        <div class="map-popup-box">
          <h4>${n.name}</h4>
          <p class="popup-sub">${n.desc}</p>
          <span class="popup-badge">⚡ Active Electric Service Route</span>
          <p class="popup-info">Weekly & Bi-Weekly Mowing, Hard Edging & Bagging.</p>
          <a href="#calculator" class="popup-link">Get Instant Quote &rarr;</a>
        </div>
      `;

      poly.bindPopup(popupContent);
      marker.bindPopup(popupContent);

      poly.on('mouseover', () => poly.setStyle({ fillOpacity: 0.55, weight: 3.5 }));
      poly.on('mouseout', () => poly.setStyle({ fillOpacity: 0.32, weight: 2.5 }));

      neighborhoodLayers[key] = { poly, marker, center: n.center };
    });

    // Fit map to master perimeter
    map.fitBounds(masterPolygon.getBounds(), { padding: [30, 30] });

    // Interactive button filtering
    const filterBtns = document.querySelectorAll('.map-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const target = btn.getAttribute('data-target');
        if (target === 'all') {
          map.fitBounds(masterPolygon.getBounds(), { padding: [30, 30] });
        } else if (neighborhoodLayers[target]) {
          map.setView(neighborhoodLayers[target].center, 15);
          neighborhoodLayers[target].poly.openPopup();
        }
      });
    });
  }

  initServiceAreaMap();
});
