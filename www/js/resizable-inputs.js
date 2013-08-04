/* global $:false */
"use strict";

$("body").on("input", "input[data-resizable]", function () {
    var $this = $(this);
    var value = $this.val();
    var widthProperties = ["font-family", "font-size", "font-weight", "margin", "padding"];
    var $span = $("<pre></pre>");
    $span.css($this.css(widthProperties));
    $span.text(value);
    $span.hide();
    $this.after($span);
    $this.width($span.width() + 7);
    $span.remove();
    if ($this.width() > $this.parents(".span1, .span2, .span3, .span4, .span5, .span6, .span7, .span8, .span9, .span10, .span11, .span12").first().width()) {
        $this.val(value.slice(0, value.length - 1));
        $this.trigger("input");
    }
});

$("body").on("templatechange templateready dataloaded urlchange resizeinputs", function () {
    $("input[data-resizable]").trigger("input");
});