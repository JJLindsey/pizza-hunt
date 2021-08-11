//create variable to hold db connection
let db;
//establish a connection to IndexedDB database called pizza-hunt and set it to ver 1
const request = indexedDB.open('pizza_hunt', 1);

//event will emit if database version changes
request.onupgradeneeded = function(event) {
  //save a reference to the database
  const db = event.target.result;
  // create an object store (table) called `new_pizza`, set it to have an auto incrementing primary key of sorts 
  db.createObjectStore('new_pizza', { autoIncrement: true });
};

request.onsuccess = function(event) {
  // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run checkDatabase() function to send all local db data to api
  if (navigator.onLine) {
    uploadPizza();
  }
};

request.onerror = function(event) {
  // log error here
  console.log(event.target.errorCode);
};

//this function will be executed if attempt to submit a new pizza & there's no internet conn
function saveRecord(record) {
  // open a new transaction with the database with read and write permissions 
  const transaction = db.transaction(['new_pizza'], 'readwrite');

  //access the object store for new_pizza
  const pizzaObjectStore = transaction.objectStore('new_pizza');

  // add a record to store with add method.
  pizzaObjectStore.add(record);
}

function uploadPizza() {
  // open a transaction on your db
  const transaction = db.transaction(['new_pizza'], 'readwrite');

  // access your object store
  const pizzaObjectStore = transaction.objectStore('new_pizza');

  // get all records from store and set to a variable
  const getAll = pizzaObjectStore.getAll();

  //on successful .getAll() execution, run this function
  getAll.onsuccess = function() {
    // if there was data in indexedDb's store, send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/pizzas', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          //open one more transaction
          const transaction = db.transaction(['new_pizza'], 'readwrite');
          const pizzaObjectStore = transaction.objectStore('new_pizza');
          // clear all items in your store
          pizzaObjectStore.clear();

          alert('All saved pizzas have been submitted.')
        })
        .catch(err => {
          // set reference to redirect back here
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', uploadPizza);
