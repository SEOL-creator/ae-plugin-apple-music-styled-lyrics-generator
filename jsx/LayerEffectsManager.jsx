function addProperty(layer, name) {
    var property = layer.property(name);
    if (property === null) {
        property = layer.addProperty(name);
    }
    return property;
}

function setOrAddKey(property, keyIndex, time, value, easeIn, easeOut) {
    if (property.numKeys > keyIndex) {
        property.setValueAtKey(keyIndex, value);
    } else {
        property.setValueAtTime(time, value);
    }
    property.setTemporalEaseAtKey(keyIndex, easeIn, easeOut);
}

function getDiff(index, markerI) {
    return markerI - index;
}

function getAbsDiff(index, markerI, max) {
    var diff = Math.abs(index - markerI);
    if (max && diff > max) return max;
    return diff;
}

function getGaussianBlurMultiplier(index, i) {
    return 0.1 * getAbsDiff(index, i, 3) + 0.05 * getAbsDiff(index, i, 1); // 0, 0.15, 0.25, 0.35
}

function applyLayerEffects(layer, timingLayer, index, layerCount, compWidth, fontOptions, gap, initialPosition, layerHeightsAccumulated, visibleLayerCount, DEFAULT_LYRICS_DURATION) {
    var ANIMATION_DURATION = 0.5;
    var ANIMATION_DELAY = 0.05;

    var EASE_IN = new KeyframeEase(0, 85);
    var EASE_OUT = new KeyframeEase(0, 30);

    var markers = timingLayer.marker;

    var effects = layer.property("ADBE Effect Parade");
    var transforms = layer.property("ADBE Transform Group");

    if (effects.property("ADBE Gaussian Blur 2") === null) {
        effects.addProperty("ADBE Gaussian Blur 2");
        effects.property("ADBE Gaussian Blur 2").property(3).setValue(false);
    }

    var expressionPosition = "";
    var gaussianBlurKeyIndex = 1;
    var expressionGaussianBlur = "";
    var opacityKeyIndex = 1;
    var expressionOpacity = "";
    var expressionScale = "";

    for (var i = 1; i <= markers.numKeys; i++) {
        // Position
        setOrAddKey(
            transforms.property("ADBE Position"),
            i * 2 - 1,
            DEFAULT_LYRICS_DURATION * i - ANIMATION_DURATION,
            [initialPosition[0], initialPosition[1] + layerHeightsAccumulated[index] + gap * visibleLayerCount[index] - layerHeightsAccumulated[i - 1] - gap * visibleLayerCount[i - 1]],
            [EASE_IN],
            [EASE_OUT]
        );
        setOrAddKey(
            transforms.property("ADBE Position"),
            i * 2,
            DEFAULT_LYRICS_DURATION * i,
            [initialPosition[0], initialPosition[1] + layerHeightsAccumulated[index] + gap * visibleLayerCount[index] - layerHeightsAccumulated[i] - gap * visibleLayerCount[i]],
            [EASE_IN],
            [EASE_OUT]
        );
        // prettier-ignore
        expressionPosition = expressionPosition +
        ((i === 1) ? "if" : "else if") +
        "(time<=thisComp.layer(\"Timing Handler\").marker.key("+i+").time-(" + (ANIMATION_DELAY * getDiff(index, i) + ANIMATION_DURATION) + ")){" +
        "transform.position=[" + initialPosition[0] + ",transform.position.valueAtTime(" + (DEFAULT_LYRICS_DURATION * i - ANIMATION_DURATION) + ")[1]];}" + //before nth animation
        "else if" +
        "(time<=thisComp.layer(\"Timing Handler\").marker.key("+i+").time-(" + (ANIMATION_DELAY * getDiff(index, i)) + ")){" +
        "transform.position=[" + initialPosition[0] + ",transform.position.valueAtTime(time-thisComp.layer(\"Timing Handler\").marker.key("+i+").time+" + (DEFAULT_LYRICS_DURATION * i + ANIMATION_DELAY * getDiff(index, i)) + ")[1]];}"; //during nth animation

        // // Gaussian Blur
        if (getAbsDiff(index, i) <= 3) {
            setOrAddKey(
                effects.property("ADBE Gaussian Blur 2").property(1),
                gaussianBlurKeyIndex++,
                DEFAULT_LYRICS_DURATION * i - ANIMATION_DURATION,
                fontOptions.fontSize * getGaussianBlurMultiplier(index, i - 1),
                [EASE_IN],
                [EASE_OUT]
            );
            setOrAddKey(
                effects.property("ADBE Gaussian Blur 2").property(1),
                gaussianBlurKeyIndex++,
                DEFAULT_LYRICS_DURATION * i,
                fontOptions.fontSize * getGaussianBlurMultiplier(index, i),
                [EASE_IN],
                [EASE_OUT]
            );
            // prettier-ignore
            expressionGaussianBlur = expressionGaussianBlur +
            ((gaussianBlurKeyIndex === 3) ? "if" : "else if") +
            "(time<=thisComp.layer(\"Timing Handler\").marker.key("+i+").time-(" + (ANIMATION_DELAY * getDiff(index, i) + ANIMATION_DURATION) + ")){" +
            "effect(1)(1).value=effect(1)(1).valueAtTime(" + (DEFAULT_LYRICS_DURATION * i - ANIMATION_DURATION) + ");}" + //before nth animation
            "else if" +
            "(time<=thisComp.layer(\"Timing Handler\").marker.key("+i+").time-(" + (ANIMATION_DELAY * getDiff(index, i)) + ")){" +
            "effect(1)(1).value=effect(1)(1).valueAtTime(time-thisComp.layer(\"Timing Handler\").marker.key("+i+").time+" + (DEFAULT_LYRICS_DURATION * i + ANIMATION_DELAY * getDiff(index, i)) + ");}"; //during nth animation
        }

        // Opacity
        if (getAbsDiff(index, i) <= 1) {
            setOrAddKey(transforms.property("ADBE Opacity"), opacityKeyIndex++, markers.keyTime(i) - ANIMATION_DURATION, 100 - 30 * getAbsDiff(index, i - 1, 1), [EASE_IN], [EASE_OUT]);
            setOrAddKey(transforms.property("ADBE Opacity"), opacityKeyIndex++, markers.keyTime(i), 100 - 30 * getAbsDiff(index, i, 1), [EASE_IN], [EASE_OUT]);
            // prettier-ignore
            expressionOpacity = expressionOpacity +
            ((opacityKeyIndex === 3) ? "if" : "else if") +
            "(time<=thisComp.layer(\"Timing Handler\").marker.key("+i+").time-(" + (ANIMATION_DELAY * getDiff(index, i) + ANIMATION_DURATION) + ")){" +
            "transform.opacity=transform.opacity.valueAtTime(" + (DEFAULT_LYRICS_DURATION * i - ANIMATION_DURATION) + ");}" + //before nth animation
            "else if" +
            "(time<=thisComp.layer(\"Timing Handler\").marker.key("+i+").time-(" + (ANIMATION_DELAY * getDiff(index, i)) + ")){" +
            "transform.opacity=transform.opacity.valueAtTime(time-thisComp.layer(\"Timing Handler\").marker.key("+i+").time+" + (DEFAULT_LYRICS_DURATION * i + ANIMATION_DELAY * getDiff(index, i)) + ");}"; //during nth animation
        }

        // Scale
        if (getDiff(index, i) === 0) {
            setOrAddKey(transforms.property("ADBE Scale"), 1, markers.keyTime(i) - ANIMATION_DURATION, [96, 96], [EASE_IN, EASE_IN, EASE_IN], [EASE_OUT, EASE_OUT, EASE_OUT]);
            setOrAddKey(transforms.property("ADBE Scale"), 2, markers.keyTime(i), [100, 100], [EASE_IN, EASE_IN, EASE_IN], [EASE_OUT, EASE_OUT, EASE_OUT]);
            // prettier-ignore
            expressionScale = expressionScale +
            "if" +
            "(time<=thisComp.layer(\"Timing Handler\").marker.key("+i+").time-(" + (ANIMATION_DELAY * getDiff(index, i) + ANIMATION_DURATION) + ")){" +
            "transform.scale=[96,96];}" + //before nth animation
            "else if" +
            "(time<=thisComp.layer(\"Timing Handler\").marker.key("+i+").time-(" + (ANIMATION_DELAY * getDiff(index, i)) + ")){" +
            "transform.scale=transform.scale.valueAtTime(time-thisComp.layer(\"Timing Handler\").marker.key("+i+").time+" + (DEFAULT_LYRICS_DURATION * i + ANIMATION_DELAY * getDiff(index, i)) + ");}"; //during nth animation
        }
        if (getDiff(index, i) === 1) {
            setOrAddKey(transforms.property("ADBE Scale"), 3, markers.keyTime(i) - ANIMATION_DURATION, [100, 100], [EASE_IN, EASE_IN, EASE_IN], [EASE_OUT, EASE_OUT, EASE_OUT]);
            setOrAddKey(transforms.property("ADBE Scale"), 4, markers.keyTime(i), [96, 96], [EASE_IN, EASE_IN, EASE_IN], [EASE_OUT, EASE_OUT, EASE_OUT]);
            // prettier-ignore
            expressionScale = expressionScale +
            "else if" +
            "(time<=thisComp.layer(\"Timing Handler\").marker.key("+i+").time-(" + (ANIMATION_DELAY * getDiff(index, i) + ANIMATION_DURATION) + ")){" +
            "transform.scale=[100,100];}" + //before nth animation
            "else if" +
            "(time<=thisComp.layer(\"Timing Handler\").marker.key("+i+").time-(" + (ANIMATION_DELAY * getDiff(index, i)) + ")){" +
            "transform.scale=transform.scale.valueAtTime(time-thisComp.layer(\"Timing Handler\").marker.key("+i+").time+" + (DEFAULT_LYRICS_DURATION * i + ANIMATION_DELAY * getDiff(index, i)) + ");}"; //during nth animation
        }
    }

    transforms.property("ADBE Position").expression =
        expressionPosition + "else{transform.position=[" + initialPosition[0] + ",transform.position.valueAtTime(" + DEFAULT_LYRICS_DURATION * markers.numKeys + ")[1]];}";
    effects.property("ADBE Gaussian Blur 2").property(1).expression =
        expressionGaussianBlur + "else{effect(1)(1).value=" + fontOptions.fontSize * getGaussianBlurMultiplier(index, markers.numKeys) + ";}";
    transforms.property("ADBE Opacity").expression = expressionOpacity + "else{transform.opacity=70;}";
    transforms.property("ADBE Scale").expression = expressionScale + "else{transform.scale=[96,96];}";
}

function validate(thisComp) {
    return true;
}

applyEffects = function (thisComp, fontOptions, initialPosition, gap, layerHeightsAccumulated, visibleLayerCount, DEFAULT_LYRICS_DURATION) {
    if (!validate()) {
        alert("This composition does not seem to be a valid APMS lyrics composition.");
    }

    var layers = thisComp.layers;
    var layerCount = layers.length;

    var progressWin = new Window("palette", "Applying Effects...", [150, 150, 600, 300]);
    progressWin.pnl = progressWin.add("panel", [10, 10, 440, 100], "Progress");
    progressWin.pnl.progBar = progressWin.pnl.add("progressbar", [20, 35, 410, 60], 0, layerCount);
    progressWin.pnl.progBarLabel = progressWin.pnl.add("statictext", [20, 20, 320, 35], "0/" + layerCount);
    progressWin.center();
    progressWin.show();

    var timingLayer = layers.byName("Timing Handler");

    var markers = timingLayer.marker;

    for (var i = layerCount; i > 1; i--) {
        applyLayerEffects(
            layers[i],
            timingLayer,
            layerCount - i + 1,
            layerCount - 1,
            thisComp.width,
            fontOptions,
            gap,
            initialPosition,
            layerHeightsAccumulated,
            visibleLayerCount,
            DEFAULT_LYRICS_DURATION
        );

        progressWin.pnl.progBar.value++;
        progressWin.pnl.progBarLabel.text = progressWin.pnl.progBar.value + "/" + layerCount;
        progressWin.update();
    }

    progressWin.close();
};
