$(function () {
    $("#routeBox")
    .css(
    {
        "background": "rgba(255,255,255,1)"
    })
    .dialog({
        autoOpen: false,
        show: { effect: 'fade', duration: 500 },
        hide: { effect: 'fade', duration: 500 }
    });

    $("#routeButton")
        .text("") // sets text to empty
    .css(
    {
        "z-index": "2",
        "background": "rgba(0,0,0,0)", "opacity": "0.9",
        "position": "absolute", "top": "4px", "left": "72px"
    }) // adds CSS
    .append("<img width='32' height='32' src='/WebGL_Constructor/Assets/UI/route-button.png'/>")
    .button()
    .click(
        function () {
            $("#routeBox").dialog("open");
        });
});