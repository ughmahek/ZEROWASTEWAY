const reportForm =
  document.getElementById("trashReportForm");

if (reportForm) {

  reportForm.addEventListener("submit", (e) => {

    e.preventDefault();

    alert(
      "Your trash report has been submitted!"
    );

    reportForm.reset();

  });

}