const copyButtons = [...document.querySelectorAll("[data-copy-target]")];

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const targetId = button.dataset.copyTarget;
    const target = document.getElementById(targetId);

    if (!target) {
      return;
    }

    const text = target.textContent || "";

    try {
      await navigator.clipboard.writeText(text);
      const previous = button.textContent;
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = previous;
      }, 1400);
    } catch (error) {
      console.warn("Could not copy the code block.", error);
    }
  });
});
