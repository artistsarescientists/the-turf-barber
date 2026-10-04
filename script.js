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

    // Exact GPS coordinates:
    // 30°28'56.2"N 97°33'43.1"W -> [30.482278, -97.561972]
    // 30°29'05.6"N 97°35'03.3"W -> [30.484889, -97.584250]
    // 30°30'01.7"N 97°34'48.0"W -> [30.500472, -97.580000]
    // 30°29'43.8"N 97°33'37.9"W -> [30.495500, -97.560528]
    const serviceCoordinates = [
      [30.482278, -97.561972],
      [30.484889, -97.584250],
      [30.500472, -97.580000],
      [30.495500, -97.560528]
    ];

    // Clean map instance
    const map = L.map('service-area-map', {
      scrollWheelZoom: false,
      zoomControl: true
    });

    // OpenStreetMap standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18
    }).addTo(map);

    // Single translucent overlay
    const overlay = L.polygon(serviceCoordinates, {
      color: '#2e7d32',
      weight: 2.5,
      fillColor: '#8bc34a',
      fillOpacity: 0.35
    }).addTo(map);

    overlay.bindPopup(`
      <div class="map-popup-box">
        <h4>⚡ The Turf Barber Service Area</h4>
        <span class="popup-badge">Active Electric Service Route</span>
        <p class="popup-info">Weekly & Bi-Weekly Mowing, Hard Edging & Bagging.</p>
        <a href="#calculator" class="popup-link">Book Your Cut &rarr;</a>
      </div>
    `);

    // Zoom cleanly directly on the exact coordinates
    map.fitBounds(overlay.getBounds(), { padding: [35, 35] });
  }

  initServiceAreaMap();
});
