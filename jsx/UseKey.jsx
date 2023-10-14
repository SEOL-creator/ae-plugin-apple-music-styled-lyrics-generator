$._apmsl.UseKey = function (
    property,
    getValueFunc,
    getValueFuncThis,
    expressionStatementBuilder,
    expressionValueAtTime,
    initialValue,
    inTemporalEase,
    outTemporalEase,
    DEFAULT_LYRICS_DURATION,
    ANIMATION_DELAY,
    ANIMATION_DURATION
) {
    this.property = property;
    this.getValue = getValueFunc;
    this.getValueThis = getValueFuncThis;
    this.expressionStatementBuilder = expressionStatementBuilder;
    this.expressionValueAtTime = expressionValueAtTime;
    this.lastValue = initialValue;
    this.inTemporalEase = inTemporalEase;
    this.outTemporalEase = outTemporalEase;

    this.DEFAULT_LYRICS_DURATION = DEFAULT_LYRICS_DURATION;
    this.ANIMATION_DELAY = ANIMATION_DELAY;
    this.ANIMATION_DURATION = ANIMATION_DURATION;

    this.keyIndex = 1;

    this.expression = "";
};
$._apmsl.UseKey.prototype.getNewValue = function (diff, layerIndex, markerIndex) {
    return (this.lastValue = this.getValue.call(this.getValueThis, diff, layerIndex, markerIndex));
};
$._apmsl.UseKey.prototype.setKey = function (keyIndex, time, value) {
    if (this.property.numKeys > keyIndex) {
        this.property.setValueAtKey(keyIndex, value);
    } else {
        this.property.setValueAtTime(time, value);
        this.property.setTemporalEaseAtKey(keyIndex, this.inTemporalEase, this.outTemporalEase);
    }
};
$._apmsl.UseKey.prototype.addExpression = function (markerIndex, diff) {
    // prettier-ignore
    this.expression +=
        (this.expression === "" ? "if" : "else if") +
        "(time<=thisComp.layer(\"Timing Markers\").marker.key("+markerIndex+").time-(" + (this.ANIMATION_DELAY * diff + this.ANIMATION_DURATION) + ")){" +
        this.expressionStatementBuilder(this.lastValue) + "}" + // Before animation
        "else if" +
        "(time<=thisComp.layer(\"Timing Markers\").marker.key("+markerIndex+").time-(" + (this.ANIMATION_DELAY * diff) + ")){" +
        this.expressionStatementBuilder(this.expressionValueAtTime(markerIndex, diff, this.DEFAULT_LYRICS_DURATION, this.ANIMATION_DELAY)) + "}"; // during animation
};
$._apmsl.UseKey.prototype.getExpression = function (defaultValue) {
    if (defaultValue) {
        return this.expression + "else{" + this.expressionStatementBuilder(defaultValue) + "}";
    }
    return this.expression;
};
$._apmsl.UseKey.prototype.key = function (diff, layerIndex, markerIndex) {
    this.addExpression(markerIndex, diff);
    this.setKey(this.keyIndex++, this.DEFAULT_LYRICS_DURATION * markerIndex - this.ANIMATION_DURATION, this.lastValue);
    this.setKey(this.keyIndex++, this.DEFAULT_LYRICS_DURATION * markerIndex, this.getNewValue(diff, layerIndex, markerIndex));
};
