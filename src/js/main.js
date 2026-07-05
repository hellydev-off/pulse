(function ($) {
  'use strict';

  // ─── List pagination ────────────────────────────────────────────────────────
  // listSel   – selector for the items wrapper (.news-list / .reviews-list)
  // itemSel   – selector for each item inside the wrapper
  // perPage   – items per page
  function initPagination(listSel, itemSel, perPage) {
    var list = document.querySelector(listSel);
    if (!list) return;

    var footer  = list.parentNode.querySelector('.list-footer');
    if (!footer) return;

    var items   = [].slice.call(list.querySelectorAll(itemSel));
    if (!items.length) return;

    var total   = Math.ceil(items.length / perPage);
    var cur     = 1;
    var cumul   = false; // true while in "show more" (append) mode

    var btnMore = footer.querySelector('.btn-show-more');
    var pgNav   = footer.querySelector('.pg');

    var prevSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="15 18 9 12 15 6"></polyline></svg>';
    var nextSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="9 18 15 12 9 6"></polyline></svg>';

    // Determine which page numbers to show in the nav
    function pageNums(active, last) {
      if (last <= 7) {
        return Array.from({length: last}, function (_, i) { return i + 1; });
      }
      if (active <= 4)         return [1, 2, 3, 4, 5, '…', last];
      if (active >= last - 3)  return [1, '…', last - 4, last - 3, last - 2, last - 1, last];
      return [1, '…', active - 1, active, active + 1, '…', last];
    }

    // Render item visibility
    function renderItems(page, append) {
      var from = append ? 0 : (page - 1) * perPage;
      var to   = page * perPage;
      items.forEach(function (el, i) {
        el.style.display = (i >= from && i < to) ? '' : 'none';
      });
    }

    // Rebuild pagination nav and bind its events
    function buildPg(active) {
      var html = '<a href="#" class="pg__item" aria-label="Назад" data-dir="-1">' + prevSVG + '</a>';

      pageNums(active, total).forEach(function (p) {
        if (p === '…') {
          html += '<span class="pg__item pg__item--dots">…</span>';
        } else {
          html += '<a href="#" class="pg__item' + (p === active ? ' pg__item--active' : '') +
                  '" data-pg="' + p + '">' + p + '</a>';
        }
      });

      html += '<a href="#" class="pg__item pg__item--filled" aria-label="Вперёд" data-dir="1">' + nextSVG + '</a>';

      pgNav.innerHTML = html;

      pgNav.querySelectorAll('[data-pg]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          goTo(+this.getAttribute('data-pg'), false);
        });
      });

      pgNav.querySelectorAll('[data-dir]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          var next = cur + (+this.getAttribute('data-dir'));
          if (next >= 1 && next <= total) goTo(next, false);
        });
      });
    }

    // Navigate to a page
    function goTo(page, append) {
      cur   = page;
      cumul = append;
      renderItems(page, append);
      buildPg(page);
      syncMore();
      if (!append) {
        var top = list.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: top < 0 ? 0 : top, behavior: 'smooth' });
      }
    }

    // Keep "Показать еще" in sync
    function syncMore() {
      if (!btnMore) return;
      btnMore.style.display = cur >= total ? 'none' : '';
    }

    if (btnMore) {
      btnMore.addEventListener('click', function (e) {
        e.preventDefault();
        if (cur < total) goTo(cur + 1, true);
      });
    }

    // Single-page edge case – hide controls
    if (total === 1) {
      if (pgNav)   pgNav.style.display   = 'none';
      if (btnMore) btnMore.style.display = 'none';
      return;
    }

    goTo(1, false);
  }

  // ─── Mobile menu (burger) ─────────────────────────────────────────────────────
  function initMobileMenu() {
    var burger  = document.getElementById('headerBurger');
    var menu    = document.getElementById('mobileMenu');
    var overlay = document.getElementById('mobileMenuOverlay');
    if (!burger || !menu) return;

    function open() {
      burger.classList.add('is-open');
      menu.classList.add('is-open');
      if (overlay) overlay.classList.add('is-open');
      document.body.classList.add('menu-open');
      burger.setAttribute('aria-expanded', 'true');
    }

    function close() {
      burger.classList.remove('is-open');
      menu.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
    }

    burger.addEventListener('click', function () {
      if (menu.classList.contains('is-open')) close(); else open();
    });

    if (overlay) overlay.addEventListener('click', close);

    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 992) close();
    });
  }

  // ─── Footer accordion (mobile only) ────────────────────────────────────────
  function initFooterAccordion() {
    var titles = document.querySelectorAll('.footer-nav__title');
    titles.forEach(function (title) {
      title.addEventListener('click', function () {
        if (window.innerWidth > 767) return;
        var col = title.closest('.col-sm-6, .col-md-3');
        if (col) col.classList.toggle('is-open');
      });
    });
  }

  // ─── Profile sidebar drawer (mobile only) ──────────────────────────────────
  function initProfileSidebar() {
    var sidebar = document.querySelector('.profile-sidebar');
    var content = document.querySelector('.profile-content');
    if (!sidebar || !content) return;

    // Trigger button injected before content
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'profile-menu-trigger';
    var nameEl = sidebar.querySelector('.profile-sidebar__name');
    var name = nameEl ? nameEl.textContent.replace(/\s+/g, ' ').trim() : 'Меню профиля';
    trigger.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg><span>' + name + '</span>';
    content.parentNode.insertBefore(trigger, content);

    // Overlay
    var overlay = document.createElement('div');
    overlay.className = 'profile-sidebar-overlay';
    document.body.appendChild(overlay);

    function open() {
      sidebar.classList.add('is-drawer-open');
      overlay.classList.add('is-open');
      document.body.classList.add('menu-open');
    }
    function close() {
      sidebar.classList.remove('is-drawer-open');
      overlay.classList.remove('is-open');
      document.body.classList.remove('menu-open');
    }

    trigger.addEventListener('click', open);
    overlay.addEventListener('click', close);
    sidebar.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  // ─── Review text truncation (mobile only) ──────────────────────────────────
  function initReviewTruncation() {
    if (window.innerWidth > 767) return;
    document.querySelectorAll('.review-card__text').forEach(function (el) {
      if (el.dataset.truncated) return;
      el.dataset.truncated = '1';
      if (el.textContent.trim().length <= 200) return;
      el.classList.add('review-card__text--clamped');
      var btn = document.createElement('button');
      btn.className = 'review-card__toggle';
      btn.textContent = 'Показать полностью';
      el.parentNode.insertBefore(btn, el.nextSibling);
      btn.addEventListener('click', function () {
        var clamped = el.classList.contains('review-card__text--clamped');
        el.classList.toggle('review-card__text--clamped', !clamped);
        btn.textContent = clamped ? 'Свернуть' : 'Показать полностью';
      });
    });
  }

  // ─── Phone mask ───────────────────────────────────────────────────────────────
  function applyPhoneMask(input) {
    var el = input[0];

    function format(val) {
      var digits = val.replace(/\D/g, '');
      if (digits.length === 0) return '';
      if (digits[0] === '8') digits = '7' + digits.slice(1);
      if (digits[0] !== '7') digits = '7' + digits;
      digits = digits.slice(0, 11);

      var result = '+7';
      if (digits.length > 1) result += ' ' + digits.slice(1, 4);
      if (digits.length > 4) result += ' ' + digits.slice(4, 7);
      if (digits.length > 7) result += '-' + digits.slice(7, 9);
      if (digits.length > 9) result += '-' + digits.slice(9, 11);
      return result;
    }

    input.on('focus', function () {
      if (!el.value) {
        el.value = '+7 ';
        // Place cursor after prefix, not at position 0
        setTimeout(function () {
          try { el.setSelectionRange(3, 3); } catch (e) {}
        }, 0);
      }
    });

    input.on('input', function () {
      var pos   = el.selectionStart;
      var old   = el.value;
      var fresh = format(el.value);

      el.value = fresh;

      var diff = fresh.length - old.length;
      var newPos = Math.max(3, pos + diff);
      try { el.setSelectionRange(newPos, newPos); } catch (e) {}
    });

    input.on('keydown', function (e) {
      if ((e.key === 'Backspace' || e.key === 'Delete') &&
          (el.value === '+7 ' || el.value === '+7')) {
        e.preventDefault();
        el.value = '';
      }
    });

    input.on('blur', function () {
      if (el.value === '+7 ' || el.value === '+7') el.value = '';
    });
  }

  function isPhoneComplete(val) {
    return val.replace(/\D/g, '').length === 11;
  }

  // ─── Email validation ─────────────────────────────────────────────────────────
  function isEmailValid(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.trim());
  }

  // ─── Login modal ─────────────────────────────────────────────────────────────
  function initLoginModal() {
    var overlay     = $('#loginModal');
    var closeBtn    = $('#modalClose');
    var openBtn     = $('#openLoginModal');
    var tabs        = $('.auth-dialog__tab');
    var phoneInput  = $('#phoneInput');
    var emailInput  = $('#emailInput');
    var phoneErr    = $('#phoneError');
    var emailErr    = $('#emailError');
    var phoneSubmit = $('#phoneSubmit');
    var emailSubmit = $('#emailSubmit');

    if (!overlay.length) return;

    applyPhoneMask(phoneInput);

    function openModal() {
      overlay.addClass('is-open').attr('aria-hidden', 'false');
      $('body').addClass('auth-open');
      setTimeout(function () { phoneInput.focus(); }, 250);
    }

    function closeModal() {
      overlay.removeClass('is-open').attr('aria-hidden', 'true');
      $('body').removeClass('auth-open');
    }

    // Delegated: the "Войти" button is re-rendered by shop.js on auth change
    $(document).on('click', '#openLoginModal', function (e) {
      e.preventDefault();
      openModal();
    });

    closeBtn.on('click', closeModal);

    overlay.on('click', function (e) {
      if ($(e.target).is(overlay)) closeModal();
    });

    $(document).on('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    // ── Tab switching ──
    tabs.on('click', function () {
      var target = $(this).data('tab');
      tabs.removeClass('auth-dialog__tab--active').attr('aria-selected', 'false');
      $(this).addClass('auth-dialog__tab--active').attr('aria-selected', 'true');

      $('.auth-pane').removeClass('auth-pane--active').attr('hidden', true);
      $('#modal-pane-' + target).addClass('auth-pane--active').removeAttr('hidden');

      // Reset errors on tab switch
      phoneInput.removeClass('is-invalid');
      emailInput.removeClass('is-invalid');
      phoneErr.removeClass('is-visible');
      emailErr.removeClass('is-visible');
    });

    // ── Phone submit ──
    phoneSubmit.on('click', function () {
      var val = phoneInput.val();
      if (!isPhoneComplete(val)) {
        phoneInput.addClass('is-invalid');
        phoneErr.addClass('is-visible');
        phoneInput.focus();
        return;
      }
      phoneInput.removeClass('is-invalid');
      phoneErr.removeClass('is-visible');
      // Stub auth: accept any valid number
      if (window.Pulse) window.Pulse.login({ name: 'Александр', contact: val });
      closeModal();
    });

    phoneInput.on('input', function () {
      if (isPhoneComplete($(this).val())) {
        $(this).removeClass('is-invalid');
        phoneErr.removeClass('is-visible');
      }
    });

    // ── Email submit ──
    emailSubmit.on('click', function () {
      var val = emailInput.val();
      if (!isEmailValid(val)) {
        emailInput.addClass('is-invalid');
        emailErr.addClass('is-visible');
        emailInput.focus();
        return;
      }
      emailInput.removeClass('is-invalid');
      emailErr.removeClass('is-visible');
      // Stub auth: accept any valid email
      if (window.Pulse) window.Pulse.login({ name: 'Александр', contact: val });
      closeModal();
    });

    emailInput.on('input', function () {
      if (isEmailValid($(this).val())) {
        $(this).removeClass('is-invalid');
        emailErr.removeClass('is-visible');
      }
    });

    emailInput.on('blur', function () {
      var val = $(this).val();
      if (val && !isEmailValid(val)) {
        $(this).addClass('is-invalid');
        emailErr.addClass('is-visible');
      }
    });
  }

  // ─── Product slider (auto-play + dot nav) ────────────────────────────────────
  function initProductSlider() {
    document.querySelectorAll('.products-section').forEach(function (section) {
      var track = section.querySelector('.products-slider__track');
      var dots  = [].slice.call(section.querySelectorAll('.products-section__dot'));
      if (!track || !dots.length) return;

      var total = dots.length;
      var cur   = 0;
      var timer;

      function goTo(index) {
        cur = index;
        track.style.transform = 'translateX(-' + (cur * 100) + '%)';
        dots.forEach(function (dot, i) {
          dot.classList.toggle('products-section__dot--active', i === cur);
        });
      }

      function startAuto() {
        timer = setInterval(function () {
          goTo((cur + 1) % total);
        }, 4000);
      }

      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () {
          clearInterval(timer);
          goTo(i);
          startAuto();
        });
      });

      startAuto();
    });
  }

  $(document).ready(function () {
    console.log('Harmony theme ready');

    initMobileMenu();
    initLoginModal();
    initFooterAccordion();
    initProfileSidebar();
    initProductSlider();
    window.setTimeout(initReviewTruncation, 50);

    // Doctor card → profile page navigation
    $(document).on('click', '[data-doctor-name]', function (e) {
      e.preventDefault();
      var name  = $(this).data('doctor-name');
      var photo = $(this).data('doctor-photo') || '';
      window.location.href =
        'doctor-profile.html?name=' + encodeURIComponent(name) +
        '&photo=' + encodeURIComponent(photo);
    });

    // Paginate news list (8 per page)
    initPagination('.news-list', '.news-list-item', 8);

    // Paginate reviews list (4 per page)
    initPagination('.reviews-list', '.review-card', 4);

    // Paginate encyclopedia grid (8 per page)
    initPagination('.enc-grid', '.enc-card', 8);
  });

}(jQuery));
