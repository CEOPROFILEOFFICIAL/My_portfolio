/* ============ Admin panel logic ============ */
(function () {
  'use strict';

  var token = sessionStorage.getItem('admin_token') || '';

  var loginView = document.getElementById('login-view');
  var dashView = document.getElementById('dash-view');

  function show(view) {
    loginView.classList.toggle('hidden', view !== 'login');
    dashView.classList.toggle('hidden', view !== 'dash');
  }

  async function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign(
      { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      opts.headers || {}
    );
    var res = await fetch(path, opts);
    if (res.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || ('Request failed (' + res.status + ')'));
    return data;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function logout() {
    token = '';
    sessionStorage.removeItem('admin_token');
    show('login');
  }

  /* ---------- Login ---------- */
  document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var pw = document.getElementById('pw').value;
    var st = document.getElementById('login-status');
    var btn = document.getElementById('login-btn');
    st.className = 'status'; st.textContent = '';
    btn.disabled = true; btn.textContent = 'Checking…';
    try {
      var res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.error || 'Login failed');
      token = data.token;
      sessionStorage.setItem('admin_token', token);
      document.getElementById('pw').value = '';
      show('dash');
      loadAll();
    } catch (err) {
      st.textContent = err.message;
      st.classList.add('err');
    } finally {
      btn.disabled = false; btn.textContent = 'Log In';
    }
  });
  document.getElementById('logout-btn').addEventListener('click', logout);

  /* ---------- Tabs ---------- */
  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
      tab.classList.add('active');
      document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
  });

  /* ---------- Settings ---------- */
  var SETTING_FIELDS = [
    ['hero_badge', 'Hero badge', 'text'],
    ['hero_title', 'Hero title (name, first part)', 'text'],
    ['hero_title_accent', 'Hero title (accent part)', 'text'],
    ['hero_roles', 'Hero typing roles (one per line)', 'lines'],
    ['hero_bio', 'Hero bio', 'area'],
    ['about_p1', 'About paragraph 1', 'area'],
    ['about_p2', 'About paragraph 2', 'area'],
    ['fact_degree', 'Fact: Degree', 'text'],
    ['fact_university', 'Fact: University', 'text'],
    ['fact_focus', 'Fact: Focus', 'text'],
    ['fact_location', 'Fact: Location', 'text'],
    ['tools', 'Tool chips (one per line)', 'lines'],
    ['contact_email', 'Contact email', 'text'],
    ['contact_github_url', 'GitHub URL', 'text'],
    ['contact_github_label', 'GitHub label', 'text'],
    ['contact_location', 'Location line', 'text'],
  ];

  async function loadSettings() {
    var rows = await api('/api/admin-content?resource=settings');
    var map = {};
    rows.forEach(function (r) { map[r.key] = r.value; });
    var html = SETTING_FIELDS.map(function (f) {
      var key = f[0], label = f[1], type = f[2];
      var val = esc(map[key] || '');
      var input = type === 'area'
        ? '<textarea data-key="' + key + '">' + val + '</textarea>'
        : '<input data-key="' + key + '" value="' + val + '"' + (type === 'lines' ? ' placeholder="one per line"' : '') + ' />';
      // store line-breaks: lines fields keep \n
      return '<div class="field"><label>' + esc(label) + '</label>' + input + '</div>';
    }).join('');
    document.getElementById('settings-form').innerHTML = html;
  }

  document.getElementById('save-settings').addEventListener('click', async function () {
    var st = document.getElementById('settings-status');
    st.className = 'status'; st.textContent = 'Saving…';
    try {
      var settings = {};
      document.querySelectorAll('#settings-form [data-key]').forEach(function (el) {
        settings[el.dataset.key] = el.value;
      });
      await api('/api/admin-content?resource=settings', { method: 'PUT', body: JSON.stringify({ settings: settings }) });
      st.textContent = 'Saved. Changes are live on the site.';
      st.classList.add('ok');
    } catch (err) {
      st.textContent = err.message;
      st.classList.add('err');
    }
  });

  /* ---------- Skills ---------- */
  function skillEditorHTML(s) {
    s = s || {};
    return '<div class="editor"><h3>' + (s.id ? 'Edit skill' : 'New skill') + '</h3>' +
      '<div class="field-row">' +
      '<div class="field"><label>Name</label><input id="se-name" value="' + esc(s.name) + '"></div>' +
      '<div class="field"><label>Percent (0–100)</label><input id="se-pct" type="number" min="0" max="100" value="' + esc(s.percent == null ? 80 : s.percent) + '"></div>' +
      '</div>' +
      '<div class="field"><label>Description</label><input id="se-desc" value="' + esc(s.description) + '"></div>' +
      '<div class="field"><label>Order</label><input id="se-order" type="number" value="' + esc(s.sort_order == null ? 0 : s.sort_order) + '"></div>' +
      '<button class="btn btn-primary" id="se-save">Save</button> ' +
      '<button class="btn-sm" id="se-cancel">Cancel</button>' +
      '<p class="status" id="se-status"></p></div>';
  }

  async function loadSkills() {
    var list = await api('/api/admin-content?resource=skills');
    document.getElementById('skills-list').innerHTML = list.map(function (s) {
      return '<div class="item"><div class="item-head"><strong>' + esc(s.name) + '</strong>' +
        '<span class="item-meta">' + esc(s.percent) + '%</span></div>' +
        '<div class="item-meta">' + esc(s.description) + '</div>' +
        '<div class="item-actions"><button class="btn-sm" data-edit="' + s.id + '">Edit</button>' +
        '<button class="btn-sm btn-danger" data-del="' + s.id + '">Delete</button></div></div>';
    }).join('') || '<p class="item-meta">No skills yet.</p>';

    document.querySelectorAll('#skills-list [data-edit]').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = list.find(function (x) { return String(x.id) === b.dataset.edit; });
        openSkillEditor(s);
      });
    });
    document.querySelectorAll('#skills-list [data-del]').forEach(function (b) {
      b.addEventListener('click', async function () {
        if (!confirm('Delete this skill?')) return;
        await api('/api/admin-content?resource=skills&id=' + b.dataset.del, { method: 'DELETE' });
        loadSkills();
      });
    });
  }

  function openSkillEditor(s) {
    var box = document.getElementById('skill-editor');
    box.innerHTML = skillEditorHTML(s);
    document.getElementById('se-cancel').addEventListener('click', function () { box.innerHTML = ''; });
    document.getElementById('se-save').addEventListener('click', async function () {
      var st = document.getElementById('se-status');
      var payload = {
        name: document.getElementById('se-name').value.trim(),
        percent: Math.max(0, Math.min(100, parseInt(document.getElementById('se-pct').value, 10) || 0)),
        description: document.getElementById('se-desc').value.trim(),
        sort_order: parseInt(document.getElementById('se-order').value, 10) || 0,
      };
      if (!payload.name) { st.textContent = 'Name is required.'; st.classList.add('err'); return; }
      try {
        if (s && s.id) await api('/api/admin-content?resource=skills&id=' + s.id, { method: 'PUT', body: JSON.stringify(payload) });
        else await api('/api/admin-content?resource=skills', { method: 'POST', body: JSON.stringify(payload) });
        box.innerHTML = '';
        loadSkills();
      } catch (err) { st.textContent = err.message; st.classList.add('err'); }
    });
  }
  document.getElementById('add-skill-btn').addEventListener('click', function () { openSkillEditor(null); });

  /* ---------- Projects ---------- */
  function projectEditorHTML(p) {
    p = p || {};
    var tags = Array.isArray(p.tags) ? p.tags.join(', ') : '';
    return '<div class="editor"><h3>' + (p.id ? 'Edit project' : 'New project') + '</h3>' +
      '<div class="field"><label>Title</label><input id="pe-title" value="' + esc(p.title) + '"></div>' +
      '<div class="field"><label>Description</label><textarea id="pe-desc">' + esc(p.description) + '</textarea></div>' +
      '<div class="field-row">' +
      '<div class="field"><label>Badge (e.g. C, Java, Web)</label><input id="pe-lang" value="' + esc(p.language) + '"></div>' +
      '<div class="field"><label>Link URL</label><input id="pe-link" value="' + esc(p.link) + '"></div>' +
      '</div>' +
      '<div class="field"><label>Tags (comma separated)</label><input id="pe-tags" value="' + esc(tags) + '"></div>' +
      '<div class="field"><label>Order</label><input id="pe-order" type="number" value="' + esc(p.sort_order == null ? 0 : p.sort_order) + '"></div>' +
      '<div class="field"><label>Project image</label>' +
      '<input id="pe-file" type="file" accept="image/*">' +
      (p.image_url ? '<img class="img-preview" src="' + esc(p.image_url) + '" alt="">' : '') +
      '<input id="pe-image" type="hidden" value="' + esc(p.image_url) + '">' +
      '<p class="status" id="pe-upload-status"></p></div>' +
      '<button class="btn btn-primary" id="pe-save">Save</button> ' +
      '<button class="btn-sm" id="pe-cancel">Cancel</button>' +
      '<p class="status" id="pe-status"></p></div>';
  }

  function readFileAsBase64(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () {
        var parts = String(r.result).split(',');
        resolve({ contentType: file.type, data: parts[1] });
      };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function loadProjects() {
    var list = await api('/api/admin-content?resource=projects');
    document.getElementById('projects-list').innerHTML = list.map(function (p) {
      return '<div class="item"><div class="item-head"><strong>' + esc(p.title) + '</strong>' +
        '<span class="item-meta">' + esc(p.language || '') + '</span></div>' +
        (p.image_url ? '<img class="img-preview" src="' + esc(p.image_url) + '" alt="">' : '') +
        '<div class="item-meta">' + esc((p.description || '').slice(0, 120)) + '</div>' +
        '<div class="item-actions"><button class="btn-sm" data-edit="' + p.id + '">Edit</button>' +
        '<button class="btn-sm btn-danger" data-del="' + p.id + '">Delete</button></div></div>';
    }).join('') || '<p class="item-meta">No projects yet.</p>';

    document.querySelectorAll('#projects-list [data-edit]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = list.find(function (x) { return String(x.id) === b.dataset.edit; });
        openProjectEditor(p);
      });
    });
    document.querySelectorAll('#projects-list [data-del]').forEach(function (b) {
      b.addEventListener('click', async function () {
        if (!confirm('Delete this project?')) return;
        await api('/api/admin-content?resource=projects&id=' + b.dataset.del, { method: 'DELETE' });
        loadProjects();
      });
    });
  }

  function openProjectEditor(p) {
    var box = document.getElementById('project-editor');
    box.innerHTML = projectEditorHTML(p);

    document.getElementById('pe-file').addEventListener('change', async function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var ust = document.getElementById('pe-upload-status');
      ust.className = 'status'; ust.textContent = 'Uploading…';
      try {
        if (file.size > 3.5 * 1024 * 1024) throw new Error('Image is too large (max ~3.5MB).');
        var f = await readFileAsBase64(file);
        var res = await api('/api/admin-upload', {
          method: 'POST',
          body: JSON.stringify({ filename: file.name, contentType: f.contentType, data: f.data }),
        });
        document.getElementById('pe-image').value = res.url;
        ust.textContent = 'Uploaded.';
        ust.classList.add('ok');
      } catch (err) {
        ust.textContent = err.message;
        ust.classList.add('err');
      }
    });

    document.getElementById('pe-cancel').addEventListener('click', function () { box.innerHTML = ''; });
    document.getElementById('pe-save').addEventListener('click', async function () {
      var st = document.getElementById('pe-status');
      var payload = {
        title: document.getElementById('pe-title').value.trim(),
        description: document.getElementById('pe-desc').value.trim(),
        language: document.getElementById('pe-lang').value.trim() || 'Web',
        link: document.getElementById('pe-link').value.trim(),
        image_url: document.getElementById('pe-image').value.trim(),
        tags: document.getElementById('pe-tags').value.split(',').map(function (t) { return t.trim(); }).filter(Boolean),
        sort_order: parseInt(document.getElementById('pe-order').value, 10) || 0,
      };
      if (!payload.title) { st.textContent = 'Title is required.'; st.classList.add('err'); return; }
      try {
        if (p && p.id) await api('/api/admin-content?resource=projects&id=' + p.id, { method: 'PUT', body: JSON.stringify(payload) });
        else await api('/api/admin-content?resource=projects', { method: 'POST', body: JSON.stringify(payload) });
        box.innerHTML = '';
        loadProjects();
      } catch (err) { st.textContent = err.message; st.classList.add('err'); }
    });
  }
  document.getElementById('add-project-btn').addEventListener('click', function () { openProjectEditor(null); });

  /* ---------- Messages ---------- */
  async function loadMessages() {
    var list = await api('/api/admin-content?resource=messages');
    document.getElementById('msg-count').textContent = list.length ? '(' + list.length + ')' : '';
    document.getElementById('messages-list').innerHTML = list.map(function (m) {
      var date = new Date(m.created_at).toLocaleString();
      return '<div class="item"><div class="item-head"><strong>' + esc(m.name) + '</strong>' +
        '<span class="item-meta">' + esc(date) + '</span></div>' +
        '<div class="item-meta">' + esc(m.email) + '</div>' +
        '<div class="msg-body">' + esc(m.message) + '</div>' +
        '<div class="item-actions"><button class="btn-sm btn-danger" data-del="' + m.id + '">Delete</button></div></div>';
    }).join('') || '<p class="item-meta">No messages yet.</p>';
    document.querySelectorAll('#messages-list [data-del]').forEach(function (b) {
      b.addEventListener('click', async function () {
        if (!confirm('Delete this message?')) return;
        await api('/api/admin-content?resource=messages&id=' + b.dataset.del, { method: 'DELETE' });
        loadMessages();
      });
    });
  }

  async function loadAll() {
    try {
      await Promise.all([loadSettings(), loadSkills(), loadProjects(), loadMessages()]);
    } catch (err) {
      console.error(err);
    }
  }

  if (token) { show('dash'); loadAll(); } else { show('login'); }
})();
