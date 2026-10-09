/* ============ Portfolio interactions ============ */
(function () {
  'use strict';

  /* ---------- Preloader: terminal typing ---------- */
  var preloader = document.getElementById('preloader');
  var loaderText = document.getElementById('loader-text');
  var bootCmd = './build-portfolio.sh --release';
  var li = 0;
  var bootTimer = setInterval(function () {
    loaderText.textContent = bootCmd.slice(0, ++li);
    if (li >= bootCmd.length) {
      clearInterval(bootTimer);
      setTimeout(function () {
        preloader.classList.add('done');
        document.body.classList.add('loaded');
      }, 450);
    }
  }, 55);

  /* ---------- Hero typing effect ---------- */
  var roles = [
    'Software Engineering Student',
    'Systems Programmer',
    'Cybersecurity Enthusiast',
    'C · C++ · Java · Python Developer'
  ];
  var typedEl = document.getElementById('typed');
  var ri = 0, ci = 0, deleting = false;
  function tick() {
    var word = roles[ri];
    if (!deleting) {
      ci++;
      if (ci >= word.length) { ci = word.length; deleting = true; return void setTimeout(tick, 1700); }
    } else {
      ci--;
      if (ci <= 0) { ci = 0; deleting = false; ri = (ri + 1) % roles.length; }
    }
    typedEl.textContent = word.slice(0, ci);
    setTimeout(tick, deleting ? 34 : 62);
  }
  setTimeout(tick, 1400);

  /* ---------- Navbar: scroll state + mobile menu ---------- */
  var navbar = document.getElementById('navbar');
  var toggle = document.getElementById('menu-toggle');
  var navLinks = document.getElementById('nav-links');
  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 24);
  }
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

  /* ---------- Skill bars + counters ---------- */
  var animated = false;
  var skillObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting || animated) return;
      animated = true;
      document.querySelectorAll('.skill-bar span').forEach(function (bar) {
        bar.style.width = bar.style.getPropertyValue('--w');
      });
      document.querySelectorAll('.counter-num').forEach(function (num) {
        var target = parseInt(num.getAttribute('data-target'), 10) || 0;
        var start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / 1200, 1);
          num.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + '+';
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
      skillObserver.disconnect();
    });
  }, { threshold: 0.25 });
  var skillsSection = document.getElementById('skills');
  if (skillsSection) skillObserver.observe(skillsSection);

  /* ---------- Contact form -> Supabase via serverless function ---------- */
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

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
