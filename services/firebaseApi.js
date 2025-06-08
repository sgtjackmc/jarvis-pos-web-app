// services/firebaseApi.js
if (!window._firebaseInitialized) {
  firebase.initializeApp(window.firebaseConfig);
  window._firebaseInitialized = true;
}
window.db = firebase.database();

// --- ORDERS ---
window.addOrder = function(orderData) {
  return db.ref('orders').push(orderData);
}

window.updateOrder = function(id, data) {
  return db.ref('orders/' + id).update(data);
}

window.getAllOrders = function(callback) {
  db.ref('orders').once('value', (snapshot) => {
    const orders = [];
    snapshot.forEach(child => {
      orders.push({ id: child.key, ...child.val() });
    });
    callback(orders);
  });
}

// --- MENU ---
window.addMenuItem = function(menuItem) {
  return db.ref('menu/' + menuItem.id).set(menuItem);
}

window.getAllMenuItems = function(callback) {
  db.ref('menu').once('value', (snapshot) => {
    const menu = [];
    snapshot.forEach(child => {
      const item = child.val();
      item.id = child.key;
      menu.push(item);
    });
    callback(menu);
  });
}

window.updateMenuItem = function(id, menuItem) {
  return db.ref('menu/' + id).update(menuItem);
}

window.deleteMenuItem = function(id) {
  return db.ref('menu/' + id).remove();
}

// --- OPTION GROUPS ---
window.addOptionGroup = function(optionGroup) {
  return db.ref('optionGroups').push(optionGroup);
}

window.getAllOptionGroups = function(callback) {
  db.ref('optionGroups').once('value', (snapshot) => {
    const groups = [];
    snapshot.forEach(child => {
      groups.push({ id: child.key, ...child.val() });
    });
    callback(groups);
  });
}

window.updateOptionGroup = function(id, optionGroup) {
  return db.ref('optionGroups/' + id).update(optionGroup);
}

window.deleteOptionGroup = function(id) {
  return db.ref('optionGroups/' + id).remove();
}

// --- IMAGE UPLOAD ---
window.uploadMenuImage = function(file, menuId, onProgress) {
  return new Promise((resolve, reject) => {
    if (!firebase.storage) return reject(new Error('Firebase Storage not available'));
    const storageRef = firebase.storage().ref();
    const imgRef = storageRef.child('menu/' + menuId + '.jpg');
    const uploadTask = imgRef.put(file);
    uploadTask.on('state_changed', function(snapshot) {
      if (onProgress) {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress(percent);
      }
    }, reject, function() {
      uploadTask.snapshot.ref.getDownloadURL().then(resolve).catch(reject);
    });
  });
};

// --- App Settings (Firebase-synced) ---
window.APP_SETTINGS = {};
window.loadAppSettings = function(callback) {
  window.db.ref('appSettings').on('value', function(snapshot) {
    window.APP_SETTINGS = snapshot.val() || {
      taxEnabled: false,
      currency: 'THB',
      currencySymbol: '฿'
    };
    if (callback) callback(window.APP_SETTINGS);
  });
};
window.saveAppSettings = function(newSettings) {
  window.db.ref('appSettings').update(newSettings);
};

// --- AUTH ---
window.currentUser = null;
window.signInWithGoogle = function() {
  const provider = new firebase.auth.GoogleAuthProvider();
  return firebase.auth().signInWithPopup(provider);
};
window.signOut = function() {
  return firebase.auth().signOut();
};
window.onAuthStateChanged = function(cb) {
  firebase.auth().onAuthStateChanged(function(user) {
    window.currentUser = user;
    cb(user);
  });
}; 