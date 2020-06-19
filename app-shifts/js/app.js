// Global database variable
let DB;

// Interface selectors
const form = document.querySelector('#form'),
    name = document.querySelector('#name'),
    surname = document.querySelector('#surname'),
    phone = document.querySelector('#phone'),
    social = document.querySelector('#social'),
    date = document.querySelector('#date'),
    hour = document.querySelector('#hour'),
    shifts = document.querySelector('#shifts'),
    heading = document.querySelector('#heading');

// Expect the DOM to be loaded
document.addEventListener('DOMContentLoaded', () => {

    // To create the database
    let createDB = window.indexedDB.open('shifts', 1);

    // In case of error send message to the console
    createDB.onerror = function() {
        console.log('Error');
    }

    // If the connection was successful, send a message to the console and assign the database
    createDB.onsuccess = function() {
        // console.log('Ok');

        // Assign to the database
        DB = createDB.result;

        showShifts();
    }

    // This will run only once and create the database
    createDB.onupgradeneeded = function(e) {
        let db = e.target.result;

        // Definir objectStore (database name and options)
        // keyPath is the index of the DB
        let objectStore = db.createObjectStore('shifts', { keyPath: 'key', autoIncrement: true });

        // Create DB indexes and fields
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('surname', 'surname', { unique: false });
        objectStore.createIndex('phone', 'phone', { unique: true });
        objectStore.createIndex('social', 'social', { unique: false });
        objectStore.createIndex('date', 'date', { unique: false });
        objectStore.createIndex('hour', 'hour', { unique: false });

        console.log('The database has been successfully created.');
    }

    // When the form is submitted
    form.addEventListener('submit', addData);

    // Add form data to DB
    function addData(e) {
        e.preventDefault();

        const social = document.getElementById('social');
        const selectedSocial = social.options[social.selectedIndex].value;

        const newShift = {
            name: name.value,
            surname: surname.value,
            phone: phone.value,
            social: social.value,
            date: date.value,
            hour: hour.value
        }

        // Transaction
        let transaction = DB.transaction(['shifts'], 'readwrite');
        let objectStore = transaction.objectStore('shifts');

        let request = objectStore.add(newShift);

        // If the request was successful, the form will be reset
        request.onsuccess = () => {
            form.reset();
        }

        // Once the transaction is complete a success message will be displayed
        transaction.oncomplete = () => {
            alert('El turno ha sido agregado exitosamente');
        }

        showShifts();

        // In case of error
        transaction.onerror = () => {
            console.log('Hubo un error');
        }
    }

    // Show shifts in the DOM
    function showShifts() {
        // Clear previous shifts
        while (shifts.firstChild) {
            shifts.removeChild(shifts.firstChild);
        }

        // Create objectStore
        let objectStore = DB.transaction('shifts').objectStore('shifts');

        // This returns a request
        objectStore.openCursor().onsuccess = function(e) {
            let cursor = e.target.result;

            if (cursor) {
                let shiftsHTML = document.createElement('div');
                shiftsHTML.setAttribute('data-shifts-id', cursor.value.key);
                shiftsHTML.classList.add('list-group-item', 'block');
                shiftsHTML.innerHTML = `
                <div class="shifts">
                    <p><img src="../img/day.png"><b>Fecha:</b> ${cursor.value.date}</p>
                    <p><img src="../img/hour.png"><b>Hora</b>: ${cursor.value.hour}hs</p>
                    <p><img src="../img/user.png"><b>Paciente</b>: ${cursor.value.name} ${cursor.value.surname}</p>
                    <p><img src="../img/phone.png"><b>Teléfono</b>: ${cursor.value.phone}</p>
                    <p><img src="../img/social.png"><b>Obra Social</b>: ${cursor.value.social}</p>
                </div>
                `;

                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('btn', 'btn-danger');
                deleteBtn.innerHTML = 'Eliminar';
                deleteBtn.onclick = deleteShift;
                shiftsHTML.appendChild(deleteBtn);

                shifts.appendChild(shiftsHTML);

                // Consult the next registers
                cursor.continue();
            } else {
                if (!shifts.firstChild) {
                    // When there are no records
                    heading.textContent = 'Agrega turnos para comenzar';
                    let list = document.createElement('p');
                    list.classList.add('text-center');
                    list.textContent = 'No hay registros disponibles';
                    shifts.appendChild(list);
                } else {
                    heading.textContent = 'Pacientes agendados para hoy:';
                }
            }
        }
    }

    // Delete shifts
    function deleteShift(e) {
        let shiftID = Number(e.target.parentElement.getAttribute('data-shifts-id'));

        let transaction = DB.transaction(['shifts'], 'readwrite');
        let objectStore = transaction.objectStore('shifts');

        let request = objectStore.delete(shiftID);

        transaction.oncomplete = () => {
            e.target.parentElement.parentElement.removeChild(e.target.parentElement);
            alert(`Ha sido eliminado el turno con el ID: ${shiftID}`);

            if (!shifts.firstChild) {
                // When there are no records
                heading.textContent = 'Agrega turnos para comenzar';
                let list = document.createElement('p');
                list.classList.add('text-center');
                list.textContent = 'No hay registros disponibles';
                shifts.appendChild(list);
            } else {
                heading.textContent = 'Pacientes agendados para hoy:';
            }
        }

    }
});