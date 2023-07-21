function LyricsLayerGenerator(comp, compWidth, initialPosition, fontOptions, lines) {
    this.comp = comp;
    this.compWidth = compWidth;
    this.initialPosition = initialPosition;
    this.fontOptions = fontOptions;
    this.lines = lines;

    this.boxSize = [this.compWidth - this.initialPosition[0] * 2, this.fontOptions.leading * 8];
    this.gap = this.fontOptions.leading; // Gap between lines

    this.layerHeightsAccumulator = [0, 0];
    this.visibleLayerCount = [0, 0];

    this.progressWin = new Window("palette", "Creating Text Layers for " + this.comp.name, [150, 150, 600, 300]);
    this.progressWin.pnl = this.progressWin.add("panel", [10, 10, 440, 100], "Progress");
    this.progressWin.pnl.progBar = this.progressWin.pnl.add("progressbar", [20, 35, 410, 60], 0, this.lines);
    this.progressWin.pnl.progBarLabel = this.progressWin.pnl.add("statictext", [20, 20, 320, 35], "0/" + this.lines);

    this.progressWin.center();
    this.progressWin.show();
}

LyricsLayerGenerator.prototype.handleComplete = function () {
    this.progressWin.close();
    // this.comp.openInViewer();
};

LyricsLayerGenerator.prototype.increaseProgress = function () {
    this.progressWin.pnl.progBar.value++;
    this.progressWin.pnl.progBarLabel.text = this.progressWin.pnl.progBar.value + "/" + this.lines;
    this.progressWin.update();

    if (this.progressWin.pnl.progBar.value >= this.lines) {
        this.handleComplete();
    }
};

LyricsLayerGenerator.prototype.createIntervalLayer = function () {};

LyricsLayerGenerator.prototype.createTextLayer = function (index, text) {
    var textLayer = this.comp.layers.addBoxText(this.boxSize);
    var textProp = textLayer.property("Source Text");
    textProp.setValue(new TextDocument(text));
    var sourceText = textProp.value;

    sourceText.resetCharStyle();
    sourceText.resetParagraphStyle();
    for (var key in this.fontOptions) {
        try {
            sourceText[key] = this.fontOptions[key];
        } catch (e) {
            alert(e.message + " Key: " + key + " Line: " + e.line);
        }
    }
    textProp.setValue(sourceText);

    textLayer.name = "[" + index + "] " + text;
    textLayer.anchorPoint.setValue([-this.boxSize[0] / 2, -this.boxSize[1] / 2]);

    return textLayer;
};

LyricsLayerGenerator.prototype.addLayer = function (index, text) {
    var isInterval = text === "$I";
    if (text === "\\$I") text = "$I";

    if (isInterval) {
        var layer = this.createIntervalLayer(index, text);
    } else {
        var layer = this.createTextLayer(index, text);
    }

    this.layerHeightsAccumulator[index + 1] = this.layerHeightsAccumulator[index] + (isInterval ? 0 : layer.sourceRectAtTime(0, false).height);
    this.visibleLayerCount[index + 1] = this.visibleLayerCount[index] + (isInterval ? 0 : 1);
    this.increaseProgress();

    return layer;
};

function generateLyricsComposition(compName, lyrics, marginLR, displayPosFromTop, width, height, pixelAspect, duration, frameRate) {
    marginLR = marginLR || 100;
    displayPosFromTop = displayPosFromTop || 250;
    width = width || 800;
    height = height || 1080;
    pixelAspect = pixelAspect || 1;
    duration = duration || 240;
    frameRate = frameRate || 60;

    var FONT_OPTIONS = {
        fontSize: 60,
        font: "AppleSDGothicNeo-Bold",
        applyFill: true,
        fillColor: [1, 1, 1],
        applyStroke: false,
        justification: ParagraphJustification.LEFT_JUSTIFY,
    };
    FONT_OPTIONS["leading"] = FONT_OPTIONS.fontSize * 1.2;

    app.beginUndoGroup("Generate Lyrics Composition");
    var root = app.project.items.addFolder(compName);
    var masterComp = root.items.addComp(compName, width, height, pixelAspect, duration, frameRate);
    var lyricsComp = root.items.addComp("_" + compName + "_lyrics", width, height, pixelAspect, duration, frameRate);
    var backgroundComp = root.items.addComp("_" + compName + "_background", width, height, pixelAspect, duration, frameRate);
    masterComp.layers.add(backgroundComp);
    masterComp.layers.add(lyricsComp);

    textLayerGenerater = new LyricsLayerGenerator(lyricsComp, width, [marginLR, displayPosFromTop], FONT_OPTIONS, lyrics.length);
    for (var i = 1; i <= lyrics.length; i++) {
        textLayerGenerater.addLayer(i, lyrics[i - 1]);
    }
    var layerHeightsAccumulated = textLayerGenerater.layerHeightsAccumulator;
    var visibleLayerCount = textLayerGenerater.visibleLayerCount;

    var timingHandlerLayer = lyricsComp.layers.addNull(duration);
    timingHandlerLayer.name = "Timing Handler";

    var DEFAULT_LYRICS_DURATION = duration / (lyrics.length + 2);
    for (var i = 1; i <= lyrics.length + 1; i++) {
        timingHandlerLayer.marker.setValueAtTime(i * DEFAULT_LYRICS_DURATION, new MarkerValue(i === lyrics.length + 1 ? "End" : i));
    }

    try {
        applyEffects(lyricsComp, FONT_OPTIONS, [marginLR, displayPosFromTop], FONT_OPTIONS.fontSize, layerHeightsAccumulated, visibleLayerCount, DEFAULT_LYRICS_DURATION);
    } catch (e) {
        alert(e.message + " Line: " + e.line);
    }

    app.endUndoGroup();
}

$._ext = {
    generateLyricsComposition: generateLyricsComposition,
};
