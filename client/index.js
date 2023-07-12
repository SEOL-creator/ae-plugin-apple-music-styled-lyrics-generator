function makeComp() {
    const compName = document.querySelector("input#compName").value;
    const lyrics = document.querySelector("textarea#lyrics").value.split("\n");
    new CSInterface().evalScript("$._ext.generateLyricsComposition(" + JSON.stringify(compName) + "," + JSON.stringify(lyrics) + ")");
}

function onLoad() {
    const csInterface = new CSInterface();

    const jsxFolderPath = csInterface.getSystemPath(SystemPath.EXTENSION) + "/jsx/";
    csInterface.evalScript(`$._ext.init("${jsxFolderPath}")`);

    // ToDo: Handle theme change

    document.querySelector("button#make").addEventListener("click", makeComp);
}

document.addEventListener("DOMContentLoaded", onLoad);
