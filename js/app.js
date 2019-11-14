let model = {
    company: 'Mister Spex',
    name: '',
    salary: 0,
    list: []
};

let workingHours = 0;
let totalHours = 0;
let monthlySalary = 0;

const heading = document.querySelector('.t-header__title');
const nameField = document.querySelector('#TTNameSurname');
const salaryField = document.querySelector('#TTHourlyWage');
const appOutput = document.querySelector('#TTHours');
const monthlySalaryOutput = document.querySelector('#TTMonthlySalary');
const scrollContainer = document.querySelector('.t-c-scrollContainer');
const ttDialog = document.querySelector('dialog');
const openDialogButton = document.querySelector('#TTOpenTimeDialog');
const closeDialogButton = document.querySelector('#TTCloseTimeDialog');
const ttForm = document.querySelector('dialog form');
const clearButton = document.querySelector('#clearButton');
const addButton = document.querySelector('#TTAddTime');
const printButton = document.querySelector('#TTPrintButton');
const tableBody = document.querySelector('table').tBodies[0];


const totalTimestamp = value => value.endTime - value.startTime - value.breakDuration;
const toHoursOfDay = value => parseFloat((totalTimestamp(value) / 1000 / 60 / 60).toFixed(2));
const bySumming = (acc, value) => acc += value;
const allHours = entries => entries.map(toHoursOfDay).reduce(bySumming);
const allHoursOutput = (entries) => {
    const total = entries.map(totalTimestamp).reduce(bySumming)
    return msToHHMM(total)
}

const msToHHMM = (ms) => {
    let min = ms / 1000 / 60;
    let hours = min / 60;
    let hh = Math.floor(min / 60);
    let mm = Math.round((hours - hh) * 60);

    hh = String(hh).padStart(2, "0");
    mm = String(mm).padStart(2, "0");
    return hh + ":" + mm
}

const calculate = () => {
    monthlySalary = (totalHours * model.salary).toLocaleString("de-DE", {style: "currency", currency: "EUR", minimumFractionDigits: 2});
};

const convertListIntoTable = (acc, value) => {
    const totalms = totalTimestamp(value);
    const hours = msToHHMM(totalms);
    const start = msToHHMM(value.startTime);
    const end = msToHHMM(value.endTime);
    const breakTime = msToHHMM(value.breakDuration);
    return `${acc}
      <tr>
        <td>${value.day}</td>
        <td>${start}</td>
        <td>${end}</td>
        <td>${breakTime}</td>
        <td>${hours}</td>
      </tr>`;
}

const saveModelToLocalStorage = () => {
  localStorage.setItem('myData', JSON.stringify(model))
};

const render = (model) => {
    const tableHTMLString = model.list.reduce(convertListIntoTable, '');
    if(model.list.length > 0) {
        totalHours = allHours(model.list);
        workingHours = allHoursOutput(model.list);
    } else {
        totalHours = 0;
        workingHours = 0;
    }
    calculate();

    heading.innerText = model.name;
    nameField.value = model.name;
    salaryField.value = model.salary;
    appOutput.innerText = workingHours;
    monthlySalaryOutput.innerText = monthlySalary;

    tableBody.innerHTML = tableHTMLString;
};

const getBreakDuration = () => ttForm.elements.TTBreak.valueAsNumber * 60 * 1000;
const getStartTime = () => ttForm.elements.TTStartTime.valueAsNumber;
const getEndTime = () => ttForm.elements.TTEndTime.valueAsNumber;

const onDialogClosed = () => {
    const returnValue = ttDialog.returnValue;
    if (returnValue !== 'add') {
        return;
    }

    const day = ttForm.elements.TTDay.value;
    const breakDuration = getBreakDuration();
    const startTime = getStartTime();
    const endTime = getEndTime();

    const newEntry = {
        day,
        startTime,
        endTime,
        breakDuration
    };


    model.list.push(newEntry);
    model.list.sort((a,b) => {
      if(a.day < b.day) return -1;
      if(a.day > b.day) return 1;
      if(a.day === b.day) return 0;
    })
    ttDialog.returnValue = ''; // reset to avoid 'add'-state with next opening
    saveModelToLocalStorage();
    render(model);
};

const onNameFieldChanged = (event) => {
    const newName = event.target.value;
    model.name = newName;

    saveModelToLocalStorage();
    render(model);
};

const onSalaryFieldChanged = (event) => {
    const newSalary = event.target.value;
    model.salary = newSalary;

    saveModelToLocalStorage();
    render(model);
};

const onClearButtonClicked = (event) => {
    if (window.confirm('Do you really want to delete all entries?')) {
        model.list = [];
        saveModelToLocalStorage();
        render(model);
    }
};

const isStartBeforeEnd = () => getStartTime() < getEndTime();

const isBreakDurationLongerThanWorkday = () => getBreakDuration() > (getEndTime() - getStartTime());

const isDateAfterToday = () => ttForm.elements.TTDay.valueAsDate > new Date();

const onAddButtonClicked = (event) => {
    if (ttForm.reportValidity() === false) {
        event.preventDefault();
        return;
    }

    if (isStartBeforeEnd() === false) {
        window.alert('Start must be before end!');
        event.preventDefault();
        return;
    }

    if (isBreakDurationLongerThanWorkday()) {
        window.alert(`You didn't work at all?`);
        event.preventDefault();
        return;
    }

    if (isDateAfterToday()) {
        window.alert(`You cannot enter data for the future, McFly!`);
        event.preventDefault();
        return;
    }

    ttDialog.returnValue = 'add'; // polyfill isn't handling returnValues correctly. It must be set here!
};

document.addEventListener('DOMContentLoaded', () => {
    const myData = localStorage.getItem('myData')

    if(myData !== null) {
        model = JSON.parse(myData)
    }

    nameField.addEventListener('keyup', onNameFieldChanged);
    salaryField.addEventListener('keyup', onSalaryFieldChanged);
    openDialogButton.addEventListener('click', () => ttDialog.showModal());
    closeDialogButton.addEventListener('click', () => ttDialog.close());
    ttDialog.addEventListener('close', onDialogClosed);
    clearButton.addEventListener('click', onClearButtonClicked);
    addButton.addEventListener('click', onAddButtonClicked);
    printButton.addEventListener('click', () => window.print())

    render(model);
});
