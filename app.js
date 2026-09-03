// DATA STRUCTURE - Now stores analysts per application
let globalAnalysts = {
    JDEdwards: [],
    SalesForce: []
};
let ticketRecords = [];
let monthsList = [];
let currentMonth = "";

const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
const API_BASE = '/api';
const AUTH_KEY = 'brickworks-metrics-auth';

function isAuthenticated() {
    return localStorage.getItem(AUTH_KEY) === 'true';
}

function setAuthenticated(value) {
    if (value) {
        localStorage.setItem(AUTH_KEY, 'true');
    } else {
        localStorage.removeItem(AUTH_KEY);
    }
}

function showLoginScreen(show) {
    const loginScreen = document.getElementById('loginScreen');
    const appShell = document.getElementById('appShell');
    if (loginScreen) loginScreen.classList.toggle('hidden', !show);
    if (appShell) appShell.classList.toggle('hidden', show);
    if (show) {
        document.getElementById('loginUsername')?.focus();
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    const errorEl = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnIcon = document.getElementById('loginBtnIcon');
    const loginBtnSpinner = document.getElementById('loginBtnSpinner');
    const loginBtnText = document.getElementById('loginBtnText');
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        errorEl.textContent = 'Please enter both username and password.';
        return;
    }

    loginBtn.disabled = true;
    loginBtnIcon.hidden = true;
    loginBtnSpinner.hidden = false;
    loginBtnText.textContent = 'Signing in...';
    errorEl.textContent = '';

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        let result = {};
        const text = await response.text();
        if (text) {
            try {
                result = JSON.parse(text);
            } catch (parseError) {
                console.warn('Login response was not valid JSON:', text);
                result = { message: 'Server returned an invalid response.' };
            }
        }

        if (!response.ok || !result.ok) {
            throw new Error(result.message || 'Invalid username or password');
        }

        setAuthenticated(true);
        showLoginScreen(false);
        errorEl.textContent = '';
        usernameInput.value = '';
        passwordInput.value = '';
        initDashboard();
    } catch (error) {
        errorEl.textContent = error.message || 'Login failed. Please try again.';
    } finally {
        loginBtn.disabled = false;
        loginBtnIcon.hidden = false;
        loginBtnSpinner.hidden = true;
        loginBtnText.textContent = 'Sign In';
    }
}

function handleLogout() {
    setAuthenticated(false);
    showLoginScreen(true);
    document.getElementById('loginUsername')?.focus();
}

function formatMonthDisplay(monthId) {
    if (!monthId) return monthId;
    const [year, month] = monthId.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

function updateMonthIndicators() {
    const formattedMonth = formatMonthDisplay(currentMonth);
    const jdeIndicator = document.getElementById('jdeMonthIndicator');
    const sfIndicator = document.getElementById('sfMonthIndicator');
    const globalIndicator = document.getElementById('globalMonthIndicator');

    if (jdeIndicator) {
        jdeIndicator.innerHTML = `<i class="fa-regular fa-calendar mr-2"></i><span>${formattedMonth}</span>`;
    }
    if (sfIndicator) {
        sfIndicator.innerHTML = `<i class="fa-regular fa-calendar mr-2"></i><span>${formattedMonth}</span>`;
    }
    if (globalIndicator) {
        globalIndicator.innerHTML = `<i class="fa-regular fa-calendar-alt mr-2 text-amber-700"></i>${formattedMonth}`;
    }
}

function initDefaultData() {
    if (monthsList.length === 0) {
        monthsList.push("2026-06");
        currentMonth = "2026-06";
    }
    if (!currentMonth) currentMonth = monthsList[0];
}

async function saveData() {
    const payload = {
        analysts: globalAnalysts,
        records: ticketRecords,
        months: monthsList,
        currentMonth: currentMonth
    };

    try {
        if (typeof fetch === 'function') {
            await fetch(`${API_BASE}/metrics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        }
    } catch (error) {
        console.warn('Unable to save to MongoDB API:', error);
    }
}

async function loadData() {
    try {
        if (typeof fetch === 'function') {
            const response = await fetch(`${API_BASE}/metrics`);
            if (response.ok) {
                const text = await response.text();
                let data = {};
                if (text) {
                    try {
                        data = JSON.parse(text);
                    } catch (parseError) {
                        console.warn('Metrics response was not valid JSON:', text);
                        data = {};
                    }
                }

                if (data.analysts && !Array.isArray(data.analysts)) {
                    globalAnalysts = data.analysts;
                } else if (data.analysts && Array.isArray(data.analysts)) {
                    globalAnalysts = {
                        JDEdwards: [...data.analysts],
                        SalesForce: [...data.analysts]
                    };
                } else {
                    globalAnalysts = { JDEdwards: [], SalesForce: [] };
                }
                ticketRecords = data.records || [];
                monthsList = data.months || [];
                currentMonth = data.currentMonth || (monthsList[0] || '2026-06');
                if (monthsList.length === 0) monthsList.push('2026-06');
                if (!currentMonth || !monthsList.includes(currentMonth)) currentMonth = monthsList[0];
                updateMonthIndicators();
                return;
            }
        }
    } catch (error) {
        console.warn('MongoDB API unavailable, using default in-memory data:', error);
    }

    initDefaultData();
    globalAnalysts = { JDEdwards: [], SalesForce: [] };
    ticketRecords = [];
    if (monthsList.length === 0) monthsList = ['2026-06'];
    if (!currentMonth || !monthsList.includes(currentMonth)) currentMonth = monthsList[0];
    updateMonthIndicators();
}

function getAllAnalysts() {
    const all = new Set();
    globalAnalysts.JDEdwards.forEach(a => all.add(a));
    globalAnalysts.SalesForce.forEach(a => all.add(a));
    return Array.from(all).sort();
}

function getAnalystsForApp(app) {
    return globalAnalysts[app] || [];
}

function addAnalystToApp(analystName, app) {
    if (!globalAnalysts[app]) globalAnalysts[app] = [];
    if (!globalAnalysts[app].includes(analystName)) {
        globalAnalysts[app].push(analystName);
        globalAnalysts[app].sort();
    }
}

function removeAnalystFromApp(analystName, app) {
    if (app === 'both') {
        globalAnalysts.JDEdwards = globalAnalysts.JDEdwards.filter(a => a !== analystName);
        globalAnalysts.SalesForce = globalAnalysts.SalesForce.filter(a => a !== analystName);
    } else if (globalAnalysts[app]) {
        globalAnalysts[app] = globalAnalysts[app].filter(a => a !== analystName);
    }
}

function setTicketCount(monthId, app, analyst, weekIndex, customer, newCount) {
    if (newCount <= 0) {
        ticketRecords = ticketRecords.filter(r => !(r.monthId === monthId && r.app === app && r.analyst === analyst && r.weekIndex === weekIndex && r.customer === customer));
    } else {
        const existingIdx = ticketRecords.findIndex(r => r.monthId === monthId && r.app === app && r.analyst === analyst && r.weekIndex === weekIndex && r.customer === customer);
        if (existingIdx !== -1) {
            ticketRecords[existingIdx].count = newCount;
        } else {
            ticketRecords.push({ monthId, app, analyst, weekIndex, customer, count: newCount });
        }
    }
    ticketRecords = ticketRecords.filter(r => r.count > 0);
    saveData();
    renderTables();
}

function deleteAnalystMonth(monthId, app, analyst) {
    ticketRecords = ticketRecords.filter(r => !(r.monthId === monthId && r.app === app && r.analyst === analyst));
    saveData();
    renderTables();
}

function removeAnalystCompletely(analystName, app) {
    if (!analystName) return;
    removeAnalystFromApp(analystName, app);
    if (app === 'both') {
        ticketRecords = ticketRecords.filter(r => r.analyst !== analystName);
    } else {
        ticketRecords = ticketRecords.filter(r => !(r.analyst === analystName && r.app === app));
    }
    saveData();
    renderTables();
    updateRemoveAnalystDropdown();
    updateAnalystDropdowns();
}

function removeMonth(monthId) {
    if (!monthId) return;
    if (monthsList.length === 1) {
        alert("Cannot remove the only month. Add a new month first before removing this one.");
        return;
    }
    monthsList = monthsList.filter(m => m !== monthId);
    ticketRecords = ticketRecords.filter(r => r.monthId !== monthId);
    if (currentMonth === monthId) {
        currentMonth = monthsList[0];
    }
    saveData();
    rebuildMonthSelector();
    renderTables();
    updateRemoveAnalystDropdown();
    updateAnalystDropdowns();
    updateMonthIndicators();
}

function getCount(monthId, app, analyst, weekIndex, customer) {
    const rec = ticketRecords.find(r => r.monthId === monthId && r.app === app && r.analyst === analyst && r.weekIndex === weekIndex && r.customer === customer);
    return rec ? rec.count : 0;
}

function updateAnalystDropdowns() {
    const ticketSelect = document.getElementById('ticketAnalystSelect');
    if (ticketSelect) {
        ticketSelect.innerHTML = '';
        const allAnalysts = getAllAnalysts();
        if (allAnalysts.length === 0) {
            const opt = document.createElement('option');
            opt.disabled = true;
            opt.selected = true;
            opt.text = '-- No analysts, add first --';
            ticketSelect.appendChild(opt);
        } else {
            allAnalysts.forEach(an => {
                const opt = document.createElement('option');
                opt.value = an;
                opt.textContent = an;
                ticketSelect.appendChild(opt);
            });
        }
    }
    updateRemoveAnalystDropdown();
}

function updateRemoveAnalystDropdown() {
    const removeSelect = document.getElementById('removeAnalystSelect');
    if (removeSelect) {
        removeSelect.innerHTML = '<option value="">-- Select analyst to remove --</option>';
        const allAnalysts = getAllAnalysts();
        allAnalysts.forEach(an => {
            const opt = document.createElement('option');
            opt.value = an;
            opt.textContent = an;
            removeSelect.appendChild(opt);
        });
    }
}

function openEditModal(appName, analyst, weekIndex, weekLabel) {
    const ggCount = getCount(currentMonth, appName, analyst, weekIndex, 'GG');
    const bwsCount = getCount(currentMonth, appName, analyst, weekIndex, 'BWS');

    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `
        <div class="edit-modal-content">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-stone-800">Edit Tickets</h3>
                <button class="text-stone-400 hover:text-stone-600" id="closeEditModalBtn"><i class="fa-solid fa-times text-xl"></i></button>
            </div>
            <div class="border-t border-stone-200 pt-3 mb-4">
                <p class="text-stone-600"><span class="font-semibold">Analyst:</span> ${analyst}</p>
                <p class="text-stone-600"><span class="font-semibold">Application:</span> ${appName === 'JDEdwards' ? 'JD Edwards' : 'SalesForce'}</p>
                <p class="text-stone-600"><span class="font-semibold">Week:</span> ${weekLabel}</p>
                <p class="text-stone-600"><span class="font-semibold">Month:</span> ${formatMonthDisplay(currentMonth)}</p>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-stone-700 mb-1">GG (Glen-Gery) Tickets</label>
                    <input type="number" id="editGGCount" min="0" value="${ggCount}" class="w-full px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-stone-700 mb-1">BWS (Brickworks Supply) Tickets</label>
                    <input type="number" id="editBWSCount" min="0" value="${bwsCount}" class="w-full px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500">
                </div>
            </div>
            <div class="flex gap-3 mt-6">
                <button id="saveEditBtn" class="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2 rounded-xl transition">Save Changes</button>
                <button id="cancelEditBtn" class="flex-1 bg-stone-300 hover:bg-stone-400 text-stone-700 font-medium py-2 rounded-xl transition">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const closeModal = () => modal.remove();

    document.getElementById('closeEditModalBtn')?.addEventListener('click', closeModal);
    document.getElementById('cancelEditBtn')?.addEventListener('click', closeModal);
    document.getElementById('saveEditBtn')?.addEventListener('click', () => {
        const newGG = parseInt(document.getElementById('editGGCount').value) || 0;
        const newBWS = parseInt(document.getElementById('editBWSCount').value) || 0;

        setTicketCount(currentMonth, appName, analyst, weekIndex, 'GG', newGG);
        setTicketCount(currentMonth, appName, analyst, weekIndex, 'BWS', newBWS);
        closeModal();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

function renderTables() {
    if (!currentMonth) return;

    function buildTable(appName, tbodyId, footerId) {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        tbody.innerHTML = '';
        
        let analystList = getAnalystsForApp(appName);
        
        if (analystList.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="7" class="text-center py-8 text-stone-400">No analysts assigned to this application. Add analyst and select this app.`;
            tbody.appendChild(tr);
            document.getElementById(footerId).innerHTML = `<td colspan="7" class="px-4 py-2">Month Total: GG: 0 | BWS: 0 | ALL: 0`;
            return;
        }

        for (let analyst of analystList) {
            const row = document.createElement('tr');
            row.className = 'border-b border-stone-100 hover:bg-stone-50';

            const nameCell = document.createElement('td');
            nameCell.className = 'px-4 py-3 font-medium text-stone-700';
            nameCell.innerText = analyst;
            row.appendChild(nameCell);

            let weeklyTotal = 0;
            for (let weekIdx = 0; weekIdx < 4; weekIdx++) {
                const ggCount = getCount(currentMonth, appName, analyst, weekIdx, 'GG');
                const bwsCount = getCount(currentMonth, appName, analyst, weekIdx, 'BWS');
                weeklyTotal += (ggCount + bwsCount);

                const td = document.createElement('td');
                td.className = 'px-3 py-3 text-center cursor-pointer hover:bg-stone-100 transition';
                td.innerHTML = `<div class="flex flex-col items-center gap-0.5">
                            <span class="font-semibold text-amber-700">GG: ${ggCount}</span>
                            <span class="font-semibold text-emerald-700">BWS: ${bwsCount}</span>
                        </div>`;
                td.title = `Click to edit week ${weekIdx + 1} tickets`;
                td.onclick = () => openEditModal(appName, analyst, weekIdx, weekLabels[weekIdx]);
                row.appendChild(td);
            }

            const totalCell = document.createElement('td');
            totalCell.className = 'px-3 py-3 text-center font-bold bg-stone-50';
            totalCell.innerText = weeklyTotal;
            row.appendChild(totalCell);

            const actionCell = document.createElement('td');
            actionCell.className = 'px-3 py-3 text-center';
            actionCell.innerHTML = `
                <div class="flex gap-2 justify-center">
                    <button class="edit-ticket-btn text-blue-600 hover:text-blue-800 transition text-lg" title="Edit tickets for this analyst">
                        <i class="fa-regular fa-pen-to-square"></i>
                    </button>
                    <button class="delete-analyst-btn text-red-600 hover:text-red-800 transition text-lg" title="Delete all tickets for this analyst from this app">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            `;

            const editBtn = actionCell.querySelector('.edit-ticket-btn');
            const deleteBtn = actionCell.querySelector('.delete-analyst-btn');

            editBtn.onclick = () => {
                const modalDiv = document.createElement('div');
                modalDiv.className = 'edit-modal';
                modalDiv.innerHTML = `
                    <div class="edit-modal-content">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-xl font-bold text-stone-800">Edit Tickets for ${analyst}</h3>
                            <button class="text-stone-400 hover:text-stone-600 closeWeekSelectBtn"><i class="fa-solid fa-times text-xl"></i></button>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-stone-700 mb-1">Select Week to Edit</label>
                            <select id="weekSelectForEdit" class="w-full px-3 py-2 border border-stone-300 rounded-xl">
                                <option value="0">Week 1</option>
                                <option value="1">Week 2</option>
                                <option value="2">Week 3</option>
                                <option value="3">Week 4</option>
                            </select>
                        </div>
                        <div class="flex gap-3 mt-4">
                            <button id="selectWeekBtn" class="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-medium py-2 rounded-xl transition">Continue to Edit</button>
                            <button id="cancelTempBtn" class="flex-1 bg-stone-300 hover:bg-stone-400 text-stone-700 font-medium py-2 rounded-xl transition">Cancel</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modalDiv);
                const closeTemp = () => modalDiv.remove();
                modalDiv.querySelector('.closeWeekSelectBtn')?.addEventListener('click', closeTemp);
                modalDiv.querySelector('#cancelTempBtn')?.addEventListener('click', closeTemp);
                modalDiv.querySelector('#selectWeekBtn')?.addEventListener('click', () => {
                    const selectedWeek = parseInt(modalDiv.querySelector('#weekSelectForEdit').value);
                    closeTemp();
                    openEditModal(appName, analyst, selectedWeek, weekLabels[selectedWeek]);
                });
                modalDiv.addEventListener('click', (e) => { if (e.target === modalDiv) closeTemp(); });
            };

            deleteBtn.onclick = () => {
                if (confirm(`Delete ALL tickets for ${analyst} from ${appName === 'JDEdwards' ? 'JD Edwards' : 'SalesForce'} in ${formatMonthDisplay(currentMonth)}?`)) {
                    deleteAnalystMonth(currentMonth, appName, analyst);
                }
            };

            row.appendChild(actionCell);
            tbody.appendChild(row);
        }

        let totalGG = 0, totalBWS = 0;
        for (let analyst of analystList) {
            for (let weekIdx = 0; weekIdx < 4; weekIdx++) {
                totalGG += getCount(currentMonth, appName, analyst, weekIdx, 'GG');
                totalBWS += getCount(currentMonth, appName, analyst, weekIdx, 'BWS');
            }
        }
        const footerRow = document.getElementById(footerId);
        if (footerRow) {
            footerRow.innerHTML = `<td colspan="7" class="px-4 py-3">
                        <div class="flex justify-between items-center">
                            <span><i class="fa-solid fa-chart-simple mr-2"></i>Month Total:</span>
                            <span class="font-bold">GG: ${totalGG} | BWS: ${totalBWS} | ALL: ${totalGG + totalBWS}</span>
                        </div>
                    </td>`;
        }
    }

    buildTable('JDEdwards', 'jdeTableBody', 'jdeFooterRow');
    buildTable('SalesForce', 'sfTableBody', 'sfFooterRow');
    updateAnalystDropdowns();
    updateKPIView();
}

function updateKPIView() {
    const kpiView = document.getElementById('kpiView');
    if (!kpiView || !currentMonth) return;

    const monthRecords = ticketRecords.filter(record => record.monthId === currentMonth);
    const totalTickets = monthRecords.reduce((sum, record) => sum + Number(record.count || 0), 0);
    const activeAnalysts = new Set(monthRecords.map(record => record.analyst));
    const allAnalysts = getAllAnalysts();
    const weeklyTotals = weekLabels.map((_, weekIndex) => monthRecords
        .filter(record => Number(record.weekIndex) === weekIndex)
        .reduce((sum, record) => sum + Number(record.count || 0), 0));
    const peakWeekTotal = Math.max(...weeklyTotals, 0);
    const peakWeekIndex = weeklyTotals.indexOf(peakWeekTotal);
    const customerTotals = { GG: 0, BWS: 0 };
    const appTotals = { JDEdwards: 0, SalesForce: 0 };
    const analystTotals = {};

    monthRecords.forEach(record => {
        const count = Number(record.count || 0);
        customerTotals[record.customer] = (customerTotals[record.customer] || 0) + count;
        appTotals[record.app] = (appTotals[record.app] || 0) + count;
        analystTotals[record.analyst] = (analystTotals[record.analyst] || 0) + count;
    });

    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    setText('kpiTotalTickets', totalTickets);
    setText('kpiActiveAnalysts', `${activeAnalysts.size} / ${allAnalysts.length}`);
    setText('kpiAverageTickets', activeAnalysts.size ? (totalTickets / activeAnalysts.size).toFixed(1) : '0');
    setText('kpiPeakWeek', peakWeekTotal ? `${weekLabels[peakWeekIndex]} · ${peakWeekTotal}` : 'No tickets');
    setText('kpiMonthLabel', formatMonthDisplay(currentMonth));
    setText('kpiCustomerTotal', `${customerTotals.GG} GG · ${customerTotals.BWS} BWS`);
    setText('kpiApplicationTotal', `${appTotals.JDEdwards} JD Edwards · ${appTotals.SalesForce} Salesforce`);

    const weeklyBars = document.getElementById('kpiWeeklyBars');
    if (weeklyBars) {
        weeklyBars.innerHTML = '';
        weeklyTotals.forEach((total, index) => {
            const barHeight = peakWeekTotal ? Math.max((total / peakWeekTotal) * 100, total ? 8 : 2) : 2;
            const item = document.createElement('div');
            item.className = 'kpi-week-bar';
            item.innerHTML = `<div class="kpi-bar-value">${total}</div><div class="kpi-bar-track"><div class="kpi-bar-fill" style="height: ${barHeight}%"></div></div><div class="kpi-bar-label">${weekLabels[index]}</div>`;
            weeklyBars.appendChild(item);
        });
    }

    const leaderboard = document.getElementById('kpiLeaderboard');
    if (leaderboard) {
        leaderboard.innerHTML = '';
        const sortedAnalysts = Object.entries(analystTotals).sort(([, first], [, second]) => second - first);
        if (sortedAnalysts.length === 0) {
            leaderboard.innerHTML = '<p class="text-sm text-stone-400 py-4">No ticket activity for this month.</p>';
        } else {
            sortedAnalysts.forEach(([analyst, total], index) => {
                const row = document.createElement('div');
                row.className = 'kpi-leader-row';
                row.innerHTML = `<span class="kpi-rank">${index + 1}</span><span class="kpi-analyst">${analyst}</span><span class="kpi-leader-total">${total}</span>`;
                leaderboard.appendChild(row);
            });
        }
    }
}

function rebuildMonthSelector() {
    const selector = document.getElementById('monthSelector');
    if (!selector) return;
    selector.innerHTML = '';
    monthsList.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = formatMonthDisplay(m);
        if (currentMonth === m) opt.selected = true;
        selector.appendChild(opt);
    });
}

// Legacy HTML report builder retained for backwards compatibility.
function generateLegacyHTMLReport(reportType, weekIndex = null) {
    const loadingDiv = document.getElementById('exportLoading');
    loadingDiv.style.display = 'flex';
    
    try {
        const monthDisplay = formatMonthDisplay(currentMonth);
        
        const getWeekData = (app, analyst, week) => {
            const gg = getCount(currentMonth, app, analyst, week, 'GG');
            const bws = getCount(currentMonth, app, analyst, week, 'BWS');
            return { gg, bws, total: gg + bws };
        };

        let reportTitle = (reportType === 'month') ? `Full Month Report - ${monthDisplay}` : `${weekLabels[weekIndex]} Report - ${monthDisplay}`;
        
        let htmlContent = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>BrickWorks IT - ${reportTitle}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;400;500;600;700&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
            <style>
                * { font-family: 'Inter', sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
                body { background: #f8f7f4; padding: 40px 20px; }
                .report-container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 28px; box-shadow: 0 20px 35px -12px rgba(0,0,0,0.1); overflow: hidden; }
                .header { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 30px; text-align: center; border-bottom: 3px solid #b4533b; position: relative; }
                .header h1 { font-size: 28px; font-weight: 800; color: #292524; margin-bottom: 8px; }
                .header p { color: #78350f; font-weight: 500; }
                .content { padding: 30px; }
                .section-title { font-size: 22px; font-weight: 700; margin: 30px 0 15px 0; color: #1c1917; border-left: 6px solid #b4533b; padding-left: 15px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                th { background: #f5f5f4; padding: 12px; border: 1px solid #d6d3d1; text-align: center; font-weight: 700; }
                td { padding: 10px; border: 1px solid #e7e5e4; text-align: center; }
                .footer { background: #fafaf9; padding: 16px; text-align: center; font-size: 12px; color: #78716c; border-top: 1px solid #e7e5e4; }
                .badge { background: #fef3c7; display: inline-block; padding: 4px 12px; border-radius: 40px; font-size: 13px; font-weight: 600; margin-top: 8px; }
                .total-row { background: #fffbeb; font-weight: 700; }
                .pdf-btn-container { text-align: right; margin-bottom: 20px; }
                .pdf-btn { background: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; }
                .pdf-btn:hover { background: #b91c1c; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                @media print { .pdf-btn-container, .pdf-btn, .no-print { display: none !important; } }
            </style>
        </head>
        <body>
        <div class="report-container" id="reportContainer">
            <div class="header">
                <div class="pdf-btn-container no-print">
                    <button class="pdf-btn" onclick="saveAsPDF()"><i class="fa-solid fa-file-pdf"></i> Save as PDF</button>
                </div>
                <h1><i class="fa-solid fa-bricks"></i> BrickWorks IT Operations</h1>
                <p>Application Team • ${reportType === 'month' ? 'Monthly Ticket Metrics' : weekLabels[weekIndex] + ' Detailed Report'}</p>
                <div class="badge">${monthDisplay} ${reportType !== 'month' ? `• ${weekLabels[weekIndex]}` : ''}</div>
                <div style="margin-top: 10px; font-size: 11px; color: #78716c;">Generated: ${new Date().toLocaleString()}</div>
            </div>
            <div class="content" id="reportContent">`;

        if (reportType === 'month') {
            for (let app of ['JDEdwards', 'SalesForce']) {
                const appTitle = (app === 'JDEdwards') ? 'JD Edwards' : 'SalesForce';
                const analysts = getAnalystsForApp(app);
                htmlContent += `<h2 class="section-title"><i class="fa-solid fa-chart-simple"></i> ${appTitle} Tickets</h2>
                <table>
                    <thead><tr><th>Analyst</th><th>Week 1 (GG/BWS)</th><th>Week 2 (GG/BWS)</th><th>Week 3 (GG/BWS)</th><th>Week 4 (GG/BWS)</th><th>Total</th></tr></thead>
                    <tbody>`;
                let appTotal = 0;
                for (let analyst of analysts) {
                    let analystTotal = 0;
                    htmlContent += `<tr>`;
                    htmlContent += `<td style="font-weight:600; text-align:left;">${analyst}</td>`;
                    for (let w = 0; w < 4; w++) {
                        const { gg, bws, total } = getWeekData(app, analyst, w);
                        analystTotal += total;
                        htmlContent += `<td style="text-align:center;">GG: ${gg}<br>BWS: ${bws}</td>`;
                    }
                    htmlContent += `<td style="font-weight:bold; text-align:center;">${analystTotal}</td>`;
                    htmlContent += `</tr>`;
                    appTotal += analystTotal;
                }
                htmlContent += `<tr class="total-row"><td colspan="4" style="text-align:right;"><strong>Month Total Tickets</strong></td><td colspan="2" style="text-align:center;"><strong>${appTotal}</strong></td></tr>`;
                htmlContent += `</tbody></table>`;
            }
        } else {
            for (let app of ['JDEdwards', 'SalesForce']) {
                const appTitle = (app === 'JDEdwards') ? 'JD Edwards' : 'SalesForce';
                const analysts = getAnalystsForApp(app);
                htmlContent += `<h2 class="section-title"><i class="fa-regular fa-calendar-week"></i> ${appTitle} - ${weekLabels[weekIndex]}</h2>
                <table>
                    <thead><tr><th>Analyst</th><th>GG Tickets</th><th>BWS Tickets</th><th>Week Total</th></tr></thead>
                    <tbody>`;
                let weekGG = 0, weekBWS = 0;
                for (let analyst of analysts) {
                    const { gg, bws, total } = getWeekData(app, analyst, weekIndex);
                    weekGG += gg;
                    weekBWS += bws;
                    htmlContent += `<tr>
                        <td style="font-weight:600; text-align:left;">${analyst}</td>
                        <td style="text-align:center;">${gg}</td>
                        <td style="text-align:center;">${bws}</td>
                        <td style="font-weight:bold; text-align:center;">${total}</td>
                    </tr>`;
                }
                htmlContent += `<tr class="total-row"><td style="text-align:right;"><strong>${weekLabels[weekIndex]} Totals</strong></td>
                    <td style="text-align:center;"><strong>${weekGG}</strong></td>
                    <td style="text-align:center;"><strong>${weekBWS}</strong></td>
                    <td style="text-align:center;"><strong>${weekGG + weekBWS}</strong></td>
                </tr>`;
                htmlContent += `</tbody></table>`;
            }
        }
        
        htmlContent += `</div>
            <div class="footer">
                <p>BrickWorks Manufacturing | IT Operations Report</p>
                <p>Data reflects tickets submitted by Glen-Gery (GG) and Brickworks Supply (BWS)</p>
            </div>
        </div>
        <script>
            function saveAsPDF() {
                const btnContainer = document.querySelector('.pdf-btn-container');
                const originalDisplay = btnContainer.style.display;
                btnContainer.style.display = 'none';
                const element = document.getElementById('reportContainer');
                const opt = {
                    margin: [0.5, 0.5, 0.5, 0.5],
                    filename: 'BrickWorks_IT_${reportType === 'month' ? `FullMonth_${currentMonth}` : `Week${weekIndex + 1}_${currentMonth}`}.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, letterRendering: true },
                    jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
                };
                html2pdf().set(opt).from(element).save().then(() => {
                    btnContainer.style.display = originalDisplay;
                }).catch(() => {
                    btnContainer.style.display = originalDisplay;
                });
            }
        <\/script>
        </body>
        </html>`;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const link = document.createElement('a');
        const fileName = `BrickWorks_IT_${reportType === 'month' ? `FullMonth_${currentMonth}` : `Week${weekIndex + 1}_${currentMonth}`}.html`;
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
    } catch (err) {
        console.error(err);
        alert("Error generating report.");
    } finally {
        loadingDiv.style.display = 'none';
    }
}

function generateExcelReport(reportType, weekIndex = null) {
    const loadingDiv = document.getElementById('exportLoading');
    loadingDiv.style.display = 'flex';

    try {
        if (typeof XLSX === 'undefined') {
            throw new Error('Excel export library is unavailable.');
        }

        const monthDisplay = formatMonthDisplay(currentMonth);
        const workbook = XLSX.utils.book_new();
        const getWeekData = (app, analyst, week) => ({
            gg: getCount(currentMonth, app, analyst, week, 'GG'),
            bws: getCount(currentMonth, app, analyst, week, 'BWS')
        });

        for (const app of ['JDEdwards', 'SalesForce']) {
            const appTitle = app === 'JDEdwards' ? 'JD Edwards' : 'SalesForce';
            const rows = [
                ['BrickWorks IT Operations'],
                [reportType === 'month' ? 'Full Month Ticket Metrics' : `${weekLabels[weekIndex]} Ticket Metrics`],
                ['Month', monthDisplay],
                ['Generated', new Date().toLocaleString()],
                []
            ];

            if (reportType === 'month') {
                rows.push(['Analyst', 'Week 1 (GG)', 'Week 1 (BWS)', 'Week 2 (GG)', 'Week 2 (BWS)', 'Week 3 (GG)', 'Week 3 (BWS)', 'Week 4 (GG)', 'Week 4 (BWS)', 'Total']);
                let appTotal = 0;
                for (const analyst of getAnalystsForApp(app)) {
                    const row = [analyst];
                    let analystTotal = 0;
                    for (let week = 0; week < 4; week++) {
                        const { gg, bws } = getWeekData(app, analyst, week);
                        row.push(gg, bws);
                        analystTotal += gg + bws;
                    }
                    row.push(analystTotal);
                    appTotal += analystTotal;
                    rows.push(row);
                }
                rows.push(['Month Total Tickets', '', '', '', '', '', '', '', '', appTotal]);
            } else {
                rows.push(['Analyst', 'GG Tickets', 'BWS Tickets', 'Week Total']);
                let weekGG = 0;
                let weekBWS = 0;
                for (const analyst of getAnalystsForApp(app)) {
                    const { gg, bws } = getWeekData(app, analyst, weekIndex);
                    rows.push([analyst, gg, bws, gg + bws]);
                    weekGG += gg;
                    weekBWS += bws;
                }
                rows.push([`${weekLabels[weekIndex]} Totals`, weekGG, weekBWS, weekGG + weekBWS]);
            }

            const sheet = XLSX.utils.aoa_to_sheet(rows);
            sheet['!cols'] = reportType === 'month'
                ? [{ wch: 24 }, ...Array(8).fill({ wch: 13 }), { wch: 12 }]
                : [{ wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
            XLSX.utils.book_append_sheet(workbook, sheet, appTitle);
        }

        const fileName = `BrickWorks_IT_${reportType === 'month' ? `FullMonth_${currentMonth}` : `Week${weekIndex + 1}_${currentMonth}`}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    } catch (error) {
        console.error(error);
        alert('Error generating Excel report.');
    } finally {
        loadingDiv.style.display = 'none';
    }
}

function showUnifiedReportModal() {
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `<div class="edit-modal-content" style="max-width:450px;">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-stone-800"><i class="fa-solid fa-chart-line"></i> Generate Report</h3>
            <button class="text-stone-400 hover:text-stone-600 closeReportModal"><i class="fa-solid fa-times"></i></button>
        </div>
        <p class="text-stone-600 mb-5 text-sm">Select report scope for <strong>${formatMonthDisplay(currentMonth)}</strong></p>
        <div class="grid grid-cols-2 gap-3 mb-5">
            <button data-type="week" data-week="0" class="report-option bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl py-3 font-semibold transition"><i class="fa-solid fa-file-excel text-emerald-700"></i> Week 1</button>
            <button data-type="week" data-week="1" class="report-option bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl py-3 font-semibold transition"><i class="fa-solid fa-file-excel text-emerald-700"></i> Week 2</button>
            <button data-type="week" data-week="2" class="report-option bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl py-3 font-semibold transition"><i class="fa-solid fa-file-excel text-emerald-700"></i> Week 3</button>
            <button data-type="week" data-week="3" class="report-option bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl py-3 font-semibold transition"><i class="fa-solid fa-file-excel text-emerald-700"></i> Week 4</button>
            <button data-type="month" class="report-option col-span-2 bg-purple-100 hover:bg-purple-200 border border-purple-300 rounded-xl py-3 font-semibold transition"><i class="fa-regular fa-calendar-alt"></i> Full Month Report (All Weeks)</button>
        </div>
        <button id="cancelReportModal" class="w-full mt-2 bg-stone-300 hover:bg-stone-400 text-stone-700 font-medium py-2 rounded-xl transition">Cancel</button>
    </div>`;
    
    document.body.appendChild(modal);
    const closeModal = () => modal.remove();
    modal.querySelector('.closeReportModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelReportModal')?.addEventListener('click', closeModal);
    
    modal.querySelectorAll('.report-option').forEach(btn => {
        btn.addEventListener('click', async () => {
            const type = btn.getAttribute('data-type');
            if (type === 'month') {
                generateExcelReport('month');
            } else if (type === 'week') {
                const week = parseInt(btn.getAttribute('data-week'));
                generateExcelReport('week', week);
            }
            closeModal();
        });
    });
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}
//test deploy
function addAnalyst() {
    const nameInput = document.getElementById('newAnalystName');
    let name = nameInput.value.trim();
    if (name === "") { alert("Please enter analyst name"); return; }
    
    const jdeChecked = document.getElementById('analystJDE').checked;
    const sfChecked = document.getElementById('analystSF').checked;
    
    if (!jdeChecked && !sfChecked) {
        alert("Please select at least one application (JD Edwards or Salesforce) for this analyst.");
        return;
    }
    
    let added = false;
    if (jdeChecked) {
        if (!globalAnalysts.JDEdwards.includes(name)) {
            globalAnalysts.JDEdwards.push(name);
            globalAnalysts.JDEdwards.sort();
            added = true;
        } else {
            alert(`Analyst "${name}" already exists in JD Edwards`);
        }
    }
    if (sfChecked) {
        if (!globalAnalysts.SalesForce.includes(name)) {
            globalAnalysts.SalesForce.push(name);
            globalAnalysts.SalesForce.sort();
            added = true;
        } else if (!jdeChecked) {
            alert(`Analyst "${name}" already exists in Salesforce`);
        }
    }
    
    if (added) {
        nameInput.value = "";
        // Uncheck checkboxes
        document.getElementById('analystJDE').checked = false;
        document.getElementById('analystSF').checked = false;
        saveData();
        renderTables();
    } else {
        alert("Analyst already exists in selected application(s).");
    }
}

function handleRemoveAnalyst() {
    const select = document.getElementById('removeAnalystSelect');
    const analystName = select.value;
    if (!analystName) { alert("Please select an analyst to remove"); return; }
    
    const appSelect = document.getElementById('removeAppSelect');
    const app = appSelect.value;
    
    let message = "";
    if (app === 'both') {
        message = `Are you sure you want to remove analyst "${analystName}" from BOTH applications and delete ALL their tickets?`;
    } else if (app === 'JDEdwards') {
        message = `Are you sure you want to remove analyst "${analystName}" from JD Edwards only? Their Salesforce data will remain.`;
    } else {
        message = `Are you sure you want to remove analyst "${analystName}" from Salesforce only? Their JD Edwards data will remain.`;
    }
    
    if (confirm(message)) {
        removeAnalystCompletely(analystName, app);
        if (app === 'both') {
            alert(`Analyst "${analystName}" removed completely.`);
        } else {
            alert(`Analyst "${analystName}" removed from ${app === 'JDEdwards' ? 'JD Edwards' : 'SalesForce'}.`);
        }
    }
}

function addTickets() {
    const allAnalysts = getAllAnalysts();
    if (allAnalysts.length === 0) {
        alert("Please add at least one analyst first using 'Add Analyst'");
        return;
    }
    const analyst = document.getElementById('ticketAnalystSelect').value;
    if (!analyst || analyst === '-- No analysts, add first --') {
        alert("Select an analyst");
        return;
    }
    const app = document.getElementById('ticketAppSelect').value;
    
    // Check if analyst is assigned to this app
    if (!getAnalystsForApp(app).includes(analyst)) {
        alert(`${analyst} is not assigned to ${app === 'JDEdwards' ? 'JD Edwards' : 'SalesForce'}. Please add them to this application first.`);
        return;
    }
    
    const customer = document.getElementById('ticketCustomerSelect').value;
    const weekIndex = parseInt(document.getElementById('ticketWeekSelect').value);
    let qty = parseInt(document.getElementById('ticketQty').value);
    if (isNaN(qty) || qty < 1) qty = 1;

    const existingIdx = ticketRecords.findIndex(r => r.monthId === currentMonth && r.app === app && r.analyst === analyst && r.weekIndex === weekIndex && r.customer === customer);
    if (existingIdx !== -1) {
        ticketRecords[existingIdx].count += qty;
    } else {
        ticketRecords.push({ monthId: currentMonth, app, analyst, weekIndex, customer, count: qty });
    }
    ticketRecords = ticketRecords.filter(r => r.count > 0);
    saveData();
    renderTables();

    const btn = document.getElementById('addTicketsBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
    setTimeout(() => {
        btn.innerHTML = originalText;
    }, 1500);
}

function addNewMonth() {
    const newMonthVal = document.getElementById('newMonthInput').value;
    if (!newMonthVal) return;
    if (monthsList.includes(newMonthVal)) { alert("Month already exists"); return; }
    monthsList.push(newMonthVal);
    monthsList.sort();
    saveData();
    rebuildMonthSelector();
    alert(`Month ${formatMonthDisplay(newMonthVal)} added! Select it from dropdown and click "Switch" to view.`);
}

function handleRemoveMonth() {
    const selectedMonth = document.getElementById('monthSelector').value;
    if (!selectedMonth) { alert("No month selected"); return; }
    if (confirm(`Are you sure you want to remove ${formatMonthDisplay(selectedMonth)} and ALL its tickets? This cannot be undone.`)) {
        removeMonth(selectedMonth);
        rebuildMonthSelector();
    }
}

function changeMonth() {
    const select = document.getElementById('monthSelector');
    if (select.value) {
        currentMonth = select.value;
        saveData();
        renderTables();
        rebuildMonthSelector();
        updateMonthIndicators();
    }
}

function initEventListeners() {
    const listeners = [
        ['addAnalystBtn', 'click', addAnalyst],
        ['removeAnalystBtn', 'click', handleRemoveAnalyst],
        ['addTicketsBtn', 'click', addTickets],
        ['addMonthBtn', 'click', addNewMonth],
        ['removeMonthBtn', 'click', handleRemoveMonth],
        ['changeMonthBtn', 'click', changeMonth],
        ['unifiedReportBtn', 'click', showUnifiedReportModal]
    ];

    listeners.forEach(([id, event, handler]) => {
        document.getElementById(id)?.addEventListener(event, handler);
    });
}

let dashboardInitialized = false;

async function initDashboard() {
    if (dashboardInitialized) return;

    dashboardInitialized = true;
    await loadData();
    initEventListeners();
    rebuildMonthSelector();
    renderTables();
    updateAnalystDropdowns();
    updateMonthIndicators();
}

function init() {
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    if (!isAuthenticated()) {
        showLoginScreen(true);
        return;
    }

    showLoginScreen(false);
    initDashboard();
}

init();