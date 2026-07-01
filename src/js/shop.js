/* ============================================================================
   Pulse shop — business logic (cart, auth, orders) on top of localStorage.
   No backend: everything is persisted client-side. Exposed as window.Pulse.
   ========================================================================== */
(function ($) {
  'use strict';

  // ─── Product catalog (single source of truth) ─────────────────────────────
  var CATALOG = [
    {
      id: 'kizlyar',
      name: 'Ножи для метания СМН+ (Кизляр)',
      article: 'H8A7C9',
      price: 6000,
      oldPrice: 7500,
      img: '/images/catalog/карт1.png',
      inStock: true,
      specs: [
        ['Общая длина, см', '24'],
        ['Длина лезвия, см', '10.8'],
        ['Толщина лезвия, мм', '5'],
        ['Твёрдость, HRc', '45']
      ],
      desc: 'Ножи для метания СМН+ (Кизляр) — профессиональный инвентарь для спортсменов. Изготовлены из прочной стали, гарантирующей долговечность использования. Оптимальный баланс обеспечивает точность броска и предсказуемую траекторию.'
    },
    {
      id: 'multicam',
      name: 'Чехол «МУЛЬТИКАМ»',
      article: 'OIB1UW',
      price: 900,
      oldPrice: null,
      img: '/images/catalog/карт2.png',
      inStock: false,
      specs: [
        ['Материал', 'Кордура'],
        ['Расцветка', 'Multicam'],
        ['Крепление', 'MOLLE']
      ],
      desc: 'Прочный чехол «МУЛЬТИКАМ» для переноски и хранения метательных ножей. Изготовлен из износостойкой ткани, оснащён креплением на пояс.'
    },
    {
      id: 'saro',
      name: 'Ножи для метания СМН+ (Саро)',
      article: 'JUZ9BJ',
      price: 7000,
      oldPrice: null,
      img: '/images/catalog/карт1.png',
      inStock: true,
      specs: [
        ['Общая длина, см', '24'],
        ['Длина лезвия, см', '10.8'],
        ['Толщина лезвия, мм', '5'],
        ['Твёрдость, HRc', '45']
      ],
      desc: 'Ножи для метания СМН+ (Саро) — профессиональный инвентарь для спортсменов. Модель разработана с учётом требований к спортивному метанию. Подходит как для тренировок, так и для участия в соревнованиях. Выбирайте надёжное снаряжение — выбирайте СМН+!'
    },
    {
      id: 'target',
      name: 'Мишень для метания М1 (36х32 см)',
      article: 'I5Y91U',
      price: 5000,
      oldPrice: 6250,
      img: '/images/catalog/карт3.png',
      inStock: true,
      specs: [
        ['Размер, см', '36 × 32'],
        ['Материал', 'Фанера'],
        ['Зоны', '5 / 10 / 15 / 20']
      ],
      desc: 'Мишень для метания М1 (36х32 см) с разметкой зон. Изготовлена из плотной фанеры, выдерживает многократные попадания. Подходит для тренировок и соревнований по спортивному метанию.'
    }
  ];

  function product(id) {
    for (var i = 0; i < CATALOG.length; i++) {
      if (CATALOG[i].id === id) return CATALOG[i];
    }
    return null;
  }

  // ─── Persistence ───────────────────────────────────────────────────────────
  var LS = { cart: 'pulse_cart', auth: 'pulse_auth', orders: 'pulse_orders' };

  function read(key, def) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return v == null ? def : v;
    } catch (e) { return def; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  var Store = {
    getCart: function () { return read(LS.cart, []); },
    setCart: function (c) { write(LS.cart, c); },

    addToCart: function (id, qty) {
      qty = qty || 1;
      var cart = Store.getCart();
      var row = null;
      for (var i = 0; i < cart.length; i++) { if (cart[i].id === id) { row = cart[i]; break; } }
      if (row) { row.qty += qty; } else { cart.push({ id: id, qty: qty }); }
      Store.setCart(cart);
    },
    setQty: function (id, qty) {
      var cart = Store.getCart();
      for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === id) { cart[i].qty = Math.max(1, qty); break; }
      }
      Store.setCart(cart);
    },
    removeFromCart: function (id) {
      Store.setCart(Store.getCart().filter(function (r) { return r.id !== id; }));
    },
    cartCount: function () {
      return Store.getCart().reduce(function (s, r) { return s + r.qty; }, 0);
    },
    clearCart: function () { Store.setCart([]); },

    getAuth: function () { return read(LS.auth, null); },
    setAuth: function (a) { write(LS.auth, a); },
    logout: function () { try { localStorage.removeItem(LS.auth); } catch (e) {} },

    getOrders: function () { return read(LS.orders, []); },
    addOrder: function (o) {
      var orders = Store.getOrders();
      orders.unshift(o);
      write(LS.orders, orders);
    }
  };

  // ─── Formatting helpers ────────────────────────────────────────────────────
  function fmt(n) { return Math.round(n).toLocaleString('ru-RU') + ' Р'; }

  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

  function two(n) { return n < 10 ? '0' + n : '' + n; }
  function ruDate(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function ruDateTime(d) { return ruDate(d) + ', ' + two(d.getHours()) + ':' + two(d.getMinutes()); }
  function ruWeekday(d) { return WEEKDAYS[d.getDay()]; }

  function orderCode() {
    var n = Math.floor(1000 + Math.random() * 9000);
    return '0221225037-' + n;
  }

  // ─── Cart math ─────────────────────────────────────────────────────────────
  // gross = sum of (oldPrice||price)*qty ; net = sum of price*qty
  function cartMath(cart, filter) {
    var gross = 0, net = 0, count = 0;
    cart.forEach(function (row) {
      if (filter && !filter(row)) return;
      var p = product(row.id);
      if (!p) return;
      gross += (p.oldPrice || p.price) * row.qty;
      net += p.price * row.qty;
      count += row.qty;
    });
    return { gross: gross, net: net, discount: gross - net, count: count };
  }

  // ─── Icons ─────────────────────────────────────────────────────────────────
  var ICON_USER = '<svg width="23" height="27" viewBox="0 0 23 27" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M20.9642 23.452C20.0502 24.308 18.9422 24.815 17.7762 25.204C15.5862 25.936 13.3232 26.195 10.9342 26.22C8.48616 26.182 5.98916 25.887 3.60116 24.953C2.56316 24.547 1.59016 24.026 0.826162 23.18C0.270162 22.564 -0.0208382 21.848 0.00116184 21.004C0.0781618 18.05 1.12916 15.508 3.17816 13.388C3.61016 12.94 4.21516 12.909 4.63016 13.3C5.05916 13.705 5.06616 14.323 4.61716 14.784C3.23916 16.204 2.39616 17.889 2.10216 19.85C2.05116 20.191 2.05016 20.54 2.00716 20.883C1.94616 21.374 2.16316 21.736 2.50716 22.044C3.11016 22.585 3.82916 22.917 4.57816 23.189C6.44216 23.868 8.38016 24.138 10.3502 24.188C12.7752 24.249 15.1712 24.035 17.4672 23.184C18.0872 22.954 18.6762 22.623 19.2482 22.283C19.8772 21.908 20.1162 21.341 20.0462 20.577C19.8402 18.338 19.0102 16.401 17.4392 14.795C17.1922 14.542 17.0322 14.259 17.0732 13.898C17.1192 13.487 17.3402 13.193 17.7272 13.051C18.1302 12.902 18.4892 13.001 18.7902 13.301C19.9902 14.494 20.8712 15.89 21.4322 17.49C21.8172 18.588 22.0032 19.72 22.0552 20.881C22.1022 21.923 21.7062 22.759 20.9642 23.452ZM11.0292 14.115C7.12716 14.104 3.99916 10.932 4.01116 7.00201C4.02416 3.14301 7.18716 -0.00698836 11.0422 1.16441e-05C14.9512 0.00801164 18.0512 3.17701 18.0432 7.15801C18.0362 10.96 14.8432 14.127 11.0292 14.115ZM10.9952 2.01701C8.26716 2.02101 6.01316 4.29701 6.01616 7.04301C6.01916 9.82701 8.25416 12.095 10.9972 12.097C13.7962 12.1 16.0402 9.84801 16.0382 7.04001C16.0372 4.26301 13.7782 2.01201 10.9952 2.01701Z" fill="#B1BFCC"/></svg>';
  var ICON_CART = '<svg width="30" height="26" viewBox="0 0 30 26" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M23.8003 25.845C22.6503 25.845 21.6413 24.992 21.4523 23.861C21.3483 23.232 21.5023 22.577 21.8763 22.063C22.2493 21.551 22.8073 21.215 23.4483 21.119C23.5713 21.101 23.6963 21.091 23.8183 21.091C25.0003 21.091 25.9833 21.948 26.1563 23.128C26.2493 23.758 26.0883 24.386 25.7033 24.896C25.3173 25.408 24.7533 25.737 24.1153 25.824C24.0113 25.838 23.9053 25.845 23.8003 25.845ZM10.9493 25.845C9.81628 25.845 8.81028 25.01 8.61128 23.903C8.49428 23.258 8.63528 22.612 9.00928 22.085C9.37528 21.569 9.93128 21.227 10.5733 21.123C10.7053 21.101 10.8393 21.091 10.9703 21.091C12.1433 21.091 13.1243 21.939 13.3043 23.108C13.5023 24.4 12.6073 25.616 11.3093 25.817C11.1903 25.836 11.0693 25.845 10.9493 25.845ZM11.0263 19.52C9.38728 19.52 7.98128 18.301 7.52428 16.485L5.45528 3.581L5.45228 3.57C5.27828 2.871 4.67428 2.363 4.01628 2.361L1.04628 2.352C0.472277 2.351 0.0122769 1.845 0.000276938 1.203C-0.00672306 0.859 0.119277 0.53 0.344277 0.3C0.534277 0.107 0.782277 0 1.04328 0L3.99128 0.005C5.58528 0.008 6.99828 1.204 7.43028 2.915L9.52028 15.882L9.52328 15.893C9.71328 16.654 10.3183 17.165 11.0283 17.165L23.5723 17.168C24.3463 17.158 24.9563 16.649 25.1313 15.872L27.1863 6.62L11.5703 6.616C11.0253 6.616 10.5883 6.14 10.5553 5.508C10.5363 5.163 10.6713 4.785 10.8993 4.545C11.0173 4.421 11.2183 4.273 11.5073 4.273L28.4753 4.267C28.8123 4.267 29.0853 4.4 29.2863 4.663C29.5173 4.966 29.6033 5.349 29.5213 5.712L27.1213 16.475C26.7183 18.266 25.2873 19.517 23.6423 19.517L11.0263 19.52Z" fill="#B1BFCC"/></svg>';
  var ICON_ORDERS = '<svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.178 26.103C1.874 26.103 0 24.229 0 21.926V16.379C0 14.076 1.874 12.202 4.178 12.202H5.547V4.177C5.547 1.874 7.421 0 9.724 0H16.38C18.683 0 20.557 1.874 20.557 4.177V12.202H21.926C24.229 12.202 26.103 14.076 26.103 16.379V21.926C26.103 24.229 24.229 26.103 21.926 26.103H4.178ZM13.901 24.404H21.926C23.293 24.404 24.405 23.292 24.405 21.926V16.379C24.405 15.013 23.293 13.901 21.926 13.901H13.901V24.404ZM4.178 13.901C2.811 13.901 1.699 15.013 1.699 16.379V21.926C1.699 23.292 2.811 24.404 4.178 24.404H12.203V13.901H4.178ZM9.724 1.699C8.357 1.699 7.246 2.81 7.246 4.177V12.202H18.858V4.177C18.858 2.81 17.746 1.699 16.38 1.699H9.724ZM18.044 18.338C17.575 18.338 17.194 17.957 17.194 17.488C17.194 17.02 17.575 16.639 18.044 16.639H20.262C20.731 16.639 21.112 17.02 21.112 17.488C21.112 17.957 20.731 18.338 20.262 18.338H18.044ZM5.842 18.338C5.373 18.338 4.992 17.957 4.992 17.488C4.992 17.02 5.373 16.639 5.842 16.639H8.06C8.528 16.639 8.909 17.02 8.909 17.488C8.909 17.957 8.528 18.338 8.06 18.338H5.842ZM11.943 6.136C11.474 6.136 11.093 5.754 11.093 5.286C11.093 4.818 11.474 4.437 11.943 4.437H14.161C14.629 4.437 15.011 4.818 15.011 5.286C15.011 5.754 14.629 6.136 14.161 6.136H11.943Z" fill="#B1BFCC"/></svg>';
  var ICON_TRASH = '<svg width="16" height="18" viewBox="0 0 16 18" fill="none"><path d="M1 4h14M5 4V2h6v2M2 4l1 12a1 1 0 001 1h8a1 1 0 001-1L14 4" stroke="#B1BFCC" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_CARTBTN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>';

  // ─── Header rendering (auth + cart badge) ──────────────────────────────────
  function mkBadge(n) {
    return n > 0 ? '<span class="header-action__badge">' + n + '</span>' : '';
  }
  function cartBadge() { return mkBadge(Store.cartCount()); }

  function renderHeader() {
    var $actions = $('#headerActions');
    if (!$actions.length) return;
    var auth = Store.getAuth();
    var html = '';

    if (auth) {
      var orderCount = Store.getOrders().length;
      // stub unread notifications count (2) — will be dynamic when backend arrives
      var notifCount = 2;
      html += '<a href="profile.html" class="header-action header-action--has-badge">' + ICON_USER + mkBadge(notifCount) + '<span>Профиль</span></a>';
      html += '<a href="profile-orders.html" class="header-action header-action--has-badge">' + ICON_ORDERS + mkBadge(orderCount) + '<span>Заказы</span></a>';
    } else {
      html += '<a href="#" class="header-action" id="openLoginModal">' + ICON_USER + '<span>Войти</span></a>';
    }
    html += '<a href="cart.html" class="header-action header-action--cart">' + ICON_CART + cartBadge() + '<span>Корзина</span></a>';

    $actions.html(html);
  }

  // ─── Small toast feedback ──────────────────────────────────────────────────
  function toast(msg) {
    var $t = $('#pulseToast');
    if (!$t.length) {
      $t = $('<div id="pulseToast" class="pulse-toast"></div>').appendTo('body');
    }
    $t.text(msg).addClass('is-visible');
    clearTimeout($t.data('timer'));
    $t.data('timer', setTimeout(function () { $t.removeClass('is-visible'); }, 1800));
  }

  // ─── Product cards (delegated: navigate + add to cart) ─────────────────────
  function initCards() {
    // Navigate to product page from image / name
    $(document).on('click', '.product-card__image-wrap, .product-card__name', function (e) {
      var id = $(this).closest('.product-card').data('id');
      if (!id) return;
      e.preventDefault();
      window.location.href = 'product.html?id=' + id;
    });

    // Add to cart
    $(document).on('click', '.product-card__btn--primary', function (e) {
      e.preventDefault();
      var id = $(this).closest('.product-card').data('id');
      if (!id) return;
      Store.addToCart(id, 1);
      renderHeader();
      if (window.__pulseCartRender) window.__pulseCartRender();
      toast('Товар добавлен в корзину');
    });
  }

  // ─── Product page ──────────────────────────────────────────────────────────
  function initProductPage() {
    var $page = $('#productPage');
    if (!$page.length) return;

    var params = new URLSearchParams(window.location.search);
    var id = params.get('id') || 'saro';
    var p = product(id) || product('saro');

    // Populate
    $('#pdName').text(p.name);
    $('#pdBreadcrumbName').text(p.name);
    $('#pdArticle').text('Артикул: ' + p.article);
    $('#pdPrice').text(fmt(p.price));
    $('#pdImg').attr('src', p.img).attr('alt', p.name);
    $('.product-gallery__thumb .product-card__img, #pdThumbs img').attr('src', p.img);

    // Status
    var $status = $('#pdStatus');
    if (p.inStock) {
      $status.attr('class', 'product-info__status product-info__status--in').text('В наличии');
    } else {
      $status.attr('class', 'product-info__status product-info__status--out').text('Нет в наличии');
    }

    // Specs
    var specsHtml = p.specs.map(function (row) {
      return '<tr><td class="product-info__specs-key">' + row[0] +
        '</td><td class="product-info__specs-val">' + row[1] + '</td></tr>';
    }).join('');
    $('#pdSpecs').html(specsHtml);

    // Description
    $('#pdDesc').text(p.desc);

    document.title = p.name + ' — Пульсар';

    // Qty stepper
    var qty = 1;
    var $qtyVal = $('#pdQty');
    $('#pdQtyDec').on('click', function () { if (qty > 1) { qty--; $qtyVal.text(qty); } });
    $('#pdQtyInc').on('click', function () { qty++; $qtyVal.text(qty); });

    // Add to cart
    var $addBtn = $('#pdAddBtn');
    if (!p.inStock) {
      $addBtn.prop('disabled', true).addClass('is-disabled').text('Нет в наличии');
    } else {
      $addBtn.on('click', function () {
        Store.addToCart(p.id, qty);
        renderHeader();
        toast('Добавлено в корзину: ' + qty + ' шт.');
      });
    }
  }

  // ─── Cart page ─────────────────────────────────────────────────────────────
  function initCartPage() {
    var $list = $('#cartItems');
    if (!$list.length) return;

    var selected = {}; // id -> bool (default true)

    function itemMarkup(row) {
      var p = product(row.id);
      if (!p) return '';
      if (selected[row.id] === undefined) selected[row.id] = true;

      var priceBlock;
      if (p.oldPrice) {
        priceBlock =
          '<span class="cart-item__price-current">' + fmt(p.price * row.qty) + '</span>' +
          '<span class="cart-item__price-old">' + fmt(p.oldPrice * row.qty) + '</span>';
      } else {
        priceBlock = '<span class="cart-item__price-current cart-item__price-current--plain">' + fmt(p.price * row.qty) + '</span>';
      }

      return '' +
        '<div class="cart-item" data-id="' + p.id + '">' +
          '<label class="cart-checkbox">' +
            '<input type="checkbox" class="cart-item__check"' + (selected[row.id] ? ' checked' : '') + '>' +
            '<span class="cart-checkbox__mark"></span>' +
          '</label>' +
          '<div class="cart-item__image"><img src="' + p.img + '" alt="" class="cart-item__img"></div>' +
          '<div class="cart-item__info">' +
            '<a href="product.html?id=' + p.id + '" class="cart-item__name">' + p.name + '</a>' +
            '<span class="cart-item__article">Артикул: ' + p.article + '</span>' +
            '<button type="button" class="cart-item__remove" data-act="remove">' + ICON_TRASH + ' Удалить</button>' +
          '</div>' +
          '<div class="cart-item__qty">' +
            '<button type="button" class="cart-item__qty-btn" data-act="dec">−</button>' +
            '<span class="cart-item__qty-val">' + row.qty + '</span>' +
            '<button type="button" class="cart-item__qty-btn" data-act="inc">+</button>' +
          '</div>' +
          '<div class="cart-item__price">' + priceBlock + '</div>' +
        '</div>';
    }

    function render() {
      var cart = Store.getCart();
      if (!cart.length) {
        $list.html('<p class="cart-empty">Ваша корзина пуста.<br><a href="catalog.html">Перейти в каталог →</a></p>');
        $('.cart-controls, .cart-summary').hide();
      } else {
        $('.cart-controls, .cart-summary').show();
        $list.html(cart.map(itemMarkup).join(''));
      }
      updateTotals();
      updateSelectAll();
    }
    window.__pulseCartRender = render;

    function updateTotals() {
      var m = cartMath(Store.getCart(), function (row) { return selected[row.id]; });
      $('#cartGross').text(fmt(m.gross));
      $('#cartDiscount').text('- ' + fmt(m.discount));
      $('#cartTotal').text(fmt(m.net));
      $('#cartSummaryCount').text('Товары, ' + m.count + ' шт.');
      var totalItems = Store.getCart().reduce(function (s, r) { return s + r.qty; }, 0);
      $('#cartPageCount').text(totalItems + ' ' + plural(totalItems, 'товар', 'товара', 'товаров'));
      renderHeader();
    }

    function updateSelectAll() {
      var cart = Store.getCart();
      var all = cart.length > 0 && cart.every(function (r) { return selected[r.id]; });
      $('#cartSelectAll').prop('checked', all);
    }

    // Quantity
    $list.on('click', '[data-act="inc"]', function () {
      var id = $(this).closest('.cart-item').data('id');
      var row = Store.getCart().filter(function (r) { return r.id === id; })[0];
      Store.setQty(id, row.qty + 1);
      render();
    });
    $list.on('click', '[data-act="dec"]', function () {
      var id = $(this).closest('.cart-item').data('id');
      var row = Store.getCart().filter(function (r) { return r.id === id; })[0];
      if (row.qty > 1) { Store.setQty(id, row.qty - 1); render(); }
    });
    // Remove
    $list.on('click', '[data-act="remove"]', function () {
      var id = $(this).closest('.cart-item').data('id');
      Store.removeFromCart(id);
      delete selected[id];
      render();
    });
    // Per-item checkbox
    $list.on('change', '.cart-item__check', function () {
      var id = $(this).closest('.cart-item').data('id');
      selected[id] = this.checked;
      updateTotals();
      updateSelectAll();
    });
    // Select all
    $('#cartSelectAll').on('change', function () {
      var on = this.checked;
      Store.getCart().forEach(function (r) { selected[r.id] = on; });
      $list.find('.cart-item__check').prop('checked', on);
      updateTotals();
    });
    // Remove selected
    $('#cartRemoveSelected').on('click', function () {
      Store.getCart().forEach(function (r) {
        if (selected[r.id]) { Store.removeFromCart(r.id); delete selected[r.id]; }
      });
      render();
    });

    render();
  }

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  // ─── Checkout ──────────────────────────────────────────────────────────────
  function initCheckout() {
    var $page = $('#checkoutPage');
    if (!$page.length) return;

    var DELIVERY = 1000;

    // Render order items (section 4) + sidebar totals from cart
    function renderOrder() {
      var cart = Store.getCart();
      var itemsHtml = cart.map(function (row) {
        var p = product(row.id);
        if (!p) return '';
        var priceBlock = p.oldPrice
          ? '<span class="checkout-order__price-current">' + fmt(p.price * row.qty) + '</span><span class="checkout-order__price-old">' + fmt(p.oldPrice * row.qty) + '</span>'
          : '<span class="checkout-order__price-dark">' + fmt(p.price * row.qty) + '</span>';
        return '' +
          '<div class="checkout-order__item">' +
            '<img src="' + p.img + '" alt="" class="checkout-order__img">' +
            '<div class="checkout-order__info">' +
              '<a href="product.html?id=' + p.id + '" class="checkout-order__name">' + p.name + '</a>' +
              '<span class="checkout-order__article">Артикул: ' + p.article + '</span>' +
            '</div>' +
            '<span class="checkout-order__qty">' + row.qty + ' шт.</span>' +
            '<div class="checkout-order__price">' + priceBlock + '</div>' +
          '</div>';
      }).join('');

      if (!cart.length) {
        itemsHtml = '<p class="cart-empty">Корзина пуста. <a href="catalog.html">В каталог →</a></p>';
      }
      $('#checkoutItems').html(itemsHtml);

      var m = cartMath(cart);
      var total = m.net + (cart.length ? DELIVERY : 0);
      $('#coGross').text(fmt(m.gross));
      $('#coDiscount').text('- ' + fmt(m.discount));
      $('#coDelivery').text(cart.length ? fmt(DELIVERY) : fmt(0));
      $('#coTotal').text(fmt(total));
      $('#checkoutOrderCount').text(m.count + ' ' + plural(m.count, 'товар', 'товара', 'товаров'));
    }

    renderOrder();

    // ── Validation + order creation ──
    function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }
    function isPhone(v) { return v.replace(/\D/g, '').length === 11; }

    function clearError($el) { $el.removeClass('is-invalid'); }
    function markError($el) { $el.addClass('is-invalid'); }

    $('#coSubmit').on('click', function () {
      var cart = Store.getCart();
      if (!cart.length) { toast('Корзина пуста'); return; }

      var isLegal = $('#payer-legal').is(':visible');
      var errors = 0;
      var $errBox = $('#checkoutError');

      // Clear previous
      $('.checkout-field, .checkout-address').removeClass('is-invalid');

      // Contact fields (both types)
      var $name  = isLegal ? $('#payer-legal .pf-field__input').eq(0) : $('#coName');
      var $phone = isLegal ? $('#payer-legal .pf-field__input').eq(1) : $('#checkoutPhone');
      var $email = isLegal ? $('#payer-legal .pf-field__input').eq(2) : $('#coEmail');

      if (!$.trim($name.val())) { markError($name.closest('.checkout-field')); errors++; }
      if (!isPhone($phone.val())) { markError($phone.closest('.checkout-field')); errors++; }
      if (!isEmail($email.val())) { markError($email.closest('.checkout-field')); errors++; }

      // Address
      var $addr = $('#coAddress');
      if (!$.trim($addr.val())) { markError($addr); errors++; }

      // Agreement
      var agreed = $('#coAgree').is(':checked');

      if (errors > 0) {
        $errBox.text('Пожалуйста, заполните корректно все выделенные поля').show();
        $('html, body').animate({ scrollTop: $('.checkout-section').first().offset().top - 120 }, 300);
        return;
      }
      if (!agreed) {
        $errBox.text('Необходимо согласиться с правилами торговой площадки').show();
        return;
      }
      $errBox.hide();

      // Build order
      var now = new Date();
      var expected = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
      var m = cartMath(cart);
      var deliveryLabel = $('.delivery-card--active').data('delivery-label') || 'Яндекс Доставка';
      var payLabel = $('.pay-options:visible .pay-card--active').data('pay-label') || 'СБП';

      var order = {
        code: orderCode(),
        createdAt: now.toISOString(),
        dateText: ruDateTime(now),
        expectedText: ruDate(expected) + ', ' + ruWeekday(expected),
        status: 'Собираем',
        payment: payLabel,
        delivery: deliveryLabel,
        deliveryText: 'Доставка ' + deliveryLabel + ', курьером, ' + fmt(DELIVERY),
        deliveryCost: DELIVERY,
        gross: m.gross,
        discount: m.discount,
        net: m.net,
        total: m.net + DELIVERY,
        items: cart.map(function (row) {
          var p = product(row.id);
          return {
            id: p.id, name: p.name, article: p.article,
            price: p.price, oldPrice: p.oldPrice, img: p.img, qty: row.qty
          };
        })
      };

      Store.addOrder(order);
      Store.clearCart();

      // Auto "login" so the order shows up under profile if guest
      if (!Store.getAuth()) {
        var contact = $.trim($phone.val()) || $.trim($email.val());
        Store.setAuth({ name: 'Александр', contact: contact });
      }

      window.location.href = 'profile-orders.html';
    });
  }

  // ─── Orders page (render user-created orders) ──────────────────────────────
  function initOrdersPage() {
    var $container = $('#userOrders');
    if (!$container.length) return;

    var orders = Store.getOrders();
    if (!orders.length) return;

    var html = orders.map(function (o) {
      var itemsHtml = o.items.map(function (it) {
        var priceBlock = it.oldPrice
          ? '<span class="order-item__price-current">' + fmt(it.price * it.qty) + '</span><span class="order-item__price-old">' + fmt(it.oldPrice * it.qty) + '</span>'
          : '<span class="order-item__price-dark">' + fmt(it.price * it.qty) + '</span>';
        return '' +
          '<div class="order-item">' +
            '<img src="' + it.img + '" alt="" class="order-item__img">' +
            '<div class="order-item__info">' +
              '<a href="product.html?id=' + it.id + '" class="order-item__name">' + it.name + '</a>' +
              '<span class="order-item__article">Артикул: ' + it.article + '</span>' +
            '</div>' +
            '<span class="order-item__qty">' + it.qty + ' шт.</span>' +
            '<div class="order-item__price">' + priceBlock + '</div>' +
          '</div>';
      }).join('');

      var SVG_CHEV = '<svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      return '' +
        '<div class="order-group">' +
          '<div class="order-group__header">' +
            '<a href="profile-order-detail.html" class="order-group__status order-group__status--accent">' +
              o.status + ' ' + SVG_CHEV +
            '</a>' +
            '<div class="order-group__meta-grid">' +
              '<div class="order-group__meta-col">' +
                '<span class="order-group__meta-delivery">' + o.deliveryText + '</span>' +
                '<span class="order-group__expected">Ожидаем ' + o.expectedText + '</span>' +
              '</div>' +
              '<div class="order-group__meta-col">' +
                '<span class="order-group__meta-label">Дата заказа:</span>' +
                '<span class="order-group__meta-val">' + o.dateText + '</span>' +
              '</div>' +
              '<div class="order-group__meta-col">' +
                '<span class="order-group__meta-label">Код заказа:</span>' +
                '<span class="order-group__meta-val">' + o.code + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="order-items-list">' + itemsHtml + '</div>' +
          '<div class="order-group__footer">' +
            '<span class="order-group__footer-label">Итого по заказу:</span>' +
            '<span class="order-group__footer-total">' + fmt(o.total) + '</span>' +
          '</div>' +
        '</div>';
    }).join('');

    $container.html(html);
  }

  // ─── Public API (used by login modal in main.js) ───────────────────────────
  window.Pulse = {
    login: function (data) {
      Store.setAuth(data || { name: 'Александр' });
      renderHeader();
      toast('Вы вошли в аккаунт');
    },
    logout: function () {
      Store.logout();
      renderHeader();
    },
    isAuthed: function () { return !!Store.getAuth(); },
    addToCart: function (id, qty) { Store.addToCart(id, qty); renderHeader(); },
    renderHeader: renderHeader
  };

  // ─── Boot ──────────────────────────────────────────────────────────────────
  $(function () {
    renderHeader();
    initCards();
    initProductPage();
    initCartPage();
    initCheckout();
    initOrdersPage();

    // Logout link (profile sidebar)
    $(document).on('click', '.profile-sidebar__link--logout', function (e) {
      e.preventDefault();
      window.Pulse.logout();
      window.location.href = 'index.html';
    });
  });

}(jQuery));
