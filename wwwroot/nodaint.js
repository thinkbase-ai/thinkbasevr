var graph;
var demo;
var nodasource;
var interact;
var kgname;
var currentStateId;
var root;
var nodeLookup = {};
var inNoda;
var graphObject;
var kgraphs;
var graphs;
var diagonalSize = 3.0;
var offset = {x: -1.3, y: -0.8, z: 0.0};


$(async function () {
    inNoda = window.noda.isInstalled();
    $('#eventsMessage').html("Starting...");
    currentStateId = uuidv4();
    var url = 'https://darl.dev';
    var key = "";

    graph = graphql(url + "/graphql");
    var apiKey = findGetParameter("apikey");
    if ($('#kgurl').data('kgurl')) {
        mdname = $('#kgurl').data('kgurl');
    }
    else {
        mdname = findGetParameter("kgraph");
    }
    
    if (apiKey !== null)
        graph = graphql(url + "/graphql", { headers: { "Authorization": "Basic " + apiKey } });
    else if (key !== null && key !== "")
        graph = graphql(url + "/graphql", { headers: { "Authorization": "Basic " + key } });
    else if (!$('#auth').length) {
        demo = true;
    }
    interact = graph('query int($name: String! $ksid: String! $text:  String!){interactKnowledgeGraph(kgModelName: $name conversationId: $ksid conversationData: { dataType: textual name: "" value: $text }){ darl reference activeNodes response{dataType name value categories{name value }}}}');
    nodaSource = graph('query ($name: String! $offset: NodaPosition $diagonal: Float){nodaView(graphName: $name boundingDiagonal: $diagonal offset: $offset)}');
    graphObject = graph('query ($name: String! $id: String!){getGraphObjectById(graphName: $name id: $id){existence{raw precision}externalId id	inferred lineage name externalId properties{existence{raw precision}id inferred	lineage	name value confidence type virtual properties{existence{raw	precision}id inferred lineage name value confidence	type virtual}}virtual}}');
    kgraphs = graph(`{ kgraphs { name model {description initialText dateDisplay inferenceTime defaultTarget}}}`);
    try {
        if(window.vuplex)
            window.vuplex.EnableRemoteDebugging();
        var graphResp = await kgraphs();
        graphs = graphResp.kgraphs;
    }
    catch (err) {
        HandleError(err);
    }
    //var existingNodes = await window.noda.

    $('#kgmodel-dropdown').on('change', function () {
        kgname = this.value;
    });

    $('#View-Edit').click(function () {
        if ($('#View-Edit').text() === "Edit") { //view container visible
            $('#EditContainer').removeClass('d-none');
            $('#ViewContainer').addClass('d-none');
            $('#View-Edit').text("Debug");
        }
        else if ($('#View-Edit').text() === "Debug") {//edit container visible
            $('#EditContainer').addClass('d-none');
            $('#DebugContainer').removeClass('d-none');
            $('#View-Edit').text("View");
            //draw debug window
        }
        else {//debug container visible
            $('#DebugContainer').addClass('d-none');
            $('#ViewContainer').removeClass('d-none');
            $('#View-Edit').text("Edit");
        }
    });

    $('#kg-build').click(async function () {
        try {
            if (kgname) {
                await Build();
            }
            else {
                alert("Please select a knowledge graph.");
            }
        }
        catch (err) {
            HandleError(err);
        }
    });

    $('#kg-clear').click(async function () {
        try {
            Clear();
        }
        catch (err) {
            HandleError(err);
        }
    });

    $('#kg-reset').click(async function () {
        try {
            ClearChatText();
            currentStateId = uuidv4();
            if (inNoda && root !== null && root !== undefined) {
                root.nodes.forEach(async function (node) {
                    node.shape = ball;
                    node.opacity = 0.6;
                    await window.noda.updateNode(node);
                });
            }
        }
        catch (err) {
            HandleError(err);
        }
    });

    $('.msg_send_btn').click(async function () {
        const text = $('.write_msg').val();
        if (text !== "")
            await HandleChatText(text);
    });

    // window.noda.OnNodeUpdated = async function (node) {
    //    alert("Node updated: " + node.uuid);
    //    try{
    //        var res = await graphObject({ name: kgname, id: node.uuid });
   //         nodeEditor.setValue(res.getGraphObjectById);
   //     }
   //     catch(err){
   //         HandleError(err);
  //      }
  //  }

    window.noda.onNodeUpdated = async function (node) {
        var id = "";
        try {
            var res = await graphObject({ name: kgname, id: node.uuid });
            id = res.getGraphObjectById.name;
            $('#nodeIdValue').text(node.uuid);
            $('#nodeNameValue').text(id);
            $('#nodeExternalIdValue').text(res.getGraphObjectById.externalId);
            $('#nodeLineageValue').text(res.getGraphObjectById.lineage);
            if (res.getGraphObjectById.properties) {
                res.getGraphObjectById.properties.forEach(function (item, index) {
                    const accordianItem = '<div class="accordion-item"><h2 class="accordion-header" id = "heading' + index + '" ><button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse' + index + '" aria-expanded="true" aria-controls="collapse' + index + '">' + 
                        'Attribute' + (index + 1) + '</button></h2 ><div id="collapse' + index + '" class="accordion-collapse collapse show" aria-labelledby="heading' + index + '" data-bs-parent="#attributeAccordion">< div class="accordion-body" > Content </div ></div ></div >';
                    $('attributeAccordion').html($('attributeAccordion').html() + accordianItem);
                });
            } 

        }
        catch (err) {
            HandleError(err);
        }
    }

    window.noda.onInitialized = async function () {
        if (!window.noda.isInstalled())
            alert("This page is intended to be viewed inside the Noda mind-mapping app. Go to https://Noda.io ");
        else {
            try {
                var nodaID = await window.noda.getUser();
                $('#userIdValue').text(nodaId);
            }
            catch (err) {
                $('#userIdValue').text("not in Noda");
                alert("This page is intended to be viewed inside the Noda mind-mapping app. Go to https://Noda.io ");
            }
        }
    }
     

    if (!inNoda) {
        alert("This page is intended to be viewed inside the Noda mind-mapping app. Go to https://Noda.io ");
    }

 /*   var tour = new Tour({
        steps: [
            {
                element: "#kgmodel-dropdown",
                title: "Select a Knowledge Graph",
                content: "Select one of these knowledge graphs to be built inside Noda."
            },
            {
                element: "#kg-build",
                title: "Show it in Noda",
                content: "Clicking 'Build' will create an interactive graph to your left."
            },
            {
                element: "#kg-clear",
                title: "Remove a KG",
                content: "Clicking 'Clear' will remove a graph you've just loaded."
            },
            {
                element: "#msg_input",
                title: "Interact with the KG",
                content: "This is preloaded with text that will start the chatbot conversation. Give textual or numeric answers here."
            },
            {
                element: "#msg_send_btn",
                title: "Send your response to the KG",
                content: "Clicking here will send your text to the chatbot, and then to the Knowledge Graph."
            },
            {
                element: "#kg-reset",
                title: "Clear the chatbot",
                content: "Clicking 'Reset conversation' will remove the existing conversation and start again from the beginning.."
            }
        ]
    });

    // Initialize the tour
    tour.init();

    // Start the tour
    tour.start();*/
});

async function Build() {
    Clear();
    var res = await nodaSource({ name: kgname, diagonal: diagonalSize, offset: offset });
    root = JSON.parse(res.nodaView);
    $('#msg_input').val(root.initialText);
    var converter = new showdown.Converter();
    var html = converter.makeHtml(root.description);
    $('#kg-description').html(html);
    //now create the network in noda
    if (inNoda) {
        root.nodes.forEach(async function (node) {
            await window.noda.createNode(node);
            nodeLookup[node.uuid] = node;
        });
        root.links.forEach(async function (link) {
            await window.noda.createLink(link);
        });
    }
    //test
//    var res = await graphObject({ name: kgname, id: "09f1eedd-9a15-44bc-ad9e-973aa850b4c1" });
//    nodeEditor.setValue(res.getGraphObjectById);
}
async function Clear() {
    if (inNoda && root !== null && root !== undefined) {
        root.links.forEach(async function (link) {
            await window.noda.deleteLink(link);
        });
        root.nodes.forEach(async function (node) {
            await window.noda.deleteNode(node);
        });
    }
    nodeLookup = {};
    $('#msg_input').val('');
    $('#kg-description').html('');
    root = null;
    ClearChatText();
    currentStateId = uuidv4();
}


function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

async function HandleChatText(text) {
    try {
        $('.write_msg').val('');
        AddOutGoingText(text);
        var res = await interact({ name: kgname, ksid: currentStateId, text: text });
        AddInComingMessage(res);
        $(".msg_history").stop().animate({ scrollTop: $(".msg_history")[0].scrollHeight }, 1000);
        //highlight appropriate nodes here.
        if (inNoda) {
            res.interactKnowledgeGraph[0].activeNodes.forEach(async function (uuid) {
                if (uuid in nodeLookup) {
                    var n = nodeLookup[uuid];
                    n.opacity = 1.0;
                    n.shape = "Box";
                    await window.noda.updateNode(n);              
                }
            });
        }
    }
    catch (err) {
        HandleError(err);
    }
}

function AddIncomingText(text) {
    var converter = new showdown.Converter();
    var html = converter.makeHtml(text);
    $('.msg_history').append('<div class="incoming_msg">' +
        '<div class="received_msg">' +
        '<div class="received_withd_msg">' +
        '<p>' + html + '</p>' +
        '</div>' +
        '</div>' +
        '</div>');
}

function AddOutGoingText(text) {
    $('.msg_history').append('<div class="outgoing_msg">' +
        '<div class="sent_msg">' +
        '<p>' + text + '</p>' +
        '</div>' +
        '</div>');
}

function HandleError(err) {
    if (Array.isArray(err)) {
        alert(err[0].message);
    }
    else {
        alert(err);
    }
}

function AddInComingMessage(message) {
    //remove any previous buttons
    $('.received_withd_msg > .btn-group').empty();
    for (let i = 0, n = message.interactKnowledgeGraph.length; i < n; i++) {
        let r = message.interactKnowledgeGraph[i];
        switch (r.response.dataType) {
            case "textual":
            case "numeric":
                AddIncomingText(r.response.value);
                break;
            case "categorical":
                AddIncomingText(r.response.value);
                var cats = "";
                for (let n of r.response.categories) {
                    cats = cats + '<button type="button" class="btn btn-secondary chat-btn">' + n.name + '</button>';
                }
                $('.msg_history').append('<div class="incoming_msg">' +
                    '<div class="received_msg">' +
                    '<div class="received_withd_msg">' +
                    '<div class="btn-group" role="group">' + cats + '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>');
                $('.chat-btn').click(async function (data) {
                    const text = $(data.target).text();
                    await HandleChatText(text);
                });
                break;
        }
    }
}

function ClearChatText() {
    $('.msg_history').empty();
}

function clearEvents() {
    $('#eventsMessage').html("");
}

function eventMessage(message) {
    $('#eventsMessage').html(message + "<br/>" + $('#eventsMessage').html());
}


