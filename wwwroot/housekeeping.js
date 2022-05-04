$(document).ready(async function () {
    if (localStorage.getItem('popState') != 'shown') {
        await ShowMDBox("Welcome to ThinkBase", "/md/thinkbase/visitor_text.md");
        localStorage.setItem('popState', 'shown')
    }
    var priceId = getCookie("priceId");
    if (priceId) {
        document.cookie = "priceId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = '/subscribe?priceId=' + priceId;
    }

    $('#popup-close').click(function (e) {
        $('#modalIntro').fadeOut();
    });

    $('#modalIntro').click(function (e) {
        $('#modalIntro').fadeOut();
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('newsubs')) {
        await ShowMDBox("Thanks for subscribing", "/md/thinkbase/Subscribe_text.md");
    }

});

function HandlePurchase(priceId) {
    $('#modalPricing').fadeOut();
    document.cookie = "priceId=" + priceId;
    if ($('#auth').length) {
        window.location.href = '/subscribe';
    }
    else {
        window.location.href = '/MicrosoftIdentity/account/signin';
    }
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

async function ShowMDBox(header, url) {
    $.get(url, function (data) {
        var converter = new showdown.Converter();
        var html = converter.makeHtml(data);
        var div = $("<div>", {
            css: {
                "width": "100%",
                "margin-top": "1rem"
            }
        }).html(html);

        $.MessageBox({
            message: header,
            input: div,
            queue: false
        }).done(function (data) {
            console.log(data);
        });
    });
}