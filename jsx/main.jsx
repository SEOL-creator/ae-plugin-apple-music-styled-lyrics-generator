$._apmsl.main = function (displayPosTop, marginLR) {
    var Style = $._apmsl.Style;
    var LyricsCompGenerator = $._apmsl.LyricsCompGenerator;
    var LayerEffectsManager = $._apmsl.LayerEffectsManager;

    try {
        // Get the active comp
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        if (comp.numLayers >= 2) {
            return {
                error: "",
            };
        } else if (comp.numLayers === 0) {
            return {
                error: "Please select a composition with at least one layer.",
            };
        }

        var lyricsLayer = comp.layer(1);
        var style = new Style(null, null, { displayPosTop: displayPosTop, marginLR: marginLR });
        style.updateFromComp(comp);
        style.updateFromTextDocument(lyricsLayer.property("Source Text").value);

        app.beginUndoGroup("Generate Lyrics Composition");
        var rootFolder = comp.parentFolder;
        var lyricsComp = rootFolder.items.addComp(
            comp.name + "_lyrics",
            style.compStyle.width,
            style.compStyle.height,
            style.compStyle.pixelAspect,
            style.compStyle.duration,
            style.compStyle.frameRate
        );
        var bgComp = rootFolder.items.addComp(
            comp.name + "_background",
            style.compStyle.width,
            style.compStyle.height,
            style.compStyle.pixelAspect,
            style.compStyle.duration,
            style.compStyle.frameRate
        );

        comp.layers.add(bgComp);
        comp.layers.add(lyricsComp);
        lyricsLayer.enabled = false;

        var lyrics = lyricsLayer.property("Source Text").value.text.split(/\r\n|\r|\n/);

        var layerInfo = new LyricsCompGenerator(style, lyrics).generate(lyricsComp);

        var timingHandleLayer = lyricsComp.layers.addNull(style.compStyle.duration);
        timingHandleLayer.name = "Timing Markers";
        for (var i = 1; i <= lyrics.length + 1; i++) {
            // +1 for the last timing handle that indicates the end of the lyrics
            timingHandleLayer.marker.setValueAtTime(i * (style.compStyle.duration / (lyrics.length + 2)), new MarkerValue(i === lyrics.length + 1 ? "End" : i));
        }

        new LayerEffectsManager(lyricsComp, style, layerInfo).applyAll();

        app.endUndoGroup();
    } catch (e) {
        alert(e.message + " Line: " + e.line + e.fileName);
    }
};
