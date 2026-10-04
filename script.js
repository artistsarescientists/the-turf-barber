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

    // Bounding box: Highway 130 (West), Rowe Lane (South), East Wilco Hwy (North), Jakes Hill Rd (East)
    const bounds = [
      [30.485, -97.596], // SW: Hwy 130 & Rowe Lane
      [30.522, -97.550]  // NE: East Wilco Hwy & Jakes Hill Rd
    ];

    // Clean map instance
    const map = L.map('service-area-map', {
      scrollWheelZoom: false,
      zoomControl: true
    });

    // OpenStreetMap standard tile layer (matching The Frame Shop implementation)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    // Zoom cleanly directly in on the corridor
    map.fitBounds(bounds, { padding: [20, 20] });

    // Clean, subtle markers for the key communities (no polygon overlays)
    const locations = {
      rowelane: {
        name: "The Estates at Rowe Lane",
        lat: 30.4910,
        lng: -97.5850,
        desc: "Rowe Lane corridor near SH 130"
      },
      steeds: {
        name: "Steeds Crossing",
        lat: 30.5040,
        lng: -97.5850,
        desc: "Derby Day Ave & Steeds Crossing community"
      },
      rollinghills: {
        name: "Rolling Hills",
        lat: 30.5150,
        lng: -97.5740,
        desc: "Residential sector near East Wilco Hwy"
      },
      rollingmeadows: {
        name: "Rolling Meadows",
        lat: 30.4960,
        lng: -97.5630,
        desc: "Texas Meadows Dr towards Jakes Hill Rd"
      }
    };

    const markers = {};

    const pinIcon = (name) => L.divIcon({
      className: 'turf-map-marker',
      html: `<div class="turf-pin-inner"><span class="pin-symbol">🌿</span><span class="pin-text">${name}</span></div>`,
      iconSize: [130, 32],
      iconAnchor: [65, 16]
    });

    Object.entries(locations).forEach(([key, loc]) => {
      const marker = L.marker([loc.lat, loc.lng], { icon: pinIcon(loc.name) }).addTo(map);

      marker.bindPopup(`
        <div class="map-popup-box">
          <h4>${loc.name}</h4>
          <p class="popup-sub">${loc.desc}</p>
          <span class="popup-badge">⚡ Active Electric Service Route</span>
          <p class="popup-info">Weekly & Bi-Weekly Mowing, Hard Edging & Bagging.</p>
          <a href="#calculator" class="popup-link">Book Your Cut &rarr;</a>
        </div>
      `);

      markers[key] = { marker, lat: loc.lat, lng: loc.lng };
    });

    // Interactive button filtering to pan/zoom without overlays
    const filterBtns = document.querySelectorAll('.map-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const target = btn.getAttribute('data-target');
        if (target === 'all') {
          map.fitBounds(bounds, { padding: [20, 20] });
        } else if (markers[target]) {
          map.setView([markers[target].lat, markers[target].lng], 15);
          markers[target].marker.openPopup();
        }
      });
    });
  }

  initServiceAreaMap();
});
