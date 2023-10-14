function LyricsCompGenerator(style, lyrics) {
    this.style = style;
    this.lyrics = lyrics;

    this.layerHeightsAccumulatedAtIndex = [0, 0];
    this.visibleLayerCountAtIndex = [0, 0];
    this.invisibleLayerCountAtIndex = [0, 0];

    this.progressWin = new $._apmsl.ProgressWindow("Creating Lyrics Composition...", this.lyrics.length);
}

LyricsCompGenerator.prototype.createIntervalLayer = function () {};

LyricsCompGenerator.prototype.createTextLayer = function (comp, index, text) {
    var textLayer = comp.layers.addBoxText(this.style.lyricsStyle.boxSize);
    var textProp = textLayer.property("Source Text");
    textProp.setValue(new TextDocument(text));
    var sourceText = textProp.value;

    sourceText.resetCharStyle();
    sourceText.resetParagraphStyle();
    for (var key in this.style.fontStyle) {
        try {
            sourceText[key] = this.style.fontStyle[key];
        } catch (e) {
            alert(e.message + " Key: " + key + " Line: " + e.line);
        }
    }
    textProp.setValue(sourceText);

    textLayer.name = "[" + index + "] " + text;
    textLayer.anchorPoint.setValue([-this.style.lyricsStyle.boxSize[0] / 2, -this.style.lyricsStyle.boxSize[1] / 2]);

    return textLayer;
};

LyricsCompGenerator.prototype.addLayer = function (comp, index, text) {
    var isInterval = text === "$I";
    if (text === "\\$I") text = "$I";

    if (isInterval) {
        var layer = this.createTextLayer(comp, index, "[간주]");
        this.style.setIntervalLayerHeight(layer.sourceRectAtTime(0, false).height + this.style.lyricsStyle.gap);
        layer.enabled = false;
    } else {
        var layer = this.createTextLayer(comp, index, text);
    }

    this.layerHeightsAccumulatedAtIndex[index + 1] = this.layerHeightsAccumulatedAtIndex[index] + (isInterval ? this.style.lyricsStyle.intervalLayerHeight : layer.sourceRectAtTime(0, false).height);
    this.visibleLayerCountAtIndex[index + 1] = this.visibleLayerCountAtIndex[index] + (isInterval ? 0 : 1);
    this.invisibleLayerCountAtIndex[index + 1] = this.invisibleLayerCountAtIndex[index] + (isInterval ? 1 : 0);
    this.progressWin.updateProgress(index);

    return layer;
};

LyricsCompGenerator.prototype.generate = function (comp) {
    for (var i = 1; i <= this.lyrics.length; i++) {
        this.addLayer(comp, i, this.lyrics[i - 1]);
    }

    return {
        layerHeightsAccumulatedAtIndex: this.layerHeightsAccumulatedAtIndex,
        visibleLayerCountAtIndex: this.visibleLayerCountAtIndex,
        invisibleLayerCountAtIndex: this.invisibleLayerCountAtIndex,
    };
};

$._apmsl.LyricsCompGenerator = LyricsCompGenerator;
