$._apmsl.Style = function (compStyle, fontStyle, options) {
    this.compStyle = {
        width: (compStyle && compStyle.width) || 800,
        height: (compStyle && compStyle.height) || 1080,
        pixelAspect: (compStyle && compStyle.pixelAspect) || 1,
        duration: (compStyle && compStyle.duration) || 290,
        frameRate: (compStyle && compStyle.frameRate) || 60,
    };

    this.fontStyle = {
        fontSize: (fontStyle && fontStyle.fontSize) || 60,
        font: (fontStyle && fontStyle.font) || "AppleSDGothicNeo-Bold", // todo: get default font from api
        applyFill: (fontStyle && fontStyle.applyFill) === false ? false : true, // default: true
        fillColor: (fontStyle && fontStyle.fillColor) || [1, 1, 1],
        applyStroke: (fontStyle && fontStyle.applyStroke) === true ? true : false, // default: false
        justification: typeof (fontStyle && fontStyle.justification) === "number" ? fontStyle.justification : ParagraphJustification.LEFT_JUSTIFY, // default: left
        leading: null,
    };

    this.lyricsStyle = {
        displayPosTop: typeof (options && options.displayPosTop) === "number" ? options.displayPosTop : 250,
        marginLR: typeof (options && options.marginLR) === "number" ? options.marginLR : 100,
        boxSize: null,
        gap: null,
        intervalLayerHeight: 100,
    };

    this.setFontStyle();
    this.setLyricsStyle();
};

$._apmsl.Style.prototype.setCompStyle = function (newCompStyle) {
    if (newCompStyle === undefined) return;
    for (var key in newCompStyle) {
        this.compStyle[key] !== undefined && (this.compStyle[key] = newCompStyle[key]);
    }
};
$._apmsl.Style.prototype.setFontStyle = function (newFontStyle) {
    if (newFontStyle !== undefined) {
        for (var key in newFontStyle) {
            this.fontStyle[key] !== undefined && (this.fontStyle[key] = newFontStyle[key]);
        }
    }
    this.fontStyle.leading = this.fontStyle.fontSize * 1.2;
};
$._apmsl.Style.prototype.setLyricsStyle = function (newLyricsStyle) {
    if (newLyricsStyle !== undefined) {
        for (var key in newLyricsStyle) {
            this.lyricsStyle[key] !== undefined && (this.lyricsStyle[key] = newLyricsStyle[key]);
        }
    }
    this.lyricsStyle.boxSize = [this.compStyle.width - this.lyricsStyle.marginLR * 2, this.fontStyle.leading * 8];
    this.lyricsStyle.gap = this.fontStyle.fontSize;
};

$._apmsl.Style.prototype.setIntervalLayerHeight = function (intervalLayerHeight) {
    this.lyricsStyle.intervalLayerHeight = intervalLayerHeight;
};

$._apmsl.Style.prototype.updateFromComp = function (comp) {
    this.setCompStyle({
        width: comp.width,
        height: comp.height,
        pixelAspect: comp.pixelAspect,
        duration: comp.duration,
        frameRate: comp.frameRate,
    });
};
$._apmsl.Style.prototype.updateFromTextDocument = function (textDocument) {
    this.setFontStyle({
        fontSize: textDocument.fontSize,
        font: textDocument.font,
        applyFill: textDocument.applyFill,
        fillColor: textDocument.fillColor,
        applyStroke: textDocument.applyStroke,
        justification: textDocument.justification,
    });
};

$._apmsl.Style.prototype.applyToTextDocument = function (textDocument) {
    for (var key in this.fontStyle) {
        textDocument[key] = this.fontStyle[key];
    }
    return textDocument;
};
