import * as firebase from 'firebase';
import uuid from 'js-uuid';
import config, {constant} from './config/default';
import { light } from 'material-ui/styles/createPalette';

function fetchMessagesBaseOnGeo(geocode, distance, numberOfMessage, callback) {

    var db = firebase.firestore();
    var collectionRef = db.collection(config.messageDB);
    collectionRef.onSnapshot(function() {})         
    if(geocode != null && geocode != NaN && geocode.latitude != undefined) {
        console.log("Get message base on Location: (" + geocode.latitude + " ," + geocode.longitude + ")");
        // ~1 km of lat and lon in degrees
        let lat = 0.009005379598;
        let lon = 0.01129765804;

        let lowerLat = geocode.latitude - (lat * distance);
        let lowerLon = geocode.longitude - (lon * distance);

        let greaterLat = geocode.latitude + (lat * distance);
        let greaterLon = geocode.longitude + (lon * distance)

        let lesserGeopoint = new firebase.firestore.GeoPoint(lowerLat, lowerLon);
        let greaterGeopoint = new firebase.firestore.GeoPoint(greaterLat, greaterLon);

        // Use firestore

        collectionRef.where("hide", "==", false).where("geolocation", ">=", lesserGeopoint).where("geolocation", "<=", greaterGeopoint).orderBy("geolocation", "desc").limit(numberOfMessage).get().then(function(querySnapshot) {
            querySnapshot.forEach(callback);
        })
        .catch(function(error) {
            console.log("Error getting documents: ", error);
        });
        collectionRef.where("hide", "==", false).where("geolocation", ">=", lesserGeopoint).where("geolocation", "<=", greaterGeopoint).onSnapshot(function(querySnapshot) {
            querySnapshot.forEach(callback);
        })       
    } else {
        // Use firestore
        collectionRef.where("hide", "==", false).orderBy("createdAt", "desc").limit(numberOfMessage).get().then(function(querySnapshot) {
            querySnapshot.forEach(callback);
        })
        .catch(function(error) {
            console.log("Error getting documents: ", error);
        });
        collectionRef.where("hide", "==", false).onSnapshot(function(querySnapshot) {
            querySnapshot.forEach(callback);
        })       
    }
 }

 function addMessage(key, message, currentUser, tags, geolocation, streetAddress, start, duration, interval, link, imageUrl, publicImageURL, thumbnailImageURL, thumbnailPublicImageURL, status) {
    var now = Date.now();
    if(start === "")
    {
      start = null;
      duration = null;
      interval = null;
    }
    var messageRecord = {
        hide: false,
        name: currentUser.displayName,
        text: message,
        photoUrl: currentUser.providerData[0].photoURL || '/images/profile_placeholder.png',
        geolocation: new firebase.firestore.GeoPoint(geolocation.latitude, geolocation.longitude),
        streetAddress: streetAddress,
        tag: tags,
        createdAt: new Date(now),
        lastUpdate: null,
        key: key,   
        uid: currentUser.uid,
        fbuid: currentUser.providerData[0].uid,
        start: new Date(start),
        duration: duration,
        interval: interval,
        link: link,
        imageUrl, publicImageURL, 
        thumbnailImageURL, 
        thumbnailPublicImageURL,
        status: status
      };
    // Use firestore
    const db = firebase.firestore();
    const messageRef = db.collection(config.messageDB).doc(key);
    const userRef = db.collection(config.userDB).doc(currentUser.uid);
    return db.runTransaction(transaction => {
      return transaction.get(userRef).then(userDoc => {
        let publishMessages = userDoc.publishMessages;
        if (publishMessages == null) {
          publishMessages = [key]
        } else {
          publishMessages.push(key);
        }
        transaction.set(messageRef, messageRecord);
        transaction.update(userRef, {
          publishMessages: publishMessages,
          publishMessagesCount: publishMessages.length,
        });
        console.log("Document written with ID: ", key);
        return (key);
      });
    });
};
  

function getMessage(uuid) {
    // firestore
    // Use firestore
    var db = firebase.firestore();
    var collectionRef = db.collection(config.messageDB);
    var docRef = collectionRef.doc(uuid);
    return docRef.get().then(function(doc) {
        if (doc.exists) {
            return(doc.data());
        } else {
            return null;
        }
    });     
}

function updateMessage(messageKey, messageRecord, path) {
    var db = firebase.firestore();
    var now = Date.now();
    var collectionRef = db.collection(config.messageDB);
    if(messageRecord == null) {
        messageRecord.lastUpdate = new Date(now);
        collectionRef.doc(messageKey).update({
            lastUpdate: new Date(now)
        }).then(function(messageRecordRef) {
            console.log("Document written with ID: ", messageKey);
            return(messageRecordRef);
        }) 
    } else {
        messageRecord.lastUpdate = new Date(now);
        collectionRef.doc(messageKey).set(messageRecord).then(function(messageRecordRef) {
            console.log("Document written with ID: ", messageKey);
            return(messageRecordRef);
        })      
    }
}


function updateMessageImageURL(messageKey, firebaseImageURL, publicImageURL) {
    return getMessage(messageKey).then((messageRecord) => {
        if(firebaseImageURL != messageRecord.imageUrl) {
            messageRecord.imageUrl = firebaseImageURL;
        }
        if(publicImageURL != messageRecord.publicImageURL) {
            messageRecord.publicImageURL = publicImageURL;
        }        
        var path = "";
        return updateMessage(messageKey, messageRecord, path);
    });
}

function  addMessageFB_Post(messageKey, fbpost) {
    return getMessage(messageKey).then((messageRecord) => {
        if(messageRecord.fbpost != null)
        {
            messageRecord.fbpost.push(fbpost);
        }
        else
        {
            messageRecord.fbpost = [fbpost];
        }
        var path = "";
        return updateMessage(messageKey, messageRecord, path);
    });
}

function updateMessageConcernUser(messageUuid, user, isConcern) {
    // Use firestore
    return getMessage(messageUuid).then((messageRecord) => {
        if(messageRecord != null) {
            if(messageRecord.concernRecord != null)
            {
                var index = messageRecord.concernRecord.indexOf(user.uid);
                if(index == -1 && isConcern)
                {
                    messageRecord.concernRecord.push(user.uid);
                    var path = "";
                    return updateMessage(messageUuid, messageRecord, path);
                }
                else
                {
                    if(!isConcern) {
                        messageRecord.concernRecord.splice(index, 1);
                        var path = "";
                        return updateMessage(messageUuid, messageRecord, path);
                    }
                }
            } else {
                if(isConcern)
                {
                    console.log("message Uuid " + messageUuid + " User Id " + user.uid)
                    messageRecord.concernRecord = [user.uid];
                    var path = "";
                    return updateMessage(messageUuid, messageRecord, path); 
                }
            }
        } else {
            return null;
        }
    });        
}

/// All about comment
function addComment(messageUUID, currentUser, photo, commentText, tags, geolocation, streetAddress, link, status) {
    var now = Date.now();
    var fireBaseGeo = null;
    var commentRecord = {
        hide: false,
        name: currentUser.displayName,
        photoUrl: currentUser.providerData[0].photoURL || '/images/profile_placeholder.png',
        createdAt: new Date(now),
        lastUpdate: null,
    }; 
    if(commentText != null) {
        commentRecord.text = commentText;
    } else {
        if(geolocation != null) {
            commentRecord.geolocation =  new firebase.firestore.GeoPoint(geolocation.latitude, geolocation.longitude);
            if(streetAddress != null) {
                commentRecord.streetAddress = streetAddress;
            }
        } else {
            if(status != null) {
                commentRecord.changeStatus = status;
            } else {
                if(link != null) {
                    commentRecord.link = link;
                } else {
                    if(tags != null) {
                        commentRecord.tags = tags;
                    }
                }
            }
        }
    }
    console.log(commentRecord);
    // Use firestore
    var db = firebase.firestore();
    var collectionRef = db.collection(config.messageDB);  
    return collectionRef.doc(messageUUID).collection("comment").add(commentRecord).then(function(docRef) {
        console.log("comment written with ID: ", docRef.id);
        return(docRef.id);
    });  
}

function fetchCommentsBaseonMessageID(user, messageUUID, callback) {
    var db = firebase.firestore();
    var collectionRef = db.collection(config.messageDB).doc(messageUUID).collection("comment");
    collectionRef.onSnapshot(function() {})         
    // Use firestore
    collectionRef.where("hide", "==", false).get().then(function(querySnapshot) {
        querySnapshot.forEach(callback);
    })
    .catch(function(error) {
        console.log("Error getting documents: ", error);
    });
}

export {fetchCommentsBaseonMessageID, addComment, fetchMessagesBaseOnGeo, addMessage, addMessageFB_Post, updateMessageImageURL, getMessage, updateMessageConcernUser};
