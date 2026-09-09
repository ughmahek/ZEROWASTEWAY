// =====================================================
// WASTE PARTNER DASHBOARD
// =====================================================

const API_URL = "http://127.0.0.1:5000/api/reports";
const BACKEND_URL = "http://127.0.0.1:5000";

// =====================================================
// GET LOGGED-IN PARTNER
// =====================================================

const currentUser = JSON.parse(
    localStorage.getItem("zeroWasteCurrentUser")
);

if (!currentUser) {

    alert("Please log in first.");

} else {

    console.log("Logged-in partner:", currentUser);

    loadPartnerDashboard();
}


// =====================================================
// LOAD EVERYTHING
// =====================================================

async function loadPartnerDashboard() {

    try {

        updatePartnerInfo();

        await loadPendingReports();
        await loadPartnerReports();

    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

    }

}


// =====================================================
// PARTNER INFORMATION
// =====================================================

function updatePartnerInfo() {

    const partnerName =
        document.getElementById("partnerName");

    const partnerEmail =
        document.getElementById("partnerEmail");

    if (partnerName) {

        partnerName.textContent =
            currentUser.name ||
            currentUser.username ||
            currentUser.email ||
            "Waste Partner";
    }

    if (partnerEmail) {

        partnerEmail.textContent =
            currentUser.email || "";
    }

}


// =====================================================
// LOAD PENDING REPORTS
// =====================================================

async function loadPendingReports() {

    const container =
        document.getElementById(
            "reportsContainer"
        );

    if (!container) return;

    container.innerHTML =
        '<div class="loading">Loading reports...</div>';

    try {

        const response =
            await fetch(
                `${API_URL}/pending`
            );

        if (!response.ok) {

            throw new Error(
                "Failed to load pending reports"
            );

        }

        const reports =
            await response.json();

        console.log(
            "Pending reports:",
            reports
        );

        renderPendingReports(
            reports
        );

        const pendingCount =
            document.getElementById(
                "pendingCount"
            );

        if (pendingCount) {

            pendingCount.textContent =
                reports.length;

        }

    } catch (error) {

        console.error(
            "Pending reports error:",
            error
        );

        container.innerHTML = `
            <div class="error-state">
                Could not load reports.
                <button
                    class="retry-btn"
                    onclick="loadPendingReports()">
                    Retry
                </button>
            </div>
        `;
    }

}


// =====================================================
// RENDER PENDING REPORTS
// =====================================================

function renderPendingReports(reports) {

    const container =
        document.getElementById(
            "reportsContainer"
        );

    if (!reports.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size:40px;">🌱</div>
                <h3>No pending reports</h3>
                <p>There are currently no cleanup requests.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = "";

    reports.forEach(
        report => {

            container.appendChild(
                createReportCard(
                    report,
                    "pending"
                )
            );

        }
    );

}


// =====================================================
// LOAD REPORTS ACCEPTED BY THIS PARTNER
// =====================================================

async function loadPartnerReports() {

    const container =
        document.getElementById(
            "acceptedReportsContainer"
        );

    const completedContainer =
        document.getElementById(
            "completedReportsContainer"
        );

    if (!container) return;

    container.innerHTML =
        '<div class="loading">Loading accepted reports...</div>';

    try {

        const email =
            encodeURIComponent(
                currentUser.email
            );

        const response =
            await fetch(
                `${API_URL}/partner/${email}`
            );

        if (!response.ok) {

            throw new Error(
                "Failed to load partner reports"
            );

        }

        const reports =
            await response.json();

        console.log(
            "Partner reports:",
            reports
        );

        const accepted =
            reports.filter(
                report =>
                    report.status === "ACCEPTED"
            );

        const completed =
            reports.filter(
                report =>
                    report.status === "COMPLETED"
            );

        renderAcceptedReports(
            accepted
        );

        renderCompletedReports(
            completed
        );

        const acceptedCount =
            document.getElementById(
                "acceptedCount"
            );

        const completedCount =
            document.getElementById(
                "completedCount"
            );

        if (acceptedCount) {

            acceptedCount.textContent =
                accepted.length;

        }

        if (completedCount) {

            completedCount.textContent =
                completed.length;

        }

    } catch (error) {

        console.error(
            "Partner reports error:",
            error
        );

        container.innerHTML = `
            <div class="error-state">
                Could not load accepted reports.
            </div>
        `;

        if (completedContainer) {

            completedContainer.innerHTML = `
                <div class="error-state">
                    Could not load completed reports.
                </div>
            `;
        }

    }

}


// =====================================================
// RENDER ACCEPTED REPORTS
// =====================================================

function renderAcceptedReports(reports) {

    const container =
        document.getElementById(
            "acceptedReportsContainer"
        );

    if (!container) return;

    if (!reports.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size:40px;">🧹</div>
                <h3>No accepted reports</h3>
                <p>Reports you accept will appear here.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = "";

    reports.forEach(
        report => {

            container.appendChild(
                createReportCard(
                    report,
                    "accepted"
                )
            );

        }
    );

}


// =====================================================
// RENDER COMPLETED REPORTS
// =====================================================

function renderCompletedReports(reports) {

    const container =
        document.getElementById(
            "completedReportsContainer"
        );

    if (!container) return;

    if (!reports.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size:40px;">✅</div>
                <h3>No completed reports yet</h3>
                <p>Your completed cleanup work will appear here.</p>
            </div>
        `;

        return;
    }

    container.innerHTML = "";

    reports.forEach(
        report => {

            container.appendChild(
                createReportCard(
                    report,
                    "completed"
                )
            );

        }
    );

}


// =====================================================
// CREATE REPORT CARD
// =====================================================

function createReportCard(
    report,
    type
) {

    const card =
        document.createElement("div");

    card.className =
        "report-card";

    const reportedDate =
        formatDate(report.reported_at);

    const completedDate =
        formatDate(report.completed_at);

    const beforeImage =
        `${BACKEND_URL}/uploads/${report.before_photo}`;

    let afterImage = "";

    if (report.after_photo) {

        afterImage =
            `${BACKEND_URL}/uploads/${report.after_photo}`;

    }

    // -------------------------------------------------
    // STATUS
    // -------------------------------------------------

    let statusClass =
        "status-pending";

    let statusText =
        "PENDING";

    if (report.status === "ACCEPTED") {

        statusClass =
            "status-accepted";

        statusText =
            "ACCEPTED";

    }

    if (report.status === "COMPLETED") {

        statusClass =
            "status-completed";

        statusText =
            "COMPLETED";

    }

    // -------------------------------------------------
    // ACTION
    // -------------------------------------------------

    let actionHTML = "";

    if (type === "pending") {

        actionHTML = `
            <button
                class="accept-btn"
                onclick="acceptReport(${report.id})">
                ✓ Accept Cleanup
            </button>
        `;

    }

    if (type === "accepted") {

        actionHTML = `
            <div class="proof-section">

                <label>
                    Upload cleanup proof
                </label>

                <input
                    type="file"
                    accept="image/*"
                    class="after-photo-input"
                    id="afterPhoto-${report.id}">

                <button
                    class="complete-btn"
                    onclick="completeReport(${report.id})">
                    ✓ Complete Cleanup
                </button>

            </div>
        `;

    }

    // -------------------------------------------------
    // AFTER PHOTO
    // -------------------------------------------------

    let afterPhotoHTML = "";

    if (type === "completed" && afterImage) {

        afterPhotoHTML = `
            <div class="photo-column">

                <span class="photo-label">
                    AFTER CLEANUP
                </span>

                <img
                    src="${afterImage}"
                    class="report-photo"
                    alt="After cleanup">

            </div>
        `;

    }

    // -------------------------------------------------
    // CARD
    // -------------------------------------------------

    card.innerHTML = `

        <div class="report-card-header">

            <div>

                <span class="report-number">
                    REPORT #${report.id}
                </span>

                <span class="status ${statusClass}">
                    ${statusText}
                </span>

            </div>

            <span class="reported-time">
                Reported ${reportedDate}
            </span>

        </div>


        <div class="report-content">

            <div class="photo-container">

                <div class="photo-comparison">

                    <div class="photo-column">

                        <span class="photo-label">
                            BEFORE CLEANUP
                        </span>

                        <img
                            src="${beforeImage}"
                            class="report-photo"
                            alt="Reported trash">

                    </div>

                    ${afterPhotoHTML}

                </div>

            </div>


            <div class="report-details">

                <div class="detail-item">

                    <span class="detail-label">
                        📍 LOCATION
                    </span>

                    <p>
                        ${escapeHTML(
                            report.location
                        )}
                    </p>

                </div>


                <div class="detail-item">

                    <span class="detail-label">
                        📝 DESCRIPTION
                    </span>

                    <p>
                        ${escapeHTML(
                            report.description
                        )}
                    </p>

                </div>


                <div class="detail-item">

                    <span class="detail-label">
                        👤 REPORTED BY
                    </span>

                    <p>
                        ${escapeHTML(
                            report.user_id
                        )}
                    </p>

                </div>


                ${
                    report.accepted_by
                    ?
                    `
                    <div class="detail-item">

                        <span class="detail-label">
                            🧹 ACCEPTED BY
                        </span>

                        <p>
                            ${escapeHTML(
                                report.accepted_by
                            )}
                        </p>

                    </div>
                    `
                    :
                    ""
                }


                ${
                    report.completed_at
                    ?
                    `
                    <div class="detail-item">

                        <span class="detail-label">
                            ✓ COMPLETED
                        </span>

                        <p>
                            ${completedDate}
                        </p>

                    </div>
                    `
                    :
                    ""
                }


                <div class="report-actions">

                    ${actionHTML}

                </div>

            </div>

        </div>
    `;

    return card;
}


// =====================================================
// ACCEPT REPORT
// =====================================================

async function acceptReport(reportId) {

    if (!currentUser) {

        alert(
            "Please log in first."
        );

        return;
    }

    const confirmed =
        confirm(
            "Accept this cleanup request?"
        );

    if (!confirmed) return;

    try {

        const response =
            await fetch(
                `${API_URL}/${reportId}/accept`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        accepted_by:
                            currentUser.email
                    })
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.error ||
                "Could not accept report."
            );

        }

        alert(
            "Cleanup request accepted!"
        );

        await loadPartnerDashboard();

    } catch (error) {

        console.error(
            "Accept error:",
            error
        );

        alert(
            error.message
        );

    }

}


// =====================================================
// COMPLETE REPORT
// =====================================================

async function completeReport(reportId) {

    const input =
        document.getElementById(
            `afterPhoto-${reportId}`
        );

    if (!input || !input.files.length) {

        alert(
            "Please upload an after-cleanup photo."
        );

        return;
    }

    const afterPhoto =
        input.files[0];

    const confirmed =
        confirm(
            "Mark this cleanup as completed?"
        );

    if (!confirmed) return;

    try {

        const formData =
            new FormData();

        formData.append(
            "after_photo",
            afterPhoto
        );

        const response =
            await fetch(
                `${API_URL}/${reportId}/complete`,
                {
                    method: "POST",
                    body: formData
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.error ||
                "Could not complete report."
            );

        }

        alert(
            "Cleanup completed successfully!"
        );

        await loadPartnerDashboard();

    } catch (error) {

        console.error(
            "Complete error:",
            error
        );

        alert(
            error.message
        );

    }

}


// =====================================================
// REFRESH BUTTON
// =====================================================

const refreshBtn =
    document.getElementById(
        "refreshBtn"
    );

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        function () {

            loadPartnerDashboard();

        }
    );

}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(dateString) {

    if (!dateString) {

        return "Not available";

    }

    const date =
        new Date(dateString);

    if (isNaN(date.getTime())) {

        return dateString;

    }

    return date.toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}