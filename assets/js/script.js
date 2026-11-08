/* =========================================================================
   LARISIN AJA — Front-end script
   Carousel, smooth scroll, form validasi + webhook + toast & modal sukses
   ========================================================================= */

/* ------- 1. Konfigurasi Webhook (n8n via Ngrok) ------- */
const WEBHOOK_URL = "https://aversion-tamer-cinnamon.ngrok-free.dev/webhook/klaim-trial";

/* ------- Helper ------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------- 2. Toast Notification ------- */
function showToast(message, type = "success") {
  const container = $("#toastContainer");
  if (!container) return;

  const icons = {
    success:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd"/></svg>',
    error:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/></svg>',
  };

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");

  const icon = document.createElement("span");
  icon.className = "toast-icon";
  icon.innerHTML = icons[type] || icons.success;

  const msg = document.createElement("span");
  msg.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(msg);
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast--closing");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
    setTimeout(() => toast.remove(), 400);
  }, 4200);
}

/* ------- 3. Carousel Hero ------- */
const track = $("#carouselTrack");
const carouselViewport = $("#carouselViewport");
const dots = $$("#carouselDots button");
const prevBtn = $("#prevBtn");
const nextBtn = $("#nextBtn");
let current = 0;
const slideCount = track ? track.children.length : 0;

function updateCarousel() {
  if (!track) return;
  track.style.transform = `translate3d(-${current * 100}%, 0, 0)`;
  dots.forEach((dot, i) => {
    const active = i === current;
    dot.classList.toggle("w-6", active);
    dot.classList.toggle("w-2", !active);
    dot.classList.toggle("bg-[#E04F00]", active);
    dot.classList.toggle("bg-[#E7DCD1]", !active);
  });
}

function goTo(i) {
  if (!slideCount) return;
  current = (i + slideCount) % slideCount;
  updateCarousel();
}

if (prevBtn) prevBtn.addEventListener("click", () => { goTo(current - 1); startAuto(); });
if (nextBtn) nextBtn.addEventListener("click", () => { goTo(current + 1); startAuto(); });
dots.forEach((dot) => dot.addEventListener("click", () => { goTo(Number(dot.dataset.index)); startAuto(); }));
updateCarousel();

// Auto-advance and smooth touch swipe without blocking page scroll
let autoTimer = null;
function startAuto() { stopAuto(); autoTimer = setInterval(() => goTo(current + 1), 5000); }
function stopAuto() { if (autoTimer) clearInterval(autoTimer); autoTimer = null; }
if (track && carouselViewport && slideCount > 1) {
  startAuto();

  let pointerStartX = null;
  let pointerStartY = null;
  let isSwiping = false;

  carouselViewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    isSwiping = false;
    stopAuto();
  }, { passive: true });

  carouselViewport.addEventListener("pointermove", (event) => {
    if (pointerStartX === null) return;
    const deltaX = event.clientX - pointerStartX;
    const deltaY = event.clientY - pointerStartY;

    if (!isSwiping) {
      if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
        isSwiping = true;
        try { carouselViewport.setPointerCapture(event.pointerId); } catch (_) {}
      } else if (Math.abs(deltaY) > 8) {
        pointerStartX = null;
        pointerStartY = null;
        startAuto();
      }
    }
  }, { passive: true });

  carouselViewport.addEventListener("pointerup", (event) => {
    if (pointerStartX === null) return;
    const distance = event.clientX - pointerStartX;
    pointerStartX = null;
    pointerStartY = null;
    try { carouselViewport.releasePointerCapture(event.pointerId); } catch (_) {}
    if (Math.abs(distance) >= 35) {
      goTo(current + (distance < 0 ? 1 : -1));
    }
    startAuto();
  });

  carouselViewport.addEventListener("pointercancel", () => {
    pointerStartX = null;
    pointerStartY = null;
    startAuto();
  });
}

/* ------- 4. Form Validasi & Webhook ------- */
const form = $("#claimForm");
const submitBtn = $("#submitBtn");
const submitLabel = $("#submitBtnLabel");
const submitSpinner = $("#submitSpinner");
const submitArrow = $("#submitArrow");

function setFieldError(id, message) {
  const input = document.getElementById(id);
  const err = document.getElementById("err_" + id);
  if (input) {
    input.classList.add("border-red-400", "focus:border-red-500", "focus:ring-red-500/15");
    input.classList.remove("border-[#F0E6DC]", "focus:border-[#E04F00]", "focus:ring-[#E04F00]/15");
  }
  if (err) {
    err.textContent = message;
    err.classList.remove("hidden");
  }
}

function clearFieldError(id) {
  const input = document.getElementById(id);
  const err = document.getElementById("err_" + id);
  if (input) {
    input.classList.remove("border-red-400", "focus:border-red-500", "focus:ring-red-500/15");
    input.classList.add("border-[#F0E6DC]", "focus:border-[#E04F00]", "focus:ring-[#E04F00]/15");
  }
  if (err) err.classList.add("hidden");
}

function normalizeWhatsApp(raw) {
  let digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (digits.startsWith("62")) { /* sudah format internasional */ }
  else if (digits.startsWith("8")) digits = "62" + digits;
  return digits;
}

function isValidWhatsApp(d) {
  return /^62[0-9]{9,13}$/.test(d);
}

function formatWaDisplay(wa) {
  const body = wa.slice(2);
  return "+62 " + body.replace(/(\d{3})(\d{4})(\d+)/, "$1-$2-$3");
}

function setLoading(loading) {
  if (!submitBtn) return;
  submitBtn.disabled = loading;
  if (loading) {
    submitLabel.textContent = "Mengirim...";
    submitSpinner.classList.remove("hidden");
    submitArrow.classList.add("hidden");
  } else {
    submitLabel.textContent = "Submit klaim trial";
    submitSpinner.classList.add("hidden");
    submitArrow.classList.remove("hidden");
  }
}

if (form) {
  ["nama_toko", "kategori_usaha", "nomor_whatsapp"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => clearFieldError(id));
    el.addEventListener("change", () => clearFieldError(id));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nama = (form.nama_toko?.value || "").trim();
    const kategori = form.kategori_usaha?.value || "";
    const waRaw = (form.nomor_whatsapp?.value || "").trim();
    const wa = normalizeWhatsApp(waRaw);

    let valid = true;
    if (!nama) { setFieldError("nama_toko", "Nama toko wajib diisi."); valid = false; }
    if (!kategori) { setFieldError("kategori_usaha", "Pilih kategori usaha dulu."); valid = false; }
    if (!waRaw) { setFieldError("nomor_whatsapp", "Nomor WhatsApp wajib diisi."); valid = false; }
    else if (!isValidWhatsApp(wa)) { setFieldError("nomor_whatsapp", "Format nomor tidak valid. Contoh: 0812 3456 7890."); valid = false; }
    if (!valid) return;

    setLoading(true);

    const payload = {
      nama_toko: nama,
      kategori_usaha: kategori,
      nomor_whatsapp: wa,
      paket: "Trial 14 Hari",
      tanggal_daftar: new Date().toISOString(),
    };

    let success = false;
    if (!WEBHOOK_URL) {
      // Mode simulasi (fallback demo) — URL webhook belum diisi
      await delay(1200);
      console.info("[SIMULASI] Webhook payload:", payload);
      success = true;
    } else {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        success = res.ok;
        if (!success) console.error("Webhook gagal:", res.status, res.statusText);
      } catch (err) {
        console.error("Webhook error:", err);
        success = false;
      } finally {
        clearTimeout(timer);
      }
    }

    setLoading(false);

    if (success) {
      showToast("Trial berhasil diklaim! Cek WhatsApp kamu ya. 🎉", "success");
      openSuccessModal(payload);
      form.reset();
    } else {
      showToast("Ups, ada kendala saat mengirim. Coba lagi sebentar ya.", "error");
    }
  });
}

/* ------- 5. Modal Sukses & Simulasi WhatsApp ------- */
const modal = $("#successModal");
const modalSuccess = $("#modalSuccess");
const modalWaView = $("#modalWaView");
let lastPayload = null;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function setScrollLock(locked) {
  if (locked) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.paddingRight = "";
    document.body.style.overflow = "";
  }
}

function openSuccessModal(payload) {
  if (!modal) return;
  lastPayload = payload;
  $("#modalNamaToko").textContent = payload.nama_toko;
  $("#modalKategori").textContent = payload.kategori_usaha;
  $("#modalWa").textContent = formatWaDisplay(payload.nomor_whatsapp);
  showSuccessView();
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  setScrollLock(true);
}

function closeModal() {
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  setScrollLock(false);
  resetWaView();
}

function showSuccessView() {
  if (modalSuccess) modalSuccess.classList.remove("hidden");
  if (modalWaView) modalWaView.classList.add("hidden");
}

function showWaView() {
  if (modalSuccess) modalSuccess.classList.add("hidden");
  if (modalWaView) modalWaView.classList.remove("hidden");
  playWaSimulation();
}

function resetWaView() {
  const typing = $("#waTyping");
  const text = $("#waText");
  if (typing) typing.classList.remove("hidden");
  if (text) text.classList.add("hidden");
}

function playWaSimulation() {
  const name = lastPayload?.nama_toko || "kak";
  const typing = $("#waTyping");
  const text = $("#waText");
  if (!text) return;

  text.innerHTML =
    "Halo <b>" + escapeHtml(name) + "</b>! 🎉 Trial 14 hari Larisin aja kamu sudah aktif. " +
    "Tim kami akan segera memandu aktivasi bot WhatsApp-mu di nomor ini.";
  text.classList.add("hidden");
  if (typing) typing.classList.remove("hidden");

  setTimeout(() => {
    if (typing) typing.classList.add("hidden");
    text.classList.remove("hidden");
  }, 1400);
}

$("#modalClose")?.addEventListener("click", closeModal);
$("#modalDone")?.addEventListener("click", closeModal);
$("#simulateWaBtn")?.addEventListener("click", showWaView);
$("#waBack")?.addEventListener("click", showSuccessView);
modal?.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
