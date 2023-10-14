$._apmsl = {
    // Evaluate all the files in the given folder
    init: function (jsxFolderPath) {
        var folder = new Folder(jsxFolderPath);
        if (folder.exists) {
            var jsxFiles = folder.getFiles("*.jsx");
            for (var i = 0; i < jsxFiles.length; i++) {
                try {
                    $.evalFile(jsxFiles[i]);
                } catch (e) {
                    alert("Exception:" + e);
                }
            }
        }
    },
};
