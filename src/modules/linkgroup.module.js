(function() {
    // Register module
    const LinkGroup = {
        links: [],
        panel: null,

        init() {
            console.log('🔗 LinkGroup.init called');
            // Hide other panels for clean UX
            document.querySelectorAll('.sidekick-panel').forEach(p => {
                if (p.id !== 'sidekick-linkgroup-panel') p.style.display = 'none';
            });
            const panel = document.getElementById('sidekick-linkgroup-panel');
            if (panel) {
                panel.style.display = (panel.style.display === 'none' ? 'block' : 'none');
                return;
            }
            this.loadLinks();
            this.createPanel();
        },

        loadLinks() {
            const saved = localStorage.getItem('sidekick_linkgroup');
            this.links = saved ? JSON.parse(saved) : [];
        },

        saveLinks() {
            localStorage.setItem('sidekick_linkgroup', JSON.stringify(this.links));
        },

        createPanel() {
            console.log('🔗 LinkGroup.createPanel called');
            // Remove old panel if exists
            const old = document.getElementById('sidekick-linkgroup-panel');
            if (old) old.remove();

            // Panel container
            const panel = document.createElement('div');
            panel.id = 'sidekick-linkgroup-panel';
            panel.className = 'sidekick-panel';

            // Header with dropdown
            panel.innerHTML = `
                <div class="notepad-header" style="background:#607D8B; color:#fff; display:flex; align-items:center; justify-content:space-between; padding:8px 12px;">
                    <span style="font-weight:bold;">🔗 Link Group</span>
                    <div>
                        <button id="add-link-btn" style="margin-right:8px;">Add new link</button>
                        <button id="dropdown-btn">▼</button>
                    </div>
                </div>
                <div class="link-list" style="padding:12px;"></div>
            `;

            document.body.appendChild(panel);
            panel.style.display = 'block'; // Ensure visible
            // Debug: Add visible content to confirm rendering
            panel.innerHTML += '<div style="color:#fff;background:#333;padding:10px;">Debug: Panel Content</div>';
            this.panel = panel;
            this.renderLinks();

            // Add link button
            panel.querySelector('#add-link-btn').onclick = () => this.showAddLinkModal();

            // Dropdown (hide/show panel)
            const dropdownBtn = panel.querySelector('#dropdown-btn');
            dropdownBtn.onclick = () => {
                const list = panel.querySelector('.link-list');
                list.style.display = list.style.display === 'none' ? 'block' : 'none';
            };
        },

        renderLinks() {
            const list = this.panel.querySelector('.link-list');
            list.innerHTML = '';
            this.links.forEach((link, idx) => {
                const row = document.createElement('div');
                row.style = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;background:#eee;padding:6px 8px;border-radius:4px;';
                row.innerHTML = `
                    <a href="${link.url}" target="_blank" style="color:#2196F3;text-decoration:underline;">${link.name}</a>
                    <div>
                        <button class="copy-btn" data-idx="${idx}" style="margin-right:6px;">📋</button>
                        <button class="remove-btn" data-idx="${idx}">❌</button>
                    </div>
                `;
                list.appendChild(row);
            });

            // Copy button
            list.querySelectorAll('.copy-btn').forEach(btn => {
                btn.onclick = () => {
                    const url = this.links[btn.dataset.idx].url;
                    navigator.clipboard.writeText(url);
                };
            });

            // Remove button
            list.querySelectorAll('.remove-btn').forEach(btn => {
                btn.onclick = () => {
                    this.links.splice(btn.dataset.idx, 1);
                    this.saveLinks();
                    this.renderLinks();
                };
            });
        },

        showAddLinkModal() {
            // Simple modal
            const modal = document.createElement('div');
            modal.style = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:24px;border-radius:8px;z-index:999999;box-shadow:0 4px 16px rgba(0,0,0,0.2);';
            modal.innerHTML = `
                <h3>Add New Link</h3>
                <input id="link-name" placeholder="Name" style="width:100%;margin-bottom:8px;padding:6px;" />
                <input id="link-url" placeholder="URL" style="width:100%;margin-bottom:8px;padding:6px;" />
                <button id="save-link">Save</button>
                <button id="cancel-link" style="margin-left:8px;">Cancel</button>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#save-link').onclick = () => {
                const name = modal.querySelector('#link-name').value.trim();
                const url = modal.querySelector('#link-url').value.trim();
                if (name && url) {
                    this.links.push({ name, url });
                    this.saveLinks();
                    this.renderLinks();
                    modal.remove();
                }
            };
            modal.querySelector('#cancel-link').onclick = () => modal.remove();
        }
    };

    // Register to global modules
    window.top.SidekickModules = window.top.SidekickModules || {};
    window.top.SidekickModules.LinkGroup = LinkGroup;
})();
