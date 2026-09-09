/* =========================
   TRASH TIPS
========================= */

const searchInput = document.getElementById("tipSearch");
const categoryButtons = document.querySelectorAll(".category");
const tipCards = document.querySelectorAll(".tip-card");


/* =========================
   CATEGORY FILTER
========================= */

categoryButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        categoryButtons.forEach(function(btn) {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        const selectedCategory =
            button.dataset.category;

        tipCards.forEach(function(card) {

            const cardCategory =
                card.dataset.category;

            if (
                selectedCategory === "all" ||
                cardCategory === selectedCategory
            ) {

                card.style.display = "block";

            } else {

                card.style.display = "none";

            }

        });

    });

});


/* =========================
   SEARCH
========================= */

searchInput.addEventListener("input", function() {

    const searchTerm =
        searchInput.value.toLowerCase().trim();

    tipCards.forEach(function(card) {

        const cardText =
            card.textContent.toLowerCase();

        if (cardText.includes(searchTerm)) {

            card.style.display = "block";

        } else {

            card.style.display = "none";

        }

    });

});


/* =========================
   SORTING GAME
========================= */

function checkAnswer(button, correct) {

    const message =
        document.getElementById("answerMessage");

    if (correct) {

        message.textContent =
            "✅ Correct! Banana peels are organic waste and can be composted.";

        message.style.color = "#2e9b62";

    } else {

        message.textContent =
            "❌ Not quite! Try thinking about what banana peels are made of.";

        message.style.color = "#d95c5c";

    }

}