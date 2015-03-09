$(function () {
    $("#menuButton")
   .css(
   {
       "background": "rgba(255,255,255,0.5)"
   })

    $("#menuButton")
      .text("") // sets text to empty
   .css(
   {
       "z-index": "2",
       "background": "rgba(0,0,0,0)", "opacity": "0.9",
       "position": "absolute", "top": "4px", "left": "38px"
   }) // adds CSS
   .append("<img width='32' height='32' src='/WebGL_Constructor/Assets/UI/menu-button.png'/>")
   .button()
   .click(
       function () {
           var url = $("#RedirectTo").val();
           location.href = url;
       });
});