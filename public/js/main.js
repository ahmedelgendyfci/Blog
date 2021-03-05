function AddReadMore() {
    //This limit you can set after how much characters you want to show Read More.
    var carLmt = 170;
    //Traverse all selectors with this class and manupulate HTML part to show Read More
    $(".addReadMore").each(function () {
        if ($(this).find(".firstSec").length)
            return;
        var allstr = $(this).text();
        if (allstr.length > carLmt) {
            var firstSet = allstr.substring(0, carLmt);
            $(this).html(firstSet + "... ");
        }
    });
}

$(function () {
    //Calling function after Page Load
    AddReadMore();
});




