(function ($) {
  'use strict';

  // ── Header scroll state ──────────────────────────────────────────────────────
  var $siteHeader = $('.site-header');

  function updateHeaderScroll() {
    if ($(window).scrollTop() > 40) {
      $siteHeader.addClass('is-scrolled');
    } else {
      $siteHeader.removeClass('is-scrolled');
    }
  }

  $(window).on('scroll.header', updateHeaderScroll);
  updateHeaderScroll();

  // ── FAQ accordion ────────────────────────────────────────────────────────────
  $(document).on('click', '.ca-faq-item__head', function () {
    var $item = $(this).closest('.ca-faq-item');
    $item.toggleClass('is-open');
  });

  // ── Active nav on scroll ─────────────────────────────────────────────────────
  var $navItems = $('.header-nav__item');
  var $sections = $('[id]').filter(function () {
    return $(this).closest('.site-header').length === 0;
  });

  function updateActiveNav() {
    var scrollTop = $(window).scrollTop() + 140;
    $sections.each(function () {
      var id = $(this).attr('id');
      var top = $(this).offset().top;
      var bottom = top + $(this).outerHeight();
      if (scrollTop >= top && scrollTop < bottom) {
        $navItems.removeClass('is-active');
        $navItems.find('a[href="#' + id + '"]').closest('.header-nav__item').addClass('is-active');
      }
    });
  }

  $(window).on('scroll', updateActiveNav);
  updateActiveNav();

  // ── Smooth scroll ────────────────────────────────────────────────────────────
  $(document).on('click', 'a[href^="#"]', function (e) {
    var target = $(this.getAttribute('href'));
    if (target.length) {
      e.preventDefault();
      var offset = target.offset().top - 140;
      $('html, body').animate({ scrollTop: offset }, 500);
    }
  });

  // ── Steps slider ─────────────────────────────────────────────────────────────
  var currentStep = 3;
  var totalSteps = 10;

  function showStep(idx) {
    currentStep = Math.max(0, Math.min(idx, totalSteps - 1));
    $('.ca-step-content').removeClass('is-active');
    $('.ca-step-content[data-step="' + currentStep + '"]').addClass('is-active');

    var $nums = $('.ca-steps-num');
    $nums.each(function () {
      var n = parseInt($(this).data('step'));
      $(this).removeClass('is-active is-done');
      if (n < currentStep) $(this).addClass('is-done');
      else if (n === currentStep) $(this).addClass('is-active');
    });
  }

  $('#stepPrev').on('click', function () { showStep(currentStep - 1); });
  $('#stepNext').on('click', function () { showStep(currentStep + 1); });

  $(document).on('click', '.ca-steps-num', function () {
    showStep(parseInt($(this).data('step')));
  });

  // ── Services tabs ─────────────────────────────────────────────────────────────
  var currentServ = 0;
  var servCount = $('.ca-services__item').length;

  function showService(idx) {
    currentServ = (idx + servCount) % servCount;
    $('.ca-services__item').removeClass('is-active');
    $('.ca-services__item[data-serv="' + currentServ + '"]').addClass('is-active');
  }

  $(document).on('click', '.ca-services__item', function () {
    showService(parseInt($(this).data('serv')));
  });

  $('#servPrev').on('click', function () { showService(currentServ - 1); });
  $('#servNext').on('click', function () { showService(currentServ + 1); });

  // ── Advantages circle ─────────────────────────────────────────────────────────
  var advData = [
    {
      title: 'Собственные аналитики',
      text: 'Для достижения оптимальных результатов в рамках установленного бюджета мы задействуем квалифицированных сотрудников агентства, включая специалистов по веб-аналитике и маркетологов. Внедряем комплексную аналитику на всех этапах — от показа объявлений до завершения сделок.'
    },
    {
      title: 'Индивидуальный подход',
      text: 'Каждый проект уникален. Мы разрабатываем стратегию с учётом специфики вашего бизнеса, целевой аудитории и конкурентной среды — без шаблонных решений.'
    },
    {
      title: 'Полное погружение в проект',
      text: 'Наша команда полностью погружается в вашу нишу: изучает продукт, конкурентов и аудиторию, чтобы рекламные кампании были максимально точными и эффективными.'
    },
    {
      title: 'Индивидуальный аккаунт-менеджер',
      text: 'За каждым клиентом закреплён персональный менеджер — ваша единственная точка контакта, которая координирует работу всей команды и держит вас в курсе всех изменений.'
    }
  ];

  $(document).on('click', '.ca-adv-item', function () {
    var idx = parseInt($(this).data('adv'));
    $('.ca-adv-item').removeClass('is-active');
    $(this).addClass('is-active');
    $('#advTitle').text(advData[idx].title);
    $('#advText').text(advData[idx].text);
  });

  // ── Tools tabs ────────────────────────────────────────────────────────────────
  var toolsData = [
    { title: 'Семантическое ядро', text: 'Изначально собираем максимально полный список запросов, затем вручную прорабатываем его, проверяя соответствие тематике и предложению. Согласовываем с вами подобранные фразы.' },
    { title: 'Минус-слова', text: 'Тщательно прорабатываем список минус-слов, чтобы исключить нецелевой трафик и снизить стоимость привлечения клиента.' },
    { title: 'Смарт-баннеры и динамический ремаркетинг', text: 'Автоматически генерируем персонализированные объявления на основе поведения пользователей и товарного фида.' },
    { title: 'Таргетинг', text: 'Настраиваем показ рекламы по интересам, поведению, демографии и социальным характеристикам целевой аудитории.' },
    { title: 'Анализ рекламы', text: 'Регулярно анализируем эффективность всех кампаний, объявлений и ключевых слов для постоянного улучшения результатов.' },
    { title: 'Средства аналитики', text: 'Используем Яндекс Метрику, коллтрекинг и сквозную аналитику для полного понимания пути клиента от клика до покупки.' },
    { title: 'Структурирование', text: 'Грамотно структурируем рекламные кампании по группам товаров, услуг и географии для максимальной управляемости.' },
    { title: 'Графические объявления', text: 'Разрабатываем привлекательные баннеры для РСЯ с учётом фирменного стиля и требований площадки.' },
    { title: 'УТП в быстрых ссылках / UTM метки', text: 'Прописываем уникальные торговые предложения в быстрых ссылках и устанавливаем UTM-метки для точной аналитики источников трафика.' }
  ];

  var currentTool = 0;

  function showTool(idx) {
    currentTool = (idx + toolsData.length) % toolsData.length;
    $('.ca-tool-tag').removeClass('is-active');
    $('.ca-tool-tag[data-tool="' + currentTool + '"]').addClass('is-active');
    $('#toolTitle').text(toolsData[currentTool].title);
    $('#toolText').text(toolsData[currentTool].text);
  }

  $(document).on('click', '.ca-tool-tag', function () {
    showTool(parseInt($(this).data('tool')));
  });

  $('#toolPrev').on('click', function () { showTool(currentTool - 1); });
  $('#toolNext').on('click', function () { showTool(currentTool + 1); });

  // ── Guarantees simple slider ─────────────────────────────────────────────────
  var guarSwiper = null;
  if (typeof Swiper !== 'undefined' && document.getElementById('guaranteesSwiper')) {
    guarSwiper = new Swiper('#guaranteesSwiper', {
      slidesPerView: 2,
      spaceBetween: 20,
    });

    $('#guarPrev').on('click', function () { guarSwiper.slidePrev(); });
    $('#guarNext').on('click', function () { guarSwiper.slideNext(); });

    guarSwiper.on('slideChange', function () {
      var idx = guarSwiper.activeIndex;
      var $dots = $('#guarDots .ca-slider-nav__dot');
      $dots.removeClass('is-active').eq(idx).addClass('is-active');
    });
  }

})(jQuery);
