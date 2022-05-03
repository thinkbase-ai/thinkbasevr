
const Noda = {};

window.noda = Noda;

Noda.MessageProcessingQueue = {};

Noda.createNode = async function (props) {
    return new Promise(function (resolve, reject) {
        var messageId = uuidv4();
        var requestPromise = window.noda.sendMessage('createNode', messageId, props);

        requestPromise.then(response => {
            resolve(response);
        }).catch(error => {
            reject("Call to Noda.createNode failed: " + error);
        });
    });
}

Noda.updateNode = async function (props) {
    return new Promise(function (resolve, reject) {
        var messageId = uuidv4();
        var requestPromise = window.noda.sendMessage('updateNode', messageId, props);

        requestPromise.then(response => {
            resolve(response);
        }).catch(error => {
            reject("Call to Noda.updateNode failed: " + error);
        });
    });
}

Noda.deleteNode = async function (props) {
    return new Promise(function (resolve, reject) {
        var messageId = uuidv4();
        var requestPromise = window.noda.sendMessage('deleteNode', messageId, props);

        requestPromise.then(response => {
            resolve(response);
        }).catch(error => {
            reject("Call to Noda.deleteNode failed: " + error);
        });
    });
}

Noda.createLink = async function (props) {
    return new Promise(function (resolve, reject) {
        var messageId = uuidv4();
        var requestPromise = window.noda.sendMessage('createLink', messageId, props);

        requestPromise.then(response => {
            resolve(response);
        }).catch(error => {
            reject("Call to Noda.createLink failed: " + error);
        });
    });
}

Noda.updateLink = async function (props) {
    return new Promise(function (resolve, reject) {
        var messageId = uuidv4();
        var requestPromise = window.noda.sendMessage('updateLink', messageId, props);

        requestPromise.then(response => {
            resolve(response);
        }).catch(error => {
            reject("Call to Noda.updateLink failed: " + error);
        });
    });
}

Noda.deleteLink = async function (props) {
    return new Promise(function (resolve, reject) {
        var messageId = uuidv4();
        var requestPromise = window.noda.sendMessage('deleteLink', messageId, props);

        requestPromise.then(response => {
            resolve(response);
        }).catch(error => {
            reject("Call to Noda.deleteLink failed: " + error);
        });
    });
}


Noda.sendMessage = async function (messageType, messageId, messageData) {
    return new Promise(function (resolve, reject) {

        var messageId = uuidv4();

        window.noda.MessageProcessingQueue[messageId] = function (response) {
            window.noda.MessageProcessingQueue[messageId] = null;

            if (response.messageStatus == "Success") {
                if (response.messageData != null)
                    resolve(response.messageData);
                else
                    resolve(response.messageStatus)
            } else
                reject(response.messageStatus);
        }

        try {
            window.vuplex.postMessage({ messageType: messageType, messageId: messageId, messageData: messageData });
        } catch (ex) {
            reject("Could not send message: " + ex);
        }
    });
}

if (window.vuplex) {
    addMessageListener();
} else {
    window.addEventListener('vuplexready', addMessageListener);
}

function addMessageListener() {

    window.vuplex.addEventListener('message', function (event) {
        let json = event.data;

        console.log("Receiving Response: " + event.data);

        var response = JSON.parse(event.data);

        if (response.messageId != null) {

            var messageProcessingCallback = window.noda.MessageProcessingQueue[response.messageId];

            if (messageProcessingCallback != null) {
                messageProcessingCallback(response);
            }
        }

        if (response.eventType != null) {
            const eventHandler = "on" + response.eventType.charAt(0).toUpperCase() + response.eventType.slice(1)
            if (window.noda[eventHandler] != null) {
                if (response.eventData != null)
                    window.noda[eventHandler](response.eventData);
                else
                    window.noda[eventHandler]();
            }
        }
    });
}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
