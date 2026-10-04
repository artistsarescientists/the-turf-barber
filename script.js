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

    // Centered on North & Northeast Pflugerville
    const map = L.map('service-area-map', {
      scrollWheelZoom: false,
      zoomControl: true
    }).setView([30.468, -97.598], 13);

    // OpenStreetMap standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    // Master North & Northeast Pflugerville Service Area Perimeter
    const masterServiceBoundary = [
      [30.4480, -97.6320],
      [30.4620, -97.6300],
      [30.4740, -97.6250],
      [30.4880, -97.6180],
      [30.4930, -97.6020],
      [30.4930, -97.5850],
      [30.4850, -97.5680],
      [30.4650, -97.5640],
      [30.4500, -97.5750],
      [30.4450, -97.6000],
      [30.4480, -97.6320]
    ];

    const masterPolygon = L.polygon(masterServiceBoundary, {
      color: '#2e7d32',
      fillColor: '#8bc34a',
      fillOpacity: 0.12,
      weight: 2,
      dashArray: '6, 6'
    }).addTo(map);

    masterPolygon.bindPopup(`
      <div class="map-popup-box">
        <h4>⚡ North & Northeast Pflugerville</h4>
        <p class="popup-sub">Official All-Electric Service Route</p>
        <span class="popup-badge">Priority Coverage Territory</span>
        <p class="popup-info">Weekly & Bi-Weekly Mowing, Hard Edging & Bagging.</p>
        <a href="#calculator" class="popup-link">Book Your Cut &rarr;</a>
      </div>
    `);

    // Specific Neighborhood Outlines & Details
    const neighborhoods = {
      rowelane: {
        name: "The Estates at Rowe Lane",
        label: "Estates at Rowe Lane",
        center: [30.4715, -97.5990],
        coords: [
          [30.4785, -97.6080],
          [30.4795, -97.5910],
          [30.4670, -97.5890],
          [30.4630, -97.5975],
          [30.4665, -97.6080]
        ],
        desc: "Northeast Pflugerville • Rowe Lane corridor",
        color: "#28a745"
      },
      rollingmeadows: {
        name: "Rolling Meadows",
        label: "Rolling Meadows",
        center: [30.4670, -97.5810],
        coords: [
          [30.4745, -97.5890],
          [30.4755, -97.5730],
          [30.4600, -97.5720],
          [30.4590, -97.5870]
        ],
        desc: "Northeast Pflugerville • Texas Meadows Dr & scenic lots",
        color: "#1e7e34"
      },
      steeds: {
        name: "Steeds Crossing",
        label: "Steeds Crossing",
        center: [30.4590, -97.6160],
        coords: [
          [30.4675, -97.6255],
          [30.4685, -97.6100],
          [30.4520, -97.6080],
          [30.4510, -97.6220],
          [30.4590, -97.6255]
        ],
        desc: "North Pflugerville • Grand National Ave & FM 685",
        color: "#388e3c"
      },
      rollinghills: {
        name: "Rolling Hills",
        label: "Rolling Hills",
        center: [30.4820, -97.5980],
        coords: [
          [30.4880, -97.6065],
          [30.4890, -97.5915],
          [30.4790, -97.5905],
          [30.4780, -97.6055]
        ],
        desc: "North Pflugerville • Scenic residential community",
        color: "#2e7d32"
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
        fillOpacity: 0.28
      }).addTo(map);

      const marker = L.marker(n.center, {
        icon: turfPinIcon(n.label)
      }).addTo(map);

      const popupContent = `
        <div class="map-popup-box">
          <h4>${n.name}</h4>
          <p class="popup-sub">${n.desc}</p>
          <span class="popup-badge">⚡ Active Electric Service Route</span>
          <p class="popup-info">Weekly & Bi-Weekly Mowing, Edging, and Bagging.</p>
          <a href="#calculator" class="popup-link">Get Instant Quote &rarr;</a>
        </div>
      `;

      poly.bindPopup(popupContent);
      marker.bindPopup(popupContent);

      poly.on('mouseover', () => poly.setStyle({ fillOpacity: 0.5, weight: 3.5 }));
      poly.on('mouseout', () => poly.setStyle({ fillOpacity: 0.28, weight: 2.5 }));

      neighborhoodLayers[key] = { poly, marker, center: n.center };
    });

    // Fit map to outer boundary initially
    map.fitBounds(masterPolygon.getBounds(), { padding: [25, 25] });

    // Interactive button filtering
    const filterBtns = document.querySelectorAll('.map-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const target = btn.getAttribute('data-target');
        if (target === 'all') {
          map.fitBounds(masterPolygon.getBounds(), { padding: [25, 25] });
        } else if (target === 'northpville') {
          map.setView([30.468, -97.615], 14);
        } else if (target === 'nepville') {
          map.setView([30.470, -97.590], 14);
        } else if (neighborhoodLayers[target]) {
          map.setView(neighborhoodLayers[target].center, 15);
          neighborhoodLayers[target].poly.openPopup();
        }
      });
    });
  }

  initServiceAreaMap();
});
