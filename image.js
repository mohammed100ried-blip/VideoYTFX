/* =========================================================
   VideoYTFX - Image Studio
   image.js
   ========================================================= */

(() => {
    "use strict";

    const state = {
        image: null,
        fileName: "VideoYTFX-image",
        rotation: 0,
        scale: 1,
        filter: "none",
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        grayscale: 0
    };

    const canvas = document.getElementById("imageCanvas");
    const ctx = canvas ? canvas.getContext("2d") : null;

    const uploadInput =
        document.getElementById("imageInput") ||
        document.getElementById("uploadInput") ||
        document.querySelector('input[type="file"]');

    const uploadArea =
        document.getElementById("uploadArea") ||
        document.getElementById("dropZone");

    const preview =
        document.getElementById("imagePreview");

    const downloadButton =
        document.getElementById("downloadBtn") ||
        document.getElementById("downloadImage");

    const resetButton =
        document.getElementById("resetBtn") ||
        document.getElementById("resetImage");

    const rotateButton =
        document.getElementById("rotateBtn");

    const zoomInButton =
        document.getElementById("zoomInBtn");

    const zoomOutButton =
        document.getElementById("zoomOutBtn");


    /* =========================================================
       FIND ELEMENT
       ========================================================= */

    function find(selectorList) {
        for (const selector of selectorList) {
            const element = document.querySelector(selector);

            if (element) {
                return element;
            }
        }

        return null;
    }


    /* =========================================================
       IMAGE INPUT
       ========================================================= */

    function openFilePicker() {
        if (uploadInput) {
            uploadInput.click();
        }
    }


    if (uploadArea) {
        uploadArea.addEventListener("click", openFilePicker);

        uploadArea.addEventListener("dragover", event => {
            event.preventDefault();
            uploadArea.classList.add("dragging");
        });

        uploadArea.addEventListener("dragleave", () => {
            uploadArea.classList.remove("dragging");
        });

        uploadArea.addEventListener("drop", event => {
            event.preventDefault();

            uploadArea.classList.remove("dragging");

            const files = event.dataTransfer.files;

            if (files && files.length > 0) {
                loadImage(files[0]);
            }
        });
    }


    if (uploadInput) {
        uploadInput.addEventListener("change", event => {
            const file = event.target.files?.[0];

            if (file) {
                loadImage(file);
            }
        });
    }


    /* =========================================================
       LOAD IMAGE
       ========================================================= */

    function loadImage(file) {

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            showMessage(
                "Please select a valid image file."
            );
            return;
        }

        const maxSize =
            25 * 1024 * 1024;

        if (file.size > maxSize) {
            showMessage(
                "Image size must be smaller than 25 MB."
            );
            return;
        }

        const reader =
            new FileReader();

        reader.onload = event => {

            const image =
                new Image();

            image.onload = () => {

                state.image = image;

                state.fileName =
                    file.name
                        .replace(/\.[^/.]+$/, "")
                        .replace(/[^a-zA-Z0-9-_]/g, "-");

                resetSettings(false);

                setupCanvas();

                draw();

                updatePreview();

                showEditor();

            };

            image.onerror = () => {
                showMessage(
                    "Could not load this image."
                );
            };

            image.src =
                event.target.result;
        };

        reader.readAsDataURL(file);
    }


    /* =========================================================
       CANVAS
       ========================================================= */

    function setupCanvas() {

        if (!canvas || !state.image) {
            return;
        }

        const image =
            state.image;

        const maxWidth = 1600;
        const maxHeight = 1200;

        let width =
            image.naturalWidth;

        let height =
            image.naturalHeight;

        const ratio =
            Math.min(
                1,
                maxWidth / width,
                maxHeight / height
            );

        width =
            Math.round(width * ratio);

        height =
            Math.round(height * ratio);

        canvas.width =
            width;

        canvas.height =
            height;
    }


    /* =========================================================
       DRAW
       ========================================================= */

    function draw() {

        if (!canvas || !ctx || !state.image) {
            return;
        }

        const image =
            state.image;

        const width =
            canvas.width;

        const height =
            canvas.height;

        ctx.clearRect(
            0,
            0,
            width,
            height
        );

        ctx.save();

        ctx.translate(
            width / 2,
            height / 2
        );

        ctx.rotate(
            state.rotation *
            Math.PI / 180
        );

        ctx.scale(
            state.scale,
            state.scale
        );

        ctx.filter =
            createFilter();

        ctx.drawImage(
            image,
            -width / 2,
            -height / 2,
            width,
            height
        );

        ctx.restore();

        ctx.filter =
            "none";
    }


    /* =========================================================
       FILTER
       ========================================================= */

    function createFilter() {

        let filter = "";

        filter +=
            `brightness(${state.brightness}%) `;

        filter +=
            `contrast(${state.contrast}%) `;

        filter +=
            `saturate(${state.saturation}%) `;

        filter +=
            `blur(${state.blur}px) `;

        filter +=
            `grayscale(${state.grayscale}%) `;

        switch (state.filter) {

            case "vintage":
                filter +=
                    "sepia(35%) contrast(110%) saturate(85%)";
                break;

            case "warm":
                filter +=
                    "sepia(20%) saturate(125%)";
                break;

            case "cool":
                filter +=
                    "hue-rotate(12deg) saturate(110%)";
                break;

            case "dramatic":
                filter +=
                    "contrast(135%) saturate(105%)";
                break;

            case "mono":
                filter +=
                    "grayscale(100%) contrast(115%)";
                break;

            case "soft":
                filter +=
                    "brightness(105%) contrast(92%) saturate(90%)";
                break;
        }

        return filter;
    }


    /* =========================================================
       PREVIEW
       ========================================================= */

    function updatePreview() {

        if (!preview || !canvas) {
            return;
        }

        preview.src =
            canvas.toDataURL(
                "image/png"
            );

        preview.style.display =
            "block";
    }


    /* =========================================================
       SHOW EDITOR
       ========================================================= */

    function showEditor() {

        const editor =
            find([
                "#editor",
                ".editor",
                "#imageEditor",
                ".image-editor"
            ]);

        const upload =
            find([
                "#uploadArea",
                "#dropZone",
                ".upload-area",
                ".drop-zone"
            ]);

        if (editor) {
            editor.style.display =
                "block";
        }

        if (upload) {
            upload.classList.add(
                "has-image"
            );
        }
    }


    /* =========================================================
       BRIGHTNESS
       ========================================================= */

    const brightness =
        find([
            "#brightness",
            "#brightnessSlider"
        ]);

    if (brightness) {

        brightness.addEventListener(
            "input",
            () => {

                state.brightness =
                    Number(
                        brightness.value
                    );

                draw();
                updatePreview();
            }
        );
    }


    /* =========================================================
       CONTRAST
       ========================================================= */

    const contrast =
        find([
            "#contrast",
            "#contrastSlider"
        ]);

    if (contrast) {

        contrast.addEventListener(
            "input",
            () => {

                state.contrast =
                    Number(
                        contrast.value
                    );

                draw();
                updatePreview();
            }
        );
    }


    /* =========================================================
       SATURATION
       ========================================================= */

    const saturation =
        find([
            "#saturation",
            "#saturationSlider"
        ]);

    if (saturation) {

        saturation.addEventListener(
            "input",
            () => {

                state.saturation =
                    Number(
                        saturation.value
                    );

                draw();
                updatePreview();
            }
        );
    }


    /* =========================================================
       BLUR
       ========================================================= */

    const blur =
        find([
            "#blur",
            "#blurSlider"
        ]);

    if (blur) {

        blur.addEventListener(
            "input",
            () => {

                state.blur =
                    Number(
                        blur.value
                    );

                draw();
                updatePreview();
            }
        );
    }


    /* =========================================================
       FILTER BUTTONS
       ========================================================= */

    document
        .querySelectorAll(
            "[data-filter]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    state.filter =
                        button.dataset.filter;

                    document
                        .querySelectorAll(
                            "[data-filter]"
                        )
                        .forEach(item => {
                            item.classList.remove(
                                "active"
                            );
                        });

                    button.classList.add(
                        "active"
                    );

                    draw();
                    updatePreview();
                }
            );

        });


    /* =========================================================
       ROTATE
       ========================================================= */

    function rotateImage() {

        if (!state.image) {
            return;
        }

        state.rotation += 90;

        if (state.rotation >= 360) {
            state.rotation = 0;
        }

        draw();
        updatePreview();
    }


    if (rotateButton) {
        rotateButton.addEventListener(
            "click",
            rotateImage
        );
    }


    /* =========================================================
       ZOOM
       ========================================================= */

    function zoomIn() {

        if (!state.image) {
            return;
        }

        state.scale =
            Math.min(
                3,
                state.scale + .1
            );

        draw();
        updatePreview();
    }


    function zoomOut() {

        if (!state.image) {
            return;
        }

        state.scale =
            Math.max(
                .2,
                state.scale - .1
            );

        draw();
        updatePreview();
    }


    if (zoomInButton) {
        zoomInButton.addEventListener(
            "click",
            zoomIn
        );
    }


    if (zoomOutButton) {
        zoomOutButton.addEventListener(
            "click",
            zoomOut
        );
    }


    /* =========================================================
       DOWNLOAD
       ========================================================= */

    function downloadImage() {

        if (!state.image || !canvas) {
            showMessage(
                "Please upload an image first."
            );
            return;
        }

        const link =
            document.createElement("a");

        link.download =
            `${state.fileName}-VideoYTFX.png`;

        link.href =
            canvas.toDataURL(
                "image/png",
                1
            );

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();
    }


    if (downloadButton) {
        downloadButton.addEventListener(
            "click",
            downloadImage
        );
    }


    /* =========================================================
       RESET
       ========================================================= */

    function resetSettings(redraw = true) {

        state.rotation = 0;
        state.scale = 1;

        state.filter = "none";

        state.brightness = 100;
        state.contrast = 100;
        state.saturation = 100;
        state.blur = 0;
        state.grayscale = 0;


        setControlValue(
            ["#brightness", "#brightnessSlider"],
            100
        );

        setControlValue(
            ["#contrast", "#contrastSlider"],
            100
        );

        setControlValue(
            ["#saturation", "#saturationSlider"],
            100
        );

        setControlValue(
            ["#blur", "#blurSlider"],
            0
        );


        document
            .querySelectorAll(
                "[data-filter]"
            )
            .forEach(button => {

                button.classList.remove(
                    "active"
                );

                if (
                    button.dataset.filter ===
                    "none"
                ) {
                    button.classList.add(
                        "active"
                    );
                }

            });


        if (redraw) {

            draw();

            updatePreview();

        }
    }


    function setControlValue(
        selectors,
        value
    ) {

        const element =
            find(selectors);

        if (element) {
            element.value =
                value;
        }
    }


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            () => {

                resetSettings();

            }
        );

    }


    /* =========================================================
       KEYBOARD SHORTCUTS
       ========================================================= */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "s"
            ) {

                event.preventDefault();

                downloadImage();
            }


            if (
                event.key.toLowerCase() === "r"
            ) {

                rotateImage();
            }
        }
    );


    /* =========================================================
       MESSAGE
       ========================================================= */

    function showMessage(message) {

        let box =
            document.getElementById(
                "imageMessage"
            );

        if (!box) {

            box =
                document.createElement(
                    "div"
                );

            box.id =
                "imageMessage";

            box.style.position =
                "fixed";

            box.style.left =
                "50%";

            box.style.bottom =
                "25px";

            box.style.transform =
                "translateX(-50%)";

            box.style.padding =
                "12px 20px";

            box.style.borderRadius =
                "12px";

            box.style.background =
                "rgba(17,24,39,.95)";

            box.style.color =
                "#fff";

            box.style.border =
                "1px solid rgba(255,255,255,.1)";

            box.style.zIndex =
                "99999";

            box.style.fontFamily =
                "inherit";

            document.body.appendChild(
                box
            );
        }

        box.textContent =
            message;

        box.style.opacity =
            "1";

        clearTimeout(
            box._timer
        );

        box._timer =
            setTimeout(
                () => {
                    box.style.opacity =
                        "0";
                },
                3000
            );
    }


    /* =========================================================
       GLOBAL API
       ========================================================= */

    window.VideoYTFXImageStudio = {

        loadImage,

        downloadImage,

        reset: resetSettings,

        rotate: rotateImage,

        zoomIn,

        zoomOut,

        getState() {
            return {
                ...state
            };
        }

    };


    /* =========================================================
       START
       ========================================================= */

    if (preview) {
        preview.style.display =
            "none";
    }

})();
