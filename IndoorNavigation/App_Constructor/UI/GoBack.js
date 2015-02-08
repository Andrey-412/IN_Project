$(function () {
    $("#GoBack")
   .css(
   {
       "background": "rgba(255,255,255,0.5)"
   })

    $("#GoBack")
      .text("") // sets text to empty
   .css(
   {
       "z-index": "2",
       "background": "rgba(0,0,0,0)", "opacity": "0.9",
       "position": "absolute", "top": "4px", "left": "32px"
   }) // adds CSS
   .append("<img width='32' height='32' src='/App_Constructor/ThreeJs/images/icon-info.png'/>")
   .button()
   .click(
       function () {
           var url = $("#RedirectTo").val();
           location.href = url;
       });
});