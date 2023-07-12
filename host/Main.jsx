function evalFile(path) {
    try {
        $.evalFile(path);
    } catch (e) {
        alert("Exception: " + e);
        throw new Error("Error evaluating file: " + path + "\n" + e);
    }
}

function evalFiles(jsxFolderPath) {
    var jsxFiles = new Folder(jsxFolderPath).getFiles("*.jsx");
    for (var i = 0; i < jsxFiles.length; i++) evalFile(jsxFiles[i]);
}

function init(jsxFolderPath) {
    evalFiles(jsxFolderPath);
}

$._ext = {
    init: init,
};
