/**
 * Elder Joy Care Center - Professional NGO Script
 * Handles:
 * - Google Translate Integration
 * - Mobile Menu Logic
 * - Sticky Header Effects
 * - Intersection Observer Animations
 * - Donation Form Interactions
 * - Volunteer ID Card Generation (html2canvas & jsPDF)
 */

/**
 * Initializes Google Translate element
 */
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,hi,mr',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
    }, 'google_translate_element');
}

document.addEventListener('DOMContentLoaded', () => {

    // Mark that JavaScript has loaded
    document.body.classList.add('js-loaded');

    // --- 1. Mobile Menu Toggle ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const span = mobileMenuBtn.querySelector('span');
            if (navLinks.classList.contains('active')) {
                span.innerHTML = '&times;'; // Show close icon
            } else {
                span.innerHTML = '&#9776;'; // Show hamburger icon
            }
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuBtn.querySelector('span').innerHTML = '&#9776;';
            });
        });
    }

    // --- 2. Sticky Header Effect ---
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // --- 3. Intersection Observer for Scroll Animations ---
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // --- 4. Donation Form Logic ---
    const donationForm = document.getElementById('donation-form');
    const amountInput = document.getElementById('donation-amount');
    const presetBtns = document.querySelectorAll('.preset-btn');

    if (donationForm && amountInput) {
        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                presetBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                amountInput.value = btn.dataset.amount;
            });
        });

        amountInput.addEventListener('input', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
        });

        donationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const amount = parseFloat(amountInput.value);
            const fullName = document.getElementById('donor-name').value;
            const email = document.getElementById('donor-email').value;
            const phone = document.getElementById('donor-phone').value;

            if (amount < 100) {
                alert('Please enter an amount of ₹100 or more.');
                return;
            }

            const btn = document.getElementById('donation-submit-btn');
            const originalText = btn.innerText;
            btn.innerText = 'Processing...';
            btn.disabled = true;

            try {
                // Create payment order
                const response = await fetch('http://localhost:5000/api/create-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        fullName: fullName,
                        email: email,
                        phone: phone,
                        amount: amount
                    })
                });

                const data = await response.json();

                if (data.success) {
                    // Initialize Cashfree SDK
                    const cashfree = Cashfree({
                        mode: 'sandbox' // Change to 'production' when using production credentials
                    });

                    // Open Cashfree payment page
                    const checkoutOptions = {
                        paymentSessionId: data.payment_session_id,
                        returnUrl: `${window.location.origin}/donation.html?payment=success`
                    };

                    cashfree.checkout(checkoutOptions).then((result) => {
                        if (result.error) {
                            alert('Payment failed: ' + result.error.message);
                            btn.innerText = originalText;
                            btn.disabled = false;
                        }
                    });
                } else {
                    alert('Error: ' + data.message);
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            } catch (error) {
                console.error('Payment error:', error);
                alert('Payment system error. Please ensure the payment server is running on port 5000.');
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });

        // Check for payment success in URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment') === 'success') {
            alert('Thank you for your generous donation! Your payment has been processed successfully.');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    // --- 5. Volunteer ID Card Generator ---
    const volunteerForm = document.getElementById('volunteer-id-form');
    const cardPreviewSection = document.getElementById('card-preview-section');
    const volunteerFormSection = document.getElementById('volunteer-form-section');

    let uploadedPhotoBase64 = null;

    // Photo Upload Preview
    const photoInput = document.getElementById('vol-photo');
    if (photoInput) {
        const uploadPlaceholder = document.getElementById('upload-placeholder');
        const photoPreviewBox = document.getElementById('photo-preview-box');
        const photoPreview = document.getElementById('photo-preview');
        const removePhotoBtn = document.getElementById('remove-photo-btn');

        photoInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    uploadedPhotoBase64 = event.target.result;
                    photoPreview.src = event.target.result;
                    uploadPlaceholder.style.display = 'none';
                    photoPreviewBox.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        if (removePhotoBtn) {
            removePhotoBtn.addEventListener('click', function () {
                photoInput.value = '';
                uploadedPhotoBase64 = null;
                uploadPlaceholder.style.display = 'block';
                photoPreviewBox.style.display = 'none';
            });
        }
    }

    // Form Submission & Card Generation
    if (volunteerForm) {
        volunteerForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get form values
            const name = document.getElementById('vol-name').value;
            const role = document.getElementById('vol-role').value;
            const dob = document.getElementById('vol-dob').value;
            const mobile = document.getElementById('vol-mobile').value;
            const qualification = document.getElementById('vol-qualification').value;

            // Validate photo
            if (!uploadedPhotoBase64) {
                alert('Please upload a volunteer photo.');
                return;
            }

            // Format DOB
            const dobDate = new Date(dob);
            const formattedDOB = dobDate.toLocaleDateString('en-GB');

            // Populate card
            document.getElementById('card-name').textContent = name;
            document.getElementById('card-role').textContent = role;
            document.getElementById('card-dob').textContent = formattedDOB;
            document.getElementById('card-qualification').textContent = qualification;
            document.getElementById('card-mobile').textContent = mobile;
            document.getElementById('card-photo').src = uploadedPhotoBase64;

            // Show card preview
            cardPreviewSection.style.display = 'block';

            // Scroll to card
            cardPreviewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // Download Card Functionality
    const downloadCardBtn = document.getElementById('download-card-btn');
    if (downloadCardBtn) {
        downloadCardBtn.addEventListener('click', function () {
            const card = document.getElementById('volunteer-id-card');
            const volunteerName = document.getElementById('card-name').textContent || 'Volunteer';
            const originalText = downloadCardBtn.innerHTML;

            downloadCardBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            downloadCardBtn.disabled = true;

            // Use html2canvas to capture the card
            html2canvas(card, {
                scale: 3,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                allowTaint: false,
                imageTimeout: 0
            }).then(function (canvas) {
                // Convert canvas to blob
                canvas.toBlob(function (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `ElderJoy_Volunteer_ID_${volunteerName.replace(/\s+/g, '_')}.png`;
                    link.href = url;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);

                    downloadCardBtn.innerHTML = originalText;
                    downloadCardBtn.disabled = false;

                    setTimeout(() => {
                        alert('✓ Volunteer ID Card downloaded successfully!');
                    }, 200);
                }, 'image/png', 1.0);
            }).catch(function (error) {
                console.error('Download failed:', error);
                downloadCardBtn.innerHTML = originalText;
                downloadCardBtn.disabled = false;
                alert('Download failed. Please try again.');
            });
        });
    }


    // --- 6. Additional Download Functionality for Volunteer ID Generator Page ---
    const downloadPngBtn = document.getElementById('download-png-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');

    // Helper function to wait for libraries to load
    function waitForLibraries() {
        return new Promise((resolve) => {
            const checkLibraries = () => {
                if (typeof html2canvas !== 'undefined' && (window.jspdf || window.jsPDF)) {
                    resolve();
                } else {
                    setTimeout(checkLibraries, 100);
                }
            };
            checkLibraries();
        });
    }

    // Helper function to generate card canvas
    function generateCardCanvas() {
        return new Promise((resolve, reject) => {
            const card = document.getElementById('volunteer-id-card-display');
            const vName = document.getElementById('card-name-display').textContent || 'Volunteer';

            if (!card) {
                reject(new Error('Card element not found'));
                return;
            }

            html2canvas(card, {
                scale: 3,
                useCORS: false,
                allowTaint: true,
                backgroundColor: "#ffffff",
                logging: false,
                foreignObjectRendering: false
            }).then(canvas => {
                resolve({ canvas, vName });
            }).catch(err => {
                reject(err);
            });
        });
    }

    // Download as PNG
    if (downloadPngBtn) {
        downloadPngBtn.addEventListener('click', function () {
            const originalText = downloadPngBtn.innerHTML;
            const vName = document.getElementById('card-name-display').textContent || 'Volunteer';

            downloadPngBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing...';
            downloadPngBtn.disabled = true;

            waitForLibraries().then(() => {
                return generateCardCanvas();
            }).then(({ canvas, vName }) => {
                const link = document.createElement('a');
                link.download = `ElderJoy_Volunteer_ID_${vName.replace(/\s+/g, '_')}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();

                downloadPngBtn.innerHTML = originalText;
                downloadPngBtn.disabled = false;

                setTimeout(() => {
                    alert('✅ ID Card downloaded as PNG successfully!');
                }, 100);
            }).catch(err => {
                console.error("PNG Export failed:", err);
                alert('❌ Failed to generate PNG: ' + err.message);
                downloadPngBtn.innerHTML = originalText;
                downloadPngBtn.disabled = false;
            });
        });
    }

    // Download as PDF
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', function () {
            const originalText = downloadPdfBtn.innerHTML;
            const vName = document.getElementById('card-name-display').textContent || 'Volunteer';

            downloadPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing PDF...';
            downloadPdfBtn.disabled = true;

            waitForLibraries().then(() => {
                return generateCardCanvas();
            }).then(({ canvas, vName }) => {
                const imgData = canvas.toDataURL('image/png');

                // Try multiple ways to access jsPDF
                const jsPDF = window.jspdf?.jsPDF || window.jsPDF;

                if (!jsPDF) {
                    console.error('jsPDF not found in window object');
                    console.log('window.jspdf:', window.jspdf);
                    throw new Error('jsPDF library not loaded. Please refresh the page.');
                }

                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'px',
                    format: [500, 300]
                });

                pdf.addImage(imgData, 'PNG', 0, 0, 500, 300);
                pdf.save(`ElderJoy_Volunteer_ID_${vName.replace(/\s+/g, '_')}.pdf`);

                downloadPdfBtn.innerHTML = originalText;
                downloadPdfBtn.disabled = false;

                setTimeout(() => {
                    alert('✅ ID Card downloaded as PDF successfully!');
                }, 100);
            }).catch(err => {
                console.error("PDF generation error:", err);
                downloadPdfBtn.innerHTML = originalText;
                downloadPdfBtn.disabled = false;
                alert('❌ Error: ' + err.message);
            });
        });
    }

    // --- 6. Generic Form Submission (e.g., Contact/Volunteer) ---
    const genericForms = document.querySelectorAll('form:not(#donation-form)');
    genericForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            if (btn) {
                const originalText = btn.innerText;
                btn.innerText = 'Transmitting...';
                btn.disabled = true;

                setTimeout(() => {
                    alert('Success! We have received your submission and will contact you within 24-48 hours.');
                    btn.innerText = originalText;
                    btn.disabled = false;
                    form.reset();
                }, 1000);
            }
        });
    });

    // --- 7. Volunteer Registration Form with EmailJS ---

    const volunteerRegistrationForm = document.getElementById('volunteer-registration-form');

    if (volunteerRegistrationForm) {
        volunteerRegistrationForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Stop page refresh

            // Update button state
            const submitBtn = volunteerRegistrationForm.querySelector('.volunteer-submit-btn');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            // Collect form data
            let params = {
                volunteer_name: document.getElementById('volunteer-name').value,
                volunteer_email: document.getElementById('volunteer-email').value,
                volunteer_phone: document.getElementById('volunteer-phone').value,
                volunteer_dob: document.getElementById('volunteer-dob').value,
                volunteer_qualification: document.getElementById('volunteer-qualification').value,
                volunteer_area: document.getElementById('volunteer-area').value,
                volunteer_availability: document.getElementById('volunteer-availability').value,
            };

            // Send email using EmailJS
            emailjs.send("service_7qrmzkb", "template_yzchg1m", params)
                .then(function (response) {
                    console.log('SUCCESS!', response.status, response.text);
                    alert("✅ Volunteer Registration Submitted Successfully!");
                    volunteerRegistrationForm.reset();
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                })
                .catch(function (error) {
                    console.error('FAILED...', error);
                    alert("❌ Failed to send registration. Please try again.");
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                });
        });
    }

    // Download Volunteer Card
    const downloadVolunteerCardBtn = document.getElementById('download-volunteer-card');
    if (downloadVolunteerCardBtn) {
        downloadVolunteerCardBtn.addEventListener('click', function () {
            const card = document.getElementById('volunteer-id-card');
            const volunteerName = document.getElementById('card-volunteer-name').textContent || 'Volunteer';
            const originalText = downloadVolunteerCardBtn.innerHTML;

            downloadVolunteerCardBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
            downloadVolunteerCardBtn.disabled = true;

            // Use html2canvas to capture the card
            html2canvas(card, {
                scale: 3,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                allowTaint: false,
                imageTimeout: 0
            }).then(function (canvas) {
                const imgData = canvas.toDataURL('image/png');

                // Check for jsPDF
                const { jsPDF } = window.jspdf || {};

                if (!jsPDF) {
                    // Fallback to PNG download if jsPDF is not available
                    canvas.toBlob(function (blob) {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.download = `Volunteer-ID-${volunteerName.replace(/\s+/g, '-')}.png`;
                        link.href = url;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);

                        downloadVolunteerCardBtn.innerHTML = originalText;
                        downloadVolunteerCardBtn.disabled = false;

                        setTimeout(() => {
                            alert('✓ Volunteer ID Card downloaded as PNG!');
                        }, 200);
                    }, 'image/png', 1.0);
                } else {
                    // Create PDF
                    const pdf = new jsPDF({
                        orientation: 'landscape',
                        unit: 'px',
                        format: [canvas.width / 3, canvas.height / 3]
                    });

                    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 3, canvas.height / 3);
                    pdf.save(`Volunteer-ID-${volunteerName.replace(/\s+/g, '-')}.pdf`);

                    downloadVolunteerCardBtn.innerHTML = originalText;
                    downloadVolunteerCardBtn.disabled = false;

                    setTimeout(() => {
                        alert('✓ Volunteer ID Card downloaded as PDF successfully!');
                    }, 200);
                }
            }).catch(function (error) {
                console.error('Download failed:', error);
                downloadVolunteerCardBtn.innerHTML = originalText;
                downloadVolunteerCardBtn.disabled = false;
                alert('Download failed. Please try again.');
            });
        });
    }
});
