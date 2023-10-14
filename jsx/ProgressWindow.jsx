$._apmsl.ProgressWindow = function (title, max, onClose) {
    try {
        this.max = max;
        this.onClose = onClose;
        this.progressWin = new Window("palette", title, [150, 150, 600, 300]);
        this.progressWin.pnl = this.progressWin.add("panel", [10, 10, 440, 100], "Progress");
        this.progressWin.pnl.progBar = this.progressWin.pnl.add("progressbar", [20, 35, 410, 60], 0, max);
        this.progressWin.pnl.progBarLabel = this.progressWin.pnl.add("statictext", [20, 20, 320, 35], "0/" + max);
        this.progressWin.center();
        this.progressWin.show();
    } catch (e) {
        alert(e.message + " Line: " + e.line);
    }
};
$._apmsl.ProgressWindow.prototype.updateProgress = function (updater) {
    try {
        var newValue;
        if (typeof updater === "number") {
            newValue = updater;
        } else if (typeof updater === "function") {
            newValue = updater(this.progressWin.pnl.progBar.value);
        }
        
        if (newValue >= this.max) {
            this.close();
        }
        this.progressWin.pnl.progBar.value = newValue;
        this.progressWin.pnl.progBarLabel.text = newValue + "/" + this.max;
        this.progressWin.update();
    } catch (e) {
        alert(e.message + " Line: " + e.line);
    }
};
$._apmsl.ProgressWindow.prototype.close = function () {
    try {
        this.progressWin.close();
        this.onClose && this.onClose();
    } catch (e) {
        alert(e.message + " Line: " + e.line);
    }
};
