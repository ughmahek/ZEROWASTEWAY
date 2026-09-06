document.addEventListener("DOMContentLoaded", () => {

    const intro = document.getElementById("intro");
    const portal = document.getElementById("portal");

    /*
     * Intro duration
     *
     * The CSS handles the actual animation.
     * This simply removes the intro from the page
     * after the animation is complete.
     */

    setTimeout(() => {

        if (intro) {
            intro.style.display = "none";
        }

        if (portal) {
            portal.style.overflow = "visible";
        }

        document.body.style.overflowY = "auto";

    }, 5300);


    /*
     * Small magnetic hover effect
     */

    const cards = document.querySelectorAll(".portal-card");

    cards.forEach(card => {

        card.addEventListener("mousemove", (event) => {

            const rect = card.getBoundingClientRect();

            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 30;
            const rotateY = (centerX - x) / 30;

            card.style.transform =
                `translateY(-10px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });


        card.addEventListener("mouseleave", () => {

            card.style.transform =
                "translateY(0) rotateX(0) rotateY(0)";
        });

    });

});