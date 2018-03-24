import {
  UPDATE_FILTER,
  UPDATE_FILTER_LOCATION,
  FETCH_USER,
  DISABLE_LOCATION,
  FETCH_LOCATION,
  FETCH_ADDRESS_BOOK,
  FETCH_RECENT_MESSAGE,
  TOGGLE_ADDRESS_DIALOG,
  TOGGLE_NEARBYEVENT_DIALOG,
  TOGGLE_LEADER_BOARD,
  FETCH_TOP_TWENTY,
} from './actions/types';
import * as firebase from 'firebase';
import config, {constant} from './config/default';
import {getUserProfile} from './UserProfile';

const currentLocationLabel = "現在位置";

function dispatchToggleNearbyEventDialog(flag) {
  return {type: TOGGLE_NEARBYEVENT_DIALOG, open: flag};
}

function dispatchToggleAddressBook(flag) {
  return {type: TOGGLE_ADDRESS_DIALOG, open: flag};
}

function dispatchToggleLeaderBoard(flag) {
  return {type: TOGGLE_LEADER_BOARD, open: flag};
}

function receiveLocation(pos, label=currentLocationLabel){
  return {type: FETCH_LOCATION, geoLocation: pos, label: label};
}

function disableLocation() {
  return {type: DISABLE_LOCATION};
}

function fetchAddressBook(address) {
  return {type: FETCH_ADDRESS_BOOK, addresses: address};
}

function fetchUser(user, loading=false) {
  return {type: FETCH_USER, user: user, loading: loading};
}

function fetchRecentMessage(recentMessage, openRecent) {
  return {type: FETCH_RECENT_MESSAGE, recentMessage: recentMessage, openRecent: openRecent};
}

function dispatchFilter(eventNumber, distance, geolocation) {
  return {type: UPDATE_FILTER, eventNumber: eventNumber, geolocation: geolocation, distance: distance}
}

function dispatchFilterLocation(geolocation, distance) {
  return {type: UPDATE_FILTER_LOCATION, geolocation: geolocation, distance: distance};
}


export function fetchLocation(callback=receiveLocation) {
  return dispatch => {
    if(navigator.geolocation) {
      var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }; 
      navigator.geolocation.getCurrentPosition((geoLocation) => {
        console.log(geoLocation);
        callback(geoLocation);
      },
      (error) => {
        console.log(error);
      }, options);
    } else {
      alert('Location not supported!');
      dispatch(disableLocation())
    }
  }
}

export function checkAuthState() {
  return dispatch => {
    var auth = firebase.auth();
    dispatch(fetchUser(null, true));
    auth.onAuthStateChanged((user) => {
      dispatch(fetchUser(user));
    });
  };
}

export function signIn() {
  return dispatch => {
    var provider = new firebase.auth.FacebookAuthProvider();
    provider.addScope('user_friends');
    provider.addScope('publish_actions');
    provider.addScope('user_managed_groups');
    provider.addScope('user_birthday');
    firebase.auth().signInWithPopup(provider).then(function(result) {
      var token = result.credential.accessToken;
      var user = result.user;
      console.log(result.additionalUserInfo.profile);
    }).catch(function(error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      var email = error.email;
      var credential = error.credential;
    });
  };
}

export function signOut() {
  return dispatch => {
    firebase.auth().signOut();
    dispatch(fetchUser(null)); 
  }
}

export function updateFilter(eventNumber, distance, geolocation) {
  return dispatch => {
    dispatch(dispatchFilter(eventNumber, distance, geolocation));
  };
}

export function updateFilterLocation(geolocation, distance) {
  return dispatch => {
    dispatch(dispatchFilterLocation(geolocation, distance));
  };
}

export function updateFilterWithCurrentLocation() {
  return dispatch => {
    dispatch(fetchLocation(geolocation => {
      dispatch(receiveLocation(geolocation));
      dispatch(updateFilterLocation(geolocation.coords));     
    }));  
  }
}

export function fetchAddressBookByUser(user) {
  return dispatch => {
    var db = firebase.firestore();
    var collectionRef = db.collection(config.userDB).doc(user.uid).collection("AddressBook");
    collectionRef.onSnapshot(function() {})         
    collectionRef.get().then(function(querySnapshot) {
       const addresses = querySnapshot.docs.map(d => ({... d.data(), id: d.id}));
       dispatch(fetchAddressBook(addresses));
    })
    .catch(function(error) {
        console.log("Error getting documents: ", error);
    });
  };
}

export function upsertAddress(user, key, type, text, geolocation, streetAddress) {
  return dispatch => {
    var now = Date.now();
    var addressRecord = {
        type: type,
        updateAt: new Date(now),
        text: text,
        geolocation: new firebase.firestore.GeoPoint(geolocation.latitude, geolocation.longitude),
        streetAddress: streetAddress
    }; 
    console.log(addressRecord);
    // Use firestore
    var db = firebase.firestore();
    var collectionRef = db.collection(config.userDB).doc(user.uid).collection("AddressBook");
    if(key != null) {
        collectionRef.doc(key).set(addressRecord).then(function() {
          dispatch(fetchAddressBookByUser(user))
        });
    } else {
        collectionRef.add(addressRecord).then(function(docRef) {
          console.log("comment written with ID: ", docRef.id);
          dispatch(fetchAddressBookByUser(user))
        });
    }  
  }
}

export function deleteAddress(user, key) {
  return dispatch => {
    const db = firebase.firestore();
    const collectionRef = db.collection(config.userDB).doc(user.uid).collection("AddressBook");
    collectionRef.doc(key).delete().then(() => {
      dispatch(fetchAddressBookByUser(user))
    });
  };
}


export function toggleAddressDialog(flag) {
  return dispatch => {
    dispatch(dispatchToggleAddressBook(flag));
  };
}

export function toggleNearbyEventDialog(flag) {
  return dispatch => {
    dispatch(dispatchToggleNearbyEventDialog(flag));
  };
}

export function toggleLeaderBoard(flag) {
  return dispatch => {
    dispatch(dispatchToggleLeaderBoard(flag));
  }
}

export function updateRecentMessage(eventId, openRecent) {

}

export function fetchTopTwenty() {
  return dispatch => {
    console.log('fetchTopTwenty');
    var db = firebase.firestore();
    var collectionRef = db.collection(config.userDB).orderBy('publishMessagesCount', 'desc').limit(20);
    collectionRef.onSnapshot(function() {})         
    collectionRef.get().then(function(querySnapshot) {
       const users = querySnapshot.docs.map(d => ({... d.data(), id: d.id}));
       console.log(users);
       dispatch({type: FETCH_TOP_TWENTY, users: users}) ;
    })
    .catch(function(error) {
        console.log("Error getting documents: ", error);
    });

  }
}
