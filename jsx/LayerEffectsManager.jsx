$._apmsl.LayerEffectsManager = function (lyricsComp, style, layerInfo) {
    this.comp = lyricsComp;
    this.layers = lyricsComp.layers;
    this.layerCount = this.layers.length; // number of layers in the lyrics comp. Should be fixed to count only the lyrics layers
    this.timingLayer = this.layers.byName("Timing Markers");
    this.markerCount = this.timingLayer.marker.numKeys;

    this.style = style;
    this.layerHeightsAccumulatedAtIndex = layerInfo.layerHeightsAccumulatedAtIndex;
    this.visibleLayerCountAtIndex = layerInfo.visibleLayerCountAtIndex;
    this.invisibleLayerCountAtIndex = layerInfo.invisibleLayerCountAtIndex;

    this.numsVisibleLayers = [-4, 9]; // Cull layers that are not in this range

    this.DEFAULT_LYRICS_DURATION = this.style.compStyle.duration / (this.markerCount + 1);
    this.ANIMATION_DURATION = 0.5;
    this.ANIMATION_DELAY = 0.04;

    this.KEY_EASE_IN = new KeyframeEase(0, 85);
    this.KEY_EASE_OUT = new KeyframeEase(0, 30);
};

$._apmsl.LayerEffectsManager.prototype.getLyricLayer = function (index) {
    return this.layers[this.layerCount - (index - 1)];
};

$._apmsl.LayerEffectsManager.prototype.getLayerPosY = function (_, layerIndex, markerIndex) {
    var invisibleLayerSpacer = this.invisibleLayerCountAtIndex[layerIndex];

    if (markerIndex < layerIndex && this.invisibleLayerCountAtIndex[markerIndex] < this.invisibleLayerCountAtIndex[markerIndex + 1]) {
        invisibleLayerSpacer--;
    }

    return (
        this.style.lyricsStyle.displayPosTop +
        this.layerHeightsAccumulatedAtIndex[layerIndex] +
        this.style.lyricsStyle.gap * this.visibleLayerCountAtIndex[layerIndex] -
        invisibleLayerSpacer * this.style.lyricsStyle.intervalLayerHeight -
        this.layerHeightsAccumulatedAtIndex[markerIndex] -
        this.style.lyricsStyle.gap * this.visibleLayerCountAtIndex[markerIndex] +
        this.invisibleLayerCountAtIndex[markerIndex] * this.style.lyricsStyle.intervalLayerHeight
    );
};

$._apmsl.LayerEffectsManager.prototype.getDiff = function (layerIndex, markerIndex) {
    var diff = this.visibleLayerCountAtIndex[markerIndex] - this.visibleLayerCountAtIndex[layerIndex];
    if (this.invisibleLayerCountAtIndex[markerIndex] < this.invisibleLayerCountAtIndex[markerIndex + 1] && layerIndex > markerIndex) {
        // When invisible layer is focused,
        // the diff of the layers following the invisible layer should be -1. not zero.
        diff -= 1;
    }

    return diff;
};

$._apmsl.LayerEffectsManager.prototype.getGaussianBlurValue = function (diff, layerIndex, markerIndex) {
    var limitValue = function (num, max) {
        if (num > max) return max;
        return num;
    };

    return this.style.fontStyle.fontSize * (0.1 * limitValue(Math.abs(diff), 3) + 0.05 * limitValue(Math.abs(diff), 1)); // 0, 0.15, 0.25, 0.35
};

$._apmsl.LayerEffectsManager.prototype.updateLayer = function (layerIndex) {
    var layer = this.getLyricLayer(layerIndex);

    var effects = layer.property("ADBE Effect Parade");
    var transforms = layer.property("ADBE Transform Group");

    transforms.property("ADBE Position").dimensionsSeparated = true;
    transforms.property("ADBE Position_0").setValue(this.style.lyricsStyle.marginLR);
    var keyPosition = new $._apmsl.UseKey(
        transforms.property("ADBE Position_1"),
        this.getLayerPosY,
        this,
        function (value) {
            return "transform.yPosition=" + value + ";";
        },
        function (markerIndex, diff, DEFAULT_LYRICS_DURATION, ANIMATION_DELAY) {
            return (
                'transform.yPosition.valueAtTime(time-thisComp.layer("Timing Markers").marker.key(' + markerIndex + ").time+" + (DEFAULT_LYRICS_DURATION * markerIndex + ANIMATION_DELAY * diff) + ")"
            );
        },
        this.style.lyricsStyle.displayPosTop + this.layerHeightsAccumulatedAtIndex[layerIndex] + this.style.lyricsStyle.gap * this.visibleLayerCountAtIndex[layerIndex],
        [this.KEY_EASE_IN],
        [this.KEY_EASE_OUT],
        this.DEFAULT_LYRICS_DURATION,
        this.ANIMATION_DELAY,
        this.ANIMATION_DURATION
    );

    if (effects.property("ADBE Gaussian Blur 2") === null) {
        effects.addProperty("ADBE Gaussian Blur 2");
        effects.property("ADBE Gaussian Blur 2").property(3).setValue(false);
    }
    var keyGaussianBlur = new $._apmsl.UseKey(
        effects.property("ADBE Gaussian Blur 2").property(1),
        this.getGaussianBlurValue,
        this,
        function (value) {
            return "effect(1)(1).value=" + value + ";";
        },
        function (markerIndex, diff, DEFAULT_LYRICS_DURATION, ANIMATION_DELAY) {
            return 'effect(1)(1).valueAtTime(time-thisComp.layer("Timing Markers").marker.key(' + markerIndex + ").time+" + (DEFAULT_LYRICS_DURATION * markerIndex + ANIMATION_DELAY * diff) + ")";
        },
        this.getGaussianBlurValue(this.getDiff(layerIndex, 1), layerIndex, 1),
        [this.KEY_EASE_IN],
        [this.KEY_EASE_OUT],
        this.DEFAULT_LYRICS_DURATION,
        this.ANIMATION_DELAY,
        this.ANIMATION_DURATION
    );

    var OPACITY_NOT_FOCUSED = 70;
    var keyOpacity = new $._apmsl.UseKey(
        transforms.property("ADBE Opacity"),
        function (diff, layerIndex, markerIndex) {
            return diff === 0 ? 100 : OPACITY_NOT_FOCUSED;
        },
        this,
        function (value) {
            return "transform.opacity=" + value + ";";
        },
        function (markerIndex, diff, DEFAULT_LYRICS_DURATION, ANIMATION_DELAY) {
            return 'transform.opacity.valueAtTime(time-thisComp.layer("Timing Markers").marker.key(' + markerIndex + ").time+" + (DEFAULT_LYRICS_DURATION * markerIndex + ANIMATION_DELAY * diff) + ")";
        },
        OPACITY_NOT_FOCUSED,
        [this.KEY_EASE_IN],
        [this.KEY_EASE_OUT],
        this.DEFAULT_LYRICS_DURATION,
        this.ANIMATION_DELAY,
        this.ANIMATION_DURATION
    );

    var keyScale = new $._apmsl.UseKey(
        transforms.property("ADBE Scale"),
        function (diff, layerIndex, markerIndex) {
            return diff === 0 ? [100, 100] : [96, 96];
        },
        this,
        function (value) {
            if (typeof value === "object") return "transform.scale=[" + value[0] + "," + value[1] + "];";
            return "transform.scale=" + value + ";";
        },
        function (markerIndex, diff, DEFAULT_LYRICS_DURATION, ANIMATION_DELAY) {
            return 'transform.scale.valueAtTime(time-thisComp.layer("Timing Markers").marker.key(' + markerIndex + ").time+" + (DEFAULT_LYRICS_DURATION * markerIndex + ANIMATION_DELAY * diff) + ")";
        },
        [96, 96],
        [this.KEY_EASE_IN, this.KEY_EASE_IN, this.KEY_EASE_IN],
        [this.KEY_EASE_OUT, this.KEY_EASE_OUT, this.KEY_EASE_OUT],
        this.DEFAULT_LYRICS_DURATION,
        this.ANIMATION_DELAY,
        this.ANIMATION_DURATION
    );

    for (var i = 1; i <= this.markerCount; i++) {
        // var diff = this.visibleLayerCountAtIndex[i] - this.visibleLayerCountAtIndex[layerIndex];
        // if (this.invisibleLayerCountAtIndex[i] < this.invisibleLayerCountAtIndex[i + 1] && layerIndex > i) {
        //     // When invisible layer is focused,
        //     // the diff of the layers following the invisible layer should be -1. not zero.
        //     diff -= 1;
        // }

        var diff = this.getDiff(layerIndex, i);

        try {
            // Position
            if (-diff <= this.numsVisibleLayers[1] && -diff >= this.numsVisibleLayers[0] && i !== this.markerCount) {
                // when last marker is focused (=song is end and no lyrics are highlighted), layers should keep their position.

                keyPosition.key(diff, layerIndex, i);
            }
        } catch (e) {
            alert(e.message + " Line: " + e.line + e.fileName);
            alert("Position\n" + "diff: " + diff + " layerIndex: " + layerIndex + " i: " + i);
        }
        try {
            // Gaussian Blur
            if (Math.abs(layerIndex - i) <= this.numsVisibleLayers[0] || Math.abs(layerIndex - i) <= this.numsVisibleLayers[1]) {
                keyGaussianBlur.key(diff, layerIndex, i);
            }
        } catch (e) {
            alert(e.message + " Line: " + e.line + e.fileName);
            alert("Gaussian Blur\n" + "diff: " + diff + " layerIndex: " + layerIndex + " i: " + i);
        }
        try {
            // Opacity
            if (Math.abs(layerIndex - i) <= 1) {
                keyOpacity.key(diff, layerIndex, i);
            }
        } catch (e) {
            alert(e.message + " Line: " + e.line + e.fileName);
            alert("Opacity\n" + "diff: " + diff + " layerIndex: " + layerIndex + " i: " + i);
        }
        try {
            // Scale
            if (Math.abs(layerIndex - i) <= 1) {
                keyScale.key(diff, layerIndex, i);
            }
        } catch (e) {
            alert(e.message + " Line: " + e.line + e.fileName);
            alert("Scale\n" + "diff: " + diff + " layerIndex: " + layerIndex + " i: " + i);
        }
    }

    transforms.property("ADBE Position_1").expression = keyPosition.getExpression(
        this.style.lyricsStyle.displayPosTop +
            this.layerHeightsAccumulatedAtIndex[layerIndex] +
            this.style.lyricsStyle.gap * this.visibleLayerCountAtIndex[layerIndex] -
            this.layerHeightsAccumulatedAtIndex[this.markerCount - 1] -
            this.style.lyricsStyle.gap * this.visibleLayerCountAtIndex[this.markerCount - 1]
    );
    effects.property("ADBE Gaussian Blur 2").property(1).expression = keyGaussianBlur.getExpression(
        this.getGaussianBlurValue(this.visibleLayerCountAtIndex[this.markerCount] - this.visibleLayerCountAtIndex[layerIndex], layerIndex, this.markerCount)
    );
    transforms.property("ADBE Opacity").expression = keyOpacity.getExpression(OPACITY_NOT_FOCUSED);
    transforms.property("ADBE Scale").expression = keyScale.getExpression("[96, 96]");
};

$._apmsl.LayerEffectsManager.prototype.applyAll = function () {
    try {
        var progressWin = new $._apmsl.ProgressWindow("Applying Effects...", this.layerCount);
        for (var i = 1; i < this.layerCount; i++) {
            this.updateLayer(i);
            progressWin.updateProgress(i);
        }
        progressWin.close(function () {
            this.comp.openInViewer();
        });
    } catch (e) {
        alert(e.message + " Line: " + e.line);
    }
};
