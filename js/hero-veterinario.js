(function () {
    const hero = document.getElementById("hero-veterinario");
    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    hero.addEventListener("pointermove", function (evento) {
        const limites = hero.getBoundingClientRect();
        const x = (evento.clientX - limites.left) / limites.width - 0.5;
        const y = (evento.clientY - limites.top) / limites.height - 0.5;
        hero.style.setProperty("--fondo-x", `${x * 14}px`);
        hero.style.setProperty("--fondo-y", `${y * 10}px`);
    });

    hero.addEventListener("pointerleave", function () {
        hero.style.setProperty("--fondo-x", "0px");
        hero.style.setProperty("--fondo-y", "0px");
    });
})();
