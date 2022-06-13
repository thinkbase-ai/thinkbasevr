var graph;
var demo;
var nodasource;
var interact;
var kgname;
var currentStateId;
var root;
var nodeLookup = {};
var inNoda;
var nodeEditor;
var graphObject;
var diagonalSize = 3.0;
var offset = {x: -1.3, y: -0.8, z: 0.0};


$(async function () {
    inNoda = true;
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

    $('#kgmodel-dropdown').on('change', async function () {
        kgname = this.value;
    });

    $('#View-Edit').click(function () {
        if ($('#View-Edit').text() === "Edit") {
            $('#ViewContainer').addClass('d-none');
            $('#EditContainer').removeClass('d-none');
            $('#View-Edit').text("View");
        }
        else {
            $('#EditContainer').addClass('d-none');
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
    window.noda.onNodeUpdated = function (node) {
                 eventMessage("Node updated with uuid: " + node.uuid);
                 }
    
    const response = await fetch("wwwroot/graphobjectschema.json");
    const schema = await response.json();
    nodeEditor = new JSONEditor($('#nodeEditor')[0], {
        schema: schema,
        theme: 'bootstrap4',
        disable_array_add: true,
        disable_array_delete: true,
        disable_array_delete_all_rows: true,
        disable_array_delete_last_row: true,
        disable_collapse: true,
        disable_edit_json: true,
        disable_properties: true,
        iconlib: "fontawesome5"
    });

    if (!inNoda) {
        alert("This page is intended to be viewed inside the Noda mind-mapping app. Go to https://Noda.io ");
    }

    var tour = new Tour({
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
    tour.start();
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

var eventsMessageElement;

document.addEventListener('DOMContentLoaded', function () {    
    eventsMessageElement = document.getElementById('eventsMessage');
    window.noda.onNodeUpdated = function (node) { eventMessage("Node updated with uuid: " + node.uuid + " opacity: " + node.opacity); }
}, false);

function eventMessage(message) {
    eventsMessageElement.innerHTML = message + "<br/>" + eventsMessageElement.innerHTML;
}


