document.addEventListener("DOMContentLoaded", async function () {

    async function loadComponent(elementId, file) {

        const container =
            document.getElementById(elementId);

        if (!container) {
            return;
        }

        try {

            const response =
                await fetch(file);

            if (!response.ok) {

                throw new Error(
                    `No se pudo cargar ${file}`
                );

            }

            const html =
                await response.text();

            container.innerHTML =
                html;

        } catch (error) {

            console.error(
                "Error cargando componente:",
                error
            );

        }

    }


    await Promise.all([

        loadComponent(
            "sidebar-container",
            "./admin-sidebar.html"
        ),

        loadComponent(
            "topbar-container",
            "./top-bar.html"
        )

    ]);


    document.dispatchEvent(
        new CustomEvent(
            "adminComponentsLoaded"
        )
    );

});