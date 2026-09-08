console.log("ZeroWasteWay Dashboard loaded.");

const REPORTS_API = "http://127.0.0.1:5000/api/reports";
const BACKEND_URL = "http://127.0.0.1:5000";

const currentUser = JSON.parse(
  localStorage.getItem("zeroWasteCurrentUser")
);

function formatDate(dateString) {
  if (!dateString) return "N/A";

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function getImageUrl(filename) {
  if (!filename) return null;
  return `${BACKEND_URL}/uploads/${filename}`;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadMyReports() {
  const container = document.getElementById("myReportsContainer");

  if (!container) return;

  if (!currentUser || !currentUser.email) {
    container.innerHTML = `
      <div class="no-reports">
        <h3>Please log in</h3>
        <p>Log in to view the trash reports you have submitted.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="loading-reports">
      <p>Loading your reports...</p>
    </div>
  `;

  try {
    const response = await fetch(
      `${REPORTS_API}/my/${encodeURIComponent(currentUser.email)}`
    );

    if (!response.ok) {
      throw new Error("Failed to load reports");
    }

    const reports = await response.json();

    if (!reports || reports.length === 0) {
      container.innerHTML = `
        <div class="no-reports">
          <h3>No reports yet</h3>
          <p>You haven't reported any waste problems yet.</p>
          <a href="report-trash.html" class="report-now-btn">
            Report Trash
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = reports
      .map(createReportCard)
      .join("");

  } catch (error) {
    console.error("Error loading reports:", error);

    container.innerHTML = `
      <div class="error-reports">
        <h3>Unable to load reports</h3>
        <p>Something went wrong while loading your reports.</p>
        <button
          class="refresh-reports-btn"
          onclick="loadMyReports()"
        >
          Try Again
        </button>
      </div>
    `;
  }
}

function createReportCard(report) {
  const beforeImage = getImageUrl(report.before_photo);
  const afterImage = getImageUrl(report.after_photo);

  let statusClass = "status-pending";
  let statusText = "PENDING";

  if (report.status === "ACCEPTED") {
    statusClass = "status-accepted";
    statusText = "ACCEPTED";
  }

  if (report.status === "COMPLETED") {
    statusClass = "status-completed";
    statusText = "COMPLETED";
  }

  return `
    <article class="my-report-card">

      <div class="report-header">
        <div>
          <h3>Report #${report.id}</h3>
          <p class="reported-date">
            Reported: ${formatDate(report.reported_at)}
          </p>
        </div>

        <span class="report-status ${statusClass}">
          ${statusText}
        </span>
      </div>

      <div class="report-details">

        <div class="report-info">

          <p>
            <strong>Location:</strong><br>
            ${escapeHtml(report.location)}
          </p>

          <p>
            <strong>Description:</strong><br>
            ${escapeHtml(report.description)}
          </p>

          ${
            report.accepted_by
              ? `
                <p>
                  <strong>Accepted by:</strong><br>
                  ${escapeHtml(report.accepted_by)}
                </p>
              `
              : ""
          }

        </div>

        <div class="report-before">
          <h4>Before Cleanup</h4>

          ${
            beforeImage
              ? `
                <img
                  src="${beforeImage}"
                  alt="Before cleanup"
                  class="report-image"
                >
              `
              : `
                <div class="no-image">No photo</div>
              `
          }
        </div>

      </div>

      ${
        report.status === "COMPLETED"
          ? `
            <div class="completion-section">

              <h4>After Cleanup</h4>

              ${
                afterImage
                  ? `
                    <img
                      src="${afterImage}"
                      alt="After cleanup"
                      class="report-image"
                    >
                  `
                  : `
                    <div class="no-image">
                      No completion photo
                    </div>
                  `
              }

              <p class="completed-date">
                <strong>Completed:</strong>
                ${formatDate(report.completed_at)}
              </p>

            </div>
          `
          : ""
      }

    </article>
  `;
}

document.addEventListener("DOMContentLoaded", function () {
  const userName = document.getElementById("userName");

  if (userName && currentUser && currentUser.fullname) {
    userName.textContent = currentUser.fullname;
  }

  loadMyReports();
});