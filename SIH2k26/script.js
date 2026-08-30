// API_URL for the NestJS backend
const API_URL = 'http://localhost:3000/api/v1';


document.addEventListener('DOMContentLoaded', async () => {
    // Prevent the site from triggering any reloads unless manually confirmed by the user
    window.addEventListener('beforeunload', (e) => {
        // Cancel the event and show the browser's native confirmation dialog
        e.preventDefault();
        e.returnValue = '';
    });

    // 1. Wipe backend memory on page refresh (as requested)
    // Removed because this causes data loss on every live server reload
    /* 
    try {
        await fetch(`${API_URL}/reset`, { method: 'POST' });
    } catch (e) {
        console.error("Failed to reset:", e);
    }
    */

    let authToken = localStorage.getItem('supabase_access_token') || null;
    let currentUser = JSON.parse(localStorage.getItem('user_data') || 'null');

    const navLoginBtn = document.getElementById('nav-login');
    const userMenuContainer = document.getElementById('user-menu-container');
    const navUserProfile = document.getElementById('nav-user-profile');
    const userNameDisplay = document.getElementById('user-name-display');
    const userDropdown = document.getElementById('user-dropdown');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    const dropdownUserEmail = document.getElementById('dropdown-user-email');
    const dropdownUserRole = document.getElementById('dropdown-user-role');
    const navLogout = document.getElementById('nav-logout');

    // Auth modals (if any)
    const authModal = document.getElementById('auth-modal');
    const closeAuthModal = document.getElementById('close-auth-modal');
    const loginForm = document.getElementById('login-form');

    function updateAuthUI() {
        if (authToken && currentUser) {
            if (navLoginBtn) navLoginBtn.style.display = 'none';
            if (userMenuContainer) {
                userMenuContainer.style.display = 'block';
                userNameDisplay.textContent = currentUser.name || 'User';
                dropdownUserName.textContent = currentUser.name || 'User';
                dropdownUserEmail.textContent = currentUser.email || 'No email provided';
                dropdownUserRole.textContent = currentUser.role || 'User';
            }
        } else {
            if (navLoginBtn) navLoginBtn.style.display = 'block';
            if (userMenuContainer) userMenuContainer.style.display = 'none';
        }
    }

    updateAuthUI();

    if (navUserProfile) {
        navUserProfile.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (userDropdown.style.display === 'none') {
                userDropdown.style.display = 'block';
            } else {
                userDropdown.style.display = 'none';
            }
        });

        document.addEventListener('click', (e) => {
            if (userMenuContainer && !userMenuContainer.contains(e.target) && userDropdown) {
                userDropdown.style.display = 'none';
            }
        });
    }

    if (navLogout) {
        navLogout.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('supabase_access_token');
            localStorage.removeItem('supabase_refresh_token');
            localStorage.removeItem('user_data');
            authToken = null;
            currentUser = null;
            if (userDropdown) userDropdown.style.display = 'none';
            updateAuthUI();
            loadFeed();
        });
    }

    const form = document.getElementById('challenge-form');
    const feedList = document.getElementById('feed-list');
    const uploadAreaTrigger = document.getElementById('upload-area-trigger');
    const uploadPopup = document.getElementById('upload-popup');
    const btnCamera = document.getElementById('btn-camera');
    const btnGallery = document.getElementById('btn-gallery');
    const mediaInputGallery = document.getElementById('media-input-gallery');
    const mediaInputCamera = document.getElementById('media-input-camera');
    const uploadLabelText = document.getElementById('upload-label-text');
    const previewContainer = document.getElementById('preview-container');
    const submitBtn = document.getElementById('submit-btn');

    let selectedFiles = [];

    const openModalBtn = document.getElementById('open-post-modal');
    const closeModalBtn = document.getElementById('close-post-modal');
    const postModal = document.getElementById('post-modal');

    if (openModalBtn && closeModalBtn && postModal) {
        openModalBtn.addEventListener('click', () => postModal.classList.add('active'));
        closeModalBtn.addEventListener('click', () => postModal.classList.remove('active'));
        postModal.addEventListener('click', (e) => {
            if (e.target === postModal) postModal.classList.remove('active');
        });
    }

    // ── Load Feed and Search Logic ────────────────────────────────────────────
    function loadFeed(query = '') {
        feedList.innerHTML = '<p class="empty-state">Loading...</p>';
        const url = query ? `${API_URL}/challenges?page=1&limit=20&search=${encodeURIComponent(query)}` : `${API_URL}/challenges?page=1&limit=20`;

        const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};

        fetch(url, { headers })
            .then(r => r.json())
            .then(data => renderFeed(data.data))
            .catch(() => {
                feedList.innerHTML = `
                    <div class="feed-item error-card">
                        <p>Server not found.</p>
                    </div>`;
            });
    }

    // Initial load
    loadFeed();

    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => loadFeed(searchInput.value.trim()));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                loadFeed(searchInput.value.trim());
            }
        });
    }

    // ── Navigation Logic ──────────────────────────────────────────────────────
    const navFeed = document.getElementById('nav-feed');
    const navStatistics = document.getElementById('nav-statistics');
    const feedSection = document.getElementById('feed-section');
    const statisticsSection = document.getElementById('statistics-section');
    const searchContainer = document.querySelector('.search-container');
    const mainElement = document.querySelector('.main-layout');

    if (navFeed && navStatistics) {
        navFeed.addEventListener('click', (e) => {
            e.preventDefault();
            navFeed.classList.add('active');
            navStatistics.classList.remove('active');
            if (mainElement) mainElement.style.display = 'block';
            statisticsSection.style.display = 'none';
            if (searchContainer) searchContainer.style.display = 'block';
        });

        navStatistics.addEventListener('click', (e) => {
            e.preventDefault();
            navStatistics.classList.add('active');
            navFeed.classList.remove('active');
            if (mainElement) mainElement.style.display = 'none';
            statisticsSection.style.display = 'block';
            if (searchContainer) searchContainer.style.display = 'none';
            loadStatistics();
        });
    }

    async function loadStatistics() {
        const statsOverview = document.getElementById('stats-overview');
        const statsDistricts = document.getElementById('stats-districts');
        const statsCategories = document.getElementById('stats-categories');
        const statsTrending = document.getElementById('stats-trending');
        const statsMyProblems = document.getElementById('stats-my-problems');

        try {
            const savedUser = JSON.parse(localStorage.getItem('user_data'));

            const [overviewRes, distRes, catRes, trendingRes] = await Promise.all([
                fetch(`${API_URL}/analytics/overview`),
                fetch(`${API_URL}/analytics/by-district`),
                fetch(`${API_URL}/analytics/by-category`),
                fetch(`${API_URL}/analytics/trending`)
            ]);

            if (overviewRes.ok) {
                const overviewPayload = await overviewRes.json();
                const overviewData = overviewPayload.data || overviewPayload;
                statsOverview.innerHTML = `
                    <div class="stat-box"><h4>Total Problems</h4><p>${overviewData.totalChallenges || 0}</p></div>
                    <div class="stat-box"><h4>Resolved</h4><p>${overviewData.resolvedChallenges || 0}</p></div>
                    <div class="stat-box"><h4>Pending</h4><p>${overviewData.pendingChallenges || 0}</p></div>
                `;

                // Render the Posted vs Solved chart
                renderSubmissionsChart();
            }

            if (distRes.ok) {
                const distPayload = await distRes.json();
                const distData = distPayload.data || distPayload;
                statsDistricts.innerHTML = distData.length ? distData.map(d => `<div class="stat-row"><span>${d.district || 'Unknown'}</span><span>${d.count}</span></div>`).join('') : '<p>No data</p>';
            }

            if (catRes.ok) {
                const catPayload = await catRes.json();
                const catData = catPayload.data || catPayload;
                statsCategories.innerHTML = catData.length ? catData.map(c => `<div class="stat-row"><span>${c.category || 'Unknown'}</span><span>${c.count}</span></div>`).join('') : '<p>No data</p>';
            }

            if (trendingRes.ok) {
                const trendingPayload = await trendingRes.json();
                const trendingData = trendingPayload.data || trendingPayload;
                if (trendingData.length) {
                    statsTrending.innerHTML = '';
                    statsTrending.innerHTML = trendingData.map(challenge => `
                        <div class="feed-item">
                            <div class="feed-meta">
                                <span class="tag tag-hot">Trending (${challenge.support_count || 0} supports)</span>
                                <span class="status">${challenge.status} • ${challenge.district || 'Unknown'}</span>
                            </div>
                            <h3>${challenge.title}</h3>
                            <p>${challenge.description.length > 100 ? challenge.description.substring(0, 100) + '...' : challenge.description}</p>
                        </div>
                    `).join('');
                } else {
                    statsTrending.innerHTML = '<p>No trending problems found.</p>';
                }
            }

            if (savedUser && savedUser.id && statsMyProblems) {
                try {
                    const myProbsRes = await fetch(`${API_URL}/challenges?limit=50`);
                    if (myProbsRes.ok) {
                        const payload = await myProbsRes.json();
                        const myData = (payload.data || []).filter(c => c.submitted_by === savedUser.id);

                        // Append 'My Posts' to the overview cards
                        const overviewDiv = document.getElementById('stats-overview');
                        if (overviewDiv) {
                            overviewDiv.innerHTML += `<div class="stat-box" style="background: #e0f2fe; border-color: #7dd3fc;"><h4>My Posts</h4><p>${myData.length}</p></div>`;
                        }

                        if (myData.length) {
                            statsMyProblems.innerHTML = '';
                            myData.forEach(challenge => {
                                const card = document.createElement('div');
                                card.className = 'feed-item';

                                const actionsHtml = `
                                    <div class="problem-actions" style="margin-top: 10px; display: flex; gap: 8px;">
                                        <button class="action-btn edit-my-post" data-id="${challenge.id}">Edit</button>
                                        <button class="action-btn delete-btn delete-my-post" data-id="${challenge.id}">Delete</button>
                                    </div>
                                `;

                                card.innerHTML = `
                                    <div class="feed-meta">
                                        <span class="status">${challenge.status} • ${challenge.district || 'Unknown'}</span>
                                    </div>
                                    <h3>${challenge.title}</h3>
                                    <p>${challenge.description.length > 100 ? challenge.description.substring(0, 100) + '...' : challenge.description}</p>
                                    ${actionsHtml}
                                `;

                                // Attach event listeners
                                const editBtn = card.querySelector('.edit-my-post');
                                const delBtn = card.querySelector('.delete-my-post');

                                editBtn.addEventListener('click', () => {
                                    document.getElementById('title').value = challenge.title || '';
                                    document.getElementById('district').value = challenge.district || '';
                                    document.getElementById('description').value = challenge.description || '';
                                    document.getElementById('solution').value = '';

                                    form.dataset.editId = challenge.id;
                                    submitBtn.textContent = 'Update Challenge';
                                    if (postModal) postModal.classList.add('active');
                                });

                                delBtn.addEventListener('click', () => {
                                    if (!confirm('Are you sure you want to delete this challenge?')) return;
                                    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
                                    fetch(`${API_URL}/challenges/${challenge.id}`, { method: 'DELETE', headers })
                                        .then(() => {
                                            // Re-load stats and feed to reflect deletion
                                            loadStatistics();
                                            fetch(`${API_URL}/challenges?page=1&limit=20`, { headers })
                                                .then(r => r.json())
                                                .then(d => renderFeed(d.data));
                                        });
                                });

                                statsMyProblems.appendChild(card);
                            });
                        } else {
                            statsMyProblems.innerHTML = '<p>You have not posted any problems yet.</p>';
                        }
                    }
                } catch (e) {
                    statsMyProblems.innerHTML = '<p>Error loading your problems.</p>';
                }
            } else if (statsMyProblems) {
                statsMyProblems.innerHTML = '<p>Please log in to view your problems.</p>';
            }

        } catch (e) {
            console.error('Error fetching statistics:', e);
            statsOverview.innerHTML = '<p>Error loading stats.</p>';
        }
    }

    let submissionsChart = null;

    async function renderSubmissionsChart() {
        const canvas = document.getElementById('submissions-chart');
        if (!canvas) return;

        if (submissionsChart) {
            submissionsChart.destroy();
        }

        try {
            const res = await fetch(`${API_URL}/challenges`);
            if (!res.ok) return;
            const payload = await res.json();
            const challenges = payload.data || payload;

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            // Group by month
            const postedByMonth = {};
            const solvedByMonth = {};

            challenges.forEach(c => {
                const date = c.created_at ? new Date(c.created_at) : null;
                if (!date) return;
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                postedByMonth[monthKey] = (postedByMonth[monthKey] || 0) + 1;
                if (c.status === 'completed' || c.status === 'validated') {
                    solvedByMonth[monthKey] = (solvedByMonth[monthKey] || 0) + 1;
                }
            });

            const allMonths = [...new Set(Object.keys(postedByMonth))].sort();
            const labels = allMonths.map(m => {
                const [year, month] = m.split('-');
                return `${monthNames[parseInt(month) - 1]} ${year}`;
            });
            const postedData = allMonths.map(m => postedByMonth[m] || 0);
            const solvedData = allMonths.map(m => solvedByMonth[m] || 0);

            submissionsChart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Posted',
                            data: postedData,
                            borderColor: '#2563eb',
                            backgroundColor: 'transparent',
                            borderWidth: 3,
                            tension: 0,
                            pointRadius: 4,
                            pointBackgroundColor: '#2563eb',
                        },
                        {
                            label: 'Solved',
                            data: solvedData,
                            borderColor: '#e97319',
                            backgroundColor: 'transparent',
                            borderWidth: 3,
                            tension: 0,
                            pointRadius: 4,
                            pointBackgroundColor: '#e97319',
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { font: { family: 'Inter', size: 14 }, padding: 20 }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1, font: { family: 'Inter', size: 13 } },
                            grid: { color: 'rgba(0,0,0,0.06)' }
                        },
                        x: {
                            ticks: { font: { family: 'Inter', size: 12 } },
                            grid: { color: 'rgba(0,0,0,0.04)' }
                        }
                    }
                }
            });
        } catch (err) {
            console.error('Error rendering chart:', err);
        }
    }

    // ── Camera Modal Logic ────────────────────────────────────────────────────
    const cameraModal = document.getElementById('camera-modal');
    const cameraVideo = document.getElementById('camera-video');
    const cameraCanvas = document.getElementById('camera-canvas');
    const btnCameraCapture = document.getElementById('btn-camera-capture');
    const btnCameraCancel = document.getElementById('btn-camera-cancel');
    let cameraStream = null;

    async function openCamera() {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            cameraVideo.srcObject = cameraStream;
            cameraModal.classList.add('active');
        } catch (err) {
            alert('Could not access camera: ' + err.message);
        }
    }

    function closeCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        cameraModal.classList.remove('active');
    }

    if (btnCameraCancel) btnCameraCancel.addEventListener('click', closeCamera);

    if (btnCameraCapture) btnCameraCapture.addEventListener('click', () => {
        if (!cameraStream) return;

        cameraCanvas.width = cameraVideo.videoWidth;
        cameraCanvas.height = cameraVideo.videoHeight;
        const ctx = cameraCanvas.getContext('2d');
        ctx.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);

        cameraCanvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                if (window.currentEditHandleFiles) {
                    window.currentEditHandleFiles([file]);
                } else {
                    handleFiles([file]);
                }
            }
            closeCamera();
        }, 'image/jpeg', 0.8);
    });

    // ── Upload Popup & File Selection Logic ───────────────────────────────────
    if (uploadAreaTrigger && uploadPopup) {
        uploadAreaTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            uploadPopup.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!uploadAreaTrigger.contains(e.target) && !uploadPopup.contains(e.target)) {
                uploadPopup.classList.remove('show');
            }
        });

        btnCamera.addEventListener('click', () => {
            openCamera();
            uploadPopup.classList.remove('show');
        });

        btnGallery.addEventListener('click', () => {
            mediaInputGallery.click();
            uploadPopup.classList.remove('show');
        });
    }

    function handleFiles(files) {
        if (!files || !files.length) return;
        selectedFiles = [...selectedFiles, ...Array.from(files)];
        renderPreviews();
    }

    if (mediaInputGallery) mediaInputGallery.addEventListener('change', (e) => {
        if (window.currentEditHandleFiles) {
            window.currentEditHandleFiles(e.target.files);
        } else {
            handleFiles(e.target.files);
        }
        e.target.value = ''; // Reset input
    });

    function renderPreviews() {
        previewContainer.innerHTML = '';
        if (!selectedFiles.length) {
            uploadLabelText.textContent = 'Click to upload photo or video';
            return;
        }
        uploadLabelText.textContent = `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`;

        selectedFiles.forEach((file, index) => {
            const url = URL.createObjectURL(file);
            const wrapper = document.createElement('div');
            wrapper.className = 'preview-wrapper';

            const el = file.type.startsWith('video/')
                ? Object.assign(document.createElement('video'), { src: url, controls: true })
                : Object.assign(document.createElement('img'), { src: url, alt: 'preview' });
            el.className = 'media-preview';

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-media-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                selectedFiles.splice(index, 1);
                renderPreviews();
            });

            wrapper.appendChild(el);
            wrapper.appendChild(removeBtn);
            previewContainer.appendChild(wrapper);
        });
    }

    // ── Form submit ───────────────────────────────────────────────────────────
    form.addEventListener('submit', async e => {
        e.preventDefault();

        const titleVal = document.getElementById('title')?.value.trim() || 'Untitled Challenge';
        const distVal = document.getElementById('district')?.value.trim() || 'Unknown';
        const description = document.getElementById('description').value.trim();
        const solution = document.getElementById('solution')?.value.trim();
        const fullDesc = solution
            ? `${description}\n\nProposed solution: ${solution}`
            : description;

        if (!description || !titleVal || !distVal) return;

        const formData = new FormData();
        formData.append('title', titleVal);
        formData.append('district', distVal);
        formData.append('description', fullDesc);
        selectedFiles.forEach(f => formData.append('file', f)); // Backend expects 'file'

        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
        feedList.innerHTML = '<div class="feed-item"><p>Running AI Routing...</p></div>';

        const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};

        try {
            const editId = form.dataset.editId;
            let res;
            if (editId) {
                // For editing, we might just send JSON since media upload on edit isn't fully set up, but let's just send JSON for simplicity or FormData
                res = await fetch(`${API_URL}/challenges/${editId}`, {
                    method: 'PATCH',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: titleVal,
                        district: distVal,
                        description: fullDesc
                    })
                });
            } else {
                res = await fetch(`${API_URL}/challenges`, { method: 'POST', body: formData, headers });
            }

            if (!res.ok) throw new Error(`Server error ${res.status}`);

            // Re-fetch challenges
            const freshRes = await fetch(`${API_URL}/challenges?page=1&limit=20`);
            const data = await freshRes.json();
            renderFeed(data.data);
        } catch (err) {
            console.error('Submit error:', err);
            feedList.innerHTML = `
                <div class="feed-item error-card">
                    <p>Submission failed.</p>
                    <p>Make sure the backend is running and configured with a database.</p>
                </div>`;
        } finally {
            form.reset();
            delete form.dataset.editId;
            selectedFiles = [];
            previewContainer.innerHTML = '';
            uploadLabelText.textContent = 'Click to upload photo or video';
            submitBtn.textContent = 'Submit Challenge';
            submitBtn.disabled = false;
            if (postModal) postModal.classList.remove('active');
        }
    });

    // ── Render challenges returned by backend ───────────────────────────────────
    function renderFeed(challenges) {
        if (!challenges || !challenges.length) {
            feedList.innerHTML = '<p class="empty-state empty-state-centered">No challenges yet.</p>';
            return;
        }
        feedList.innerHTML = '';

        challenges.forEach((challenge) => {
            const card = document.createElement('div');
            card.className = 'feed-item';

            const meta = document.createElement('div');
            meta.className = 'feed-meta';
            meta.innerHTML = `
                <span class="tag tag-new">${challenge.district}</span>
                <span class="status">${(challenge.status || 'SUBMITTED').replace('_', ' ').toUpperCase()}</span>
            `;

            const title = document.createElement('h3');
            title.textContent = challenge.title || 'Untitled Challenge';

            const pDesc = document.createElement('p');
            pDesc.className = 'problem-text';
            pDesc.style.whiteSpace = 'pre-wrap';
            pDesc.textContent = challenge.description;

            card.appendChild(meta);
            card.appendChild(title);
            card.appendChild(pDesc);

            if (challenge.media_urls && challenge.media_urls.length > 0) {
                const row = document.createElement('div');
                row.className = 'media-row';
                challenge.media_urls.forEach(url => {
                    const mediaUrl = url.startsWith('http')
                        ? url
                        : (url.startsWith('/api/v1')
                            ? `http://localhost:3000${url}`
                            : `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`);

                    if (mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.mov')) {
                        const vid = document.createElement('video');
                        vid.src = mediaUrl;
                        vid.controls = true;
                        vid.className = 'media-thumb';
                        row.appendChild(vid);
                    } else {
                        const img = document.createElement('img');
                        img.src = mediaUrl;
                        img.alt = 'Attached media';
                        img.className = 'media-thumb media-thumb-zoom';
                        img.addEventListener('click', () => openLightbox(mediaUrl));
                        row.appendChild(img);
                    }
                });
                card.appendChild(row);
            }

            const interactionRow = document.createElement('div');
            interactionRow.className = 'interaction-row';
            interactionRow.style.marginTop = '15px';

            const supportBtn = document.createElement('button');
            supportBtn.className = 'interaction-btn support-btn';
            let currentSupportCount = challenge.support_count || 0;
            let supported = challenge.has_supported === 1;

            supportBtn.type = 'button';

            const renderSupportBtn = () => {
                if (supported) {
                    supportBtn.innerHTML = `<span>Supported (${currentSupportCount})</span>`;
                    supportBtn.classList.add('active');
                } else {
                    supportBtn.innerHTML = `<span>Support (${currentSupportCount})</span>`;
                    supportBtn.classList.remove('active');
                }
            };

            renderSupportBtn();

            let isSupporting = false;
            supportBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (!authToken) {
                    alert('You must be logged in to support a challenge.');
                    return;
                }

                if (isSupporting) return;

                // Optimistic UI update
                const prevSupported = supported;
                const prevCount = currentSupportCount;

                supported = !supported;
                currentSupportCount += supported ? 1 : -1;
                renderSupportBtn();

                isSupporting = true;

                const headers = { 'Authorization': `Bearer ${authToken}` };

                try {
                    const res = await fetch(`${API_URL}/challenges/${challenge.id}/support`, { method: 'POST', headers });
                    if (res.ok) {
                        const payload = await res.json();
                        const result = payload.data || payload;

                        currentSupportCount = result.support_count;
                        supported = result.supported;
                        renderSupportBtn();
                    } else {
                        // Revert on error
                        supported = prevSupported;
                        currentSupportCount = prevCount;
                        renderSupportBtn();
                        const errData = await res.json();
                        alert(errData.message || 'Error supporting challenge');
                    }
                } catch (err) {
                    // Revert on error
                    supported = prevSupported;
                    currentSupportCount = prevCount;
                    renderSupportBtn();
                    console.error('Error supporting challenge:', err);
                } finally {
                    isSupporting = false;
                }
            });

            interactionRow.appendChild(supportBtn);

            // Action Buttons (Edit/Delete) - only for creator
            if (currentUser && challenge.submitted_by === currentUser.id) {
                const actions = document.createElement('div');
                actions.className = 'problem-actions';
                actions.style.marginLeft = 'auto';

                const editBtn = document.createElement('button');
                editBtn.className = 'action-btn';
                editBtn.title = 'Edit';
                editBtn.innerHTML = 'Edit';
                editBtn.style.marginRight = '8px';
                editBtn.addEventListener('click', () => {
                    // Populate modal
                    document.getElementById('title').value = challenge.title || '';
                    document.getElementById('district').value = challenge.district || '';
                    document.getElementById('description').value = challenge.description || '';
                    document.getElementById('solution').value = '';

                    form.dataset.editId = challenge.id; // Store ID for edit mode
                    submitBtn.textContent = 'Update Challenge';

                    if (postModal) postModal.classList.add('active');
                });

                const delBtn = document.createElement('button');
                delBtn.className = 'action-btn delete-btn';
                delBtn.title = 'Delete';
                delBtn.innerHTML = 'Delete';
                delBtn.addEventListener('click', () => {
                    if (!confirm('Are you sure you want to delete this challenge?')) return;

                    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
                    fetch(`${API_URL}/challenges/${challenge.id}`, { method: 'DELETE', headers })
                        .then(() => {
                            fetch(`${API_URL}/challenges?page=1&limit=20`, { headers })
                                .then(r => r.json())
                                .then(data => renderFeed(data.data));
                        });
                });

                actions.appendChild(editBtn);
                actions.appendChild(delBtn);
                interactionRow.appendChild(actions);
            }

            card.appendChild(interactionRow);

            feedList.appendChild(card);
        });
    }

    // ── Delete a post ─────────────────────────────────────────────────────────
    async function deletePost(id, btn) {
        if (!confirm('Delete this challenge? This cannot be undone.')) return;
        btn.textContent = 'processing...';
        btn.disabled = true;
        const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
        try {
            const res = await fetch(`${API_URL}/submission/${id}`, { method: 'DELETE', headers });
            const data = await res.json();
            renderFeed(data.clusters);
        } catch (err) {
            console.error('Delete failed:', err);
            btn.textContent = 'Delete';
            btn.disabled = false;
        }
    }

    // ── Edit a post inline ────────────────────────────────────────────────────
    function startEdit(li, problem, textSpan) {
        const textarea = document.createElement('textarea');
        textarea.className = 'edit-textarea';
        textarea.value = problem.text;
        textarea.rows = 3;

        let keptMedia = [...(problem.media || [])];
        let editNewFiles = [];

        const mediaContainer = document.createElement('div');
        mediaContainer.className = 'edit-media-container';

        const mediaHeader = document.createElement('div');
        mediaHeader.className = 'edit-media-header';
        mediaHeader.innerHTML = '<span class="edit-media-title">Media Attached</span>';

        const addMediaBtn = document.createElement('button');
        addMediaBtn.type = 'button';
        addMediaBtn.className = 'btn btn-outline';
        addMediaBtn.style.padding = '4px 8px';
        addMediaBtn.style.fontSize = '12px';
        addMediaBtn.textContent = '+ Add Media';
        addMediaBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.currentEditHandleFiles = (files) => {
                editNewFiles = [...editNewFiles, ...Array.from(files)];
                renderEditMedia();
            };
            if (uploadAreaTrigger) uploadAreaTrigger.click(); // Open popup
        });

        mediaHeader.appendChild(addMediaBtn);
        mediaContainer.appendChild(mediaHeader);

        const editPreviewContainer = document.createElement('div');
        editPreviewContainer.id = 'preview-container';
        mediaContainer.appendChild(editPreviewContainer);

        function renderEditMedia() {
            editPreviewContainer.innerHTML = '';

            // Render existing media
            keptMedia.forEach((m, index) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'preview-wrapper';
                const el = m.isVideo
                    ? Object.assign(document.createElement('video'), { src: `${API_URL}${m.url}`, controls: true })
                    : Object.assign(document.createElement('img'), { src: `${API_URL}${m.url}` });
                el.className = 'media-preview';

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'remove-media-btn';
                removeBtn.innerHTML = '&times;';
                removeBtn.addEventListener('click', () => {
                    keptMedia.splice(index, 1);
                    renderEditMedia();
                });

                wrapper.appendChild(el);
                wrapper.appendChild(removeBtn);
                editPreviewContainer.appendChild(wrapper);
            });

            // Render new media
            editNewFiles.forEach((file, index) => {
                const url = URL.createObjectURL(file);
                const wrapper = document.createElement('div');
                wrapper.className = 'preview-wrapper';
                const el = file.type.startsWith('video/')
                    ? Object.assign(document.createElement('video'), { src: url, controls: true })
                    : Object.assign(document.createElement('img'), { src: url });
                el.className = 'media-preview';

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'remove-media-btn';
                removeBtn.innerHTML = '&times;';
                removeBtn.addEventListener('click', () => {
                    editNewFiles.splice(index, 1);
                    renderEditMedia();
                });

                wrapper.appendChild(el);
                wrapper.appendChild(removeBtn);
                editPreviewContainer.appendChild(wrapper);
            });
        }

        renderEditMedia();

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.className = 'action-btn save-btn';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'action-btn cancel-btn';

        const editControls = document.createElement('div');
        editControls.className = 'edit-controls';
        editControls.appendChild(saveBtn);
        editControls.appendChild(cancelBtn);

        const wrapper = document.createElement('div');
        wrapper.style.width = '100%';
        wrapper.appendChild(textarea);
        wrapper.appendChild(mediaContainer);
        wrapper.appendChild(editControls);

        textSpan.replaceWith(wrapper);
        li.querySelector('.problem-actions').style.display = 'none';

        // Hide media row if present
        const mediaRow = li.querySelector('.media-row');
        if (mediaRow) mediaRow.style.display = 'none';

        textarea.focus();

        cancelBtn.addEventListener('click', () => {
            window.currentEditHandleFiles = null;
            wrapper.replaceWith(textSpan);
            li.querySelector('.problem-actions').style.display = 'flex';
            if (mediaRow) mediaRow.style.display = 'flex';
        });

        saveBtn.addEventListener('click', async () => {
            const newText = textarea.value.trim();
            if (!newText) return;
            saveBtn.textContent = 'processing...';
            saveBtn.disabled = true;

            const formData = new FormData();
            formData.append('text', newText);
            formData.append('kept_media', keptMedia.map(m => m.id).join(','));
            editNewFiles.forEach(f => formData.append('media', f));
            const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};

            try {
                const res = await fetch(`${API_URL}/submission/${problem.id}`, {
                    method: 'PATCH',
                    headers: headers,
                    body: formData
                });
                const data = await res.json();
                window.currentEditHandleFiles = null;
                renderFeed(data.clusters);
            } catch (err) {
                console.error('Edit failed:', err);
                saveBtn.textContent = 'Save';
                saveBtn.disabled = false;
            }
        });
    }

    // ── Lightbox ──────────────────────────────────────────────────────────────
    function openLightbox(src) {
        document.getElementById('lightbox-overlay')?.remove();
        const overlay = document.createElement('div');
        overlay.id = 'lightbox-overlay';
        overlay.className = 'lightbox-overlay';
        const img = document.createElement('img');
        img.src = src;
        img.className = 'lightbox-img';
        overlay.appendChild(img);
        overlay.addEventListener('click', () => overlay.remove());
        document.body.appendChild(overlay);
    }
});
