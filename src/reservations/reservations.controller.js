const service = require("./reservations.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

// ! Helper Function
// Check whether incoming request contains necessary keys and valid

const validateReq = (req, res, next) => {
  if (!req.body.data) {
    return next({ status: 400, message: `data` });
  }

  const {
    first_name,
    last_name,
    mobile_number,
    reservation_date,
    reservation_time,
    people,
  } = req.body.data;

  if (!first_name || first_name === ``) {
    return next({ status: 400, message: `first_name` });
  }

  if (!last_name || last_name === `` || typeof last_name !== `string`) {
    return next({ status: 400, message: `last_name` });
  }

  if (
    !mobile_number ||
    mobile_number === `` ||
    typeof mobile_number !== `string`
  ) {
    return next({ status: 400, message: `mobile_number` });
  }

  if (
    !reservation_date ||
    reservation_date === `` ||
    typeof reservation_date !== `string` ||
    isNaN(Date.parse(reservation_date))
  ) {
    return next({ status: 400, message: `reservation_date` });
  }

  let timeFormat = /\d\d:\d\d/;
  if (
    !reservation_time ||
    reservation_time === `` ||
    typeof reservation_time !== `string` ||
    !reservation_time.match(timeFormat)
  ) {
    return next({ status: 400, message: `reservation_time` });
  }
  if (people === 0 ){
    return next({ status: 400, message: `people` });
  }
  next();
};
const validPeople = (req, res, next) => {
  const {people} = req.body.data;  
  const partysize = Number.isInteger(people);

  if (!partysize || partysize === 0 ) {
    return next({ status: 400, message: `people` });
  }
  next();
}

const tuesdayRestrictions = (req, res, next) => {
  let submitDate = new Date(req.body.data.reservation_date);
  if (submitDate.getDay() === 1) {
    return next({
      status: 400,
      message:
        "The restaurant is closed on Tuesdays.",
    });
  }
  next();
};

const pastDateStop = (req, res, next) => {
  let submitDate = new Date(req.body.data.reservation_date);
  const today = new Date();
  if (submitDate < today) {
    return next({
      status: 400,
      message:
        "The reservation date is in the past. Only future reservations are allowed.",
    });
  }
  next();
};

const openHourValidation = (req, res, next) => {
  let submitTime = req.body.data.reservation_time;
  if (submitTime < "10:30:00" || submitTime > "21:30:00") {
    return next({
      status: 400,
      message:
        "Reservation time are available from 10:30 AM to 9:30 PM local time; Only future reservations are allowed after noon today.",
    });
  }
  next();
};

async function reservationExists(req, res, next) {
  const { reservation_id } = req.params;
  const reservation = await service.read(reservation_id);
  if (reservation) {
    res.locals.reservation = reservation;
    return next();
  }
  next({ status: 404, message: `${reservation_id} was not found.` });
}


async function checkStatus(req, res, next) {
  const { status } = req.body.data;
  if (status === "seated" || status === "finished") {
    return next({ status: 400, message: `status is ${status}` });
  }
  next();
}

function finishedStatus(req, res, next) {
  const { status } = res.locals.reservation;
  if (status === "finished") {
    return next({
      status: 400,
      message: `A reservation status: ${status} cannot be updated.`,
    });
  }
  next();
}

function unknownstatus(req, res, next) {
  const {status} = req.body.data;
  const validStatus = ["booked", "seated", "finished", "cancelled"];
  if (!validStatus.includes(status)){
    return next({
      status: 400,
      message: `Status ${status} is not valid.`,
    });
  }
  next();
}

//  Route Functions
//----------------------------
async function list(req, res) {
  const { date, mobile_number } = req.query;
  if (date) {
    const data = await service.list(date);
    res.json({ data });
  } else if (mobile_number) {
    const data = await service.search(mobile_number) 
    res.json({ data });
    
  }
}

async function create(req, res) {
  const data = await service.create(req.body.data);
  res.status(201).json({ data });
}

async function read(req, res, next) {
  const { reservation: data } = res.locals;
  res.status(200).json({ data });
}

async function updateStatus(req, res) {
  const { status } = req.body.data;
  const { reservation_id } = req.params;
  const data = await service.updateStatus(status, reservation_id);
  res.status(200).json({ data });
}

async function update(req, res, next) {
  const { reservation_id } = res.locals.reservation;
  const updatedReservation = {
    ...req.body.data,
    reservation_id,
  };
  const data = await service.update(updatedReservation);
  res.status(200).json({ data });
}


module.exports = {
  list: asyncErrorBoundary(list),
  create: [
    validateReq,
    tuesdayRestrictions,
    pastDateStop,
    openHourValidation,
    validPeople,
    checkStatus,
    asyncErrorBoundary(create),
  ],
  read: [asyncErrorBoundary(reservationExists), asyncErrorBoundary(read)],
  update: [ 
    reservationExists,
    validateReq,
    tuesdayRestrictions,
    pastDateStop,
    openHourValidation,
    validPeople,
    checkStatus,
    asyncErrorBoundary(update)],
  updateStatus: [
    reservationExists, 
    finishedStatus, 
    unknownstatus, 
    asyncErrorBoundary(updateStatus)],
};
