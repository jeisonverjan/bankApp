//Fetch Data
import users from './users.json' assert{type: 'json'}

//Global variables from HTML
const userNameSpan = document.querySelector('.user-name')
const formUserName = document.querySelector('.form-username')
const formPassword = document.querySelector('.form-password')
const loggingBtn = document.querySelector('.logging-btn')
const mainContainer = document.querySelector('.main-container')
const currDateEle = document.querySelector('.curr-date') // html element
const transferTo = document.querySelector('.transfer-to')
const transferAmount = document.querySelector('.transfer-amount')
const transferBtn = document.querySelector('.transfer-btn')
const movementContainer = document.querySelector('.movements-box') //html element
const loanBtn = document.querySelector('.loan-btn')
const loanAmountEle = document.querySelector('.loan-amount')
const deleteUserEle = document.querySelector('.delete-user-ele')
const deletePinEle = document.querySelector('.delete-pin-ele')
const deleteAccountBtn = document.querySelector('.delete-account-btn')
const inValueEle = document.querySelector('.in-value')
const outValueEle = document.querySelector('.out-value')
const interestValueEle = document.querySelector('.interest-value')
const sortEle = document.querySelector('.fa-sort')
let isSorted = false
const timerEle = document.querySelector('.timer-ele')

//Global variables
const usersData = users
let currentUser;
let currentUserBalance = null;
let timer = null;

//Logout timer function
const startLogoutTimer = function () {
    const tick = function () {
        const min = String(Math.trunc(time / 60)).padStart(2, '0')
        const sec = String(time % 60).padStart(2, '0')
        //in each call, print the remaining time to the UI
        timerEle.textContent = `${min}:${sec}`
        
        //when 0 seconds, stop timer and logout the user
        if (time === 0) {
            clearInterval(timer)
            mainContainer.style.opacity = 0;
            userNameSpan.textContent = 'Log in to get started!!'
        }
        //decrease 1 sec
        time--
    }
    //set time to 5 minutes
    let time = 300
    //Call the timer every second
    tick()
    const timer = setInterval(tick, 1000)
    return timer
}

//Restart timer 

const restartTimer = function(){
    clearInterval(timer)
    timer = startLogoutTimer()
}

//login function
const loggingUser = function (e) {
    e.preventDefault()

    if (!formUserName.value || !formPassword.value) return // if the form is empty return
    currentUser = usersData.find(user => user.userName === formUserName.value.toLowerCase())
    if (!currentUser) {
        alert('The user does not exist')
        return
    }
    if (currentUser.pin !== +formPassword.value) {
        alert('Password incorrect')
        return
    }
    userNameSpan.textContent = `Welcome, ${currentUser.name.split(' ')[0]}!` // personalizing user header
    mainContainer.style.opacity = 1 // making visible user dashboard
    mainContainer.style.transform = 'translateY(0)' //animation
    formPassword.value = '' //reset form
    formUserName.value = ''
    
    initApp() // initiating the app then
}

const initApp = function () {
    updateCurrentDate(new Date());
    setInterval(function () { updateCurrentDate(new Date()) }, 60000);
    calculateBalance()
    renderMovements(currentUser.movements)
    calculateFooter()
    if(timer) clearInterval(timer)
    timer = startLogoutTimer()
    
}

loggingBtn.addEventListener('click', loggingUser.bind())

//update date each minute
const updateCurrentDate = function (date) {
    const dateOptions = {
        hour: "numeric",
        minute: "numeric",
        day: "numeric",
        month: "short",
        year: "numeric",
        weekday: "short"
    }
    const formatDate = new Intl.DateTimeFormat(currentUser.language, dateOptions).format(date)
    currDateEle.textContent = formatDate
}

//calculating user balance
const calculateBalance = function () {
    const balance = currentUser.movements //return the sum of user movements
        .map(ele => ele.amount)
        .reduce((cont, curr) => cont + curr)
    const balanceElem = document.querySelector('.balance-number') //html element
    balanceElem.textContent = formatCurrency(balance) // updating html element
    currentUserBalance = balance
}
// formatting current date according user currency
const formatCurrency = function (amount) {
    const amountOptions = {
        style: "currency",
        currency: currentUser.currency
    }
    return Intl.NumberFormat(currentUser.language, amountOptions).format(amount)
}
//Formatting movements dates
const formatDate = function (date) {
    const currDate = new Date()
    const now = new Date(date)
    const daysPassed = Math.round(Math.abs(currDate - now) / (1000 * 60 * 60 * 24))

    if (daysPassed === 0) return `TODAY`
    if (daysPassed === 1) return `YESTERDAY`
    if (daysPassed <= 7) return `${daysPassed} days ago`

    const dateOptions = {
        day: "numeric",
        month: "short",
        year: "numeric",
    }
    return new Intl.DateTimeFormat(currentUser.language, dateOptions).format(now)
}

// Sorting movements
sortEle.addEventListener('click', function () {
    if (!isSorted) {
        const sortedMovements = currentUser.movements.slice().sort((a, b) => {
            if (a.amount > b.amount) {
                return -1;
            }
            if (a.amount < b.amount) {
                return 1;
            }
            return 0;
        });
        renderMovements(sortedMovements)
        isSorted = true
    } else {
        renderMovements(currentUser.movements)
        isSorted = false
    }
})

//Render user movements
const renderMovements = function (userMovements) {
    movementContainer.innerHTML = '' //cleaning dashboard
    userMovements.forEach(move => {

        const movementType = move.amount > 0 ? 'Deposit' : 'Withdraw'

        movementContainer.insertAdjacentHTML('beforeend', `
            <div class="movement">
                <span class="move-transaction">${movementType}</span>
                <span class="move-date">${formatDate(move.date)}</span>
                <span class="move-amount move-${movementType}">${formatCurrency(move.amount)}</span>
            </div>
        `);
    });
    restartTimer()
}

// Transferring money

transferBtn.addEventListener('click', function (e) {
    e.preventDefault()

    //if the user to transfer does not exist
    const transferUser = usersData.find(user => user.userName === transferTo.value.toLowerCase())
    if (!transferUser || transferUser === currentUser) {
        alert('Enter a valid username')
        return
    }
    if (+transferAmount.value <= 0) {
        alert('Enter a valid value')
        return
    }

    //if the current user does not have enough money
    if (+transferAmount.value > currentUserBalance) {
        alert('Insufficient funds')
        return
    }

    //Add a negative movement to the current user
    currentUser.movements.unshift({
        date: new Date(),
        amount: Number(-transferAmount.value)
    })

    //Add a positive movement to the user to transfer
    transferUser.movements.unshift({
        date: new Date(),
        amount: +transferAmount.value
    })
    //update user dashboard and calculate balance
    renderMovements(currentUser.movements)
    calculateBalance()
    calculateFooter()
    transferTo.value = ''
    transferAmount.value = ''

    //restart timer:
    restartTimer()
})

//Requesting a Loan

loanBtn.addEventListener('click', function (e) {
    e.preventDefault()
    //user form value
    const loanAmount = loanAmountEle.value
    const acceptableAmount = currentUser.movements
        .map(ele => ele.amount)
        .some(ele => ele >= (loanAmount * 0.20))

    if (+loanAmount <= 0) {
        alert('Enter a valid value')
        return
    }
    if (!acceptableAmount) {
        alert("The amount of the loan is to high")
        return
    }
    //Add a positive movement to the current user
    currentUser.movements.unshift({
        date: new Date(),
        amount: +loanAmount
    })
    renderMovements(currentUser.movements)
    calculateBalance()
    calculateFooter()
    loanAmountEle.value = ''
    
    //Restart timer
    restartTimer()
})

// Deleting account

deleteAccountBtn.addEventListener('click', function (e) {
    e.preventDefault()

    const userToDelete = deleteUserEle.value.toLowerCase()
    const pinUserToDelete = +deletePinEle.value
    console.log(userToDelete)
    console.log(pinUserToDelete)

    if (userToDelete !== currentUser.userName || pinUserToDelete !== currentUser.pin) {
        alert('Incorrect Data')
        return
    }
    const indexToRemove = usersData.findIndex(user => user.userName === userToDelete)
    usersData.splice(indexToRemove, 1)
    mainContainer.style.opacity = 0 // making visible user dashboard
    mainContainer.style.transform = 'translateY(100px)' //animation

    deleteUserEle.value = ''
    deletePinEle.value = ''
})

// Calculate in, out and interest
const calculateFooter = function () {

    inValueEle.textContent = formatCurrency(currentUser.movements
        .filter(ele => ele.amount > 0)
        .reduce((cont, val) => cont + val.amount, 0))

    outValueEle.textContent = formatCurrency(currentUser.movements
        .filter(ele => ele.amount < 0)
        .reduce((cont, val) => cont + val.amount, 0))

    interestValueEle.textContent = formatCurrency(currentUser.movements
        .filter(val => val.amount > 0)
        .map(ele => ele.amount * currentUser.interest)
        .reduce((cont, val) => cont + val, 0))
}
