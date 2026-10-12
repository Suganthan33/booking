/**
 * ============================================================================
 * Appointly — Appointment Booking System
 * Modern, Beginner-Friendly Vanilla JavaScript Implementation
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. Constants & Configuration
// ----------------------------------------------------------------------------
const STORAGE_KEY = 'appointly_bookings';

// Standard 9 time slots required by project specifications
const STANDARD_TIME_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM'
];

// ----------------------------------------------------------------------------
// 2. DOM Elements Cache
// ----------------------------------------------------------------------------
const form = document.getElementById('appointmentForm');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const serviceTypeSelect = document.getElementById('serviceType');
const appointmentDateInput = document.getElementById('appointmentDate');
const selectedTimeSlotInput = document.getElementById('selectedTimeSlot');
const additionalNotesInput = document.getElementById('additionalNotes');
const charCountSpan = document.getElementById('charCount');
const submitBtn = document.getElementById('submitBtn');
const resetFormBtn = document.getElementById('resetFormBtn');
const formAlert = document.getElementById('formAlert');

// Slots DOM
const noDateSelectedPrompt = document.getElementById('noDateSelectedPrompt');
const slotsWrapper = document.getElementById('slotsWrapper');
const slotsActiveDateText = document.getElementById('slotsActiveDateText');
const timeSlotsGrid = document.getElementById('timeSlotsGrid');
const noSlotsAvailableMsg = document.getElementById('noSlotsAvailableMsg');

// Live Summary Sidebar DOM
const summaryService = document.getElementById('summaryService');
const summaryDate = document.getElementById('summaryDate');
const summaryTime = document.getElementById('summaryTime');
const summaryName = document.getElementById('summaryName');
const summaryEmail = document.getElementById('summaryEmail');
const summaryPhone = document.getElementById('summaryPhone');

// Appointments List & Controls DOM
const appointmentsContainer = document.getElementById('appointmentsContainer');
const emptyAppointmentsState = document.getElementById('emptyAppointmentsState');
const appointmentCountBadge = document.getElementById('appointmentCountBadge');
const navBookingBadge = document.getElementById('navBookingBadge');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const filterTabs = document.querySelectorAll('.filter-tab');
const serviceFilter = document.getElementById('serviceFilter');
const sortOrder = document.getElementById('sortOrder');
const addSampleDataBtn = document.getElementById('addSampleDataBtn');
const clearAllBookingsBtn = document.getElementById('clearAllBookingsBtn');

// Modals DOM
const cancelModal = document.getElementById('cancelModal');
const cancelModalBookingId = document.getElementById('cancelModalBookingId');
const cancelModalDetails = document.getElementById('cancelModalDetails');
const abortCancelBtn = document.getElementById('abortCancelBtn');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');

const successModal = document.getElementById('successModal');
const successReceiptDetails = document.getElementById('successReceiptDetails');
const viewBookingsBtn = document.getElementById('viewBookingsBtn');
const closeSuccessModalBtn = document.getElementById('closeSuccessModalBtn');

// Toast Container
const toastContainer = document.getElementById('toastContainer');

// State Tracking
let activeTabFilter = 'all'; // 'all', 'upcoming', 'past'
let appointmentToCancelId = null;

// ----------------------------------------------------------------------------
// 3. Storage Utilities (LocalStorage)
// ----------------------------------------------------------------------------
/**
 * Retrieves all saved appointments from localStorage.
 * Gracefully handles missing or corrupted JSON data.
 * @returns {Array} Array of appointment objects
 */
function getAppointmentsFromStorage() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) return [];
    const parsed = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Appointly: Failed to read from localStorage:', error);
    showToast('Storage Error', 'Could not read stored appointments. Starting fresh.', 'error');
    return [];
  }
}

/**
 * Saves appointment list to localStorage safely.
 * @param {Array} appointments 
 * @returns {boolean} Success status
 */
function saveAppointmentsToStorage(appointments) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    return true;
  } catch (error) {
    console.error('Appointly: Failed to save to localStorage:', error);
    showToast('Storage Error', 'Unable to save appointment to browser storage.', 'error');
    return false;
  }
}

// ----------------------------------------------------------------------------
// 4. Initialization & Setup
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // 1. Set current year in footer
  const yearElem = document.getElementById('currentYear');
  if (yearElem) yearElem.textContent = new Date().getFullYear();

  // 2. Set min date attribute to today (prevents past date selection in HTML5 picker)
  setMinBookingDate();

  // 3. Register Event Listeners
  initEventListeners();

  // 4. Initial Render of Appointments and Badges
  renderAppointments();
  updateAppointmentCounters();
});

/**
 * Sets the 'min' attribute of the date input to today's date formatted as YYYY-MM-DD
 */
function setMinBookingDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const minDateString = `${yyyy}-${mm}-${dd}`;
  appointmentDateInput.setAttribute('min', minDateString);
}

// ----------------------------------------------------------------------------
// 5. Event Listeners Setup
// ----------------------------------------------------------------------------
function initEventListeners() {
  // Service selection via interactive cards
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach(card => {
    card.addEventListener('click', () => {
      const serviceName = card.getAttribute('data-service');
      serviceTypeSelect.value = serviceName;
      highlightSelectedServiceCard(serviceName);
      updateSummaryPreview();
      clearFieldError('serviceType');
      
      // Smooth scroll to form if clicked on services section
      if (window.innerWidth <= 768) {
        document.getElementById('bookingSection').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Service select dropdown changes
  serviceTypeSelect.addEventListener('change', () => {
    highlightSelectedServiceCard(serviceTypeSelect.value);
    updateSummaryPreview();
    clearFieldError('serviceType');
  });

  // Date selection change
  appointmentDateInput.addEventListener('change', handleDateChange);

  // Live input sync with summary preview & validation clearing
  fullNameInput.addEventListener('input', () => {
    updateSummaryPreview();
    clearFieldError('fullName');
  });

  emailInput.addEventListener('input', () => {
    updateSummaryPreview();
    clearFieldError('email');
  });

  phoneInput.addEventListener('input', (e) => {
    // Only allow numbers in phone input
    phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
    updateSummaryPreview();
    clearFieldError('phone');
  });

  // Textarea character counter
  additionalNotesInput.addEventListener('input', () => {
    charCountSpan.textContent = `${additionalNotesInput.value.length} / 300`;
  });

  // Form submission
  form.addEventListener('submit', handleFormSubmit);

  // Form reset button
  resetFormBtn.addEventListener('click', resetBookingForm);

  // Search and Filters
  searchInput.addEventListener('input', () => {
    clearSearchBtn.classList.toggle('hidden', searchInput.value.length === 0);
    renderAppointments();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    renderAppointments();
  });

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTabFilter = tab.getAttribute('data-filter');
      renderAppointments();
    });
  });

  serviceFilter.addEventListener('change', renderAppointments);
  sortOrder.addEventListener('change', renderAppointments);

  // Sample data and clear buttons
  if (addSampleDataBtn) addSampleDataBtn.addEventListener('click', loadSampleData);
  if (clearAllBookingsBtn) clearAllBookingsBtn.addEventListener('click', handleClearAll);

  // Cancel Modal events
  abortCancelBtn.addEventListener('click', closeCancelModal);
  confirmCancelBtn.addEventListener('click', executeCancellation);
  cancelModal.addEventListener('click', (e) => {
    if (e.target === cancelModal) closeCancelModal();
  });

  // Success Modal events
  viewBookingsBtn.addEventListener('click', () => {
    closeSuccessModal();
    document.getElementById('appointmentsSection').scrollIntoView({ behavior: 'smooth' });
  });
  closeSuccessModalBtn.addEventListener('click', closeSuccessModal);
  successModal.addEventListener('click', (e) => {
    if (e.target === successModal) closeSuccessModal();
  });

  // Escape key to dismiss modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!cancelModal.classList.contains('hidden')) closeCancelModal();
      if (!successModal.classList.contains('hidden')) closeSuccessModal();
    }
  });
}

// ----------------------------------------------------------------------------
// 6. Service Cards & Summary Sync
// ----------------------------------------------------------------------------
function highlightSelectedServiceCard(selectedService) {
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach(card => {
    const isSelected = card.getAttribute('data-service') === selectedService;
    card.classList.toggle('selected', isSelected);
  });
}

function updateSummaryPreview() {
  summaryService.textContent = serviceTypeSelect.value || '— Not Selected';
  summaryDate.textContent = formatDateForDisplay(appointmentDateInput.value) || '— Not Selected';
  summaryTime.textContent = selectedTimeSlotInput.value || '— Not Selected';
  summaryName.textContent = fullNameInput.value.trim() || '—';
  summaryEmail.textContent = emailInput.value.trim() || '—';
  summaryPhone.textContent = phoneInput.value.trim() || '—';
}

// ----------------------------------------------------------------------------
// 7. Time Slots Management & Availability Logic
// ----------------------------------------------------------------------------
/**
 * Runs whenever the appointment date input changes.
 * Validates date, checks booked slots, and renders slot buttons.
 */
function handleDateChange() {
  const selectedDate = appointmentDateInput.value;
  clearFieldError('appointmentDate');
  clearFieldError('timeSlot');
  selectedTimeSlotInput.value = '';
  updateSummaryPreview();

  if (!selectedDate) {
    noDateSelectedPrompt.classList.remove('hidden');
    slotsWrapper.classList.add('hidden');
    return;
  }

  // Validate that user didn't somehow pick a past date
  const isPast = checkIfDateIsPast(selectedDate);
  if (isPast) {
    showFieldError('appointmentDate', 'You cannot select a past date.');
    noDateSelectedPrompt.classList.remove('hidden');
    slotsWrapper.classList.add('hidden');
    return;
  }

  // Display slot grid
  noDateSelectedPrompt.classList.add('hidden');
  slotsWrapper.classList.remove('hidden');
  slotsActiveDateText.textContent = `Available Slots for: ${formatDateForDisplay(selectedDate)}`;

  renderTimeSlotsForDate(selectedDate);
}

/**
 * Checks whether a given 'YYYY-MM-DD' date string is before today.
 */
function checkIfDateIsPast(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return targetDate < today;
}

/**
 * Checks if a specific time slot has already passed for today.
 * E.g., if today is 2:30 PM, then 09:00 AM - 02:00 PM are past.
 */
function isSlotPassedToday(dateStr, timeSlotStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const today = new Date();
  
  const isToday = (
    today.getFullYear() === year &&
    today.getMonth() === (month - 1) &&
    today.getDate() === day
  );

  if (!isToday) return false;

  // Parse time slot like "02:00 PM"
  const [timePart, period] = timeSlotStr.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const slotTime = new Date();
  slotTime.setHours(hours, minutes, 0, 0);

  return slotTime <= today;
}

/**
 * Renders the 9 time slot buttons for the chosen date.
 * Queries existing appointments to detect booked slots.
 */
function renderTimeSlotsForDate(dateStr) {
  timeSlotsGrid.innerHTML = '';
  const appointments = getAppointmentsFromStorage();

  // Find all times already reserved for this exact date
  const bookedTimes = appointments
    .filter(apt => apt.date === dateStr)
    .map(apt => apt.time);

  let availableCount = 0;

  STANDARD_TIME_SLOTS.forEach(timeSlot => {
    const isBooked = bookedTimes.includes(timeSlot);
    const isPassed = isSlotPassedToday(dateStr, timeSlot);
    const isUnavailable = isBooked || isPassed;

    if (!isUnavailable) availableCount++;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'time-slot-btn';
    btn.setAttribute('data-time', timeSlot);

    let statusText = 'Available';
    if (isBooked) {
      statusText = 'Booked';
      btn.classList.add('booked');
      btn.disabled = true;
      btn.title = 'This slot has already been booked by another client';
    } else if (isPassed) {
      statusText = 'Time Passed';
      btn.classList.add('past-slot');
      btn.disabled = true;
      btn.title = 'This time has already passed today';
    }

    btn.innerHTML = `
      <span class="slot-time-text">${timeSlot}</span>
      <span class="slot-status-text">${statusText}</span>
    `;

    if (!isUnavailable) {
      btn.addEventListener('click', () => {
        // Deselect all previous slots
        document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
        // Select this slot
        btn.classList.add('selected');
        selectedTimeSlotInput.value = timeSlot;
        clearFieldError('timeSlot');
        updateSummaryPreview();
      });
    }

    timeSlotsGrid.appendChild(btn);
  });

  // If no slots available at all for this date
  noSlotsAvailableMsg.classList.toggle('hidden', availableCount > 0);
}

// ----------------------------------------------------------------------------
// 8. Form Validation & Submission
// ----------------------------------------------------------------------------
/**
 * Validates all fields according to project rules:
 * - Name: not empty or whitespace only
 * - Email: valid pattern
 * - Phone: exactly 10 digits
 * - Service: selected
 * - Date: selected & not past
 * - Time: selected
 */
function validateBookingForm() {
  let isValid = true;
  clearAllFieldErrors();
  hideFormAlert();

  // 1. Full Name
  const nameValue = fullNameInput.value.trim();
  if (!nameValue) {
    showFieldError('fullName', 'Full name is required and cannot be empty.');
    isValid = false;
  } else if (nameValue.length < 2) {
    showFieldError('fullName', 'Please enter a valid name (at least 2 letters).');
    isValid = false;
  }

  // 2. Email Address
  const emailValue = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailValue) {
    showFieldError('email', 'Email address is required.');
    isValid = false;
  } else if (!emailRegex.test(emailValue)) {
    showFieldError('email', 'Please enter a valid email address (e.g. name@example.com).');
    isValid = false;
  }

  // 3. Phone Number (exactly 10 digits)
  const phoneValue = phoneInput.value.trim();
  const phoneRegex = /^\d{10}$/;
  if (!phoneValue) {
    showFieldError('phone', 'Phone number is required.');
    isValid = false;
  } else if (!phoneRegex.test(phoneValue)) {
    showFieldError('phone', 'Phone number must contain exactly 10 digits.');
    isValid = false;
  }

  // 4. Service Type
  const serviceValue = serviceTypeSelect.value;
  if (!serviceValue) {
    showFieldError('serviceType', 'Please select a service type.');
    isValid = false;
  }

  // 5. Appointment Date
  const dateValue = appointmentDateInput.value;
  if (!dateValue) {
    showFieldError('appointmentDate', 'Please select an appointment date.');
    isValid = false;
  } else if (checkIfDateIsPast(dateValue)) {
    showFieldError('appointmentDate', 'Appointment date cannot be in the past.');
    isValid = false;
  }

  // 6. Time Slot
  const timeValue = selectedTimeSlotInput.value;
  if (!timeValue) {
    showFieldError('timeSlot', 'Please select an available time slot.');
    isValid = false;
  } else if (dateValue && isSlotPassedToday(dateValue, timeValue)) {
    showFieldError('timeSlot', 'The selected time slot has already passed today.');
    isValid = false;
  }

  return isValid;
}

/**
 * Handles Form Submission with Duplicate Prevention Guard
 */
function handleFormSubmit(e) {
  e.preventDefault();

  if (!validateBookingForm()) {
    showFormAlert('Please resolve the highlighted errors in the form before submitting.', 'error');
    return;
  }

  const newAppointment = {
    id: generateBookingId(),
    fullName: fullNameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    service: serviceTypeSelect.value,
    date: appointmentDateInput.value,
    time: selectedTimeSlotInput.value,
    notes: additionalNotesInput.value.trim() || 'No additional notes',
    createdAt: new Date().toISOString()
  };

  // Duplicate Booking Prevention Check
  const currentAppointments = getAppointmentsFromStorage();
  const isDuplicate = currentAppointments.some(apt => 
    apt.date === newAppointment.date && apt.time === newAppointment.time
  );

  if (isDuplicate) {
    showFormAlert(`The slot on ${formatDateForDisplay(newAppointment.date)} at ${newAppointment.time} is already booked! Please select another slot.`, 'error');
    showFieldError('timeSlot', 'This slot was just taken. Please pick another one.');
    // Refresh slots immediately to show latest availability
    renderTimeSlotsForDate(newAppointment.date);
    selectedTimeSlotInput.value = '';
    updateSummaryPreview();
    return;
  }

  // Save new appointment
  currentAppointments.push(newAppointment);
  const saveSuccess = saveAppointmentsToStorage(currentAppointments);

  if (!saveSuccess) {
    showFormAlert('Could not save your booking due to a browser storage issue.', 'error');
    return;
  }

  // Success actions
  showToast('Booking Confirmed!', `Appointment #${newAppointment.id} successfully reserved for ${newAppointment.fullName}.`, 'success');
  
  // Show confirmation modal
  showSuccessModal(newAppointment);

  // Refresh UI
  renderAppointments();
  updateAppointmentCounters();
  renderTimeSlotsForDate(newAppointment.date);

  // Reset form inputs
  resetBookingForm();
}

/**
 * Generates an easy-to-read reference ID e.g. APT-73921
 */
function generateBookingId() {
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `APT-${randomDigits}`;
}

function resetBookingForm() {
  form.reset();
  selectedTimeSlotInput.value = '';
  charCountSpan.textContent = '0 / 300';
  highlightSelectedServiceCard('');
  noDateSelectedPrompt.classList.remove('hidden');
  slotsWrapper.classList.add('hidden');
  clearAllFieldErrors();
  hideFormAlert();
  updateSummaryPreview();
}

// ----------------------------------------------------------------------------
// 9. Error Helpers & Alerts
// ----------------------------------------------------------------------------
function showFieldError(fieldKey, message) {
  const errorElem = document.getElementById(`${fieldKey}Error`);
  if (errorElem) errorElem.textContent = message;

  const inputElem = document.getElementById(fieldKey);
  if (inputElem && inputElem.classList) inputElem.classList.add('input-error');
}

function clearFieldError(fieldKey) {
  const errorElem = document.getElementById(`${fieldKey}Error`);
  if (errorElem) errorElem.textContent = '';

  const inputElem = document.getElementById(fieldKey);
  if (inputElem && inputElem.classList) inputElem.classList.remove('input-error');
}

function clearAllFieldErrors() {
  ['fullName', 'email', 'phone', 'serviceType', 'appointmentDate', 'timeSlot'].forEach(clearFieldError);
}

function showFormAlert(message, type = 'error') {
  formAlert.textContent = message;
  formAlert.className = `form-alert alert-${type}`;
  formAlert.classList.remove('hidden');
  formAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideFormAlert() {
  formAlert.classList.add('hidden');
  formAlert.textContent = '';
}

// ----------------------------------------------------------------------------
// 10. Appointments Listing, Search & Filters
// ----------------------------------------------------------------------------
/**
 * Renders the list of appointment cards according to search, filter, and sort settings
 */
function renderAppointments() {
  const appointments = getAppointmentsFromStorage();
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedService = serviceFilter.value;
  const sort = sortOrder.value;

  // 1. Filter by Search Query (Name, Email, ID)
  let filtered = appointments.filter(apt => {
    if (!searchTerm) return true;
    const nameMatch = apt.fullName.toLowerCase().includes(searchTerm);
    const emailMatch = apt.email.toLowerCase().includes(searchTerm);
    const idMatch = apt.id.toLowerCase().includes(searchTerm);
    return nameMatch || emailMatch || idMatch;
  });

  // 2. Filter by Service
  if (selectedService !== 'all') {
    filtered = filtered.filter(apt => apt.service === selectedService);
  }

  // 3. Filter by Tab (All, Upcoming, Past)
  if (activeTabFilter === 'upcoming') {
    filtered = filtered.filter(apt => getAppointmentStatus(apt.date, apt.time) === 'Upcoming');
  } else if (activeTabFilter === 'past') {
    filtered = filtered.filter(apt => getAppointmentStatus(apt.date, apt.time) === 'Past');
  }

  // 4. Sort
  filtered.sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${convertTimeTo24H(a.time)}`).getTime();
    const dateTimeB = new Date(`${b.date}T${convertTimeTo24H(b.time)}`).getTime();
    
    if (sort === 'date-asc') return dateTimeA - dateTimeB;
    if (sort === 'date-desc') return dateTimeB - dateTimeA;
    if (sort === 'created-desc') return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  // Handle Empty State
  if (filtered.length === 0) {
    appointmentsContainer.innerHTML = '';
    emptyAppointmentsState.classList.remove('hidden');
    
    const emptyStateMessage = document.getElementById('emptyStateMessage');
    if (appointments.length === 0) {
      emptyStateMessage.textContent = "You haven't booked any appointments yet. Select your service above to schedule!";
    } else {
      emptyStateMessage.textContent = "No appointments match your search and filter criteria. Try adjusting your query.";
    }
    return;
  }

  emptyAppointmentsState.classList.add('hidden');
  appointmentsContainer.innerHTML = '';

  // Render Cards
  filtered.forEach(apt => {
    const card = createAppointmentCard(apt);
    appointmentsContainer.appendChild(card);
  });
}

/**
 * Creates an appointment card DOM element
 */
function createAppointmentCard(apt) {
  const card = document.createElement('div');
  card.className = 'appointment-card';
  card.setAttribute('data-id', apt.id);

  const status = getAppointmentStatus(apt.date, apt.time);
  const statusClass = status === 'Upcoming' ? 'upcoming' : 'past';
  const formattedDate = formatDateForDisplay(apt.date);
  const formattedBookingTime = formatCreatedAt(apt.createdAt);

  card.innerHTML = `
    <div>
      <div class="card-top">
        <span class="booking-ref-badge">#${apt.id}</span>
        <span class="status-badge ${statusClass}">${status}</span>
      </div>

      <div class="card-customer">
        <h3 class="card-customer-name">${escapeHTML(apt.fullName)}</h3>
        <span class="card-service-pill">${escapeHTML(apt.service)}</span>
      </div>

      <div class="card-details-list">
        <div class="card-detail-item">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <strong>${formattedDate}</strong>
        </div>

        <div class="card-detail-item">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>${apt.time}</span>
        </div>

        <div class="card-detail-item">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <span>${escapeHTML(apt.email)}</span>
        </div>

        <div class="card-detail-item">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          <span>+91 ${escapeHTML(apt.phone)}</span>
        </div>
      </div>

      ${apt.notes && apt.notes !== 'No additional notes' ? `
        <div class="card-notes">
          <strong>Note:</strong> ${escapeHTML(apt.notes)}
        </div>
      ` : ''}
    </div>

    <div class="card-footer">
      <span class="card-created-time">Booked on ${formattedBookingTime}</span>
      <button type="button" class="btn btn-outline-danger btn-sm cancel-apt-btn" data-id="${apt.id}">
        Cancel
      </button>
    </div>
  `;

  // Attach cancel listener
  const cancelBtn = card.querySelector('.cancel-apt-btn');
  cancelBtn.addEventListener('click', () => promptCancellation(apt));

  return card;
}

/**
 * Returns 'Upcoming' or 'Past' based on appointment date & time
 */
function getAppointmentStatus(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const time24 = convertTimeTo24H(timeStr);
  const [hours, minutes] = time24.split(':').map(Number);

  const aptDate = new Date(year, month - 1, day, hours, minutes);
  const now = new Date();

  return aptDate >= now ? 'Upcoming' : 'Past';
}

function updateAppointmentCounters() {
  const appointments = getAppointmentsFromStorage();
  const count = appointments.length;

  if (appointmentCountBadge) appointmentCountBadge.textContent = count;
  if (navBookingBadge) navBookingBadge.textContent = count;
}

// ----------------------------------------------------------------------------
// 11. Appointment Cancellation Flow
// ----------------------------------------------------------------------------
function promptCancellation(apt) {
  appointmentToCancelId = apt.id;
  cancelModalBookingId.textContent = `#${apt.id}`;
  
  cancelModalDetails.innerHTML = `
    <div><strong>Customer:</strong> ${escapeHTML(apt.fullName)}</div>
    <div><strong>Service:</strong> ${escapeHTML(apt.service)}</div>
    <div><strong>Date & Time:</strong> ${formatDateForDisplay(apt.date)} at ${apt.time}</div>
  `;

  cancelModal.classList.remove('hidden');
}

function closeCancelModal() {
  cancelModal.classList.add('hidden');
  appointmentToCancelId = null;
}

function executeCancellation() {
  if (!appointmentToCancelId) return;

  const appointments = getAppointmentsFromStorage();
  const targetApt = appointments.find(a => a.id === appointmentToCancelId);
  const updatedList = appointments.filter(a => a.id !== appointmentToCancelId);

  saveAppointmentsToStorage(updatedList);
  closeCancelModal();

  showToast('Appointment Cancelled', `Slot for #${appointmentToCancelId} has been freed.`, 'info');

  // Update UI and badges
  renderAppointments();
  updateAppointmentCounters();

  // If the user currently has that date open in the booking form, refresh its slots immediately!
  if (targetApt && appointmentDateInput.value === targetApt.date) {
    renderTimeSlotsForDate(targetApt.date);
  }
}

function handleClearAll() {
  const appointments = getAppointmentsFromStorage();
  if (appointments.length === 0) {
    showToast('No Appointments', 'There are no appointments to clear.', 'info');
    return;
  }

  if (confirm('Are you sure you want to remove all saved appointments? This action cannot be undone.')) {
    saveAppointmentsToStorage([]);
    renderAppointments();
    updateAppointmentCounters();
    
    if (appointmentDateInput.value) {
      renderTimeSlotsForDate(appointmentDateInput.value);
    }
    
    showToast('All Cleared', 'All appointments have been cleared from local storage.', 'info');
  }
}

// ----------------------------------------------------------------------------
// 12. Success Receipt Modal
// ----------------------------------------------------------------------------
function showSuccessModal(apt) {
  successReceiptDetails.innerHTML = `
    <div><strong>Booking Reference:</strong> #${apt.id}</div>
    <div><strong>Customer Name:</strong> ${escapeHTML(apt.fullName)}</div>
    <div><strong>Service:</strong> ${escapeHTML(apt.service)}</div>
    <div><strong>Date:</strong> ${formatDateForDisplay(apt.date)}</div>
    <div><strong>Time Slot:</strong> ${apt.time}</div>
    <div><strong>Email:</strong> ${escapeHTML(apt.email)}</div>
    <div><strong>Phone:</strong> +91 ${escapeHTML(apt.phone)}</div>
    ${apt.notes && apt.notes !== 'No additional notes' ? `<div><strong>Notes:</strong> ${escapeHTML(apt.notes)}</div>` : ''}
  `;
  successModal.classList.remove('hidden');
}

function closeSuccessModal() {
  successModal.classList.add('hidden');
}

// ----------------------------------------------------------------------------
// 13. Toast Notification Helper
// ----------------------------------------------------------------------------
function showToast(title, message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✓';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <div class="toast-content">
      <div class="toast-title">${escapeHTML(title)}</div>
      <div class="toast-message">${escapeHTML(message)}</div>
    </div>
    <button class="toast-close" aria-label="Close notification">&times;</button>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });

  toastContainer.appendChild(toast);

  // Auto remove after 4.5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 250);
  }, 4500);
}

// ----------------------------------------------------------------------------
// 14. Demo Sample Data Loader
// ----------------------------------------------------------------------------
function loadSampleData() {
  const today = new Date();
  
  // Tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  // 2 days later
  const dayAfter = new Date();
  dayAfter.setDate(today.getDate() + 2);
  const dayAfterStr = `${dayAfter.getFullYear()}-${String(dayAfter.getMonth() + 1).padStart(2, '0')}-${String(dayAfter.getDate()).padStart(2, '0')}`;

  const sampleBookings = [
    {
      id: 'APT-10492',
      fullName: 'Emma Watson',
      email: 'emma.watson@example.com',
      phone: '9876543210',
      service: 'General Consultation',
      date: tomStr,
      time: '10:00 AM',
      notes: 'Initial discussion on student project scheduling requirements.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'APT-29381',
      fullName: 'Dr. John Doe',
      email: 'john.doe@hospital.org',
      phone: '9123456780',
      service: 'Dental Check-up',
      date: dayAfterStr,
      time: '02:00 PM',
      notes: 'Routine dental inspection and checkup.',
      createdAt: new Date().toISOString()
    }
  ];

  const current = getAppointmentsFromStorage();
  
  // Add without creating duplicates
  sampleBookings.forEach(sample => {
    const exists = current.some(c => c.date === sample.date && c.time === sample.time);
    if (!exists) current.push(sample);
  });

  saveAppointmentsToStorage(current);
  renderAppointments();
  updateAppointmentCounters();

  if (appointmentDateInput.value) {
    renderTimeSlotsForDate(appointmentDateInput.value);
  }

  showToast('Sample Data Loaded', '2 demo appointments have been added for testing.', 'success');
}

// ----------------------------------------------------------------------------
// 15. Date & Time Helper Utilities
// ----------------------------------------------------------------------------
function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatCreatedAt(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

function convertTimeTo24H(timeStr) {
  if (!timeStr) return '00:00';
  const [timePart, period] = timeStr.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
