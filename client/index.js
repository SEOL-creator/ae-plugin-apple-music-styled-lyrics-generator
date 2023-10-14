function toHex(color, delta) {
    function computeValue(value, delta) {
        let computedValue = !isNaN(delta) ? Math.round(value + delta) : Math.round(value);
        computedValue < 0 && (computedValue = 0);
        computedValue > 255 && (computedValue = 255);

        const hexStr = computedValue.toString(16);
        return hexStr.length == 1 ? "0" + hexStr : hexStr;
    }

    return "#" + computeValue(color.red, delta) + computeValue(color.green, delta) + computeValue(color.blue, delta);
}

function updateThemeWithAppSkinInfo(appSkinInfo) {
    //Update the background color of the panel
    const isPanelThemeLight = appSkinInfo.panelBackgroundColor.color.red > 127;

    const rootStyle = document.querySelector(":root").style;

    rootStyle.setProperty("--base-font-size", appSkinInfo.baseFontSize);
    rootStyle.setProperty("--background-color", toHex(appSkinInfo.panelBackgroundColor.color));
    rootStyle.setProperty("--highlight-color", toHex(appSkinInfo.systemHighlightColor));

    if (isPanelThemeLight) {
        rootStyle.setProperty("--font-color", "#000000");
    } else {
        rootStyle.setProperty("--font-color", "#ffffff");
    }
}

function onAppThemeColorChange(event) {
    const skinInfo = JSON.parse(window.__adobe_cep__.getHostEnvironment()).appSkinInfo;
    updateThemeWithAppSkinInfo(skinInfo);
}

function makeComp() {
    const displayPosTop = document.querySelector("input#displaypos").value;
    const marginLR = document.querySelector("input#marginlr").value;
    new CSInterface().evalScript(`try{$._apmsl.main(${displayPosTop},${marginLR});}catch(e){alert(e.message+' Line: '+e.line+e.fileName);}`);
}

function onLoad() {
    const csInterface = new CSInterface();

    // Theme
    updateThemeWithAppSkinInfo(csInterface.hostEnvironment.appSkinInfo);
    csInterface.addEventListener(CSInterface.THEME_COLOR_CHANGED_EVENT, onAppThemeColorChange);

    // Context menu
    csInterface.setContextMenu(null);

    // Load jsx scripts
    const jsxFolderPath = csInterface.getSystemPath(SystemPath.EXTENSION) + "/jsx/";
    csInterface.evalScript('$._apmsl.init("' + jsxFolderPath + '")');

    document.querySelector("button#make").addEventListener("click", makeComp);
}

document.addEventListener("DOMContentLoaded", onLoad);

window.onerror = function (msg, url, line, col, error) {
    let extra = !col ? "" : "\ncolumn: " + col;
    extra += !error ? "" : "\nerror: " + error;

    alert("Error: " + msg + "\nurl: " + url + "\nline: " + line + extra);
};
