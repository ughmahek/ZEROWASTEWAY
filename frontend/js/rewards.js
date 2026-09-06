const redeemButtons =
  document.querySelectorAll(".reward-list .btn");

redeemButtons.forEach(button => {

  button.addEventListener("click", () => {

    alert(
      "Reward redemption will be connected to your Green Points system."
    );

  });

});