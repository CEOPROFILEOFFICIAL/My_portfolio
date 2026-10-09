/* ============ Portfolio interactions + dynamic content ============ */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function setText(id, value, fallback) {
    var el = document.getElementById(id);
    if (el) el.textContent = value || fallback || '';
  }

  /* ---------- Load site content from the database ---------- */
  var roles = ['Software Engineering Student'];
  var rolesStarted = false;

  function startTyping() {
    if (rolesStarted) return;
    rolesStarted = true;
    var typedEl = document.getElementById('typed');
    var ri = 0, ci = 0, deleting = false;
    (function tick() {
      var word = roles[ri] || '';
      if (!deleting) {
        ci++;
        if (ci >= word.length) { ci = word.length; deleting = true; return void setTimeout(tick, 1700); }
      } else {
        ci--;
        if (ci <= 0) { ci = 0; deleting = false; ri = (ri + 1) % roles.length; }
      }
      typedEl.textContent = word.slice(0, ci);
      setTimeout(tick, deleting ? 34 : 62);
    })();
  }

  function lines(value) {
    return String(value || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
  }

  function renderSkills(skills) {
    var grid = document.getElementById('skills-grid');
    if (!skills.length) {
      grid.innerHTML = '<p class="content-error">No skills added yet.</p>';
      return;
    }
    grid.innerHTML = skills.map(function (s) {
      var pct = Math.max(0, Math.min(100, s.percent || 0));
      return '<div class="skill-card reveal visible">' +
        '<div class="skill-head"><span class="skill-name">' + esc(s.name) + '</span>' +
        '<span class="skill-pct">' + pct + '%</span></div>' +
        '<div class="skill-bar"><span data-w="' + pct + '%"></span></div>' +
        '<p class="skill-desc">' + esc(s.description) + '</p></div>';
    }).join('');
    requestAnimationFrame(function () {
      grid.querySelectorAll('.skill-bar span').forEach(function (bar) {
        bar.style.width = bar.getAttribute('data-w');
      });
    });
  }

  function renderTools(tools) {
    var row = document.getElementById('tools-row');
    row.innerHTML = tools.map(function (t) {
      return '<span class="tool-chip">' + esc(t) + '</span>';
    }).join('');
  }

  function renderProjects(projects) {
    var grid = document.getElementById('projects-grid');
    if (!projects.length) {
      grid.innerHTML = '<p class="content-error">No projects added yet.</p>';
      return;
    }
    grid.innerHTML = projects.map(function (p) {
      var tags = Array.isArray(p.tags) ? p.tags : [];
      var img = p.image_url
        ? '<img class="project-img" src="' + esc(p.image_url) + '" alt="' + esc(p.title) + '" loading="lazy">'
        : '';
      var link = p.link
        ? '<a href="' + esc(p.link) + '" target="_blank" rel="noopener" class="project-link" aria-label="Open ' + esc(p.title) + '">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg></a>'
        : '';
      return '<article class="project-card reveal visible">' + img +
        '<div class="project-top"><span class="project-lang">' + esc(p.language || 'Web') + '</span>' + link + '</div>' +
        '<h3>' + esc(p.title) + '</h3><p>' + esc(p.description) + '</p>' +
        '<div class="project-tags">' + tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
        '</article>';
    }).join('');
  }

  function animateCounter(el, target) {
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 1200, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + '+';
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function applyContent(data) {
    var s = data.settings || {};
    setText('hero-badge', s.hero_badge, 'Welcome');
    setText('hero-title', s.hero_title, 'Chaudhary Muhammad');
    setText('hero-title-accent', s.hero_title_accent, 'Ahmad');
    setText('hero-bio', s.hero_bio);
    setText('about-p1', s.about_p1);
    setText('about-p2', s.about_p2);
    setText('fact-degree', s.fact_degree, '—');
    setText('fact-university', s.fact_university, '—');
    setText('fact-focus', s.fact_focus, '—');
    setText('fact-location', s.fact_location, '—');
    setText('contact-email', s.contact_email);
    setText('contact-github-label', s.contact_github_label);
    setText('contact-location', s.contact_location);
    setText('footer-name', (s.hero_title || '') + ' ' + (s.hero_title_accent || ''));

    var email = s.contact_email, gh = s.contact_github_url;
    if (email) {
      document.getElementById('social-email').href = 'mailto:' + email;
      document.getElementById('info-email').href = 'mailto:' + email;
    }
    if (gh) {
      document.getElementById('social-github').href = gh;
      document.getElementById('info-github').href = gh;
    }

    var r = lines(s.hero_roles);
    if (r.length) roles = r;

    renderSkills(data.skills || []);
    renderTools(lines(s.tools));
    renderProjects(data.projects || []);

    animateCounter(document.getElementById('count-skills'), (data.skills || []).length);
    animateCounter(document.getElementById('count-projects'), (data.projects || []).length);
    animateCounter(document.getElementById('count-tools'), lines(s.tools).length);

    document.title = ((s.hero_title || '') + ' ' + (s.hero_title_accent || '')).trim() + ' — Software Engineering Student';
    startTyping();
  }

  function contentFailed() {
    ['skills-grid', 'projects-grid'].forEach(function (id) {
      document.getElementById(id).innerHTML =
        '<p class="content-error">Content is not available right now. Please check back soon.</p>';
    });
    startTyping();
  }

  fetch('/api/content')
    .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, d: d }; }); })
    .then(function (r) { if (r.ok) applyContent(r.d); else contentFailed(); })
    .catch(contentFailed);

  /* ---------- Preloader ---------- */
  var preloader = document.getElementById('preloader');
  var loaderText = document.getElementById('loader-text');
  var bootCmd = './build-portfolio.sh --release';
  var li = 0;
  var bootTimer = setInterval(function () {
    loaderText.textContent = bootCmd.slice(0, ++li);
    if (li >= bootCmd.length) {
      clearInterval(bootTimer);
      setTimeout(function () { preloader.classList.add('done'); }, 450);
    }
  }, 55);

  /* ---------- Navbar ---------- */
  var navbar = document.getElementById('navbar');
  var toggle = document.getElementById('menu-toggle');
  var navLinks = document.getElementById('nav-links');
  function onScroll() { navbar.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toggle.addEventListener('click', function () {
    var open = navLinks.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  });
  navLinks.addEventListener('click', function (e) {
    if (e.target.classList.contains('nav-link')) {
      navLinks.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- Active nav link ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var navObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        links.forEach(function (l) {
          l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(function (s) { navObserver.observe(s); });

  /* ---------- Reveal on scroll ---------- */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { revealObserver.observe(el); });

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contact-form');
  var status = document.getElementById('cf-status');
  var submitBtn = document.getElementById('cf-submit');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('cf-name').value.trim();
    var email = document.getElementById('cf-email').value.trim();
    var message = document.getElementById('cf-message').value.trim();
    status.className = '';
    if (!name || !email || !message) {
      status.textContent = 'Please fill in every field.';
      status.classList.add('err');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.textContent = 'That email address doesn\u2019t look right.';
      status.classList.add('err');
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    status.textContent = '';
    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email, message: message })
    })
      .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, d: d }; }); })
      .then(function (r) {
        if (r.ok) {
          status.textContent = 'Message sent — I\u2019ll get back to you soon.';
          status.classList.add('ok');
          form.reset();
        } else {
          status.textContent = (r.d && r.d.error) || 'Something went wrong. Please try again.';
          status.classList.add('err');
        }
      })
      .catch(function () {
        status.textContent = 'Couldn\u2019t reach the server. Please try again later.';
        status.classList.add('err');
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      });
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
